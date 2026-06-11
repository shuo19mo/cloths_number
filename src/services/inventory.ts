import { Alert } from 'react-native';
import { getDb } from '../db/database';
import type { ProductInput, StockAction, User } from '../models';
import { todayKey } from './format';
import { getSku } from './queries';

const db = getDb();

const CATEGORY_PREFIX: Record<string, string> = {
  上衣: 'TOP',
  连衣裙: 'DRESS',
  裤装: 'PANTS',
  外套: 'COAT',
  裙装: 'SKIRT',
  TOP: 'TOP',
  DRESS: 'DRESS',
  PANTS: 'PANTS',
};

export function createProduct(input: ProductInput, user: User) {
  const now = new Date().toISOString();
  const code = generateProductCode(input.category);
  let productId = 0;
  db.withTransactionSync(() => {
    const result = db.runSync(
      `INSERT INTO products
       (code, name, category, brand, supplier, note, default_cost, default_price, min_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        input.name,
        input.category,
        input.brand ?? '',
        input.supplier ?? '',
        input.note ?? '',
        input.defaultCost,
        input.defaultPrice,
        input.minStock,
        now,
        now,
      ],
    );
    productId = result.lastInsertRowId;
    if (input.imageUri) {
      db.runSync('INSERT INTO product_images (product_id, uri, is_primary, created_at) VALUES (?, ?, 1, ?)', [
        productId,
        input.imageUri,
        now,
      ]);
    }
    input.colors.forEach((color) => {
      input.sizes.forEach((size) => {
        const skuResult = db.runSync('INSERT INTO skus (product_id, color, size, quantity) VALUES (?, ?, ?, ?)', [
          productId,
          color,
          size,
          input.initialStock,
        ]);
        if (input.initialStock > 0) {
          writeMovement({
            action: 'MANUAL',
            productId,
            skuId: skuResult.lastInsertRowId,
            productName: input.name,
            productCode: code,
            color,
            size,
            change: input.initialStock,
            before: 0,
            after: input.initialStock,
            user,
            note: '初始库存',
          });
        }
      });
    });
    writeLog(user, '新增商品', productId, input.name, code, '', JSON.stringify(input), '本地创建商品');
  });
  return productId;
}

export function purchaseStock(skuId: number, quantity: number, unitCost: number, supplier: string, shippingFee: number, note: string, user: User) {
  const sku = getSku(skuId);
  if (!sku || quantity <= 0) return;
  const now = new Date().toISOString();
  const before = sku.quantity;
  const after = before + quantity;
  db.withTransactionSync(() => {
    db.runSync('UPDATE skus SET quantity = ? WHERE id = ?', [after, skuId]);
    db.runSync('UPDATE products SET default_cost = ?, supplier = ?, updated_at = ? WHERE id = ?', [
      unitCost,
      supplier,
      now,
      sku.productId,
    ]);
    db.runSync(
      `INSERT INTO purchase_records
       (product_id, sku_id, purchase_date, quantity, unit_cost, supplier, shipping_fee, total_cost, operator_id, operator_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku.productId, skuId, now, quantity, unitCost, supplier, shippingFee, quantity * unitCost + shippingFee, user.id, user.name, note],
    );
    writeMovement({
      action: 'PURCHASE',
      productId: sku.productId,
      skuId,
      productName: sku.productName,
      productCode: sku.productCode,
      color: sku.color,
      size: sku.size,
      change: quantity,
      before,
      after,
      user,
      note,
    });
    writeLog(user, '进货入库', sku.productId, sku.productName, sku.productCode, `${before}`, `${after}`, note);
  });
}

export function sellStock(skuId: number, quantity: number, unitPrice: number, discount: number, receivedAmount: number, note: string, user: User) {
  const sku = getSku(skuId);
  if (!sku || quantity <= 0) return false;
  if (sku.quantity < quantity) {
    Alert.alert('库存不足', '当前库存不足，无法完成销售。');
    return false;
  }
  const now = new Date().toISOString();
  const before = sku.quantity;
  const after = before - quantity;
  const cost = quantity * sku.defaultCost;
  const actualReceived = receivedAmount || quantity * unitPrice - discount;
  db.withTransactionSync(() => {
    db.runSync('UPDATE skus SET quantity = ? WHERE id = ?', [after, skuId]);
    db.runSync('UPDATE products SET default_price = ?, updated_at = ? WHERE id = ?', [unitPrice, now, sku.productId]);
    db.runSync(
      `INSERT INTO sale_records
       (product_id, sku_id, sale_date, quantity, unit_price, discount, received_amount, cost, profit, operator_id, operator_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku.productId, skuId, now, quantity, unitPrice, discount, actualReceived, cost, actualReceived - cost, user.id, user.name, note],
    );
    writeMovement({
      action: 'SALE',
      productId: sku.productId,
      skuId,
      productName: sku.productName,
      productCode: sku.productCode,
      color: sku.color,
      size: sku.size,
      change: -quantity,
      before,
      after,
      user,
      note,
    });
    writeLog(user, '销售出库', sku.productId, sku.productName, sku.productCode, `${before}`, `${after}`, note);
  });
  return true;
}

export function adjustStock(skuId: number, action: StockAction, targetQuantity: number, note: string, user: User) {
  const sku = getSku(skuId);
  if (!sku || targetQuantity < 0) return;
  const now = new Date().toISOString();
  const before = sku.quantity;
  const after = targetQuantity;
  db.withTransactionSync(() => {
    db.runSync('UPDATE skus SET quantity = ? WHERE id = ?', [after, skuId]);
    db.runSync('UPDATE products SET updated_at = ? WHERE id = ?', [now, sku.productId]);
    writeMovement({
      action,
      productId: sku.productId,
      skuId,
      productName: sku.productName,
      productCode: sku.productCode,
      color: sku.color,
      size: sku.size,
      change: after - before,
      before,
      after,
      user,
      note,
    });
    writeLog(user, action === 'STOCKTAKE' ? '盘点修正' : '手动调整库存', sku.productId, sku.productName, sku.productCode, `${before}`, `${after}`, note);
  });
}

export function generateProductCode(category: string) {
  const prefix = CATEGORY_PREFIX[category] ?? (category.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'ITEM');
  const date = todayKey();
  const count =
    db.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM products WHERE code LIKE ?', [`${prefix}-${date}-%`])
      ?.count ?? 0;
  return `${prefix}-${date}-${String(count + 1).padStart(3, '0')}`;
}

function writeMovement(input: {
  action: StockAction;
  productId: number;
  skuId: number;
  productName: string;
  productCode: string;
  color: string;
  size: string;
  change: number;
  before: number;
  after: number;
  user: User;
  note: string;
}) {
  db.runSync(
    `INSERT INTO stock_movements
     (action, product_id, sku_id, product_name, product_code, color, size, quantity_change, before_quantity, after_quantity, operator_id, operator_name, created_at, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.action,
      input.productId,
      input.skuId,
      input.productName,
      input.productCode,
      input.color,
      input.size,
      input.change,
      input.before,
      input.after,
      input.user.id,
      input.user.name,
      new Date().toISOString(),
      input.note,
    ],
  );
}

function writeLog(
  user: User,
  action: string,
  productId: number,
  productName: string,
  productCode: string,
  beforeValue: string,
  afterValue: string,
  note: string,
) {
  db.runSync(
    `INSERT INTO operation_logs
     (operator_id, operator_name, created_at, action, product_id, product_name, product_code, before_value, after_value, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.name, new Date().toISOString(), action, productId, productName, productCode, beforeValue, afterValue, note],
  );
}
