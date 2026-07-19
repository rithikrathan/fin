# Implementation Plan

## Overview

Adding behavioral friction features, prediction models, new charts, and new entity types to the finance manager.

## Features

### Behavioral Friction

1. **48-Hour Cooling-Off Period** — Wants get locked "Purchase" button with countdown timer. Requires `added_at` timestamp on Want.
   - **Q: Scope?** All wants, configurable lock time. Some wants can opt-out via a checkbox on the want card ("No lock needed").
   - **Q: Timer display?** Both — inline countdown on card + full countdown in purchase modal.
   - **Q: After cooldown?** Re-confirm intent — shows "Do you still want this?" prompt. If yes → unlock. If no → prompt to set a new timer (re-lock with new duration).
   - **Q: Bypass?** No bypass. Strict lock, no override.
2. **Impulse Tax** — Buying a Want costs `amount * (1 + tax_pct)`. Extra goes to Savings. Configurable % in Settings.
   - **Q: Where does tax go?** Configurable — user picks which fund receives the impulse tax.
   - **Q: When applied?** If user skips the 48-hour lock, they pay impulse tax automatically. If they wait for lock to expire and still buy, no tax.
   - **Q: Display?** Cost in blue/green + tax in small red text.
   - **Q: Per-want opt-out?** Per-want toggle checkbox: "Apply impulse tax" (default on). Some purchases can be exempted.
   - **Q: Lock + tax interaction?** Skip lock = normal impulse tax + 6.9% extra. Wait for lock = no tax.
3. **Subscription Re-Approval** — Recurring needs with `reapproval_required: true` show a "Renew?" prompt after due date instead of auto-continuing. Scales with lots of needs because most stay `false`.
   - **Q: When triggered?** X days before due date as a "still needed?" nudge.
   - **Q: User action?** Yes/No + edit amount before confirming.
   - **Q: If rejected?** User decides — pause (hidden until re-enabled) or delete permanently.
4. **Ghost Deduction for Bills** — Fund cards show "Available" (balance minus committed recurring bills + debt EMIs) vs "Total" balance.
   - **Q: What counts as committed?** User-selected — user can pin/unpin specific bills from deduction.
   - **Q: Display?** Available as bigger number, total small below it.
5. **Bank Reconciliation** — Modal forces user to enter actual bank balance. App auto-creates "Unaccounted Leakage" expense for any gap.
   - **Q: How often?** Both — manual button + monthly prompt on first login.
   - **Q: Leakage handling?** Auto-create expense but allow user to rename/categorize after.
   - **Q: Fund scope?** Per-fund — user picks which fund to reconcile.
6. **Emergency Stress Test** — Dashboard card: "If income drops to ₹0, your savings cover X days." Warning if <90 days.
   - **Q: Daily burn rate?** Both scenarios — optimistic (fixed obligations only) vs pessimistic (total spend).
   - **Q: Warning threshold?** Configurable.
   - **Q: Display?** Full — number + progress bar (red/yellow/green) + calendar date of depletion.
   - **Note:** All prediction models have configurable inputs below each card. All predictions displayed as graphs.
7. **Waterfall Allocation** — When `allocation_mode: 'waterfall'`, income fills Needs up to `baseline_survival_amount` first, then overflows into Wants/Savings by allocation %.
   - **Q: Overflow order?** User-defined priority order.
   - **Q: Shortfall behavior?** Pro-rata — each fund gets its allocation % of whatever income there is.

### Transaction Enrichment

8. **Attachments, Notes & Images** — Transactions support:
   - Free-text notes (e.g. "Lunch with team")
   - One file per transaction (image or PDF)
   - Updated icons and symbols per category/transaction type
   - **Icons:** Auto-assign by category + user override per category in Settings.

### Storage Rework (cross-platform)

App runs on web, Android (Tauri primary, Capacitor fallback), and Linux (Tauri). Current localStorage-only storage won't work for file attachments. Needs a unified storage strategy.

