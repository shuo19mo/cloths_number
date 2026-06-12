import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const db = openDatabaseSync('cloth_inventory.db');
const SCHEMA_VERSION = 2;
const DEMO_VERSION = 2;

const DEFAULT_CATEGORIES = [
  ['上衣', 'TOP'],
  ['裤装', 'PANTS'],
  ['连衣裙', 'DRESS'],
  ['裙装', 'SKIRT'],
  ['外套', 'COAT'],
  ['配饰', 'ACC'],
] as const;

export function getDb() {
  return db;
}

export function initDatabase() {
  db.execSync('PRAGMA foreign_keys = ON;');
  createBaseSchema(db);
  migrateDatabase(db);
  ensureUsers(db);
  ensureCategories(db);
  mapLegacyCategories(db);
  migrateLegacyOrders(db);
  ensureDemoData();
}

function createBaseSchema(database: SQLiteDatabase) {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
      avatar_uri TEXT, last_active_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, code TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'TOP', category_id INTEGER, brand TEXT, supplier TEXT, note TEXT,
      default_cost REAL NOT NULL, average_cost REAL NOT NULL DEFAULT 0,
      last_purchase_cost REAL NOT NULL DEFAULT 0, default_price REAL NOT NULL,
      min_stock INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, uri TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS skus (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, color TEXT NOT NULL,
      size TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0, UNIQUE(product_id, color, size),
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, product_id INTEGER NOT NULL,
      sku_id INTEGER NOT NULL, product_name TEXT NOT NULL, product_code TEXT NOT NULL,
      color TEXT NOT NULL, size TEXT NOT NULL, quantity_change INTEGER NOT NULL,
      before_quantity INTEGER NOT NULL, after_quantity INTEGER NOT NULL,
      operator_id INTEGER NOT NULL, operator_name TEXT NOT NULL, created_at TEXT NOT NULL, note TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(sku_id) REFERENCES skus(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS purchase_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, sku_id INTEGER NOT NULL,
      purchase_date TEXT NOT NULL, quantity INTEGER NOT NULL, unit_cost REAL NOT NULL,
      supplier TEXT, shipping_fee REAL NOT NULL DEFAULT 0, total_cost REAL NOT NULL,
      operator_id INTEGER NOT NULL, operator_name TEXT NOT NULL, note TEXT
    );
    CREATE TABLE IF NOT EXISTS sale_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, sku_id INTEGER NOT NULL,
      sale_date TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0, received_amount REAL NOT NULL, cost REAL NOT NULL,
      profit REAL NOT NULL, operator_id INTEGER NOT NULL, operator_name TEXT NOT NULL, note TEXT
    );
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, operator_id INTEGER NOT NULL, operator_name TEXT NOT NULL,
      created_at TEXT NOT NULL, action TEXT NOT NULL, product_id INTEGER, product_name TEXT,
      product_code TEXT, before_value TEXT, after_value TEXT, note TEXT
    );
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT NOT NULL UNIQUE, product_id INTEGER NOT NULL,
      order_date TEXT NOT NULL, supplier TEXT, shipping_fee REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL, operator_id INTEGER NOT NULL, operator_name TEXT NOT NULL, note TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, sku_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL, unit_cost REAL NOT NULL, line_cost REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY(sku_id) REFERENCES skus(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sale_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT NOT NULL UNIQUE, product_id INTEGER NOT NULL,
      order_date TEXT NOT NULL, discount REAL NOT NULL DEFAULT 0, received_amount REAL NOT NULL,
      total_cost REAL NOT NULL, profit REAL NOT NULL, operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL, note TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, sku_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL, unit_price REAL NOT NULL, line_amount REAL NOT NULL,
      unit_cost REAL NOT NULL, line_cost REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES sale_orders(id) ON DELETE CASCADE,
      FOREIGN KEY(sku_id) REFERENCES skus(id) ON DELETE CASCADE
    );
  `);
}

function migrateDatabase(database: SQLiteDatabase) {
  addColumnIfMissing(database, 'products', 'category_id', 'INTEGER');
  addColumnIfMissing(database, 'products', 'average_cost', 'REAL NOT NULL DEFAULT 0');
  addColumnIfMissing(database, 'products', 'last_purchase_cost', 'REAL NOT NULL DEFAULT 0');
  database.runSync(
    'UPDATE products SET average_cost = default_cost WHERE average_cost = 0 OR average_cost IS NULL',
  );
  database.runSync(
    'UPDATE products SET last_purchase_cost = default_cost WHERE last_purchase_cost = 0 OR last_purchase_cost IS NULL',
  );
  database.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

function addColumnIfMissing(database: SQLiteDatabase, table: string, column: string, definition: string) {
  const columns = database.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    database.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

function ensureUsers(database: SQLiteDatabase) {
  const count = database.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM users')?.count ?? 0;
  if (count > 0) return;
  const now = new Date().toISOString();
  database.runSync('INSERT INTO users (name, phone, last_active_at) VALUES (?, ?, ?)', ['张三', '店主', now]);
  database.runSync('INSERT INTO users (name, phone, last_active_at) VALUES (?, ?, ?)', ['李四', '导购', now]);
}

function ensureCategories(database: SQLiteDatabase) {
  const now = new Date().toISOString();
  DEFAULT_CATEGORIES.forEach(([name, code], index) => {
    database.runSync(
      'INSERT OR IGNORE INTO categories (name, code, sort_order, created_at) VALUES (?, ?, ?, ?)',
      [name, code, index, now],
    );
  });
}

function mapLegacyCategories(database: SQLiteDatabase) {
  const aliases: Record<string, string> = {
    TOP: 'TOP', PANTS: 'PANTS', DRESS: 'DRESS', SKIRT: 'SKIRT', COAT: 'COAT', ACC: 'ACC',
    上衣: 'TOP', 裤装: 'PANTS', 裤子: 'PANTS', 连衣裙: 'DRESS', 裙装: 'SKIRT', 外套: 'COAT', 配饰: 'ACC',
  };
  const products = database.getAllSync<{ id: number; category: string; category_id: number | null }>(
    'SELECT id, category, category_id FROM products',
  );
  products.forEach((product) => {
    if (product.category_id) return;
    const code = aliases[product.category] ?? 'TOP';
    const category = database.getFirstSync<{ id: number; name: string }>('SELECT id, name FROM categories WHERE code = ?', [code]);
    if (category) {
      database.runSync('UPDATE products SET category_id = ?, category = ? WHERE id = ?', [category.id, category.name, product.id]);
    }
  });
}

function migrateLegacyOrders(database: SQLiteDatabase) {
  const migrated = database.getFirstSync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', ['legacy_orders_migrated']);
  if (migrated) return;
  const purchases = database.getAllSync<any>('SELECT * FROM purchase_records ORDER BY id');
  const sales = database.getAllSync<any>('SELECT * FROM sale_records ORDER BY id');
  database.withTransactionSync(() => {
    purchases.forEach((row) => {
      const orderNo = `PO-LEGACY-${String(row.id).padStart(4, '0')}`;
      const orderId = database.runSync(
        `INSERT OR IGNORE INTO purchase_orders
         (order_no, product_id, order_date, supplier, shipping_fee, total_cost, operator_id, operator_name, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNo, row.product_id, row.purchase_date, row.supplier, row.shipping_fee, row.total_cost,
         row.operator_id, row.operator_name, row.note],
      ).lastInsertRowId;
      const existing = database.getFirstSync<{ id: number }>('SELECT id FROM purchase_orders WHERE order_no = ?', [orderNo]);
      const targetId = orderId || existing?.id;
      if (targetId && !(database.getFirstSync('SELECT id FROM purchase_items WHERE order_id = ?', [targetId]))) {
        database.runSync(
          'INSERT INTO purchase_items (order_id, sku_id, quantity, unit_cost, line_cost) VALUES (?, ?, ?, ?, ?)',
          [targetId, row.sku_id, row.quantity, row.unit_cost, row.quantity * row.unit_cost],
        );
      }
    });
    sales.forEach((row) => {
      const orderNo = `SO-LEGACY-${String(row.id).padStart(4, '0')}`;
      const orderId = database.runSync(
        `INSERT OR IGNORE INTO sale_orders
         (order_no, product_id, order_date, discount, received_amount, total_cost, profit,
          operator_id, operator_name, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNo, row.product_id, row.sale_date, row.discount, row.received_amount, row.cost, row.profit,
         row.operator_id, row.operator_name, row.note],
      ).lastInsertRowId;
      const existing = database.getFirstSync<{ id: number }>('SELECT id FROM sale_orders WHERE order_no = ?', [orderNo]);
      const targetId = orderId || existing?.id;
      if (targetId && !(database.getFirstSync('SELECT id FROM sale_items WHERE order_id = ?', [targetId]))) {
        database.runSync(
          `INSERT INTO sale_items
           (order_id, sku_id, quantity, unit_price, line_amount, unit_cost, line_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [targetId, row.sku_id, row.quantity, row.unit_price, row.quantity * row.unit_price,
           row.quantity ? row.cost / row.quantity : 0, row.cost],
        );
      }
    });
    database.runSync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', ['legacy_orders_migrated', '1']);
  });
}

