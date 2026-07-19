import type { AppState } from '../types';

const now = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return fmt(d);
};
const daysFromNow = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return fmt(d);
};
const monthsFromNow = (n: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() + n);
  return fmt(d);
};
const monthsAgo = (n: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - n);
  return fmt(d);
};

let txId = 1001;
const tx = () => txId++;

let wantId = 2001;
const wnt = () => wantId++;

let needId = 3001;
const nd = () => needId++;

let invId = 4001;
const inv = () => invId++;

let repId = 5001;
const rep = () => repId++;

let msId = 6001;
const ms = () => msId++;

let snapId = 7001;
const snap = () => snapId++;

export const initialState: AppState = {
  funds: [
    { id: 1, name: 'needs', balance: 38200, allocation_pct: 50, allocation_locked: false, color: '#FF2A2A', deadline: null, goal_amount: null, interest_rate: null, interest_frequency: null, interest_calc_type: null, is_career_fund: false },
    { id: 2, name: 'wants', balance: 18650, allocation_pct: 20, allocation_locked: false, color: '#A78BFA', deadline: null, goal_amount: null, interest_rate: null, interest_frequency: null, interest_calc_type: null, is_career_fund: false },
    { id: 3, name: 'savings', balance: 54800, allocation_pct: 30, allocation_locked: false, color: '#4ADE80', deadline: null, goal_amount: null, interest_rate: 7, interest_frequency: 'yearly', interest_calc_type: 'compound', is_career_fund: false },
  ],

  milestones: [
    { id: ms(), fund_id: 3, name: 'Emergency Fund (6 months)', target_amount: 300000, reached: false },
    { id: ms(), fund_id: 3, name: 'First ₹1 Lakh', target_amount: 100000, reached: true },
    { id: ms(), fund_id: 2, name: 'iPhone Fund', target_amount: 135000, reached: false },
  ],

  fund_snapshots: [
    { id: snap(), fund_id: 1, balance: 32000, date: monthsAgo(3) },
    { id: snap(), fund_id: 2, balance: 12000, date: monthsAgo(3) },
    { id: snap(), fund_id: 3, balance: 42000, date: monthsAgo(3) },
    { id: snap(), fund_id: 1, balance: 35500, date: monthsAgo(2) },
    { id: snap(), fund_id: 2, balance: 16200, date: monthsAgo(2) },
    { id: snap(), fund_id: 3, balance: 48500, date: monthsAgo(2) },
    { id: snap(), fund_id: 1, balance: 37100, date: monthsAgo(1) },
    { id: snap(), fund_id: 2, balance: 17800, date: monthsAgo(1) },
    { id: snap(), fund_id: 3, balance: 52300, date: monthsAgo(1) },
    { id: snap(), fund_id: 1, balance: 38200, date: daysAgo(1) },
    { id: snap(), fund_id: 2, balance: 18650, date: daysAgo(1) },
    { id: snap(), fund_id: 3, balance: 54800, date: daysAgo(1) },
  ],

  transactions: [
    // ── 3 months ago ──
    { id: tx(), type: 'income', name: 'Monthly Salary', amount: 80000, income_type: 'monthly', category: 'salary', date: monthsAgo(3), notes: '', fund_allocation: { 1: 40000, 2: 16000, 3: 24000 } , file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Rent', amount: 20000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Groceries — BigBasket', amount: 4200, category: 'Groceries', fund_id: 1, fund_name: 'needs', planned: false, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Electricity bill', amount: 1800, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Netflix', amount: 649, category: 'Subscriptions', fund_id: 2, fund_name: 'wants', planned: true, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Spotify annual', amount: 1188, category: 'Subscriptions', fund_id: 2, fund_name: 'wants', planned: true, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — HDFC Mid-Cap', amount: 5000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — Axis Bluechip', amount: 3000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Dinner at Barbeque Nation', amount: 2800, category: 'Dining Out', fund_id: 2, fund_name: 'wants', planned: false, date: monthsAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },

    // ── 2 months ago ──
    { id: tx(), type: 'income', name: 'Monthly Salary', amount: 80000, income_type: 'monthly', category: 'salary', date: monthsAgo(2), notes: '', fund_allocation: { 1: 40000, 2: 16000, 3: 24000 } , file_id: null, file_name: null },
    { id: tx(), type: 'income', name: 'Freelance — website redesign', amount: 25000, income_type: 'irregular', category: 'freelance', date: monthsAgo(2), notes: 'Client: TechNova', fund_allocation: { 1: 12500, 2: 5000, 3: 7500 } , file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Rent', amount: 20000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Groceries — DMart', amount: 3800, category: 'Groceries', fund_id: 1, fund_name: 'needs', planned: false, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Electricity bill', amount: 2100, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Internet — Airtel', amount: 1100, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Fuel — petrol', amount: 2500, category: 'Transport', fund_id: 1, fund_name: 'needs', planned: false, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'New running shoes — Nike', amount: 5500, category: 'Shopping', fund_id: 2, fund_name: 'wants', planned: false, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Movie tickets — PVR', amount: 600, category: 'Entertainment', fund_id: 2, fund_name: 'wants', planned: false, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — HDFC Mid-Cap', amount: 5000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — Axis Bluechip', amount: 3000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Plumber visit', amount: 800, category: 'Home Repair', fund_id: 1, fund_name: 'needs', planned: false, date: monthsAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },

    // ── last month ──
    { id: tx(), type: 'income', name: 'Monthly Salary', amount: 80000, income_type: 'monthly', category: 'salary', date: monthsAgo(1), notes: '', fund_allocation: { 1: 40000, 2: 16000, 3: 24000 } , file_id: null, file_name: null },
    { id: tx(), type: 'income', name: 'Bonus — Q3 performance', amount: 15000, income_type: 'one_time', category: 'bonus', date: monthsAgo(1), notes: 'Performance bonus', fund_allocation: { 1: 7500, 2: 3000, 3: 4500 } , file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Rent', amount: 20000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Groceries — BigBasket', amount: 3500, category: 'Groceries', fund_id: 1, fund_name: 'needs', planned: false, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Electricity bill', amount: 1600, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Internet — Airtel', amount: 1100, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Gym — Cult.fit', amount: 2500, category: 'Health', fund_id: 1, fund_name: 'needs', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Fuel — petrol', amount: 2200, category: 'Transport', fund_id: 1, fund_name: 'needs', planned: false, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Dinner at Onesta', amount: 1200, category: 'Dining Out', fund_id: 2, fund_name: 'wants', planned: false, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Bought books — Amazon', amount: 1500, category: 'Shopping', fund_id: 2, fund_name: 'wants', planned: false, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'OTT subscription — Hotstar', amount: 499, category: 'Subscriptions', fund_id: 2, fund_name: 'wants', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — HDFC Mid-Cap', amount: 5000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — Axis Bluechip', amount: 3000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Weekend trip — Coorg', amount: 6500, category: 'Travel', fund_id: 2, fund_name: 'wants', planned: true, date: monthsAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },

    // ── this month ──
    { id: tx(), type: 'income', name: 'Monthly Salary', amount: 80000, income_type: 'monthly', category: 'salary', date: daysAgo(28), notes: '', fund_allocation: { 1: 40000, 2: 16000, 3: 24000 } , file_id: null, file_name: null },
    { id: tx(), type: 'income', name: 'Freelance — mobile app UI', amount: 18000, income_type: 'irregular', category: 'freelance', date: daysAgo(10), notes: 'Client: GreenLeaf', fund_allocation: { 1: 9000, 2: 3600, 3: 5400 } , file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Rent', amount: 20000, category: 'Rent', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(27), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Groceries — DMart', amount: 4100, category: 'Groceries', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(24), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Groceries — BigBasket', amount: 1800, category: 'Groceries', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(14), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Electricity bill', amount: 1900, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(20), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Internet — Airtel', amount: 1100, category: 'Utilities', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(18), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Gym — Cult.fit', amount: 2500, category: 'Health', fund_id: 1, fund_name: 'needs', planned: true, date: daysAgo(15), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Fuel — petrol', amount: 2000, category: 'Transport', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(12), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Auto fare', amount: 350, category: 'Transport', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(8), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Netflix', amount: 649, category: 'Subscriptions', fund_id: 2, fund_name: 'wants', planned: true, date: daysAgo(16), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Dinner at Punjab Grill', amount: 3200, category: 'Dining Out', fund_id: 2, fund_name: 'wants', planned: false, date: daysAgo(10), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Movie — IMAX', amount: 900, category: 'Entertainment', fund_id: 2, fund_name: 'wants', planned: false, date: daysAgo(6), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'New headphones — Sony WH-1000XM5', amount: 22000, category: 'Electronics', fund_id: 2, fund_name: 'wants', planned: true, date: daysAgo(3), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — HDFC Mid-Cap', amount: 5000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: daysAgo(5), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'SIP — Axis Bluechip', amount: 3000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: daysAgo(5), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Fixed Deposit top-up', amount: 10000, category: 'Investments', fund_id: 3, fund_name: 'savings', planned: true, date: daysAgo(2), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Pharmacy — medicines', amount: 680, category: 'Health', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(1), is_misc: false , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Chai and samosa', amount: 80, category: 'Miscellaneous', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(4), is_misc: true , notes: "", file_id: null, file_name: null },
    { id: tx(), type: 'expense', description: 'Office lunch — momo stall', amount: 150, category: 'Miscellaneous', fund_id: 1, fund_name: 'needs', planned: false, date: daysAgo(7), is_misc: true , notes: "", file_id: null, file_name: null },
  ],

  wants: [
    {
      id: wnt(), name: 'iPhone 16 Pro Max', target_price: 134900, current_saved: 52000,
      category: 'electronics', priority: 2, purchased: false, purchase_date: null,
      notes: '256GB Desert Titanium', days_to_buy: 48, predicted_date: monthsFromNow(2),
      photo_url: null, purchase_link: 'https://www.flipkart.com/apple-iphone-16-pro',
      added_at: monthsAgo(2),
    },
    {
      id: wnt(), name: 'Keychron Q1 Pro', target_price: 8500, current_saved: 7200,
      category: 'electronics', priority: 1, purchased: false, purchase_date: null,
      notes: 'Brown switches, wireless', days_to_buy: 5, predicted_date: daysFromNow(5),
      photo_url: null, purchase_link: 'https://www.keychron.com/products/keychron-q1-pro',
      added_at: daysAgo(10),
    },
    {
      id: wnt(), name: 'Goa Trip — 4 nights', target_price: 55000, current_saved: 18000,
      category: 'travel', priority: 1, purchased: false, purchase_date: null,
      notes: 'December, with friends', days_to_buy: 120, predicted_date: monthsFromNow(4),
      photo_url: null, purchase_link: null,
      added_at: monthsAgo(1),
    },
    {
      id: wnt(), name: 'Standing Desk — Fezibo', target_price: 22000, current_saved: 22000,
      category: 'furniture', priority: 0, purchased: true, purchase_date: daysAgo(45),
      notes: 'Electric, 48 inch', days_to_buy: null, predicted_date: null,
      photo_url: null, purchase_link: null,
      added_at: daysAgo(90),
    },
    {
      id: wnt(), name: 'PlayStation 5', target_price: 49990, current_saved: 8500,
      category: 'electronics', priority: 0, purchased: false, purchase_date: null,
      notes: 'Disc edition + 2 controllers', days_to_buy: 180, predicted_date: monthsFromNow(6),
      photo_url: null, purchase_link: 'https://www.amazon.in/PlayStation-5-Console/dp/B0BJLXMVMV',
      added_at: daysAgo(30),
    },
    {
      id: wnt(), name: 'Yoga mat — premium', target_price: 3500, current_saved: 3500,
      category: 'fitness', priority: 1, purchased: true, purchase_date: daysAgo(15),
      notes: 'Manduka PRO 6mm', days_to_buy: null, predicted_date: null,
      photo_url: null, purchase_link: null,
      added_at: daysAgo(60),
    },
    {
      id: wnt(), name: 'Himalayan trek — Spiti', target_price: 35000, current_saved: 5000,
      category: 'travel', priority: 2, purchased: false, purchase_date: null,
      notes: 'September batch, 7 days', days_to_buy: 60, predicted_date: monthsFromNow(2),
      photo_url: null, purchase_link: null,
      added_at: daysAgo(20),
    },
    {
      id: wnt(), name: 'Ergonomic chair', target_price: 15000, current_saved: 15000,
      category: 'furniture', priority: 1, purchased: true, purchase_date: daysAgo(90),
      notes: 'Green Soul Monster Ultra', days_to_buy: null, predicted_date: null,
      photo_url: null, purchase_link: null,
      added_at: daysAgo(120),
    },
    {
      id: wnt(), name: 'Kindle Paperwhite', target_price: 14999, current_saved: 4200,
      category: 'electronics', priority: 1, purchased: false, purchase_date: null,
      notes: '32GB, warm light', days_to_buy: 35, predicted_date: monthsFromNow(1),
      photo_url: null, purchase_link: 'https://www.amazon.in/kindle-paperwhite',
      added_at: daysAgo(5),
    },
  ],

  needs: [
    { id: nd(), name: 'Rent', amount: 20000, category: 'Housing', recurring: true, frequency: 'monthly', due_date: '1st', fund_id: 1, fund_name: 'needs', autopay: true, notes: '', active: true, reapproval_required: false },
    { id: nd(), name: 'Internet — Airtel', amount: 1100, category: 'Utilities', recurring: true, frequency: 'monthly', due_date: '5th', fund_id: 1, fund_name: 'needs', autopay: true, notes: '150Mbps', active: true, reapproval_required: false },
    { id: nd(), name: 'Electricity', amount: 2000, category: 'Utilities', recurring: true, frequency: 'monthly', due_date: '15th', fund_id: 1, fund_name: 'needs', autopay: false, notes: 'BESCOM', active: true, reapproval_required: false },
    { id: nd(), name: 'Gym — Cult.fit', amount: 2500, category: 'Health', recurring: true, frequency: 'monthly', due_date: '10th', fund_id: 1, fund_name: 'needs', autopay: true, notes: '', active: true, reapproval_required: true },
    { id: nd(), name: 'Car Insurance', amount: 18000, category: 'Insurance', recurring: true, frequency: 'yearly', due_date: 'March 15', fund_id: 1, fund_name: 'needs', autopay: false, notes: 'Comprehensive — Swift', active: true, reapproval_required: false },
    { id: nd(), name: 'Health Insurance', amount: 12000, category: 'Insurance', recurring: true, frequency: 'yearly', due_date: 'June 1', fund_id: 1, fund_name: 'needs', autopay: true, notes: 'Star Health family floater', active: true, reapproval_required: false },
    { id: nd(), name: 'Phone bill — Jio', amount: 599, category: 'Utilities', recurring: true, frequency: 'monthly', due_date: '20th', fund_id: 1, fund_name: 'needs', autopay: true, notes: '2GB/day plan', active: true, reapproval_required: true },
    { id: nd(), name: 'Laptop repair', amount: 8000, category: 'Repair', recurring: false, frequency: null, due_date: daysAgo(10), fund_id: 1, fund_name: 'needs', autopay: false, notes: 'MacBook screen replacement — pending', active: true, reapproval_required: false },
    { id: nd(), name: 'Home cleaning — Urban Company', amount: 1200, category: 'Home', recurring: false, frequency: null, due_date: daysFromNow(3), fund_id: 1, fund_name: 'needs', autopay: false, notes: 'Deep cleaning', active: true, reapproval_required: false },
  ],

  investments: [
    { id: inv(), name: 'Reliance Industries', asset_type: 'stock', invest_amount: 50000, current_value: 64500, purchase_date: '2025-01-15', notes: '40 shares @ ₹1250' },
    { id: inv(), name: 'Tata Consultancy', asset_type: 'stock', invest_amount: 35000, current_value: 41200, purchase_date: '2025-04-10', notes: '10 shares @ ₹3500' },
    { id: inv(), name: 'HDFC Mid-Cap Fund', asset_type: 'mutual_fund', invest_amount: 120000, current_value: 148000, purchase_date: '2024-06-01', notes: 'SIP ₹5000/month' },
    { id: inv(), name: 'Axis Bluechip Fund', asset_type: 'mutual_fund', invest_amount: 72000, current_value: 82000, purchase_date: '2024-09-01', notes: 'SIP ₹3000/month' },
    { id: inv(), name: 'SBI Fixed Deposit', asset_type: 'fd', invest_amount: 200000, current_value: 218000, purchase_date: '2024-01-15', notes: '2 years @ 7.1%' },
    { id: inv(), name: 'PPF Account', asset_type: 'ppf', invest_amount: 150000, current_value: 172000, purchase_date: '2023-04-01', notes: '₹1.5L/year @ 7.1%' },
    { id: inv(), name: 'Bitcoin', asset_type: 'crypto', invest_amount: 20000, current_value: 32000, purchase_date: '2025-03-01', notes: '0.0032 BTC' },
    { id: inv(), name: 'Gold ETF', asset_type: 'other', invest_amount: 40000, current_value: 47500, purchase_date: '2024-11-15', notes: '10 units of Gold BeES' },
  ],

  debts: [
    { id: 7001, name: 'Laptop EMI — Flipkart', total_principal: 72000, remaining_balance: 48000, emi_amount: 6000, interest_rate: 12, due_date: 15, linked_fund_id: 1, notes: 'MacBook Air M3, 12 months @ 12%', active: true },
    { id: 7002, name: 'Credit Card — HDFC', total_principal: 35000, remaining_balance: 18000, emi_amount: 3500, interest_rate: 18, due_date: 25, linked_fund_id: 1, notes: 'SmartBuy rewards card', active: true },
  ],

  reports: [
    {
      id: rep(), name: 'June 2025 Monthly Report',
      period_start: monthsAgo(1).replace(/-\d{2}$/, '-01'),
      period_end: monthsAgo(1).replace(/-\d{2}$/, '-28'),
      generated_at: daysAgo(20),
      data: {
        period: { start: monthsAgo(1).replace(/-\d{2}$/, '-01'), end: monthsAgo(1).replace(/-\d{2}$/, '-28') },
        total_income: 95000, total_expenses: 52687, net: 42313,
        by_fund: { needs: 30000, wants: 9798, savings: 12889 },
        by_category: { Rent: 20000, Groceries: 3500, Utilities: 2700, Health: 2500, Transport: 2200, Subscriptions: 499, 'Dining Out': 1200, Shopping: 1500, Travel: 6500, Investments: 8000, 'Home Repair': 800, Entertainment: 600 },
        planned_total: 41499, unplanned_total: 11188, transaction_count: 13, income_count: 2, expense_count: 11,
      },
    },
  ],

  settings: {
    currency: '₹',
    locale: 'en-IN',
    expected_monthly_income: 80000,
    scale_amount: 5000,
    impulse_tax_pct: 20,
    hourly_rate: 500,
    allocation_mode: 'blind',
    baseline_survival_amount: 30000,
    mock_salary: 0,
    last_reconciliation: null,
  },

  loading: false,
};