**Platform wrapper:**
- Primary: **Tauri 2.0+** (Android + Linux) — native filesystem, notifications, clipboard
- Fallback: **Capacitor** for web-only if needed
- Tauri has plugins for: Filesystem, Notifications, Clipboard, Biometrics, etc.

**Storage architecture: Abstraction layer**

`StorageService` interface with platform-specific implementations:

| Platform | Core Data | File Attachments | Persistence |
|----------|-----------|-----------------|-------------|
| **Web** | localStorage (~5MB) | IndexedDB | WebView cache — volatile on Android |
| **Tauri (Android/Linux)** | SQLite via `tauri-plugin-sql` | Filesystem API | App data dir — survives cache clears |
| **Capacitor (fallback)** | localStorage | Filesystem API | App documents dir |

**Critical:** localStorage/IndexedDB are stored in WebView cache on Android. Android can clear them during low storage, cache cleanup, or app updates. **Tauri SQLite is required for reliable Android storage.**

**Core data (funds, transactions, needs, wants, debts):**
- Web: localStorage (~5MB limit) — fine for web dev/personal use
- Tauri: SQLite via tauri-plugin-sql (unlimited, structured)
- Abstraction layer handles read/write/migration transparently

**File attachments (images/PDFs):**
- One file per transaction (image or PDF)
- Compress before storing (images: resize + JPEG quality reduction)
- Size limit: max 5MB per file after compression
- Storage path per platform:
  - Web: IndexedDB (handles binary data well)
  - Tauri: App data directory via Filesystem API
  - Capacitor: Filesystem API

**Export/Import: zip format**
- Export = zip containing:
  - `data.json` — all app data (funds, transactions, needs, wants, debts, settings)
  - `files/` — attached files referenced by transactions
  - `meta.json` — version, timestamps, platform info
- Import = unpack zip, restore data + files, validate version compatibility
- Works across platforms (export from Android, import on Linux, etc.)

**Auto-migration:**
- On first load after update, detect localStorage data
- Migrate to new storage backend automatically
- Keep localStorage as backup until migration confirmed

### Export/Import Rework

- Export = zip format containing:
  - `data.json` — all app data
  - `files/` — attached files (images/PDFs) referenced by transactions
  - `meta.json` — version, timestamps, platform info
- Import = unpack zip, restore data + files, validate version compatibility
- Cross-platform compatible (export from Android, import on Linux, etc.)
- **Depends on: Storage Rework (abstraction layer)**

### Predictions Page (10 Models)

Each prediction card has editable assumption inputs below it and shows a computed result as a graph.

**Global rules:**
- All parameters are configurable via inputs below each card.
- All predictions displayed as graphs/charts.
- Layout: scrollable page with collapsible cards.

| # | Model | Key Configurable Inputs | Output (graph) |
|---|-------|------------------------|----------------|
| 1 | **Zero-Balance Drop-Dead Date** | Which funds to include, recurring costs | Hard calendar date on timeline |
| 2 | **Micro-Transaction Wealth Bleed** | Threshold (₹), return rate (%), years | Compound growth curve of lost wealth |
| 3 | **Payment Default Predictor** | (auto-scans due dates vs fund balance) | Warning timeline with red markers |
| 4 | **Goal Delay Tracker** | All wants overview + per-want deep-dive | Delay bar chart per want |
| 5 | **True Hourly Wage Converter** | Lookback period (configurable) | "This item = X hours" bars |
| 6 | **Subscription Annual Trap** | (auto-computes from recurring needs) | Annual cost bar chart |
| 7 | **Irregular Income Gap Buffer** | Lookback period (configurable) | Gap distribution chart + min buffer |
| 8 | **Lifestyle Creep Warning** | Comparison period, baseline | Wants vs income trend lines |
| 9 | **Inflation Deficit** | Inflation rate (%), which funds | Purchasing power loss curve |
| 10 | **Passive Income Snowball** | Projection period | Interest accumulation curve |

### New Entity Types

