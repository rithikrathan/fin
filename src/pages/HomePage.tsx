import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import {
    ReceiptText,
    PieChart,
    CreditCard,
    ShoppingBag,
    LineChart,
    Sliders,
    ArrowRight
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
            icon: ReceiptText,
            to: '/transactions',
            actionText: 'Open Ledger'
        },
        {
            title: 'Cash Allocation Splits',
            description: 'Distribute incoming cash into Needs (50%), Wants (20%), and Savings (30%) funds.',
            icon: PieChart,
            to: '/funds',
            actionText: 'Allocate Funds'
        },
        {
            title: 'Store Balances & Ledgers',
            description: 'Store cards to manage Rolling billing tabs and payment histories.',
            icon: CreditCard,
            to: '/balances',
            actionText: 'Manage Stores'
        },
        {
            title: 'Monthly Bills & Wants Lists',
            description: 'Track recurring needs, one-time utilities, and predictive wants predictions.',
            icon: ShoppingBag,
            to: '/expenses',
            actionText: 'Review Lists'
        },
        {
            title: 'Analytics Dashboard',
            description: 'Deep dive into survival runway days, historic burn rate, and savings projection charts.',
            icon: LineChart,
            to: '/dashboard',
            actionText: 'View Analytics'
        },
        {
            title: 'System Preferences',
            description: 'Adjust expected monthly income, default currencies, light/dark themes, and motion.',
            icon: Sliders,
            to: '/settings',
            actionText: 'Configure Settings'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-10 py-6 pb-28 px-4 relative overflow-hidden">
            {/* ELEGANT SUBTLE BRAND RED & BLACK MESH BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute top-[-160px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[140px] animate-ambient-drift"
                    style={{ background: 'radial-gradient(circle, #FF2A2A 0%, rgba(255, 42, 42, 0.15) 50%, transparent 80%)' }}
                />
                <div
                    className="absolute top-[320px] -right-[150px] w-[350px] h-[350px] rounded-full opacity-15 blur-[120px]"
                    style={{ background: 'radial-gradient(circle, #FF2A2A 0%, transparent 75%)' }}
                />
            </div>

            {/* HERO STATS OVERVIEW */}
            <div className="relative z-10 space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-3xl bg-surface/60 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-black text-txt-secondary flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                            Net Worth Overview
                        </span>
                        <div className="font-mono text-4xl sm:text-5xl font-black text-txt-primary tracking-tight">
                            {formatCurrency(netWorth)}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-txt-secondary block font-bold">Liquid Cash</span>
                            <span className="font-mono text-base font-bold text-txt-primary">{formatCurrency(totalBalance)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-txt-secondary block font-bold">Invested</span>
                            <span className="font-mono text-base font-bold text-gain">{formatCurrency(totalCurrentValue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* NAVIGATION NODES WITH GLOWING SYMBOL BADGES */}
            <div className="space-y-4 relative z-10">
                <h3 className="text-xs uppercase tracking-widest font-black text-txt-secondary px-1">
                    Hub Nodes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {routes.map((route, idx) => {
                        const Icon = route.icon;
                        return (
                            <div
                                key={idx}
                                onClick={() => navigate(route.to)}
                                className="group relative p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-brand/50 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,42,42,0.25)] flex items-start gap-4"
                            >
                                <div className="w-11 h-11 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0 group-hover:scale-110 group-hover:bg-brand group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,42,42,0.3)]">
                                    <Icon className="w-5.5 h-5.5" />
                                </div>
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-sm text-txt-primary group-hover:text-brand transition-colors">
                                            {route.title}
                                        </h4>
                                        <ArrowRight className="w-4 h-4 text-txt-secondary group-hover:text-brand group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-xs text-txt-secondary/80 leading-relaxed line-clamp-2">
                                        {route.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
