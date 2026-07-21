import type { AppState, Fund, IncomeTransaction, ExpenseTransaction, Want, Need, Investment, Debt, FundSnapshot } from '../types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

let _id = 100;
function id(): number { return _id++; }

const funds: Fund[] = [
  { id: 1, name: 'needs', balance: 12450, allocation_pct: 50, allocation_locked: false, color: '#FF2A2A', deadline: null, goal_amount: null, interest_rate: null, interest_frequency: null, interest_calc_type: null, is_career_fund: false },
  { id: 2, name: 'wants', balance: 8200, allocation_pct: 20, allocation_locked: false, color: '#A78BFA', deadline: null, goal_amount: null, interest_rate: null, interest_frequency: null, interest_calc_type: null, is_career_fund: false },
  { id: 3, name: 'savings', balance: 34800, allocation_pct: 30, allocation_locked: false, color: '#4ADE80', deadline: daysFromNow(365), goal_amount: 500000, interest_rate: 7.1, interest_frequency: 'yearly', interest_calc_type: 'compound', is_career_fund: false },
];

const salary = 80000;

const needs_alloc = salary * 0.50;
const wants_alloc = salary * 0.20;
const savings_alloc = salary * 0.30;

const incomeTransactions: IncomeTransaction[] = [];
for (let i = 0; i < 6; i++) {
  const date = monthsAgo(i);
  const tx: IncomeTransaction = {
    id: id(),
    type: 'income',
    name: 'Salary — TCS',
    amount: salary,
    income_type: 'monthly',
    category: 'Salary',
    date,
    notes: '',
    fund_allocation: { 1: needs_alloc, 2: wants_alloc, 3: savings_alloc },
    file_id: null,
    file_name: null,
  };
  incomeTransactions.push(tx);
}

const bonusTx: IncomeTransaction = {
  id: id(),
  type: 'income',
  name: 'Annual Bonus',
  amount: 80000,
  income_type: 'one_time',
  category: 'Bonus',
  date: monthsAgo(2),
  notes: 'Q4 performance bonus',
  fund_allocation: { 1: 24000, 2: 16000, 3: 40000 },
  file_id: null,
  file_name: null,
};
incomeTransactions.push(bonusTx);

const freelanceTx: IncomeTransaction = {
  id: id(),
  type: 'income',
  name: 'Freelance — Website project',
  amount: 15000,
  income_type: 'irregular',
  category: 'Freelance',
  date: monthsAgo(1),
  notes: 'React landing page for local business',
  fund_allocation: { 1: 5000, 2: 2000, 3: 8000 },
  file_id: null,
  file_name: null,
};
incomeTransactions.push(freelanceTx);

