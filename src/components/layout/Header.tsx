import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
    HomeIcon,
    TransactionsIcon,
    ExpensesIcon,
    FundsIcon,
    DashboardIcon,
    ReportsIcon,
    SettingsIcon,
} from '../shared/Icons';

const routeConfig: Record<string, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
    '/': { title: 'Fin Hub', icon: HomeIcon },
    '/dashboard': { title: 'Financial Dashboard', icon: DashboardIcon },
    '/expenses': { title: 'Monthly Expenses', icon: ExpensesIcon },
    '/transactions': { title: 'Ledger', icon: TransactionsIcon },
    '/funds': { title: 'Funds Split', icon: FundsIcon },
    '/funds/manage': { title: 'Manage Funds', icon: FundsIcon },
    '/investments': { title: 'Investments', icon: DashboardIcon },
    '/balances': { title: 'Store Balances', icon: TransactionsIcon },
    '/reports': { title: 'Reports', icon: ReportsIcon },
    '/settings': { title: 'Settings', icon: SettingsIcon },
};

export default function Header() {
    const { pathname } = useLocation();
    const { state } = useApp();
    const current = routeConfig[pathname] || { title: 'Fin', icon: HomeIcon };

    const mode = state.settings.theme_mode || 'system';
    const isLight =
        mode === 'light' ||
        (mode === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia &&
            !window.matchMedia('(prefers-color-scheme: dark)').matches);

    const iconSrc = isLight ? '/icon-red.svg' : '/icon.svg';

    return (
        <header className="sticky top-0 z-30 min-h-[5rem] py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] bg-surface/80 backdrop-blur-md border-b border-border-subtle flex items-center px-4 sm:px-8">
            <div className="flex items-center gap-3 min-w-0">
                <img
                    src={iconSrc}
                    alt="Fin Logo"
                    className="w-9 h-9 rounded-xl shrink-0 shadow-[0_0_15px_rgba(255,42,42,0.35)] object-cover"
                />
                <h1 className="text-xl sm:text-2xl font-bold text-txt-primary truncate">{current.title}</h1>
            </div>
        </header>
    );
}
