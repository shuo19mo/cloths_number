import { getDb } from '../db/database';
import type {
  ProductInput, PurchaseOrderInput, SaleOrderInput, StockAction, User,
} from '../models';
import { todayKey } from './format';
import { getProduct, getSku, getSkus } from './queries';

const db = getDb();

export function createCategory(name: string) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('请输入类别名称');
  const existing = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE name = ?', [cleanName]);
  if (existing) return existing.id;
  const base = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || `CAT${Date.now().toString().slice(-4)}`;
  let code = base;
  let suffix = 1;
  while (db.getFirstSync('SELECT id FROM categories WHERE code = ?', [code])) code = `${base}${suffix++}`;
  const sort = db.getFirstSync<{ count: number }>('SELECT COUNT(*) count FROM categories')?.count ?? 0;
  return db.runSync(
    'INSERT INTO categories (name, code, sort_order, created_at) VALUES (?, ?, ?, ?)',
    [cleanName, code, sort, new Date().toISOString()],
  ).lastInsertRowId;
}

export function createProduct(input: ProductInput, user: User) {
  const now = new Date().toISOString();
  const category = db.getFirstSync<{ id: number; name: string; code: string }>(
    'SELECT id, name, code FROM categories WHERE id = ?', [input.categoryId],
  );
  if (!category) throw new Error('请选择有效商品类别');
  if (!input.colors.length || !input.sizes.length) throw new Error('至少需要一个颜色和尺码');
  const code = generateProductCode(category.id);
  let productId = 0;
  db.withTransactionSync(() => {
    const result = db.runSync(
      `INSERT INTO products
       (code, name, category, category_id, brand, supplier, note, default_cost, average_cost,
        last_purchase_cost, default_price, min_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, input.name, category.name, category.id, input.brand ?? '', input.supplier ?? '',
       input.note ?? '', input.defaultCost, input.defaultCost, input.defaultCost, input.defaultPrice,
       input.minStock, now, now],
    );
    productId = result.lastInsertRowId;
    if (input.imageUri) {
      db.runSync('INSERT INTO product_images (product_id, uri, is_primary, created_at) VALUES (?, ?, 1, ?)', [productId, input.imageUri, now]);
    }
    input.colors.forEach((color) => input.sizes.forEach((size) => {
      const skuId = db.runSync('INSERT INTO skus (product_id, color, size, quantity) VALUES (?, ?, ?, ?)', [
        productId, color, size, input.initialStock,
      ]).lastInsertRowId;
      if (input.initialStock > 0) {
        writeMovement('MANUAL', productId, skuId, input.name, code, color, size, input.initialStock, 0, input.initialStock, user, '初始库存');
      }
    }));
    writeLog(user, '新增商品', productId, input.name, code, '', `创建 ${input.colors.length * input.sizes.length} 个 SKU`, input.note ?? '');
  });
  return productId;
}

export function createPurchaseOrder(input: PurchaseOrderInput, user: User) {
  const product = getProduct(input.productId);
  if (!product) throw new Error('商品不存在');
  const items = input.items.filter((item) => item.quantity > 0 && item.unitCost >= 0);
  if (!items.length) throw new Error('请至少填写一个进货明细');
  const skuMap = new Map(getSkus(product.id).map((sku) => [sku.id, sku]));
  if (items.some((item) => !skuMap.has(item.skuId))) throw new Error('进货明细包含无效 SKU');
  const now = new Date().toISOString();
  const orderNo = generateOrderNo('PO', 'purchase_orders');
  const itemCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const totalCost = itemCost + Math.max(0, input.shippingFee);
  const oldQuantity = product.totalStock;
  const addedQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const newAverageCost = oldQuantity + addedQuantity > 0
    ? (product.averageCost * oldQuantity + itemCost) / (oldQuantity + addedQuantity)
    : product.averageCost;
  db.withTransactionSync(() => {
    const orderId = db.runSync(
      `INSERT INTO purchase_orders
       (order_no, product_id, order_date, supplier, shipping_fee, total_cost, operator_id, operator_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, product.id, now, input.supplier, input.shippingFee, totalCost, user.id, user.name, input.note],
    ).lastInsertRowId;
    items.forEach((item) => {
      const sku = skuMap.get(item.skuId)!;
      const after = sku.quantity + item.quantity;
      db.runSync('UPDATE skus SET quantity = ? WHERE id = ?', [after, sku.id]);
      db.runSync(
        'INSERT INTO purchase_items (order_id, sku_id, quantity, unit_cost, line_cost) VALUES (?, ?, ?, ?, ?)',
        [orderId, sku.id, item.quantity, item.unitCost, item.quantity * item.unitCost],
      );
      writeMovement('PURCHASE', product.id, sku.id, product.name, product.code, sku.color, sku.size,
        item.quantity, sku.quantity, after, user, `${orderNo} ${input.note}`);
    });
    const latest = items[items.length - 1].unitCost;
    db.runSync(
      `UPDATE products SET default_cost = ?, average_cost = ?, last_purchase_cost = ?, supplier = ?, updated_at = ? WHERE id = ?`,
      [latest, newAverageCost, latest, input.supplier, now, product.id],
    );
    writeLog(user, '进货入库', product.id, product.name, product.code,
      `${oldQuantity} 件`, `${oldQuantity + addedQuantity} 件`, `${orderNo}，${items.length} 个 SKU`);
  });
  return orderNo;
}