8. **Debt/EMI Tracker** — `Debt` type: name, principal, remaining, emi_amount, interest_rate, due_date, linked_fund_id. Ghost-deduct from Needs. "Pay EMI" button. Early payoff calculator.
   - **Q: Debt types?** All types — loans, EMIs, credit cards, personal IOUs, BNPL, large loans.
   - **Q: Early payoff?** Both — extra payment simulator ("pay X more/month, save Y months + ₹Z interest") + lump sum close option.
   - **Q: EMI payment?** Manual with notification. User clicks "Pay EMI". Device notification + dialog box N days before due date (configurable in Settings).
   - **Note:** Need to plan device notifications (Capacitor Local Notifications API).

### Notifications System

- Platform: **Tauri Local Notifications** (Android + Linux), Capacitor Local Notifications (web fallback)
- Triggers: EMI due dates, subscription re-approval prompts, 48-hour lock expiry, monthly reconciliation reminder
- Configurable lead time per notification type in Settings
- **Depends on: Tauri integration**
9. **Salary Simulation** — Settings: mock salary input. Overlay ghost budget showing post-tax/post-investment discretionary income.
   - **Q: Tax calculation?** TBD — future feature, tax slab approach to be decided later.
   - **Q: Where?** Scenario builder page — dedicated page with scenario builder (change salary, see impact).
10. **Career ROI Fund** — `is_career_fund` flag on Fund. Spending requires a skill tag. Enforced intent.
    - **Status:** Deferred to future. Decisions on skill tags, spending gate, and ROI tracking TBD.

### Dashboard Redesign

Layout: **Tabbed** — Overview | Alerts | Charts | Predictions

**Tab: Overview**
- Row 1: Summary Cards — Total Balance, Monthly Income, Monthly Expenses, Net Savings
- Row 2: Available vs Total (Ghost Deduction) — per-fund breakdown, user-selected bills

**Tab: Alerts**
- Emergency Stress Test — configurable threshold, full display (number + bar + date)
- Payment Default Predictor
- Lifestyle Creep Warning (if baseline set)
- Subscription Re-approval banners
- 48-hour cooling-off warnings

**Tab: Charts**
- Fund Allocation Donut (existing, keep)
- Burn Rate — ComposedChart, configurable time range
- Cash Flow Trend — BarChart, configurable months back

**Tab: Predictions**
- Compact cards linking to full Predictions page
- Zero-Balance Drop-Dead Date
- Subscription Annual Trap
- Irregular Income Gap Buffer
- Passive Income Snowball

**What moves OUT of dashboard:**
- SavingsOverview with milestones → moves to FundsPage or dedicated Goals section

### Charts (all)

1. **Burn Rate** (Dashboard) — ComposedChart. Ideal burn line vs actual balance.
2. **Cash Flow Trend** (Dashboard) — BarChart. Monthly income vs expenses.
3. **Fund Allocation Donut** (Dashboard) — existing, keep.
4. **Debt Paydown Waterfall** (Debt page) — AreaChart. Remaining balance declining over months based on EMI.
5. **Goal Progress** (FundsPage or Goals section) — milestones timeline (moved from Dashboard)

### Future (document only)

