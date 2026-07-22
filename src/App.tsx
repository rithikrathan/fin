import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/shared/LoadingScreen';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import FundsPage from './pages/FundsPage';
import ManageFundsPage from './pages/ManageFundsPage';
import FundDetailPage from './pages/FundDetailPage';
import InvestmentsPage from './pages/InvestmentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import DetectTransactionPage from './pages/DetectTransactionPage';
import BalancesPage from './pages/BalancesPage';
import BalanceDetailPage from './pages/BalanceDetailPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import PredictionsPage from './pages/PredictionsPage';
import DebtsPage from './pages/DebtsPage';

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

  // Handle animations disabling dynamically
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.animations_enabled === false) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
  }, [state.settings.animations_enabled]);

  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Reset scrolling for layouts and scrollable sections
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
}

function MainApp() {
  const [loading, setLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('splash') === 'true') return true;
    return !sessionStorage.getItem('fin_app_loaded');
  });

  useEffect(() => {
    const handleShowSplash = () => setLoading(true);
    window.addEventListener('show_splash_screen', handleShowSplash);
    return () => window.removeEventListener('show_splash_screen', handleShowSplash);
  }, []);

  const handleFinishLoading = () => {
    sessionStorage.setItem('fin_app_loaded', 'true');
    setLoading(false);
  };

  return (
    <>
      {loading && <LoadingScreen onFinished={handleFinishLoading} />}
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/ledger" element={<Navigate to="/transactions" replace />} />
            <Route path="/needs" element={<Navigate to="/expenses?tab=needs" replace />} />
            <Route path="/wants" element={<Navigate to="/expenses?tab=wants" replace />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/funds" element={<FundsPage />} />
            <Route path="/funds/manage" element={<ManageFundsPage />} />
            <Route path="/funds/:id" element={<FundDetailPage />} />
            <Route path="/funds/needs" element={<Navigate to="/expenses?tab=needs" replace />} />
            <Route path="/funds/wants" element={<Navigate to="/expenses?tab=wants" replace />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/balances" element={<BalancesPage />} />
            <Route path="/balances/:id" element={<BalanceDetailPage />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/detect/:id" element={<DetectTransactionPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemeController />
      <MainApp />
    </AppProvider>
  );
}