export function createSaleOrder(input: SaleOrderInput, user: User) {
  const product = getProduct(input.productId);
  if (!product) throw new Error('商品不存在');
  const items = input.items.filter((item) => item.quantity > 0 && item.unitPrice >= 0);
  if (!items.length) throw new Error('请至少填写一个销售明细');
  const skuMap = new Map(getSkus(product.id).map((sku) => [sku.id, sku]));
  for (const item of items) {
    const sku = skuMap.get(item.skuId);
    if (!sku) throw new Error('销售明细包含无效 SKU');
    if (sku.quantity < item.quantity) throw new Error(`${sku.color}/${sku.size} 当前库存不足，无法完成销售。`);
  }
  const now = new Date().toISOString();
  const orderNo = generateOrderNo('SO', 'sale_orders');
  const gross = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const received = input.receivedAmount > 0 ? input.receivedAmount : Math.max(0, gross - input.discount);
  const totalCost = items.reduce((sum, item) => sum + item.quantity * product.averageCost, 0);
  const profit = received - totalCost;
  db.withTransactionSync(() => {
    const orderId = db.runSync(
      `INSERT INTO sale_orders
       (order_no, product_id, order_date, discount, received_amount, total_cost, profit,
        operator_id, operator_name, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, product.id, now, input.discount, received, totalCost, profit, user.id, user.name, input.note],
    ).lastInsertRowId;
    items.forEach((item) => {
      const sku = skuMap.get(item.skuId)!;
      const after = sku.quantity - item.quantity;
      db.runSync('UPDATE skus SET quantity = ? WHERE id = ?', [after, sku.id]);
      db.runSync(
        `INSERT INTO sale_items
         (order_id, sku_id, quantity, unit_price, line_amount, unit_cost, line_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, sku.id, item.quantity, item.unitPrice, item.quantity * item.unitPrice,
         product.averageCost, item.quantity * product.averageCost],
      );
      writeMovement('SALE', product.id, sku.id, product.name, product.code, sku.color, sku.size,
        -item.quantity, sku.quantity, after, user, `${orderNo} ${input.note}`);
    });
    db.runSync('UPDATE products SET default_price = ?, updated_at = ? WHERE id = ?', [items[0].unitPrice, now, product.id]);
    writeLog(user, '销售出库', product.id, product.name, product.code,
      `${product.totalStock} 件`, `${product.totalStock - items.reduce((sum, item) => sum + item.quantity, 0)} 件`,
      `${orderNo}，实收 ${received.toFixed(2)}`);
  });
  return orderNo;
}

