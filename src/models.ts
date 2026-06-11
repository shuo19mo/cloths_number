export type StockAction =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'LOSS'
  | 'MANUAL'
  | 'STOCKTAKE';

export type StockStatus = 'NORMAL' | 'LOW' | 'OUT' | 'SLOW';

export type User = {
  id: number;
  name: string;
  phone: string;
  avatarUri?: string | null;
  lastActiveAt: string;
};

export type Product = {
  id: number;
  code: string;
  name: string;
  category: string;
  brand?: string | null;
  supplier?: string | null;
  note?: string | null;
  defaultCost: number;
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
  category: string;
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
