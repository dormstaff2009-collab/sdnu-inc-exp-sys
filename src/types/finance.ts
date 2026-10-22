export type TransactionType = 'income' | 'expense';
export type UserRole = 'admin' | 'viewer';

export const DEFAULT_FISCAL_YEARS = [
  'ปี งปม.2556',
  'ปี งปม.2557',
  'ปี งปม.2558',
  'ปี งปม.2559',
  'ปี งปม.2560',
  'ปี งปม.2561',
  'ปี งปม.2562',
  'ปี งปม.2563',
  'ปี งปม.2564',
  'ปี งปม.2565',
  'ปี งปม.2566',
  'ปี งปม.2567',
  'ปี งปม.2568',
  'ปี งปม.2569',
  'ปี งปม.2570',
] as const;

export const BUILDINGS = [
  'อาคาร มน.นิเวศ 1-2',
  'อาคาร มน.นิเวศ 3-4',
  'อาคาร มน.นิเวศ 5',
  'อาคาร มน.นิเวศ 6',
  'อาคาร มน.นิเวศ 7-8',
  'อาคาร มน.นิเวศ 9-10',
  'อาคาร มน.นิเวศ 11-12',
  'อาคาร มน.นิเวศ 14-15',
] as const;

export type BuildingName = (typeof BUILDINGS)[number];

export interface FiscalYearItem {
  id: string;
  year: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  fiscalYear: string;
  building: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  amount: number;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
  type: TransactionType;
}

export interface AuthSession {
  role: UserRole;
  username?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}
