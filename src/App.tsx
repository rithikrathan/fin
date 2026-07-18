import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import NeedsPage from './pages/NeedsPage';
import FundsPage from './pages/FundsPage';
import ManageFundsPage from './pages/ManageFundsPage';
import FundDetailPage from './pages/FundDetailPage';
import ExpensesPage from './pages/ExpensesPage';
import WantsPage from './pages/WantsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/needs" element={<Navigate to="/funds/needs" replace />} />
            <Route path="/wants" element={<Navigate to="/funds/wants" replace />} />
            <Route path="/funds" element={<FundsPage />} />
            <Route path="/funds/manage" element={<ManageFundsPage />} />
            <Route path="/funds/:id" element={<FundDetailPage />} />
            <Route path="/funds/needs" element={<NeedsPage />} />
            <Route path="/funds/wants" element={<WantsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
