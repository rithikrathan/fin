# Fin

Personal finance manager — frontend-only React app. Tracks income, splits into customizable funds, logs expenses, manages a wants/needs list, tracks investments, and generates reports. All data stored in localStorage.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS 4 (dark theme, glassmorphism)
- **Charts:** Recharts (ComposedChart, AreaChart, PieChart)
- **Routing:** React Router 7
- **State:** React Context + useReducer
- **Currency:** INR (₹), Indian locale formatting

## Features

### Fund System
- **Dynamic funds** — create, edit, delete custom funds (default: needs 50%, wants 20%, savings 30%)
- **Default fund protection** — needs/wants/savings cannot be deleted
- **Allocation %** — always sums to 100%, enforced with proportional auto-rebalance on create/edit
- **Allocation lock** — lock a fund to prevent it from being rebalanced when others change
- **Fund interest** — per-fund compound or simple interest with daily/weekly/monthly/yearly frequency, accrued interest calculated from last snapshot
- **Fund snapshots** — auto-captured on every balance change, manual snapshot button available
- **Fund detail page** — balance history chart (ComposedChart), 12-month projection (income + scale), goal tracker with progress bar, milestone predictions, accrued interest display, recent transactions
- **Surplus redistribution** — transfer excess from income to underfunded funds, milestone-gated (only funds with unreached milestones), wants/savings excluded

### Milestones
- Per-fund milestone targets (e.g., "Emergency Fund 6-month buffer", "First ₹1 Lakh")
- Mark reached, track progress, auto-redistribution gated on milestone status

### Transactions
- **Income** — monthly, one-time, irregular types; split allocation across funds via `Record<number, number>`
- **Expenses** — per-fund, with category, planned/unplanned flag, `is_misc` flag for miscellaneous items
- **Transfers** — fund-to-fund redistribution (visible TransferTransaction type)
- **Export** — CSV and PDF export on TransactionsPage
- **Filter** — filter by all/income/expense

### Wants Tracker
- Save towards desired items with target price, current saved, priority (low/medium/high)
- Purchase prediction (days to buy, predicted date)
- Mark purchased with date
- Photo URL and purchase link support

### Needs Tracker
- Recurring and one-time needs with category, frequency, due date, autopay flag
- Fund assignment, active/inactive status

### Investments
- Track portfolio across asset types: stock, mutual fund, FD, PPF, crypto, other
- ROI calculation, invest amount vs current value
- Grid layout (responsive: 1 col mobile, 3 col desktop)

### Reports
- **Periods:** daily, weekly, monthly, yearly
- **Metrics:** total income, total expenses, net, by fund, by category, planned/unplanned totals
- **Save reports** — persist to state for history
- **Print/export** — PDF export via print dialog

### Settings
- Expected monthly income and scale amount (used for projections and predictions)
- Predictions card — shows expected monthly income, scale amount, and derived per-fund allocations
- Reset transactions button (preserves fund balances, milestones, snapshots)
- Delete all data

### Dashboard / Home
- Net worth (funds + investments)
- Total income vs total spent
- Fund balance cards with allocation % and share of total
- Recent transactions (last 8)
- Pending wants with save progress bars
- Investments summary with ROI

### UI/UX
- **Dark theme** — glassmorphism with `backdrop-blur`, subtle borders, glow effects
- **Responsive** — mobile-first with `sm:`/`lg:` breakpoints, touch-friendly targets (min-h 36px)
- **Responsive modals** — scrollable (`max-h-[90vh]`), padding adapts
- **Responsive header** — truncated title, "+" button on mobile, full text on desktop
- **Shared components:** Modal, Button (primary/secondary/ghost/danger, sm/md/lg), Card, Badge, EmptyState
- **Sidebar** — collapsible on mobile via hamburger menu
- **Font:** Inter (UI) + JetBrains Mono (numbers/code)

## Project Structure

```
fin/
├── src/
│   ├── components/
│   │   ├── layout/       Sidebar, Header, Layout (responsive shell)
│   │   └── shared/       Modal, Button, Card, Badge, EmptyState
│   ├── context/          AppContext (useReducer), initialState (seed data)
│   ├── pages/            12 route-level pages
│   │   ├── HomePage              Net worth, fund cards, recent tx, investments
│   │   ├── DashboardPage         Overview
│   │   ├── TransactionsPage      Income/expense entry, CSV/PDF export
│   │   ├── FundsPage             Fund grid + allocation ConfigModal
│   │   ├── FundDetailPage        Fund balance chart, milestones, interest
│   │   ├── ManageFundsPage       CRUD funds with interest/allocation
│   │   ├── ExpensesPage          Expense breakdown by category/fund
│   │   ├── WantsPage             Want list with predictions
│   │   ├── NeedsPage             Recurring needs tracker
│   │   ├── InvestmentsPage       Portfolio tracker
│   │   ├── ReportsPage           Daily/weekly/monthly/yearly reports
│   │   └── SettingsPage          Income settings, predictions, reset
│   ├── types/            TypeScript interfaces (Fund, Transaction, etc.)
│   └── utils/            Helpers (round2, formatCurrency, calculateAccruedInterest, etc.)
├── public/               Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Data Model (Key Types)

### Fund
```ts
{
  id: number;
  name: string;
  balance: number;
  allocation_pct: number;      // always sums to 100% across funds
  allocation_locked: boolean;  // exempt from proportional rebalance
  color: string;
  deadline: string | null;
  goal_amount: number | null;
  interest_rate: number | null;           // % p.a.
  interest_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  interest_calc_type: 'compound' | 'simple' | null;
}
```

### Transactions
- **IncomeTransaction** — amount, fund_allocation (fund_id → amount), income_type (monthly/one_time/irregular)
- **ExpenseTransaction** — amount, fund_id, category, planned, is_misc
- **TransferTransaction** — from_fund_id, to_fund_id, amount, note

### Other
- **Milestone** — fund_id, target_amount, reached
- **FundSnapshot** — fund_id, balance, date
- **Want** — target_price, current_saved, priority, days_to_buy, predicted_date
- **Need** — amount, category, recurring, frequency, autopay
- **Investment** — asset_type (stock/mutual_fund/fd/ppf/crypto/other), invest_amount, current_value
- **SavedReport** — period, data (by_fund, by_category, planned/unplanned)
- **Settings** — expected_monthly_income, scale_amount

## Key Helpers

- `round2(n)` — round to 2 decimal places
- `formatCurrency(amount)` — ₹ with Indian locale, decimals only when needed
- `calculateAccruedInterest(balance, rate, frequency, calcType, sinceDate)` — compound/simple interest from date
- `calculateMonthlyRequired(goal, current, deadline)` — monthly savings needed
- `getROI(invested, current)` — return on investment %
- `generateId()` — timestamp + random ID

## Running

```bash
npm install
npm run dev      # dev server
npm run build    # tsc + vite build
npm run preview  # preview production build
```
