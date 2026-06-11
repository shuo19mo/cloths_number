import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('cloth_inventory.db');

export function getDb() {
  return db;
}

export function initDatabase() {
  db.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      avatar_uri TEXT,
      last_active_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      supplier TEXT,
      note TEXT,
      default_cost REAL NOT NULL,
      default_price REAL NOT NULL,
      min_stock INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      color TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      UNIQUE(product_id, color, size),
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      sku_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      color TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity_change INTEGER NOT NULL,
      before_quantity INTEGER NOT NULL,
      after_quantity INTEGER NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(sku_id) REFERENCES skus(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchase_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      sku_id INTEGER NOT NULL,
      purchase_date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      supplier TEXT,
      shipping_fee REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(sku_id) REFERENCES skus(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sale_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      sku_id INTEGER NOT NULL,
      sale_date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      received_amount REAL NOT NULL,
      cost REAL NOT NULL,
      profit REAL NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(sku_id) REFERENCES skus(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      action TEXT NOT NULL,
      product_id INTEGER,
      product_name TEXT,
      product_code TEXT,
      before_value TEXT,
      after_value TEXT,
      note TEXT
    );
  `);

  seedDatabase();
}

function seedDatabase() {
  const userCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM users')?.count ?? 0;
  if (userCount > 0) {
    return;
  }

  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    db.runSync('INSERT INTO users (name, phone, avatar_uri, last_active_at) VALUES (?, ?, ?, ?)', [
      '张三',
      '店主',
      null,
      now,
    ]);
    db.runSync('INSERT INTO users (name, phone, avatar_uri, last_active_at) VALUES (?, ?, ?, ?)', [
      '李四',
      '导购',
      null,
      now,
    ]);

    db.runSync(
      `INSERT INTO products
        (code, name, category, brand, supplier, note, default_cost, default_price, min_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['TOP-20260611-001', '基础白 T 恤', 'TOP', 'Atelier', '杭州织造', '四季基础款', 42, 129, 8, now, now],
    );
    db.runSync(
      `INSERT INTO products
        (code, name, category, brand, supplier, note, default_cost, default_price, min_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['DRESS-20260611-002', '法式收腰连衣裙', 'DRESS', 'Moss', '广州样衣室', '夏季主推', 118, 329, 5, now, now],
    );
    db.runSync(
      `INSERT INTO products
        (code, name, category, brand, supplier, note, default_cost, default_price, min_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['PANTS-20260611-003', '高腰直筒西裤', 'PANTS', 'Studio Line', '上海档口', '黑色缺货提醒', 86, 239, 6, now, now],
    );

    const skuRows = [
      [1, '白色', 'S', 10],
      [1, '白色', 'M', 8],
      [1, '黑色', 'M', 12],
      [1, '黑色', 'L', 6],
      [2, '米色', 'M', 4],
      [2, '黑色', 'L', 3],
      [3, '黑色', 'M', 0],
      [3, '灰色', 'L', 9],
    ];
    skuRows.forEach((row) => {
      db.runSync('INSERT INTO skus (product_id, color, size, quantity) VALUES (?, ?, ?, ?)', row);
    });

    db.runSync(
      `INSERT INTO purchase_records
       (product_id, sku_id, purchase_date, quantity, unit_cost, supplier, shipping_fee, total_cost, operator_id, operator_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 1, now, 10, 42, '杭州织造', 12, 432, 1, '张三', '首批入库'],
    );
    db.runSync(
      `INSERT INTO sale_records
       (product_id, sku_id, sale_date, quantity, unit_price, discount, received_amount, cost, profit, operator_id, operator_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 2, now, 2, 129, 0, 258, 84, 174, 2, '李四', '今日销售示例'],
    );
    db.runSync(
      `INSERT INTO stock_movements
       (action, product_id, sku_id, product_name, product_code, color, size, quantity_change, before_quantity, after_quantity, operator_id, operator_name, created_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['PURCHASE', 1, 1, '基础白 T 恤', 'TOP-20260611-001', '白色', 'S', 10, 0, 10, 1, '张三', now, '首批入库'],
    );
    db.runSync(
      `INSERT INTO operation_logs
       (operator_id, operator_name, created_at, action, product_id, product_name, product_code, before_value, after_value, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, '张三', now, '新增商品', 1, '基础白 T 恤', 'TOP-20260611-001', '', '创建商品和 SKU', '示例数据'],
    );
  });
}
