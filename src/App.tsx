import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import NeedsPage from './pages/NeedsPage';
import WantsPage from './pages/WantsPage';
import FundsPage from './pages/FundsPage';
import ManageFundsPage from './pages/ManageFundsPage';
import FundDetailPage from './pages/FundDetailPage';
import InvestmentsPage from './pages/InvestmentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import DetectTransactionPage from './pages/DetectTransactionPage';

function ThemeController() {
  const { state } = useApp();

  useEffect(() => {
    const mode = state.settings.theme_mode || 'system';
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.remove('light');
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    if (mode === 'light') {
      applyTheme(false);
    } else if (mode === 'dark') {
      applyTheme(true);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [state.settings.theme_mode]);

  return null;
}

export default function App() {
  return (
    <AppProvider>
      <ThemeController />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/ledger" element={<Navigate to="/transactions" replace />} />
            <Route path="/needs" element={<NeedsPage />} />
            <Route path="/wants" element={<WantsPage />} />
            <Route path="/funds" element={<FundsPage />} />
            <Route path="/funds/manage" element={<ManageFundsPage />} />
            <Route path="/funds/:id" element={<FundDetailPage />} />
            <Route path="/funds/needs" element={<Navigate to="/needs" replace />} />
            <Route path="/funds/wants" element={<Navigate to="/wants" replace />} />
            <Route path="/expenses" element={<Navigate to="/reports" replace />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/detect/:id" element={<DetectTransactionPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
