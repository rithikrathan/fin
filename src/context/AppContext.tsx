import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction, FundSnapshot } from '../types';
import { initialState } from './initialState';
import { round2, calculateWantsPredictions } from '../utils/helpers';
import { getStorageService } from '../storage/StorageService';

function snapshotFund(fundId: number, balance: number, snapshots: FundSnapshot[]): FundSnapshot[] {
  const today = new Date().toISOString().split('T')[0];
  const existing = snapshots.find((s) => s.fund_id === fundId && s.date === today);
  if (existing) {
    return snapshots.map((s) => (s.id === existing.id ? { ...s, balance } : s));
  }
  return [
    ...snapshots,
    { id: Date.now() + Math.floor(Math.random() * 1000), fund_id: fundId, balance, date: today },
  ];
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const tx = action.payload;
      let newFunds = state.funds;
      let newSnapshots = [...state.fund_snapshots];

      if (tx.type === 'income') {
        newFunds = state.funds.map((f) => {
          const added = tx.fund_allocation[f.id] || 0;
          if (added === 0) return f;
          return { ...f, balance: round2(f.balance + added) };
        });
      } else if (tx.type === 'expense') {
        newFunds = state.funds.map((f) => {
          if (f.id === tx.fund_id) {
            return { ...f, balance: round2(f.balance - tx.amount) };
          }
          return f;
        });
      } else if (tx.type === 'transfer') {
        newFunds = state.funds.map((f) => {
          if (f.id === tx.from_fund_id) return { ...f, balance: round2(f.balance - tx.amount) };
          if (f.id === tx.to_fund_id) return { ...f, balance: round2(f.balance + tx.amount) };
          return f;
        });
      }

      for (const f of newFunds) {
        const old = state.funds.find((of) => of.id === f.id);
        if (old && old.balance !== f.balance) {
          newSnapshots = snapshotFund(f.id, f.balance, newSnapshots);
        }
      }

      return { ...state, funds: newFunds, fund_snapshots: newSnapshots, transactions: [tx, ...state.transactions] };
    }

    case 'REMOVE_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.payload);
      if (!tx) return state;

      let newFunds = state.funds;
      let newSnapshots = [...state.fund_snapshots];

      if (tx.type === 'income') {
        newFunds = state.funds.map((f) => {
          const sub = tx.fund_allocation[f.id] || 0;
          if (sub === 0) return f;
          return { ...f, balance: round2(f.balance - sub) };
        });
      } else if (tx.type === 'expense') {
        newFunds = state.funds.map((f) => {
          if (f.id === tx.fund_id) return { ...f, balance: round2(f.balance + tx.amount) };
          return f;
        });
      } else if (tx.type === 'transfer') {
        newFunds = state.funds.map((f) => {
          if (f.id === tx.from_fund_id) return { ...f, balance: round2(f.balance + tx.amount) };
          if (f.id === tx.to_fund_id) return { ...f, balance: round2(f.balance - tx.amount) };
          return f;
        });
      }

      for (const f of newFunds) {
        const old = state.funds.find((of) => of.id === f.id);
        if (old && old.balance !== f.balance) {
          newSnapshots = snapshotFund(f.id, f.balance, newSnapshots);
        }
      }

      if (tx.file_id) {
        getStorageService().then((svc) => svc.removeFile(tx.file_id!)).catch(console.error);
      }

      return {
        ...state,
        funds: newFunds,
        fund_snapshots: newSnapshots,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    }

    case 'ADD_FUND':
      return { ...state, funds: [...state.funds, action.payload] };

    case 'REMOVE_FUND':
      return {
        ...state,
        funds: state.funds.filter((f) => f.id !== action.payload),
        milestones: state.milestones.filter((m) => m.fund_id !== action.payload),
        fund_snapshots: state.fund_snapshots.filter((s) => s.fund_id !== action.payload),
      };

    case 'UPDATE_FUND':
      return {
        ...state,
        funds: state.funds.map((f) => (f.id === action.payload.id ? action.payload : f)),
      };

    case 'ADD_MILESTONE':
      return { ...state, milestones: [...state.milestones, action.payload] };

    case 'UPDATE_MILESTONE':
      return {
        ...state,
        milestones: state.milestones.map((m) => (m.id === action.payload.id ? action.payload : m)),
      };

    case 'REMOVE_MILESTONE':
      return { ...state, milestones: state.milestones.filter((m) => m.id !== action.payload) };

    case 'ADD_FUND_SNAPSHOT':
      return { ...state, fund_snapshots: [...state.fund_snapshots, action.payload] };

    case 'REDISTRIBUTE_SURPLUS': {
      const { transfers } = action.payload;
      const today = new Date().toISOString().split('T')[0];
      let newFunds = [...state.funds];
      let newSnapshots = [...state.fund_snapshots];
      const newTransactions = [...state.transactions];

      for (const tr of transfers) {
        newFunds = newFunds.map((f) => {
          if (f.id === tr.from_fund_id) return { ...f, balance: round2(f.balance - tr.amount) };
          if (f.id === tr.to_fund_id) return { ...f, balance: round2(f.balance + tr.amount) };
          return f;
        });

        const fromFund = state.funds.find((f) => f.id === tr.from_fund_id);
        const toFund = state.funds.find((f) => f.id === tr.to_fund_id);

        newTransactions.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'transfer',
          from_fund_id: tr.from_fund_id,
          to_fund_id: tr.to_fund_id,
          amount: tr.amount,
          note: `Surplus redistribution: ${fromFund?.name} → ${toFund?.name}`,
          date: today,
          file_id: null,
          file_name: null,
        });
      }

      for (const f of newFunds) {
        const old = state.funds.find((of) => of.id === f.id);
        if (old && old.balance !== f.balance) {
          newSnapshots = snapshotFund(f.id, f.balance, newSnapshots);
        }
      }

      return { ...state, funds: newFunds, fund_snapshots: newSnapshots, transactions: newTransactions };
    }

    case 'RESET_TRANSACTIONS':
      return { ...state, transactions: [] };

    case 'ADD_WANT':
      return { ...state, wants: [...state.wants, action.payload] };
    case 'UPDATE_WANT':
      return {
        ...state,
        wants: state.wants.map((w) => (w.id === action.payload.id ? action.payload : w)),
      };
    case 'REMOVE_WANT':
      return { ...state, wants: state.wants.filter((w) => w.id !== action.payload) };

    case 'ADD_NEED':
      return { ...state, needs: [...state.needs, action.payload] };
    case 'UPDATE_NEED':
      return {
        ...state,
        needs: state.needs.map((n) => (n.id === action.payload.id ? action.payload : n)),
      };
    case 'REMOVE_NEED':
      return { ...state, needs: state.needs.filter((n) => n.id !== action.payload) };

    case 'ADD_INVESTMENT':
      return { ...state, investments: [...state.investments, action.payload] };
    case 'UPDATE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.map((i) =>
          i.id === action.payload.id ? action.payload : i,
        ),
      };
    case 'REMOVE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.filter((i) => i.id !== action.payload),
      };

    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] };

    case 'UPDATE_DEBT':
      return {
        ...state,
        debts: state.debts.map((d) => (d.id === action.payload.id ? action.payload : d)),
      };

    case 'REMOVE_DEBT':
      return {
        ...state,
        debts: state.debts.filter((d) => d.id !== action.payload),
      };

    case 'PAY_DEBT_EMI': {
      const debt = state.debts.find((d) => d.id === action.payload.debt_id);
      if (!debt) return state;

      const principalPaid = round2(debt.emi_amount - (debt.remaining_balance * (debt.interest_rate / 100 / 12)));
      const actualPrincipal = Math.min(principalPaid, debt.remaining_balance);
      const newRemaining = round2(debt.remaining_balance - actualPrincipal);

      const expenseTx: import('../types').ExpenseTransaction = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'expense',
        description: `EMI — ${debt.name}`,
        amount: debt.emi_amount,
        category: 'Debt EMI',
        fund_id: debt.linked_fund_id,
        fund_name: state.funds.find((f) => f.id === debt.linked_fund_id)?.name || 'needs',
        planned: true,
        date: new Date().toISOString().split('T')[0],
        is_misc: false,
        notes: '',
        file_id: null,
        file_name: null,
      };

      const newFunds = state.funds.map((f) => {
        if (f.id === debt.linked_fund_id) return { ...f, balance: round2(f.balance - debt.emi_amount) };
        return f;
      });

      const newDebts = state.debts.map((d) => {
        if (d.id !== debt.id) return d;
        return { ...d, remaining_balance: newRemaining, active: newRemaining > 0 };
      });

      let newSnapshots = [...state.fund_snapshots];
      for (const f of newFunds) {
        const old = state.funds.find((of) => of.id === f.id);
        if (old && old.balance !== f.balance) {
          newSnapshots = snapshotFund(f.id, f.balance, newSnapshots);
        }
      }

      return {
        ...state,
        funds: newFunds,
        debts: newDebts,
        fund_snapshots: newSnapshots,
        transactions: [expenseTx, ...state.transactions],
      };
    }

    case 'RECONCILE': {
      const { actual_balance: _actual, app_balance: _app, leakage_amount } = action.payload;
      if (leakage_amount <= 0) return { ...state, settings: { ...state.settings, last_reconciliation: new Date().toISOString().split('T')[0] } };

      const needsFund = state.funds.find((f) => f.name === 'needs');
      const leakageTx: import('../types').ExpenseTransaction = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'expense',
        description: `Reconciliation adjustment — ₹${leakage_amount} unaccounted leakage`,
        amount: leakage_amount,
        category: 'Miscellaneous',
        fund_id: needsFund?.id || state.funds[0].id,
        fund_name: needsFund?.name || state.funds[0].name,
        planned: false,
        date: new Date().toISOString().split('T')[0],
        is_misc: true,
        notes: '',
        file_id: null,
        file_name: null,
      };

      const reconciledFunds = state.funds.map((f) => {
        if (f.id === (needsFund?.id || state.funds[0].id)) {
          return { ...f, balance: round2(f.balance - leakage_amount) };
        }
        return f;
      });

      let reconciledSnapshots = [...state.fund_snapshots];
      for (const f of reconciledFunds) {
        const old = state.funds.find((of) => of.id === f.id);
        if (old && old.balance !== f.balance) {
          reconciledSnapshots = snapshotFund(f.id, f.balance, reconciledSnapshots);
        }
      }

      return {
        ...state,
        funds: reconciledFunds,
        fund_snapshots: reconciledSnapshots,
        transactions: [leakageTx, ...state.transactions],
        settings: { ...state.settings, last_reconciliation: new Date().toISOString().split('T')[0] },
      };
    }

    case 'ADD_BALANCE_ACCOUNT': {
      const needsFund = state.funds.find((f) => f.name.toLowerCase() === 'needs') || state.funds[0];
      const storeNeed: import('../types').Need = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: action.payload.title,
        amount: action.payload.total_due,
        category: 'Store Balance',
        recurring: false,
        frequency: null,
        due_date: null,
        fund_id: needsFund ? needsFund.id : 1,
        fund_name: needsFund ? needsFund.name : 'needs',
        autopay: false,
        notes: `Store balance tab for ${action.payload.title}`,
        active: true,
        reapproval_required: false,
        balance_account_id: action.payload.id,
      };

      return {
        ...state,
        balance_accounts: [action.payload, ...(state.balance_accounts || [])],
        needs: [...(state.needs || []), storeNeed],
      };
    }

    case 'UPDATE_BALANCE_ACCOUNT': {
      const updatedNeeds = (state.needs || []).map((n) => {
        if (n.balance_account_id === action.payload.id) {
          return { ...n, name: action.payload.title, amount: action.payload.total_due };
        }
        return n;
      });
      return {
        ...state,
        balance_accounts: (state.balance_accounts || []).map((b) => (b.id === action.payload.id ? action.payload : b)),
        needs: updatedNeeds,
      };
    }

    case 'REMOVE_BALANCE_ACCOUNT':
      return {
        ...state,
        balance_accounts: (state.balance_accounts || []).filter((b) => b.id !== action.payload),
        balance_transactions: (state.balance_transactions || []).filter((tx) => tx.account_id !== action.payload),
        balance_line_items: (state.balance_line_items || []).filter((li) => {
          const tx = (state.balance_transactions || []).find((t) => t.id === li.transaction_id);
          return tx && tx.account_id !== action.payload;
        }),
        needs: (state.needs || []).filter((n) => n.balance_account_id !== action.payload),
      };

    case 'RESET_BALANCE_ACCOUNT': {
      const accountId = action.payload;
      const updatedAccounts = (state.balance_accounts || []).map((acc) => {
        if (acc.id === accountId) {
          return { ...acc, total_due: 0, status: 'Paid' as const };
        }
        return acc;
      });
      const updatedNeeds = (state.needs || []).map((n) => {
        if (n.balance_account_id === accountId) {
          return { ...n, amount: 0 };
        }
        return n;
      });
      return {
        ...state,
        balance_accounts: updatedAccounts,
        balance_transactions: (state.balance_transactions || []).filter((tx) => tx.account_id !== accountId),
        balance_line_items: (state.balance_line_items || []).filter((li) => {
          const tx = (state.balance_transactions || []).find((t) => t.id === li.transaction_id);
          return tx && tx.account_id !== accountId;
        }),
        needs: updatedNeeds,
      };
    }

    case 'ADD_BALANCE_TRANSACTION': {
      const { transaction: tx, line_items = [] } = action.payload;
      const allTx = [tx, ...(state.balance_transactions || [])];
      const allItems = [...line_items, ...(state.balance_line_items || [])];

      // Auto-tally account total_due and status
      const accountTx = allTx.filter((t) => t.account_id === tx.account_id);
      const additionTotal = accountTx
        .filter((t) => t.type === 'Addition')
        .reduce((sum, t) => sum + t.transaction_total, 0);
      const subtractionTotal = accountTx
        .filter((t) => t.type === 'Subtraction')
        .reduce((sum, t) => sum + t.transaction_total, 0);

      const netDue = Math.max(0, round2(additionTotal - subtractionTotal));
      let status: 'Pending' | 'Partially Paid' | 'Paid' = 'Pending';
      if (netDue === 0 && additionTotal > 0) status = 'Paid';
      else if (netDue > 0 && subtractionTotal > 0) status = 'Partially Paid';

      const updatedAccounts = (state.balance_accounts || []).map((acc) => {
        if (acc.id === tx.account_id) {
          return { ...acc, total_due: netDue, status };
        }
        return acc;
      });

      const updatedNeeds = (state.needs || []).map((n) => {
        if (n.balance_account_id === tx.account_id) {
          return { ...n, amount: netDue };
        }
        return n;
      });

      return {
        ...state,
        balance_accounts: updatedAccounts,
        balance_transactions: allTx,
        balance_line_items: allItems,
        needs: updatedNeeds,
      };
    }

    case 'REMOVE_BALANCE_TRANSACTION': {
      const { transaction_id, account_id } = action.payload;
      const remainingTx = (state.balance_transactions || []).filter((t) => t.id !== transaction_id);
      const remainingItems = (state.balance_line_items || []).filter((li) => li.transaction_id !== transaction_id);

      const accountTx = remainingTx.filter((t) => t.account_id === account_id);
      const additionTotal = accountTx
        .filter((t) => t.type === 'Addition')
        .reduce((sum, t) => sum + t.transaction_total, 0);
      const subtractionTotal = accountTx
        .filter((t) => t.type === 'Subtraction')
        .reduce((sum, t) => sum + t.transaction_total, 0);

      const netDue = Math.max(0, round2(additionTotal - subtractionTotal));
      let status: 'Pending' | 'Partially Paid' | 'Paid' = 'Pending';
      if (netDue === 0 && additionTotal > 0) status = 'Paid';
      else if (netDue > 0 && subtractionTotal > 0) status = 'Partially Paid';

      const updatedAccounts = (state.balance_accounts || []).map((acc) => {
        if (acc.id === account_id) {
          return { ...acc, total_due: netDue, status };
        }
        return acc;
      });

      const updatedNeeds = (state.needs || []).map((n) => {
        if (n.balance_account_id === account_id) {
          return { ...n, amount: netDue };
        }
        return n;
      });

      return {
        ...state,
        balance_accounts: updatedAccounts,
        balance_transactions: remainingTx,
        balance_line_items: remainingItems,
        needs: updatedNeeds,
      };
    }

    case 'SAVE_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };
    case 'REMOVE_REPORT':
      return { ...state, reports: state.reports.filter((r) => r.id !== action.payload) };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'ADD_PATTERN':
      return { ...state, message_patterns: [...state.message_patterns, action.payload] };
    case 'UPDATE_PATTERN':
      return {
        ...state,
        message_patterns: state.message_patterns.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case 'REMOVE_PATTERN':
      return {
        ...state,
        message_patterns: state.message_patterns.filter((p) => p.id !== action.payload),
      };

    case 'ADD_SMS_LOG':
      return { ...state, sms_logs: [...state.sms_logs, action.payload] };
    case 'UPDATE_SMS_LOG':
      return {
        ...state,
        sms_logs: state.sms_logs.map((l) =>
          l.id === action.payload.id ? action.payload : l,
        ),
      };

    case 'ADD_DETECTED_TX':
      return { ...state, detected_transactions: [...state.detected_transactions, action.payload] };
    case 'UPDATE_DETECTED_TX':
      return {
        ...state,
        detected_transactions: state.detected_transactions.map((d) =>
          d.id === action.payload.id ? action.payload : d,
        ),
      };
    case 'REMOVE_DETECTED_TX':
      return {
        ...state,
        detected_transactions: state.detected_transactions.filter((d) => d.id !== action.payload),
      };

    case 'LOAD_DATA':
      return { ...action.payload, loading: false };
    case 'DELETE_ALL':
      return { ...initialState, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

function recalculatePredictionsInState(state: AppState): AppState {
  const wantsFund = state.funds.find((f) => f.name === 'wants');
  const wantsFundBalance = wantsFund ? wantsFund.balance : 0;
  const wantsAllocationPct = wantsFund ? wantsFund.allocation_pct : 20;

  const updatedWants = calculateWantsPredictions(
    state.wants,
    wantsFundBalance,
    state.settings.expected_monthly_income,
    wantsAllocationPct
  );

  return {
    ...state,
    wants: updatedWants,
  };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (s: AppState, a: AppAction) => {
      const next = appReducer(s, a);
      if (next.loading) return next;
      return recalculatePredictionsInState(next);
    },
    { ...initialState, loading: true }
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const svc = await getStorageService();
        await svc.migrate();
        const loaded = await svc.loadState();
        if (!cancelled) {
          dispatch({ type: 'LOAD_DATA', payload: { ...loaded, loading: false } });
        }
      } catch (e) {
        console.error('Storage load failed:', e);
        if (!cancelled) {
          dispatch({ type: 'LOAD_DATA', payload: { ...initialState, loading: false } });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state.loading) return;
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(async () => {
      try {
        const svc = await getStorageService();
        const { loading: _, ...saveable } = state;
        await svc.saveState(saveable);
      } catch (e) {
        console.error('Storage save failed:', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
