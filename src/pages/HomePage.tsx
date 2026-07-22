import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, round2 } from '../utils/helpers';
import {
    ReceiptText,
    PieChart,
    CreditCard,
    ShoppingBag,
    LineChart,
    Sliders,
    ArrowRight,
    Wallet,
    ShieldCheck,
    HeartHandshake,
    PiggyBank,
    Landmark,
    TrendingUp,
    Sparkles,
    Ghost
} from 'lucide-react';

export default function HomePage() {
    const { state } = useApp();
    const navigate = useNavigate();

    // --- FINANCIAL METRICS BREAKDOWN ---
    const totalBalance = state.funds.reduce((s, f) => s + f.balance, 0);
    const totalCurrentValue = state.investments.reduce((s, i) => s + i.current_value, 0);
    const totalInvestedCapital = state.investments.reduce((s, i) => s + i.invest_amount, 0);
    const netWorth = totalBalance + totalCurrentValue;

    const needsFund = state.funds.find((f) => f.name.toLowerCase() === 'needs') || state.funds[0];
    const wantsFund = state.funds.find((f) => f.name.toLowerCase() === 'wants') || state.funds[1];
    const savingsFund = state.funds.find((f) => f.name.toLowerCase() === 'savings') || state.funds[2];

    const needsBalance = needsFund?.balance || 0;
    const wantsBalance = wantsFund?.balance || 0;
    const savingsBalance = savingsFund?.balance || 0;

    const needsCashPct = totalBalance > 0 ? round2((needsBalance / totalBalance) * 100) : 0;
    const wantsCashPct = totalBalance > 0 ? round2((wantsBalance / totalBalance) * 100) : 0;
    const savingsCashPct = totalBalance > 0 ? round2((savingsBalance / totalBalance) * 100) : 0;

    const totalStoreBalance = state.balance_accounts.reduce((s, a) => s + a.total_due, 0);
    const totalDebts = state.debts.filter((d) => d.active).reduce((s, d) => s + d.remaining_balance, 0);

    const investmentGain = totalCurrentValue - totalInvestedCapital;
    const investmentGainPct = totalInvestedCapital > 0 ? (investmentGain / totalInvestedCapital) * 100 : 0;

    const pendingWantsCount = state.wants.filter((w) => !w.purchased).length;

    // --- GHOST BALANCE & COMMITTED DEDUCTIONS MATH ---
    const committedNeeds = state.needs.filter((n) => n.active).reduce((s, n) => {
        if (n.frequency === 'weekly') return s + n.amount * 4;
        if (n.frequency === 'yearly') return s + n.amount / 12;
        return s + n.amount;
    }, 0);
    const committedDebtsEMIs = state.debts.filter((d) => d.active).reduce((s, d) => s + d.emi_amount, 0);
    const totalCommittedDeductions = committedNeeds + committedDebtsEMIs + totalStoreBalance;
    const ghostBalance = Math.max(0, totalBalance - totalCommittedDeductions);

    const routes = [
        {
            title: 'Ledger & Transaction Logs',
            description: 'Record new income, daily expenses, or execute internal fund transfers.',
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
            description: 'Manage rolling billing tabs, store cards, and payment histories.',
            icon: CreditCard,
            to: '/balances',
            actionText: 'Manage Stores'
        },
        {
            title: 'Monthly Bills & Wants Lists',
            description: 'Track recurring needs, one-time utilities, and predictive wants wishlist.',
            icon: ShoppingBag,
            to: '/expenses',
            actionText: 'Review Lists'
        },
        {
            title: 'Analytics Dashboard',
            description: 'Deep dive into survival runway, burn rate, and savings projections.',
            icon: LineChart,
            to: '/dashboard',
            actionText: 'View Analytics'
        },
        {
            title: 'System Preferences',
            description: 'Adjust expected monthly income, default currencies, themes, and motion.',
            icon: Sliders,
            to: '/settings',
            actionText: 'Configure Preferences'
        }
    ];

    return (
        <div className="relative min-h-full">
            {/* ELEGANT SUBTLE BRAND RED MESH BACKGROUND - FULL VIEWPORT (NO HARD EDGES) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-[150px] animate-ambient-drift"
                    style={{ background: 'radial-gradient(circle, #FF2A2A 0%, rgba(255, 42, 42, 0.15) 50%, transparent 80%)' }}
                />
                <div
                    className="absolute top-[35%] -right-[120px] w-[450px] h-[450px] rounded-full opacity-15 blur-[130px]"
                    style={{ background: 'radial-gradient(circle, #FF2A2A 0%, transparent 75%)' }}
                />
            </div>

            <div className="max-w-4xl mx-auto space-y-8 py-6 pb-28 px-4 relative z-10">
                {/* ESSENTIAL NET WORTH & GHOST BALANCE HERO CARD */}
                <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border-subtle backdrop-blur-md shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-widest font-black text-txt-secondary flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                                </span>
                                Total Net Worth
                            </span>
                            <div className="font-mono text-4xl sm:text-5xl font-black text-txt-primary tracking-tight">
                                {formatCurrency(netWorth)}
                            </div>
                        </div>

                        {/* Ghost Available Cash Display */}
                        <div className="space-y-1 sm:text-right border-t sm:border-t-0 border-white/[0.06] pt-4 sm:pt-0">
                            <span className="text-[10px] uppercase tracking-widest font-black text-gain flex items-center sm:justify-end gap-1.5">
                                <Ghost className="w-3.5 h-3.5 text-gain animate-pulse" />
                                Available Cash
                            </span>
                            <div className="font-mono text-2xl sm:text-3xl font-black text-gain tracking-tight">
                                {formatCurrency(ghostBalance)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* WHERE YOUR MONEY IS AT - REWORKED 3-FUND CARDS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                        <h3 className="text-xs uppercase tracking-widest font-black text-txt-secondary flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-brand" />
                            Where Your Money Is
                        </h3>
                        <span
                            onClick={() => navigate('/funds/manage')}
                            className="text-[11px] font-mono font-bold text-brand hover:underline transition-all cursor-pointer"
                        >
                            {state.funds.length} Active Funds &gt;
                        </span>
                    </div>

                    {/* 3-COLUMN REWORKED FUND CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Needs Fund Card */}
                        <div
                            onClick={() => navigate('/expenses?tab=needs')}
                            className="p-5 rounded-2xl bg-surface border border-border-subtle fund-card-needs hover:border-loss/50 transition-all duration-300 cursor-pointer space-y-4 group hover:-translate-y-1 shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-loss/15 border border-loss/30 flex items-center justify-center text-loss group-hover:scale-110 transition-transform shadow-sm">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-loss/15 text-loss border border-loss/30">
                                    {state.settings.allocation_mode === 'waterfall' ? 'Waterfall' : `${needsFund?.allocation_pct ?? 50}% Pro-Rata`}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-txt-secondary">Needs Fund</span>
                                    <span className="text-[10px] font-mono text-loss font-semibold">{needsCashPct}% Cash</span>
                                </div>
                                <div className="font-mono text-2xl font-bold text-txt-primary group-hover:text-loss transition-colors">
                                    {formatCurrency(needsBalance)}
                                </div>
                            </div>
                        </div>

                        {/* Wants Fund Card */}
                        <div
                            onClick={() => navigate('/expenses?tab=wants')}
                            className="p-5 rounded-2xl bg-surface border border-border-subtle fund-card-wants hover:border-purple-400/50 transition-all duration-300 cursor-pointer space-y-4 group hover:-translate-y-1 shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-sm">
                                    <HeartHandshake className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                    {state.settings.allocation_mode === 'waterfall' ? 'Waterfall' : `${wantsFund?.allocation_pct ?? 20}% Pro-Rata`}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-txt-secondary">Wants Fund</span>
                                    <span className="text-[10px] font-mono text-purple-400 font-semibold">{wantsCashPct}% Cash • {pendingWantsCount} Wants</span>
                                </div>
                                <div className="font-mono text-2xl font-bold text-txt-primary group-hover:text-purple-400 transition-colors">
                                    {formatCurrency(wantsBalance)}
                                </div>
                            </div>
                        </div>

                        {/* Savings Fund Card */}
                        <div
                            onClick={() => navigate('/funds')}
                            className="p-5 rounded-2xl bg-surface border border-border-subtle fund-card-savings hover:border-gain/50 transition-all duration-300 cursor-pointer space-y-4 group hover:-translate-y-1 shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-gain/15 border border-gain/30 flex items-center justify-center text-gain group-hover:scale-110 transition-transform shadow-sm">
                                    <PiggyBank className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-gain/15 text-gain border border-gain/30">
                                    {state.settings.allocation_mode === 'waterfall' ? 'Waterfall' : `${savingsFund?.allocation_pct ?? 30}% Pro-Rata`}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-txt-secondary">Savings Fund</span>
                                    <span className="text-[10px] font-mono text-gain font-semibold">{savingsCashPct}% Cash</span>
                                </div>
                                <div className="font-mono text-2xl font-bold text-txt-primary group-hover:text-gain transition-colors">
                                    {formatCurrency(savingsBalance)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECONDARY REWORKED HOLDINGS SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {/* Investments Card */}
                        <div
                            onClick={() => navigate('/investments')}
                            className="p-4 rounded-2xl bg-surface border border-border-subtle hover:border-gain/50 transition-all duration-300 cursor-pointer flex items-center justify-between group hover:-translate-y-0.5 shadow-md"
                        >
                            <div className="space-y-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-txt-secondary font-bold flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-gain" />
                                    Investments
                                </span>
                                <div className="font-mono text-lg font-bold text-txt-primary group-hover:text-gain transition-colors">
                                    {formatCurrency(totalCurrentValue)}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${investmentGain >= 0 ? 'bg-gain/10 text-gain border border-gain/20' : 'bg-loss/10 text-loss border border-loss/20'}`}>
                                    {investmentGain >= 0 ? '+' : ''}{investmentGainPct.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* Store Ledgers Card */}
                        <div
                            onClick={() => navigate('/balances')}
                            className="p-4 rounded-2xl bg-surface border border-border-subtle hover:border-brand/50 transition-all duration-300 cursor-pointer flex items-center justify-between group hover:-translate-y-0.5 shadow-md"
                        >
                            <div className="space-y-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-txt-secondary font-bold flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-brand" />
                                    Store Card Dues
                                </span>
                                <div className="font-mono text-lg font-bold text-txt-primary group-hover:text-brand transition-colors">
                                    {formatCurrency(totalStoreBalance)}
                                </div>
                            </div>
                            <span className="text-xs text-txt-secondary font-mono font-bold">
                                {state.balance_accounts.length} Ledgers
                            </span>
                        </div>

                        {/* Active Debts Card */}
                        <div
                            onClick={() => navigate('/debts')}
                            className="p-4 rounded-2xl bg-surface border border-border-subtle hover:border-loss/50 transition-all duration-300 cursor-pointer flex items-center justify-between group hover:-translate-y-0.5 shadow-md"
                        >
                            <div className="space-y-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-txt-secondary font-bold flex items-center gap-1.5">
                                    <Landmark className="w-3.5 h-3.5 text-loss" />
                                    Active Debts & Loans
                                </span>
                                <div className="font-mono text-lg font-bold text-txt-primary group-hover:text-loss transition-colors">
                                    {formatCurrency(totalDebts)}
                                </div>
                            </div>
                            <span className="text-xs text-txt-secondary font-mono font-bold">
                                {state.debts.filter((d) => d.active).length} Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION COMMAND TILES (REWORKED HUB NODES) */}
                <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest font-black text-txt-secondary px-1 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        System Command Hub
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {routes.map((route, idx) => {
                            const Icon = route.icon;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => navigate(route.to)}
                                    className="group relative p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-white/[0.02] hover:from-white/[0.06] hover:to-white/[0.03] border border-white/10 hover:border-brand/60 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(255,42,42,0.25)] hover:-translate-y-1 flex flex-col justify-between space-y-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/40 flex items-center justify-center text-brand shrink-0 group-hover:scale-110 group-hover:bg-brand group-hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,42,42,0.3)]">
                                            <Icon className="w-5.5 h-5.5" />
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-extrabold text-sm text-txt-primary group-hover:text-brand transition-colors">
                                                    {route.title}
                                                </h4>
                                                <ArrowRight className="w-4 h-4 text-txt-secondary group-hover:text-brand group-hover:translate-x-1.5 transition-all" />
                                            </div>
                                            <p className="text-xs text-txt-secondary/80 leading-relaxed line-clamp-2">
                                                {route.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono font-bold text-txt-secondary">
                                        <span className="group-hover:text-txt-primary transition-colors">Node #0{idx + 1}</span>
                                        <span className="text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            {route.actionText} →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

