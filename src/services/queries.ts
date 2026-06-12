import { getDb } from '../db/database';
import type {
  Category, DashboardStats, Movement, OperationLog, Product, ProductFilters, Sku, User,
} from '../models';

const db = getDb();

type ProductRow = {
  id: number; code: string; name: string; category: string; category_id: number | null;
  category_name: string | null; category_code: string | null; brand: string | null;
  supplier: string | null; note: string | null; default_cost: number; average_cost: number;
  last_purchase_cost: number; default_price: number; min_stock: number; created_at: string;
  updated_at: string; main_image_uri: string | null; total_stock: number | null;
};

export function getUsers(): User[] {
  return db.getAllSync<any>('SELECT * FROM users ORDER BY id ASC').map((row) => ({
    id: row.id, name: row.name, phone: row.phone, avatarUri: row.avatar_uri, lastActiveAt: row.last_active_at,
  }));
}

export function touchUser(userId: number) {
  db.runSync('UPDATE users SET last_active_at = ? WHERE id = ?', [new Date().toISOString(), userId]);
}

export function getCategories(): Category[] {
  return db.getAllSync<any>('SELECT * FROM categories ORDER BY sort_order, id').map((row) => ({
    id: row.id, name: row.name, code: row.code, sortOrder: row.sort_order,
  }));
}

export function getProducts(filtersOrSearch: ProductFilters | string = {}): Product[] {
  const filters: ProductFilters = typeof filtersOrSearch === 'string' ? { search: filtersOrSearch } : filtersOrSearch;
  const search = filters.search?.trim() ?? '';
  const like = `%${search}%`;
  const rows = db.getAllSync<ProductRow>(
    `SELECT p.*, c.name AS category_name, c.code AS category_code,
       (SELECT uri FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id LIMIT 1) AS main_image_uri,
       COALESCE(SUM(s.quantity), 0) AS total_stock
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN skus s ON s.product_id = p.id
     WHERE (? = '' OR p.name LIKE ? OR p.code LIKE ? OR COALESCE(c.name, p.category) LIKE ?
       OR p.supplier LIKE ? OR EXISTS (
         SELECT 1 FROM skus sx WHERE sx.product_id = p.id AND (sx.color LIKE ? OR sx.size LIKE ?)
       ))
       AND (? IS NULL OR p.category_id = ?)
     GROUP BY p.id`,
    [search, like, like, like, like, like, like, filters.categoryId ?? null, filters.categoryId ?? null],
  );
  let products = rows.map(toProduct);
  if (filters.status) products = products.filter((product) => product.status === filters.status);
  const sort = filters.sort ?? 'UPDATED';
  products.sort((a, b) => {
    if (sort === 'STOCK_DESC') return b.totalStock - a.totalStock;
    if (sort === 'STOCK_ASC') return a.totalStock - b.totalStock;
    if (sort === 'PRICE_DESC') return b.defaultPrice - a.defaultPrice;
    if (sort === 'COST_DESC') return b.averageCost - a.averageCost;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return products;
}

export function getProduct(productId: number): Product | null {
  const row = db.getFirstSync<ProductRow>(
    `SELECT p.*, c.name AS category_name, c.code AS category_code,
       (SELECT uri FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id LIMIT 1) AS main_image_uri,
       COALESCE(SUM(s.quantity), 0) AS total_stock
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN skus s ON s.product_id = p.id WHERE p.id = ? GROUP BY p.id`,
    [productId],
  );
  return row ? toProduct(row) : null;
}

export function getSkus(productId?: number): Sku[] {
  const rows = productId
    ? db.getAllSync<any>('SELECT * FROM skus WHERE product_id = ? ORDER BY color, size', [productId])
    : db.getAllSync<any>('SELECT * FROM skus ORDER BY product_id, color, size');
  return rows.map((row) => ({ id: row.id, productId: row.product_id, color: row.color, size: row.size, quantity: row.quantity }));
}

export function getSku(skuId: number): (Sku & {
  productName: string; productCode: string; defaultCost: number; averageCost: number; defaultPrice: number;
}) | null {
  const row = db.getFirstSync<any>(
    `SELECT s.*, p.name, p.code, p.default_cost, p.average_cost, p.default_price
     FROM skus s JOIN products p ON p.id = s.product_id WHERE s.id = ?`, [skuId],
  );
  if (!row) return null;
  return {
    id: row.id, productId: row.product_id, color: row.color, size: row.size, quantity: row.quantity,
    productName: row.name, productCode: row.code, defaultCost: row.default_cost,
    averageCost: row.average_cost || row.default_cost, defaultPrice: row.default_price,
  };
}

export function getRecentMovements(limit = 20, productId?: number): Movement[] {
  const rows = productId
    ? db.getAllSync<any>('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?', [productId, limit])
    : db.getAllSync<any>('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows.map((row) => ({
    id: row.id, action: row.action, productName: row.product_name, productCode: row.product_code,
    color: row.color, size: row.size, quantityChange: row.quantity_change,
    beforeQuantity: row.before_quantity, afterQuantity: row.after_quantity,
    operatorName: row.operator_name, createdAt: row.created_at, note: row.note,
  }));
}

