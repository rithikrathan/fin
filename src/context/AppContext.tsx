import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction, FundSnapshot } from '../types';
import { initialState } from './initialState';
import { round2 } from '../utils/helpers';

const STORAGE_KEY = 'finmanager_data';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return { ...initialState, ...parsed, loading: false };
    }
  } catch {}
  return initialState;
}

function saveState(state: AppState) {
  try {
    const { loading, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {}
}

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

    case 'SAVE_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };
    case 'REMOVE_REPORT':
      return { ...state, reports: state.reports.filter((r) => r.id !== action.payload) };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
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

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
