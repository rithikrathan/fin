export type IncomeType = 'monthly' | 'one_time' | 'irregular';

export interface Fund {
  id: number;
  name: 'needs' | 'wants' | 'savings';
  balance: number;
  allocation_pct: number;
  color: string;
}

export interface IncomeTransaction {
  id: number;
  type: 'income';
  name: string;
  amount: number;
  income_type: IncomeType;
  category: string;
  date: string;
  notes: string;
  fund_allocation: {
    needs: number;
    wants: number;
    savings: number;
  };
}

export interface ExpenseTransaction {
  id: number;
  type: 'expense';
  description: string;
  amount: number;
  category: string;
  fund_id: number;
  fund_name: string;
  planned: boolean;
  date: string;
}

export type Transaction = IncomeTransaction | ExpenseTransaction;

export interface Want {
  id: number;
  name: string;
  target_price: number;
  current_saved: number;
  category: string;
  priority: 0 | 1 | 2;
  purchased: boolean;
  purchase_date: string | null;
  notes: string;
  days_to_buy: number | null;
  predicted_date: string | null;
  photo_url: string | null;
  purchase_link: string | null;
}

export interface Need {
  id: number;
  name: string;
  amount: number;
  category: string;
  recurring: boolean;
  frequency: 'monthly' | 'yearly' | 'weekly' | null;
  due_date: string | null;
  fund_id: number;
  fund_name: string;
  autopay: boolean;
  notes: string;
  active: boolean;
}

export type AssetType = 'stock' | 'mutual_fund' | 'fd' | 'ppf' | 'crypto' | 'other';

export interface Investment {
  id: number;
  name: string;
  asset_type: AssetType;
  invest_amount: number;
  current_value: number;
  purchase_date: string;
  notes: string;
}

export interface SavedReport {
  id: number;
  name: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  data: ReportData;
}

export interface ReportData {
  period: { start: string; end: string };
  total_income: number;
  total_expenses: number;
  net: number;
  by_fund: Record<string, number>;
  by_category: Record<string, number>;
  planned_total: number;
  unplanned_total: number;
  transaction_count: number;
  income_count: number;
  expense_count: number;
}

export interface Settings {
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
  currency: string;
  locale: string;
}

export interface AppState {
  funds: Fund[];
  transactions: Transaction[];
  wants: Want[];
  needs: Need[];
  investments: Investment[];
  reports: SavedReport[];
  settings: Settings;
  loading: boolean;
}

export type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: number }
  | { type: 'UPDATE_FUND'; payload: Fund }
  | { type: 'ADD_WANT'; payload: Want }
  | { type: 'UPDATE_WANT'; payload: Want }
  | { type: 'REMOVE_WANT'; payload: number }
  | { type: 'ADD_NEED'; payload: Need }
  | { type: 'UPDATE_NEED'; payload: Need }
  | { type: 'REMOVE_NEED'; payload: number }
  | { type: 'ADD_INVESTMENT'; payload: Investment }
  | { type: 'UPDATE_INVESTMENT'; payload: Investment }
  | { type: 'REMOVE_INVESTMENT'; payload: number }
  | { type: 'SAVE_REPORT'; payload: SavedReport }
  | { type: 'REMOVE_REPORT'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'LOAD_DATA'; payload: AppState }
  | { type: 'DELETE_ALL' }
  | { type: 'SET_LOADING'; payload: boolean };
