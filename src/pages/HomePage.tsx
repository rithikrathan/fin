import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import {
    Wallet,
    TrendingUp,
    Receipt,
    Store,
    Split,
    Settings,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';

export default function HomePage() {
    const { state } = useApp();
    const navigate = useNavigate();

    // Core stats
    const totalBalance = state.funds.reduce((s, f) => s + f.balance, 0);
    const totalCurrentValue = state.investments.reduce((s, i) => s + i.current_value, 0);
    const netWorth = totalBalance + totalCurrentValue;

    const routes = [
        {
            title: 'Ledger & Transaction Logs',
            description: 'Enter new income, log daily expenses, or record internal transfers.',
            icon: Wallet,
            to: '/transactions',
            actionText: 'Open Ledger'
        },
        {
            title: 'Cash Allocation Splits',
            description: 'Distribute incoming cash into Needs (50%), Wants (20%), and Savings (30%) funds.',
            icon: Split,
            to: '/funds',
            actionText: 'Allocate Funds'
        },
        {
            title: 'Store Balances & Ledgers',
            description: 'Store cards to manage Rolling billing tabs and payment histories.',
            icon: Store,
            to: '/balances',
            actionText: 'Manage Stores'
        },
        {
            title: 'Monthly Bills & Wants Lists',
            description: 'Track recurring needs, one-time utilities, and predictive wants predictions.',
            icon: Receipt,
            to: '/expenses',
            actionText: 'Review Lists'
        },
        {
            title: 'Analytics Dashboard',
            description: 'Deep dive into survival runway days, historic burn rate, and savings projection charts.',
            icon: TrendingUp,
            to: '/dashboard',
            actionText: 'View Analytics'
        },
        {
            title: 'System Preferences',
            description: 'Adjust expected monthly income, default currencies, light/dark themes, and motion.',
            icon: Settings,
            to: '/settings',
            actionText: 'Configure Settings'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-6 pb-28 px-4 relative overflow-hidden">
            {/* Animated Ambient Glow */}
            <div
                className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-40 pointer-events-none blur-[100px] z-0 animate-ambient-drift"
                style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 70%)' }}
            />

            {/* 1. MINIMALIST TYPOGRAPHY HEADER */}
            <div className="space-y-4 border-b border-white/[0.06] pb-8 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight text-txt-primary sm:text-5xl">
                            control deck<span className="text-brand">.</span>
                        </h1>
                        <p className="text-sm text-txt-secondary max-w-md leading-relaxed">
                            Navigate your financial environment. Track ledgers, split allocations, and view runway forecasts.
                        </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-widest font-black text-txt-secondary block">
                            Cumulative Net Worth
                        </span>
                        <div className="font-mono text-3xl font-black text-txt-primary tracking-tight mt-0.5">
                            {formatCurrency(netWorth)}
                        </div>
                        <span className="text-[10px] text-gain font-semibold flex items-center justify-start sm:justify-end gap-1 mt-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Allocated & Safe
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. PREMIUM LINEAR ROUTE LAUNCHERS (Minimalist split lists instead of card blocks) */}
            <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary tracking-widest">
                    Navigation Nodes
                </h3>

                <div className="divide-y divide-white/[0.06] border-b border-white/[0.06]">
                    {routes.map((route, idx) => {
                        const Icon = route.icon;
                        return (
                            <div
                                key={idx}
                                onClick={() => navigate(route.to)}
                                className="group py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01] transition-all px-2 -mx-2 rounded-xl"
                            >
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-txt-secondary group-hover:border-brand/30 group-hover:text-brand transition-colors shrink-0 mt-0.5">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <h4 className="font-bold text-base text-txt-primary group-hover:text-brand transition-colors truncate">
                                            {route.title}
                                        </h4>
                                        <p className="text-xs text-txt-secondary leading-relaxed max-w-xl">
                                            {route.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs font-bold text-txt-secondary group-hover:text-brand transition-colors shrink-0 self-end sm:self-center">
                                    <span>{route.actionText}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