export function ensureDemoData() {
  const current = Number(db.getFirstSync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', ['demo_version'])?.value ?? 0);
  if (current >= DEMO_VERSION) return;
  seedDemoProducts(db);
  db.runSync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', ['demo_version', String(DEMO_VERSION)]);
}

function seedDemoProducts(database: SQLiteDatabase) {
  const now = new Date().toISOString();
  const products = [
    ['TOP-DEMO-001', '基础白 T 恤', 'TOP', 'Atelier', '杭州织造', 42, 129, 8, [['白色','S',10],['白色','M',8],['黑色','M',12],['黑色','L',6]]],
    ['DRESS-DEMO-002', '法式收腰连衣裙', 'DRESS', 'Moss', '广州样衣室', 118, 329, 8, [['米色','M',4],['黑色','L',3]]],
    ['PANTS-DEMO-003', '高腰直筒西裤', 'PANTS', 'Studio Line', '上海档口', 86, 239, 12, [['黑色','M',0],['灰色','L',9]]],
    ['TOP-DEMO-004', '条纹针织开衫', 'TOP', 'Mori', '桐乡针织', 72, 199, 6, [['蓝白','S',7],['蓝白','M',11],['红白','M',5]]],
    ['SKIRT-DEMO-005', '百褶半身裙', 'SKIRT', 'Moss', '广州样衣室', 65, 189, 5, [['卡其','S',3],['卡其','M',6],['黑色','M',8]]],
    ['COAT-DEMO-006', '轻薄风衣外套', 'COAT', 'Atelier', '苏州成衣', 168, 459, 4, [['军绿','M',5],['卡其','L',2]]],
    ['ACC-DEMO-007', '真丝小方巾', 'ACC', 'Studio Line', '义乌配饰', 18, 69, 10, [['印花','均码',18],['藏蓝','均码',9]]],
    ['PANTS-DEMO-008', '垂感阔腿裤', 'PANTS', 'Mori', '上海档口', 79, 219, 8, [['黑色','S',14],['黑色','M',16],['杏色','M',7]]],
    ['DRESS-DEMO-009', '亚麻吊带长裙', 'DRESS', 'Mori', '广州样衣室', 105, 299, 6, [['白色','S',0],['绿色','M',4]]],
  ] as const;

  database.withTransactionSync(() => {
    products.forEach(([code, name, categoryCode, brand, supplier, cost, price, minStock, skuRows]) => {
      const category = database.getFirstSync<{ id: number; name: string }>('SELECT id, name FROM categories WHERE code = ?', [categoryCode]);
      if (!category) return;
      database.runSync(
        `INSERT OR IGNORE INTO products
         (code, name, category, category_id, brand, supplier, note, default_cost, average_cost,
          last_purchase_cost, default_price, min_stock, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, name, category.name, category.id, brand, supplier, 'Demo 商品', cost, cost, cost, price, minStock, now, now],
      );
      const product = database.getFirstSync<{ id: number }>('SELECT id FROM products WHERE code = ?', [code]);
      if (!product) return;
      skuRows.forEach(([color, size, quantity]) => {
        database.runSync(
          'INSERT OR IGNORE INTO skus (product_id, color, size, quantity) VALUES (?, ?, ?, ?)',
          [product.id, color, size, quantity],
        );
      });
    });
    const first = database.getFirstSync<{ id: number; name: string; code: string }>('SELECT id, name, code FROM products ORDER BY id LIMIT 1');
    const user = database.getFirstSync<{ id: number; name: string }>('SELECT id, name FROM users ORDER BY id LIMIT 1');
    const sku = first ? database.getFirstSync<{ id: number; color: string; size: string; quantity: number }>('SELECT * FROM skus WHERE product_id = ? LIMIT 1', [first.id]) : null;
    const logCount = database.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM operation_logs')?.count ?? 0;
    if (first && user && sku && logCount === 0) {
      database.runSync(
        `INSERT INTO operation_logs
         (operator_id, operator_name, created_at, action, product_id, product_name, product_code, before_value, after_value, note)
         VALUES (?, ?, ?, '新增商品', ?, ?, ?, '', 'Demo 初始化', '系统示例数据')`,
        [user.id, user.name, now, first.id, first.name, first.code],
      );
      database.runSync(
        `INSERT INTO stock_movements
         (action, product_id, sku_id, product_name, product_code, color, size, quantity_change,
          before_quantity, after_quantity, operator_id, operator_name, created_at, note)
         VALUES ('PURCHASE', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'Demo 首批入库')`,
        [first.id, sku.id, first.name, first.code, sku.color, sku.size, sku.quantity, sku.quantity, user.id, user.name, now],
      );
    }
    const purchaseCount = database.getFirstSync<{ count: number }>('SELECT COUNT(*) count FROM purchase_orders')?.count ?? 0;
    if (first && user && sku && purchaseCount === 0) {
      const product = database.getFirstSync<{ default_cost: number; default_price: number }>(
        'SELECT default_cost, default_price FROM products WHERE id = ?', [first.id],
      );
      if (product) {
        const purchaseOrderId = database.runSync(
          `INSERT INTO purchase_orders
           (order_no, product_id, order_date, supplier, shipping_fee, total_cost, operator_id, operator_name, note)
           VALUES ('PO-DEMO-001', ?, ?, 'Demo 供应商', 12, ?, ?, ?, '示例进货单')`,
          [first.id, now, product.default_cost * 10 + 12, user.id, user.name],
        ).lastInsertRowId;
        database.runSync(
          'INSERT INTO purchase_items (order_id, sku_id, quantity, unit_cost, line_cost) VALUES (?, ?, 10, ?, ?)',
          [purchaseOrderId, sku.id, product.default_cost, product.default_cost * 10],
        );
        const saleOrderId = database.runSync(
          `INSERT INTO sale_orders
           (order_no, product_id, order_date, discount, received_amount, total_cost, profit,
            operator_id, operator_name, note) VALUES ('SO-DEMO-001', ?, ?, 0, ?, ?, ?, ?, ?, '示例销售单')`,
          [first.id, now, product.default_price * 2, product.default_cost * 2,
           (product.default_price - product.default_cost) * 2, user.id, user.name],
        ).lastInsertRowId;
        database.runSync(
          `INSERT INTO sale_items
           (order_id, sku_id, quantity, unit_price, line_amount, unit_cost, line_cost)
           VALUES (?, ?, 2, ?, ?, ?, ?)`,
          [saleOrderId, sku.id, product.default_price, product.default_price * 2,
           product.default_cost, product.default_cost * 2],
        );
      }
    }
  });
}

export function resetDemoData() {
  db.withTransactionSync(() => {
    db.execSync(`
      DELETE FROM purchase_items; DELETE FROM purchase_orders;
      DELETE FROM sale_items; DELETE FROM sale_orders;
      DELETE FROM purchase_records; DELETE FROM sale_records;
      DELETE FROM stock_movements; DELETE FROM operation_logs;
      DELETE FROM product_images; DELETE FROM skus; DELETE FROM products;
      DELETE FROM app_meta WHERE key = 'demo_version';
    `);
  });
  ensureDemoData();
}