14. **Time-to-Value Conversion** — Show "hours of work" equivalent before expense (covered by Prediction #5).
15. **End-of-Month Sweep** — Auto-prompt to redistribute leftover Needs at month end.

---

## Type Changes Already Done

- [x] `Fund.is_career_fund: boolean`
- [x] `Want.added_at: string`
- [x] `Need.reapproval_required: boolean`
- [x] `Debt` type (new entity)
- [x] `Settings`: `impulse_tax_pct`, `hourly_rate`, `allocation_mode`, `baseline_survival_amount`, `mock_salary`, `last_reconciliation`
- [x] `AppState.debts: Debt[]`
- [x] Reducer: `ADD_DEBT`, `UPDATE_DEBT`, `REMOVE_DEBT`, `PAY_DEBT_EMI`, `RECONCILE`
- [x] Seed data: debts, reapproval_required on needs, added_at on wants, is_career_fund on funds

## Still TODO

### Phase 0: Platform & Storage Foundation

**Done:**
- [x] StorageService abstraction layer interface
- [x] Web storage: localStorage (core) + IndexedDB (files) via `idb` lib
- [x] Zip export/import (data.json + files/ + meta.json) via `jszip`
- [x] Image compression utility (`browser-image-compression`)
- [x] Auto-migration placeholder (detects old format, sets flag)
- [x] AppContext wired to storage module
- [x] SettingsPage: export/import switched to zip format

**Remaining:**
- [ ] Set up Tauri 2.0 project (Android + Linux targets) — **critical for Android data persistence**
- [ ] Tauri SQLite backend (`tauri-plugin-sql`) — replaces localStorage on Android
- [ ] Tauri Filesystem API for file attachments on Android/Linux
- [ ] Capacitor fallback storage (filesystem API) — lower priority
- [ ] Tauri Local Notifications plugin — for EMI reminders, lock expiry, re-approval
- [ ] Full auto-migration: detect old localStorage → prompt user → migrate to SQLite on Tauri

### Phase 0b: Transaction Enrichment (UI)

Storage layer is ready — need to wire it into the UI:

- [ ] Add `notes: string | null` and `file_id: string | null` + `file_name: string | null` to all Transaction types
- [ ] Create `FilePicker` component — upload image/PDF, compress, store in IndexedDB/filesystem
- [ ] Wire file picker into Add Income / Add Expense modals in TransactionsPage
- [ ] Show attached file thumbnail/icon on transaction cards
- [ ] Create `FileViewer` modal — preview attached image/PDF
- [ ] Update seed data with sample notes

### Phase 1: Income Hours Tracking
- [ ] Add `hours_worked: number | null` to `IncomeTransaction` type
- [ ] Add hours input to `AddIncomeModal` in TransactionsPage
- [ ] Update seed income transactions with sample hours

### Phase 2: Predictions Page
- [ ] Create `src/pages/PredictionsPage.tsx` — 10 prediction cards
- [ ] Each card: editable assumptions + computed output
- [ ] Add route `/predictions` to App.tsx
- [ ] Add sidebar entry

### Phase 3: Dashboard Redesign
- [ ] Summary cards row (total balance, income, expenses, net savings)
- [ ] Ghost deduction: Available vs Total per fund
- [ ] Emergency Stress Test card
- [ ] Payment Default Predictor warning
- [ ] Lifestyle Creep Warning (if baseline set)
- [ ] Subscription Re-approval banners
- [ ] 48-hour cooling-off warnings on recent wants
- [ ] Burn Rate chart
- [ ] Cash Flow Trend chart
- [ ] Predictions summary row (compact cards linking to full Predictions page)
- [ ] Move SavingsOverview out to FundsPage

### Phase 4: Wants Friction
- [ ] 48-Hour Cooling-Off: Disable Purchase button for wants added <48h ago
- [ ] Impulse Tax: Intercept purchase, show tax amount, require full amount in fund

### Phase 5: Needs Friction
- [ ] Subscription Re-approval: Filter needs by `reapproval_required`, show renewal banner
- [ ] Waterfall Allocation: Toggle in Settings, modify income allocation in TransactionsPage

### Phase 6: Data Integrity
- [ ] Bank Reconciliation: New modal, compare app balance vs entered balance
- [ ] Salary Simulation: Settings section with ghost budget overlay

### Phase 7: Charts
- [ ] Burn Rate Chart on Dashboard
- [ ] Cash Flow Trend Chart on Dashboard

### Phase 8: Debt Tracker
- [ ] New `DebtPage.tsx` with CRUD, ghost deduction, pay EMI, early payoff calc
- [ ] Debt Paydown Waterfall chart on DebtPage
- [ ] Add route and nav entry

### Phase 9: Career ROI Fund
- [ ] Spending gate: require skill tag to purchase from career fund