export function stocktakeProduct(productId: number, actualQuantities: Record<number, number>, note: string, user: User) {
  const product = getProduct(productId);
  if (!product) throw new Error('商品不存在');
  const changed = getSkus(productId).filter((sku) => Number.isFinite(actualQuantities[sku.id]) && actualQuantities[sku.id] !== sku.quantity);
  if (!changed.length) return 0;
  db.withTransactionSync(() => {
    changed.forEach((sku) => {
      const after = actualQuantities[sku.id];
      db.runSync('UPDATE skus SET quantity = ? WHERE id = ?', [after, sku.id]);
      writeMovement('STOCKTAKE', product.id, sku.id, product.name, product.code, sku.color, sku.size,
        after - sku.quantity, sku.quantity, after, user, note);
    });
    db.runSync('UPDATE products SET updated_at = ? WHERE id = ?', [new Date().toISOString(), product.id]);
    writeLog(user, '盘点修正', product.id, product.name, product.code, '', `${changed.length} 个 SKU 有差异`, note);
  });
  return changed.length;
}

export function adjustStock(skuId: number, action: StockAction, targetQuantity: number, note: string, user: User) {
  const sku = getSku(skuId);
  if (!sku || targetQuantity < 0) throw new Error('无效库存数量');
  db.withTransactionSync(() => {
    db.runSync('UPDATE skus SET quantity = ? WHERE id = ?', [targetQuantity, skuId]);
    db.runSync('UPDATE products SET updated_at = ? WHERE id = ?', [new Date().toISOString(), sku.productId]);
    writeMovement(action, sku.productId, sku.id, sku.productName, sku.productCode, sku.color, sku.size,
      targetQuantity - sku.quantity, sku.quantity, targetQuantity, user, note);
    writeLog(user, action === 'STOCKTAKE' ? '盘点修正' : '手动调整库存', sku.productId,
      sku.productName, sku.productCode, `${sku.quantity}`, `${targetQuantity}`, note);
  });
}

export function generateProductCode(categoryId: number) {
  const category = db.getFirstSync<{ code: string }>('SELECT code FROM categories WHERE id = ?', [categoryId]);
  const prefix = category?.code ?? 'ITEM';
  const date = todayKey();
  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) count FROM products WHERE code LIKE ?', [`${prefix}-${date}-%`])?.count ?? 0;
  return `${prefix}-${date}-${String(count + 1).padStart(3, '0')}`;
}

function generateOrderNo(prefix: string, table: 'purchase_orders' | 'sale_orders') {
  const date = todayKey();
  const count = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) count FROM ${table} WHERE order_no LIKE ?`, [`${prefix}-${date}-%`])?.count ?? 0;
  return `${prefix}-${date}-${String(count + 1).padStart(3, '0')}`;
}

function writeMovement(action: StockAction, productId: number, skuId: number, productName: string,
  productCode: string, color: string, size: string, change: number, before: number, after: number,
  user: User, note: string) {
  db.runSync(
    `INSERT INTO stock_movements
     (action, product_id, sku_id, product_name, product_code, color, size, quantity_change,
      before_quantity, after_quantity, operator_id, operator_name, created_at, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [action, productId, skuId, productName, productCode, color, size, change, before, after,
     user.id, user.name, new Date().toISOString(), note],
  );
}

function writeLog(user: User, action: string, productId: number, productName: string,
  productCode: string, beforeValue: string, afterValue: string, note: string) {
  db.runSync(
    `INSERT INTO operation_logs
     (operator_id, operator_name, created_at, action, product_id, product_name, product_code,
      before_value, after_value, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.name, new Date().toISOString(), action, productId, productName, productCode,
     beforeValue, afterValue, note],
  );
}