export function getOperationLogs(limit = 100): OperationLog[] {
  return db.getAllSync<any>('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ?', [limit]).map((row) => ({
    id: row.id, operatorName: row.operator_name, createdAt: row.created_at, action: row.action,
    productName: row.product_name, productCode: row.product_code, beforeValue: row.before_value,
    afterValue: row.after_value, note: row.note,
  }));
}

export function getDashboardStats(): DashboardStats {
  const products = getProducts();
  const now = new Date();
  const today = datePrefix(now);
  const month = today.slice(0, 7);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const summary = (where: string, params: unknown[]) => db.getFirstSync<any>(
    `SELECT COALESCE(SUM(received_amount),0) sales, COALESCE(SUM(total_cost),0) cost,
      COALESCE(SUM(profit),0) profit FROM sale_orders WHERE ${where}`, params as any,
  ) ?? { sales: 0, cost: 0, profit: 0 };
  const todaySales = summary('order_date LIKE ?', [`${today}%`]);
  const weekSales = summary('order_date >= ?', [weekStart.toISOString()]);
  const monthSales = summary('order_date LIKE ?', [`${month}%`]);
  const stockCost = products.reduce((sum, product) => sum + product.stockCost, 0);
  const stockRetail = products.reduce((sum, product) => sum + product.stockRetail, 0);
  return {
    totalProducts: products.length,
    totalStock: products.reduce((sum, product) => sum + product.totalStock, 0),
    stockCost, stockRetail, expectedProfit: stockRetail - stockCost,
    todaySales: todaySales.sales, todayCost: todaySales.cost, todayProfit: todaySales.profit,
    weekSales: weekSales.sales, monthSales: monthSales.sales, monthProfit: monthSales.profit,
    lowStockCount: products.filter((p) => p.status === 'LOW').length,
    outStockCount: products.filter((p) => p.status === 'OUT').length,
  };
}

export function getPurchases(productId: number) {
  return db.getAllSync<any>(
    `SELECT po.id, po.order_no, po.order_date AS purchase_date, po.total_cost, po.supplier,
      SUM(pi.quantity) AS quantity, AVG(pi.unit_cost) AS unit_cost
     FROM purchase_orders po JOIN purchase_items pi ON pi.order_id = po.id
     WHERE po.product_id = ? GROUP BY po.id ORDER BY po.order_date DESC LIMIT 20`, [productId],
  );
}

export function getSales(productId: number) {
  return db.getAllSync<any>(
    `SELECT so.id, so.order_no, so.order_date AS sale_date, so.received_amount,
      so.total_cost AS cost, so.profit, SUM(si.quantity) AS quantity
     FROM sale_orders so JOIN sale_items si ON si.order_id = so.id
     WHERE so.product_id = ? GROUP BY so.id ORDER BY so.order_date DESC LIMIT 20`, [productId],
  );
}

function toProduct(row: ProductRow): Product {
  const totalStock = row.total_stock ?? 0;
  const averageCost = row.average_cost || row.default_cost;
  const stockCost = totalStock * averageCost;
  const stockRetail = totalStock * row.default_price;
  const expectedProfit = stockRetail - stockCost;
  const status = totalStock === 0 ? 'OUT' : totalStock < row.min_stock ? 'LOW' : 'NORMAL';
  const categoryName = row.category_name ?? row.category;
  return {
    id: row.id, code: row.code, name: row.name, categoryId: row.category_id ?? 0,
    categoryName, categoryCode: row.category_code ?? row.category, category: categoryName,
    brand: row.brand, supplier: row.supplier, note: row.note,
    defaultCost: row.default_cost, averageCost, lastPurchaseCost: row.last_purchase_cost || row.default_cost,
    defaultPrice: row.default_price, minStock: row.min_stock, createdAt: row.created_at,
    updatedAt: row.updated_at, mainImageUri: row.main_image_uri, totalStock, stockCost,
    stockRetail, expectedProfit, marginRate: stockRetail > 0 ? expectedProfit / stockRetail : 0, status,
  };
}

function datePrefix(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
