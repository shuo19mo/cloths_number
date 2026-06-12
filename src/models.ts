export type StockAction = 'PURCHASE' | 'SALE' | 'RETURN' | 'LOSS' | 'MANUAL' | 'STOCKTAKE';
export type StockStatus = 'NORMAL' | 'LOW' | 'OUT' | 'SLOW';
export type ProductSort = 'UPDATED' | 'STOCK_DESC' | 'STOCK_ASC' | 'PRICE_DESC' | 'COST_DESC';

export type User = {
  id: number;
  name: string;
  phone: string;
  avatarUri?: string | null;
  lastActiveAt: string;
};

export type Category = {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
};

export type Product = {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  category: string;
  brand?: string | null;
  supplier?: string | null;
  note?: string | null;
  defaultCost: number;
  averageCost: number;
  lastPurchaseCost: number;
  defaultPrice: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
  mainImageUri?: string | null;
  totalStock: number;
  stockCost: number;
  stockRetail: number;
  expectedProfit: number;
  marginRate: number;
  status: StockStatus;
};

export type Sku = {
  id: number;
  productId: number;
  color: string;
  size: string;
  quantity: number;
};

export type ProductInput = {
  name: string;
  categoryId: number;
  colors: string[];
  sizes: string[];
  initialStock: number;
  defaultCost: number;
  defaultPrice: number;
  minStock: number;
  brand?: string;
  supplier?: string;
  note?: string;
  imageUri?: string;
};

export type PurchaseItemInput = { skuId: number; quantity: number; unitCost: number };
export type PurchaseOrderInput = {
  productId: number;
  items: PurchaseItemInput[];
  supplier: string;
  shippingFee: number;
  note: string;
};

export type SaleItemInput = { skuId: number; quantity: number; unitPrice: number };
export type SaleOrderInput = {
  productId: number;
  items: SaleItemInput[];
  discount: number;
  receivedAmount: number;
  note: string;
};

export type Movement = {
  id: number;
  action: StockAction;
  productName: string;
  productCode: string;
  color: string;
  size: string;
  quantityChange: number;
  beforeQuantity: number;
  afterQuantity: number;
  operatorName: string;
  createdAt: string;
  note?: string | null;
};

export type OperationLog = {
  id: number;
  operatorName: string;
  createdAt: string;
  action: string;
  productName?: string | null;
  productCode?: string | null;
  beforeValue?: string | null;
  afterValue?: string | null;
  note?: string | null;
};

export type DashboardStats = {
  totalProducts: number;
  totalStock: number;
  stockCost: number;
  stockRetail: number;
  expectedProfit: number;
  todaySales: number;
  todayCost: number;
  todayProfit: number;
  weekSales: number;
  monthSales: number;
  monthProfit: number;
  lowStockCount: number;
  outStockCount: number;
};

export type ProductFilters = {
  search?: string;
  categoryId?: number | null;
  status?: StockStatus | null;
  sort?: ProductSort;
};
