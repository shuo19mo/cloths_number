import { getDb } from '../db/database';
import type { DashboardStats, Movement, OperationLog, Product, Sku, User } from '../models';

const db = getDb();

type ProductRow = {
  id: number;
  code: string;
  name: string;
  category: string;
  brand: string | null;
  supplier: string | null;
  note: string | null;
  default_cost: number;
  default_price: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  main_image_uri: string | null;
  total_stock: number | null;
};

export function getUsers(): User[] {
  return db.getAllSync<{
    id: number;
    name: string;
    phone: string;
    avatar_uri: string | null;
    last_active_at: string;
  }>('SELECT * FROM users ORDER BY id ASC').map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    avatarUri: row.avatar_uri,
    lastActiveAt: row.last_active_at,
  }));
}

export function touchUser(userId: number) {
  db.runSync('UPDATE users SET last_active_at = ? WHERE id = ?', [new Date().toISOString(), userId]);
}

export function getProducts(search = ''): Product[] {
  const like = `%${search.trim()}%`;
  const rows = db.getAllSync<ProductRow>(
    `
    SELECT
      p.*,
      (SELECT uri FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS main_image_uri,
      COALESCE(SUM(s.quantity), 0) AS total_stock
    FROM products p
    LEFT JOIN skus s ON s.product_id = p.id
    WHERE ? = '%%'
      OR p.name LIKE ?
      OR p.code LIKE ?
      OR p.category LIKE ?
      OR p.supplier LIKE ?
      OR EXISTS (SELECT 1 FROM skus sx WHERE sx.product_id = p.id AND (sx.color LIKE ? OR sx.size LIKE ?))
    GROUP BY p.id
    ORDER BY p.updated_at DESC
    `,
    [like, like, like, like, like, like, like],
  );
  return rows.map(toProduct);
}

export function getProduct(productId: number): Product | null {
  const row = db.getFirstSync<ProductRow>(
    `
    SELECT
      p.*,
      (SELECT uri FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS main_image_uri,
      COALESCE(SUM(s.quantity), 0) AS total_stock
    FROM products p
    LEFT JOIN skus s ON s.product_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
    `,
    [productId],
  );
  return row ? toProduct(row) : null;
}

export function getSkus(productId?: number): Sku[] {
  const rows = productId
    ? db.getAllSync<{ id: number; product_id: number; color: string; size: string; quantity: number }>(
        'SELECT * FROM skus WHERE product_id = ? ORDER BY color, size',
        [productId],
      )
    : db.getAllSync<{ id: number; product_id: number; color: string; size: string; quantity: number }>(
        'SELECT * FROM skus ORDER BY product_id, color, size',
      );
  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    color: row.color,
    size: row.size,
    quantity: row.quantity,
  }));
}

export function getSku(skuId: number): (Sku & { productName: string; productCode: string; defaultCost: number; defaultPrice: number }) | null {
  const row = db.getFirstSync<{
    id: number;
    product_id: number;
    color: string;
    size: string;
    quantity: number;
    name: string;
    code: string;
    default_cost: number;
    default_price: number;
  }>(
    `
    SELECT s.*, p.name, p.code, p.default_cost, p.default_price
    FROM skus s
    JOIN products p ON p.id = s.product_id
    WHERE s.id = ?
    `,
    [skuId],
  );
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    color: row.color,
    size: row.size,
    quantity: row.quantity,
    productName: row.name,
    productCode: row.code,
    defaultCost: row.default_cost,
    defaultPrice: row.default_price,
  };
}

export function getRecentMovements(limit = 20, productId?: number): Movement[] {
  const rows = productId
    ? db.getAllSync<any>('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?', [productId, limit])
    : db.getAllSync<any>('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    productName: row.product_name,
    productCode: row.product_code,
    color: row.color,
    size: row.size,
    quantityChange: row.quantity_change,
    beforeQuantity: row.before_quantity,
    afterQuantity: row.after_quantity,
    operatorName: row.operator_name,
    createdAt: row.created_at,
    note: row.note,
  }));
}

export function getOperationLogs(limit = 80): OperationLog[] {
  return db.getAllSync<any>('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ?', [limit]).map((row) => ({
    id: row.id,
    operatorName: row.operator_name,
    createdAt: row.created_at,
    action: row.action,
    productName: row.product_name,
    productCode: row.product_code,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    note: row.note,
  }));
}

export function getDashboardStats(): DashboardStats {
  const products = getProducts();
  const stockCost = products.reduce((sum, product) => sum + product.stockCost, 0);
  const stockRetail = products.reduce((sum, product) => sum + product.stockRetail, 0);
  const totalStock = products.reduce((sum, product) => sum + product.totalStock, 0);
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const sales = db.getFirstSync<{ sales: number; cost: number; profit: number }>(
    `SELECT COALESCE(SUM(received_amount), 0) AS sales, COALESCE(SUM(cost), 0) AS cost, COALESCE(SUM(profit), 0) AS profit
     FROM sale_records WHERE sale_date LIKE ?`,
    [`${todayPrefix}%`],
  ) ?? { sales: 0, cost: 0, profit: 0 };
  const allSales =
    db.getFirstSync<{ sales: number; profit: number }>(
      'SELECT COALESCE(SUM(received_amount), 0) AS sales, COALESCE(SUM(profit), 0) AS profit FROM sale_records',
    ) ?? { sales: 0, profit: 0 };
  return {
    totalProducts: products.length,
    totalStock,
    stockCost,
    stockRetail,
    expectedProfit: stockRetail - stockCost,
    todaySales: sales.sales,
    todayCost: sales.cost,
    todayProfit: sales.profit,
    weekSales: allSales.sales,
    monthSales: allSales.sales,
    monthProfit: allSales.profit,
    lowStockCount: products.filter((p) => p.status === 'LOW').length,
    outStockCount: products.filter((p) => p.status === 'OUT').length,
  };
}

export function getPurchases(productId: number) {
  return db.getAllSync<any>('SELECT * FROM purchase_records WHERE product_id = ? ORDER BY purchase_date DESC LIMIT 20', [productId]);
}

export function getSales(productId: number) {
  return db.getAllSync<any>('SELECT * FROM sale_records WHERE product_id = ? ORDER BY sale_date DESC LIMIT 20', [productId]);
}

function toProduct(row: ProductRow): Product {
  const totalStock = row.total_stock ?? 0;
  const stockCost = totalStock * row.default_cost;
  const stockRetail = totalStock * row.default_price;
  const expectedProfit = stockRetail - stockCost;
  const status = totalStock === 0 ? 'OUT' : totalStock < row.min_stock ? 'LOW' : 'NORMAL';
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    brand: row.brand,
    supplier: row.supplier,
    note: row.note,
    defaultCost: row.default_cost,
    defaultPrice: row.default_price,
    minStock: row.min_stock,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mainImageUri: row.main_image_uri,
    totalStock,
    stockCost,
    stockRetail,
    expectedProfit,
    marginRate: stockRetail > 0 ? expectedProfit / stockRetail : 0,
    status,
  };
}
