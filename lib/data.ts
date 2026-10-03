export interface SaleItem {
  id: string;
  date: string;
  category: string;
  region: string;
  amount: number;
  quantity: number;
  inStock: boolean;
}

export const SALES_DATA: SaleItem[] = [
  { id: 's1', date: '2026-01-10', category: 'Electronics', region: 'North', amount: 1250, quantity: 3, inStock: true },
  { id: 's2', date: '2026-01-15', category: 'Apparel', region: 'South', amount: 640, quantity: 5, inStock: true },
  { id: 's3', date: '2026-01-20', category: 'Furniture', region: 'East', amount: 1890, quantity: 2, inStock: false },
  { id: 's4', date: '2026-01-28', category: 'Electronics', region: 'West', amount: 2100, quantity: 4, inStock: true },
  { id: 's5', date: '2026-02-05', category: 'Apparel', region: 'North', amount: 980, quantity: 8, inStock: true },
  { id: 's6', date: '2026-02-12', category: 'Furniture', region: 'South', amount: 1450, quantity: 1, inStock: false },
  { id: 's7', date: '2026-02-18', category: 'Electronics', region: 'East', amount: 2300, quantity: 6, inStock: true },
  { id: 's8', date: '2026-02-25', category: 'Apparel', region: 'West', amount: 1120, quantity: 7, inStock: true },
  { id: 's9', date: '2026-03-02', category: 'Furniture', region: 'North', amount: 1760, quantity: 3, inStock: true },
  { id: 's10', date: '2026-03-11', category: 'Electronics', region: 'South', amount: 2900, quantity: 5, inStock: false },
  { id: 's11', date: '2026-03-19', category: 'Apparel', region: 'East', amount: 830, quantity: 4, inStock: true },
  { id: 's12', date: '2026-03-27', category: 'Furniture', region: 'West', amount: 2050, quantity: 2, inStock: true },
];

export const ALL_CATEGORIES = ['Electronics', 'Apparel', 'Furniture'];
export const ALL_REGIONS = ['North', 'South', 'East', 'West'];

// BarChart və DataTable uyğunluğu üçün alias eksportlar:
export const CATEGORIES = ['All', ...ALL_CATEGORIES];
export const REGIONS = ['All', ...ALL_REGIONS];