const expenseTransactions: ExpenseTransaction[] = [
  { id: id(), type: 'expense', description: 'House Rent', amount: 18000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(5), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'House Rent', amount: 18000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(4), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'House Rent', amount: 18000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(3), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'House Rent', amount: 18000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(2), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'House Rent', amount: 18000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(1), is_misc: false, notes: '', file_id: null, file_name: null },

  { id: id(), type: 'expense', description: 'Electricity Bill', amount: 1850, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(25), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Internet — Airtel', amount: 999, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(20), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Jio Postpaid', amount: 599, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(18), is_misc: false, notes: '', file_id: null, file_name: null },

  { id: id(), type: 'expense', description: 'BigBasket Groceries', amount: 4200, category: 'Groceries', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(15), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'DMart Monthly', amount: 3800, category: 'Groceries', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(5), is_misc: false, notes: '', file_id: null, file_name: null },

  { id: id(), type: 'expense', description: 'Domestic Help — Lakshmi', amount: 3000, category: 'Household', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(1), is_misc: false, notes: '', file_id: null, file_name: null },

  { id: id(), type: 'expense', description: 'Uber to office', amount: 340, category: 'Transport', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(10), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Metro Pass', amount: 1200, category: 'Transport', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(8), is_misc: false, notes: '', file_id: null, file_name: null },

  { id: id(), type: 'expense', description: 'Health Insurance Premium', amount: 2400, category: 'Insurance', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(3), is_misc: false, notes: 'Star Health — family floater', file_id: null, file_name: null },

  { id: id(), type: 'expense', description: 'Dinner at Barbeque Nation', amount: 2200, category: 'Dining', fund_id: 2, fund_name: 'wants', planned: true, date: daysAgo(12), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Movie — Pushpa 2', amount: 600, category: 'Entertainment', fund_id: 2, fund_name: 'wants', planned: true, date: daysAgo(14), is_misc: false, notes: 'INOX — 3 tickets', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Netflix + Spotify', amount: 750, category: 'Subscriptions', fund_id: 2, fund_name: 'wants', planned: true, date: daysAgo(7), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Zomato — Weekend order', amount: 890, category: 'Dining', fund_id: 2, fund_name: 'wants', planned: false, date: daysAgo(2), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Cricket bat', amount: 1500, category: 'Hobbies', fund_id: 2, fund_name: 'wants', planned: false, date: daysAgo(6), is_misc: false, notes: 'SG Kashmir willow', file_id: null, file_name: null },

  { id: id(), type: 'expense', description: 'SBI SIP — Flexicap', amount: 5000, category: 'Investment', fund_id: 3, fund_name: 'savings', planned: true, date: daysAgo(5), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'SBI SIP — Nifty Index', amount: 5000, category: 'Investment', fund_id: 3, fund_name: 'savings', planned: true, date: daysAgo(5), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'PPF Deposit', amount: 12500, category: 'Investment', fund_id: 3, fund_name: 'savings', planned: true, date: daysAgo(10), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Car Loan EMI', amount: 14500, category: 'Debt EMI', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(5), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Education Loan EMI', amount: 7500, category: 'Debt EMI', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(5), is_misc: false, notes: '', file_id: null, file_name: null },
  { id: id(), type: 'expense', description: 'Random shopping', amount: 2300, category: 'Miscellaneous', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(4), is_misc: true, notes: '', file_id: null, file_name: null },
];

const wants: Want[] = [
  { id: id(), name: 'iPhone 16 Pro', target_price: 130000, current_saved: 45000, category: 'electronics', priority: 2, purchased: false, purchase_date: null, notes: '256GB Desert Titanium', days_to_buy: null, predicted_date: null, photo_url: null, purchase_link: 'https://www.flipkart.com/apple-iphone-16-pro', added_at: daysAgo(60), no_lock: false },
  { id: id(), name: 'Goa Trip', target_price: 35000, current_saved: 12000, category: 'travel', priority: 1, purchased: false, purchase_date: null, notes: '3 nights — Dec long weekend', days_to_buy: null, predicted_date: null, photo_url: null, purchase_link: null, added_at: daysAgo(45), no_lock: false },
  { id: id(), name: 'Sony WH-1000XM5', target_price: 25000, current_saved: 19500, category: 'electronics', priority: 1, purchased: false, purchase_date: null, notes: 'Noise cancelling headphones', days_to_buy: null, predicted_date: null, photo_url: null, purchase_link: 'https://www.amazon.in/Sony-WH-1000XM5/dp/B09XS7JWHH', added_at: daysAgo(30), no_lock: false },
  { id: id(), name: 'PlayStation 5', target_price: 50000, current_saved: 8000, category: 'electronics', priority: 0, purchased: false, purchase_date: null, notes: 'Slim Digital Edition', days_to_buy: null, predicted_date: null, photo_url: null, purchase_link: null, added_at: daysAgo(90), no_lock: false },
  { id: id(), name: 'Running Shoes — Asics', target_price: 12000, current_saved: 12000, category: 'fitness', priority: 1, purchased: true, purchase_date: daysAgo(10), notes: 'Gel-Nimbus 26', days_to_buy: 0, predicted_date: daysAgo(10), photo_url: null, purchase_link: null, added_at: daysAgo(40), no_lock: false },
];

const needs: Need[] = [
  { id: id(), name: 'House Rent', amount: 18000, category: 'Housing', recurring: true, frequency: 'monthly', due_date: '1', fund_id: 1, fund_name: 'needs', autopay: true, notes: '', active: true, reapproval_required: false },
  { id: id(), name: 'Electricity — BESCOM', amount: 1800, category: 'Utilities', recurring: true, frequency: 'monthly', due_date: '5', fund_id: 1, fund_name: 'needs', autopay: false, notes: '', active: true, reapproval_required: false },
  { id: id(), name: 'Internet — Airtel', amount: 999, category: 'Utilities', recurring: true, frequency: 'monthly', due_date: '12', fund_id: 1, fund_name: 'needs', autopay: true, notes: '', active: true, reapproval_required: false },
  { id: id(), name: 'Jio Postpaid', amount: 599, category: 'Utilities', recurring: true, frequency: 'monthly', due_date: '15', fund_id: 1, fund_name: 'needs', autopay: true, notes: '', active: true, reapproval_required: false },
  { id: id(), name: 'Domestic Help', amount: 3000, category: 'Household', recurring: true, frequency: 'monthly', due_date: '1', fund_id: 1, fund_name: 'needs', autopay: false, notes: '', active: true, reapproval_required: false },
  { id: id(), name: 'Health Insurance', amount: 2400, category: 'Insurance', recurring: true, frequency: 'monthly', due_date: '10', fund_id: 1, fund_name: 'needs', autopay: true, notes: 'Star Health — family floater', active: true, reapproval_required: false },
  { id: id(), name: 'Car Loan EMI', amount: 14500, category: 'Debt EMI', recurring: true, frequency: 'monthly', due_date: '5', fund_id: 1, fund_name: 'needs', autopay: true, notes: 'HDFC — 5yr tenure', active: true, reapproval_required: false },
  { id: id(), name: 'Education Loan EMI', amount: 7500, category: 'Debt EMI', recurring: true, frequency: 'monthly', due_date: '5', fund_id: 1, fund_name: 'needs', autopay: true, notes: 'SBI Scholar Loan', active: true, reapproval_required: false },
];

const investments: Investment[] = [
  { id: id(), name: 'HDFC Flexicap Fund', asset_type: 'mutual_fund', invest_amount: 90000, current_value: 102500, purchase_date: monthsAgo(6), notes: 'SIP ₹5000/month' },
  { id: id(), name: 'SBI Nifty 50 Index Fund', asset_type: 'mutual_fund', invest_amount: 75000, current_value: 82000, purchase_date: monthsAgo(6), notes: 'SIP ₹5000/month + lumpsum' },
  { id: id(), name: 'PPF — SBI', asset_type: 'ppf', invest_amount: 150000, current_value: 178000, purchase_date: monthsAgo(18), notes: '₹12500/month deposit' },
  { id: id(), name: 'SBI Fixed Deposit', asset_type: 'fd', invest_amount: 100000, current_value: 105500, purchase_date: monthsAgo(10), notes: '7.1% p.a. — 1yr lock-in' },
  { id: id(), name: 'TCS Stock (ESPP)', asset_type: 'stock', invest_amount: 45000, current_value: 58000, purchase_date: monthsAgo(8), notes: 'Employee stock purchase plan' },
];

const debts: Debt[] = [
  { id: id(), name: 'HDFC Car Loan', total_principal: 600000, remaining_balance: 420000, emi_amount: 14500, interest_rate: 8.5, due_date: 5, linked_fund_id: 1, notes: 'Maruti Swift Dzire — started Jan 2023', active: true },
  { id: id(), name: 'SBI Education Loan', total_principal: 300000, remaining_balance: 85000, emi_amount: 7500, interest_rate: 9.0, due_date: 5, linked_fund_id: 1, notes: 'B.Tech loan — moratorium ended Jul 2024', active: true },
];

const now = new Date();
const snapshots: FundSnapshot[] = [];
for (let i = 90; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().split('T')[0];

  const monthProgress = (90 - i) / 90;
  const needsBal = Math.round(5000 + monthProgress * 7450 + Math.sin(i / 7) * 3000);
  const wantsBal = Math.round(3000 + monthProgress * 5200 + Math.cos(i / 5) * 2000);
  const savingsBal = Math.round(15000 + monthProgress * 19800 + Math.sin(i / 10) * 4000);

  if (i % 3 === 0) {
    snapshots.push({ id: id(), fund_id: 1, balance: needsBal, date: dateStr });
    snapshots.push({ id: id(), fund_id: 2, balance: wantsBal, date: dateStr });
    snapshots.push({ id: id(), fund_id: 3, balance: savingsBal, date: dateStr });
  }
}

export function getSeedState(): AppState {
  return {
    funds,
    milestones: [
      { id: id(), fund_id: 3, name: 'Emergency Fund — 6 months', target_amount: 400000, reached: false },
      { id: id(), fund_id: 3, name: 'Home Down Payment', target_amount: 1000000, reached: false },
    ],
    fund_snapshots: snapshots,
    transactions: [...incomeTransactions, ...expenseTransactions] as AppState['transactions'],
    wants,
    needs,
    investments,
    debts,
    reports: [],
    settings: {
      currency: '₹',
      locale: 'en-IN',
      expected_monthly_income: salary,
      scale_amount: 5000,
      impulse_tax_pct: 20,
      hourly_rate: 500,
      allocation_mode: 'blind',
      baseline_survival_amount: 25000,
      mock_salary: 0,
      last_reconciliation: daysAgo(15),
      cooling_off_hours: 48,
      waterfall_priority: [],
      theme_mode: 'system',
    },
    message_patterns: [],
    sms_logs: [],
    detected_transactions: [],
    loading: false,
  };
}
