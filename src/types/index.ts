export type IncomeType = 'monthly' | 'one_time' | 'irregular';

export interface Fund {
  id: number;
  name: string;
  balance: number;
  allocation_pct: number;
  allocation_locked: boolean;
  color: string;
  deadline: string | null;
  goal_amount: number | null;
  interest_rate: number | null;
  interest_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  interest_calc_type: 'compound' | 'simple' | null;
  is_career_fund: boolean;
}

export interface Milestone {
  id: number;
  fund_id: number;
  name: string;
  target_amount: number;
  reached: boolean;
}

export interface FundSnapshot {
  id: number;
  fund_id: number;
  balance: number;
  date: string;
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
  fund_allocation: Record<number, number>;
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
  is_misc: boolean;
}

export interface TransferTransaction {
  id: number;
  type: 'transfer';
  from_fund_id: number;
  to_fund_id: number;
  amount: number;
  note: string;
  date: string;
}

export type Transaction = IncomeTransaction | ExpenseTransaction | TransferTransaction;

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
  added_at: string;
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
  reapproval_required: boolean;
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

export interface Debt {
  id: number;
  name: string;
  total_principal: number;
  remaining_balance: number;
  emi_amount: number;
  interest_rate: number;
  due_date: number;
  linked_fund_id: number;
  notes: string;
  active: boolean;
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
  currency: string;
  locale: string;
  expected_monthly_income: number;
  scale_amount: number;
  impulse_tax_pct: number;
  hourly_rate: number;
  allocation_mode: 'blind' | 'waterfall';
  baseline_survival_amount: number;
  mock_salary: number;
  last_reconciliation: string | null;
}

export interface AppState {
  funds: Fund[];
  milestones: Milestone[];
  fund_snapshots: FundSnapshot[];
  transactions: Transaction[];
  wants: Want[];
  needs: Need[];
  investments: Investment[];
  debts: Debt[];
  reports: SavedReport[];
  settings: Settings;
  loading: boolean;
}

export type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: number }
  | { type: 'UPDATE_FUND'; payload: Fund }
  | { type: 'ADD_FUND'; payload: Fund }
  | { type: 'REMOVE_FUND'; payload: number }
  | { type: 'ADD_MILESTONE'; payload: Milestone }
  | { type: 'UPDATE_MILESTONE'; payload: Milestone }
  | { type: 'REMOVE_MILESTONE'; payload: number }
  | { type: 'ADD_FUND_SNAPSHOT'; payload: FundSnapshot }
  | { type: 'REDISTRIBUTE_SURPLUS'; payload: { transfers: { from_fund_id: number; to_fund_id: number; amount: number }[] } }
  | { type: 'RESET_TRANSACTIONS' }
  | { type: 'ADD_WANT'; payload: Want }
  | { type: 'UPDATE_WANT'; payload: Want }
  | { type: 'REMOVE_WANT'; payload: number }
  | { type: 'ADD_NEED'; payload: Need }
  | { type: 'UPDATE_NEED'; payload: Need }
  | { type: 'REMOVE_NEED'; payload: number }
  | { type: 'ADD_INVESTMENT'; payload: Investment }
  | { type: 'UPDATE_INVESTMENT'; payload: Investment }
  | { type: 'REMOVE_INVESTMENT'; payload: number }
  | { type: 'ADD_DEBT'; payload: Debt }
  | { type: 'UPDATE_DEBT'; payload: Debt }
  | { type: 'REMOVE_DEBT'; payload: number }
  | { type: 'PAY_DEBT_EMI'; payload: { debt_id: number } }
  | { type: 'RECONCILE'; payload: { actual_balance: number; app_balance: number; leakage_amount: number } }
  | { type: 'SAVE_REPORT'; payload: SavedReport }
  | { type: 'REMOVE_REPORT'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'LOAD_DATA'; payload: AppState }
  | { type: 'DELETE_ALL' }
  | { type: 'SET_LOADING'; payload: boolean };
