import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction } from '../types';
import { initialState } from './initialState';

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

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const tx = action.payload;
      const newFunds = state.funds.map((f) => {
        if (tx.type === 'income') {
          const alloc = tx.fund_allocation;
          const added =
            f.name === 'needs' ? alloc.needs : f.name === 'wants' ? alloc.wants : alloc.savings;
          return { ...f, balance: f.balance + added };
        }
        if (tx.type === 'expense' && f.id === tx.fund_id) {
          return { ...f, balance: f.balance - tx.amount };
        }
        return f;
      });
      return { ...state, funds: newFunds, transactions: [tx, ...state.transactions] };
    }
    case 'REMOVE_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.payload);
      if (!tx) return state;
      const newFunds = state.funds.map((f) => {
        if (tx.type === 'income') {
          const alloc = tx.fund_allocation;
          const sub =
            f.name === 'needs' ? alloc.needs : f.name === 'wants' ? alloc.wants : alloc.savings;
          return { ...f, balance: f.balance - sub };
        }
        if (tx.type === 'expense' && f.id === tx.fund_id) {
          return { ...f, balance: f.balance + tx.amount };
        }
        return f;
      });
      return {
        ...state,
        funds: newFunds,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    }
    case 'UPDATE_FUND':
      return {
        ...state,
        funds: state.funds.map((f) => (f.id === action.payload.id ? action.payload : f)),
      };
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
