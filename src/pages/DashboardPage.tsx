import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Card from '../components/shared/Card';
import EmptyState from '../components/shared/EmptyState';
import { BarChart3 } from 'lucide-react';
import PredictionsContent from '../components/predictions/PredictionsContent';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceDot,
    ComposedChart,
    Area,
} from 'recharts';

interface ProjectionPoint {
    date: string;
    balance: number;
    month: number;
    targets: { name: string; value: number }[];
}

function projectWantsFund(
    currentBalance: number,
    monthlyIncome: number,
    wantsPct: number,
    months: number,
    startDate: Date,
    pendingWants: { name: string; target_price: number; current_saved: number; predicted_date: string | null }[],
): ProjectionPoint[] {
    const monthlyAdd = monthlyIncome * (wantsPct / 100);
    const points: ProjectionPoint[] = [];

    const wantsByMonth = new Map<number, { name: string; value: number }[]>();
    for (const w of pendingWants) {
        if (!w.predicted_date) continue;
        const predDate = new Date(w.predicted_date);
        const diffMonths =
            (predDate.getTime() - startDate.getTime()) / (30.416 * 24 * 60 * 60 * 1000);
        const month = Math.max(0, Math.round(diffMonths));
        if (!wantsByMonth.has(month)) wantsByMonth.set(month, []);
        wantsByMonth.get(month)!.push({ name: w.name, value: w.target_price });
    }

    let runningBalance = currentBalance;
    for (let i = 0; i <= months; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);

        if (i > 0) {
            runningBalance += monthlyAdd;
        }

        const targets = wantsByMonth.get(i) || [];
        const totalDeducted = targets.reduce((sum, item) => sum + item.value, 0);
        runningBalance = Math.max(0, runningBalance - totalDeducted);

        points.push({
            date: d.toISOString().split('T')[0],
            balance: Math.round(runningBalance),
            month: i,
            targets,
        });
    }
    return points;
}

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; dataKey?: string }>;
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#121212]/95 border border-white/[0.08] rounded-xl px-4 py-3 shadow-xl backdrop-blur-md">
            <div className="text-xs text-txt-secondary mb-2">{label ? formatDate(label) : ''}</div>
            {payload.map((p, i) => (
                <div key={i} className="text-sm font-mono font-semibold text-txt-primary">
                    {p.name}: {formatCurrency(p.value)}
                </div>
            ))}
        </div>
    );
};

export default function DashboardPage() {
    const { state } = useApp();
    const navigate = useNavigate();

    const totalBalance = state.funds.reduce((s, f) => s + f.balance, 0);
    const totalCurrentValue = state.investments.reduce((s, i) => s + i.current_value, 0);
    const netWorth = totalBalance + totalCurrentValue;

    const totalIncome = state.transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = state.transactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

    const recentTx = [...state.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const pendingWants = state.wants
        .filter((w) => !w.purchased)
        .sort((a, b) => (a.days_to_buy ?? Infinity) - (b.days_to_buy ?? Infinity))
        .slice(0, 4);

    const avgMonthlyIncome = useMemo(() => {
        if (totalIncome === 0) return 0;
        const dates = state.transactions
            .filter((t) => t.type === 'income')
            .map((t) => new Date(t.date));
        if (dates.length === 0) return 0;
        const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
        const months = Math.max(
            1,
            (Date.now() - earliest.getTime()) / (30 * 24 * 60 * 60 * 1000),
        );
        return totalIncome / months;
    }, [state.transactions, totalIncome]);

    const wantsFund = state.funds.find((f) => f.name === 'wants');
    const monthlyIncomeSource = state.settings.expected_monthly_income || avgMonthlyIncome || 80000;

    const chartData = useMemo(() => {
        if (!wantsFund) return { projection: [] as ProjectionPoint[], maxMonths: 12 };
        const now = new Date();
        const maxPredMonth = pendingWants.reduce((max, w) => {
            if (!w.predicted_date) return max;
            const diff =
                (new Date(w.predicted_date).getTime() - now.getTime()) /
                (30.416 * 24 * 60 * 60 * 1000);
            return Math.max(max, Math.ceil(diff) + 2);
        }, 12);

        const projection = projectWantsFund(
            wantsFund.balance,
            monthlyIncomeSource,
            wantsFund.allocation_pct,
            maxPredMonth,
            now,
            pendingWants,
        );

        return { projection, maxMonths: maxPredMonth };
    }, [wantsFund, monthlyIncomeSource, pendingWants]);

    const avgExpenses = useMemo(() => {
        const expenseTxs = state.transactions.filter((t) => t.type === 'expense');
        if (expenseTxs.length === 0) return 0;
        const dates = expenseTxs.map((t) => new Date(t.date));
        const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
        const months = Math.max(1, (Date.now() - earliest.getTime()) / (30 * 24 * 60 * 60 * 1000));
        return expenseTxs.reduce((s, t) => s + t.amount, 0) / months;
    }, [state.transactions]);

    const daysCovered = avgExpenses > 0 ? Math.round((totalBalance / avgExpenses) * 30) : 365;

    const hasData = state.transactions.length > 0;

    if (!hasData) {
        return (
            <div className="max-w-5xl mx-auto">
                <EmptyState
                    icon={<BarChart3 className="w-9 h-9 text-brand" />}
                    title="No Analytics Available"
                    description="Log transactions and income to generate real-time analytics, runway forecasts, and burn-rate charts."
                    action={{ label: 'Add First Transaction', onClick: () => navigate('/transactions') }}
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-24">
            {/* Stats Block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] border-b border-white/[0.06] pb-8 gap-4 sm:gap-0">
                <div className="pb-4 sm:pb-0 sm:pr-6">
                    <div className="text-xs uppercase tracking-wider font-bold text-txt-secondary mb-1">
                        Net Worth
                    </div>
                    <div className="font-mono text-3xl sm:text-4xl font-bold text-txt-primary">
                        {formatCurrency(netWorth)}
                    </div>
                    <div className="text-xs text-txt-secondary mt-0.5">
                        Liquid Funds + Investments
                    </div>
                </div>
                <div className="py-4 sm:py-0 sm:px-6">
                    <div className="text-xs uppercase tracking-wider font-bold text-txt-secondary mb-1">
                        Total Income Logged
                    </div>
                    <div className="font-mono text-2xl font-bold text-gain">
                        {formatCurrency(totalIncome)}
                    </div>
                    <div className="text-xs text-txt-secondary mt-0.5">
                        Net cumulative inflows
                    </div>
                </div>
                <div className="pt-4 sm:pt-0 sm:pl-6">
                    <div className="text-xs uppercase tracking-wider font-bold text-txt-secondary mb-1">
                        Total Expense Logged
                    </div>
                    <div className="font-mono text-2xl font-bold text-loss">
                        {formatCurrency(totalExpenses)}
                    </div>
                    <div className="text-xs text-txt-secondary mt-0.5">
                        Net cumulative outflows
                    </div>
                </div>
            </div>

            {/* Allocation Cards */}
            <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.06]">
                    Allocated Cash Balances
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {state.funds.map((fund) => {
                        const pct = totalBalance > 0 ? (fund.balance / totalBalance) * 100 : 0;
                        return (
                            <Card key={fund.id} className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: fund.color }} />
                                    <span className="text-xs text-txt-secondary uppercase tracking-widest font-semibold">
                                        {fund.name}
                                    </span>
                                </div>
                                <div className="font-mono text-2xl font-bold text-txt-primary">
                                    {formatCurrency(fund.balance)}
                                </div>
                                <div className="text-xs text-txt-secondary mt-1">
                                    {fund.allocation_pct}% split ratio · {pct.toFixed(1)}% of cash
                                </div>
                                <div className="mt-4 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${pct}%`, backgroundColor: fund.color }}
                                    />
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Wants Projections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                <div className="lg:col-span-8 space-y-4">
                    <div className="border-b border-white/[0.06] pb-2">
                        <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                            Wants Purchase Projections
                        </h3>
                    </div>
                    <div className="h-[260px] w-full pr-4">
                        {wantsFund ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData.projection} margin={{ top: 15, right: 5, left: -20, bottom: 5 }}>
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(v) => {
                                            const d = new Date(v);
                                            return d.toLocaleDateString('en-IN', { month: 'short' });
                                        }}
                                        stroke="rgba(255,255,255,0.2)"
                                        fontSize={10}
                                        fontFamily="JetBrains Mono"
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.2)"
                                        fontSize={10}
                                        fontFamily="JetBrains Mono"
                                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <Area
                                        type="monotone"
                                        dataKey="balance"
                                        name="Wants Balance"
                                        fill="rgba(167, 139, 250, 0.04)"
                                        stroke="#A78BFA"
                                        strokeWidth={1.8}
                                    />
                                    {chartData.projection.map((pt, index) =>
                                        pt.targets.map((_tgt, subIndex) => (
                                            <ReferenceDot
                                                key={`${index}-${subIndex}`}
                                                x={pt.date}
                                                y={pt.balance}
                                                r={5}
                                                fill="#FF2A2A"
                                                stroke="#FFFFFF"
                                                strokeWidth={1.5}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate('/expenses?tab=wants')}
                                            />
                                        ))
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-txt-secondary italic">
                                Wants fund configuration not found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Stress Test Emergency Runway */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="border-b border-white/[0.06] pb-2">
                        <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                            Stress Runway
                        </h3>
                    </div>
                    <div className="p-4 border border-white/[0.06] rounded-xl bg-white/[0.01] space-y-4">
                        <div>
                            <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-semibold mb-1">
                                Survival Coverage
                            </div>
                            <div className={`font-mono text-2xl font-bold ${daysCovered >= 90 ? 'text-gain' : 'text-loss'}`}>
                                {daysCovered} Days
                            </div>
                            <div className="text-[10px] text-txt-secondary mt-1">
                                {daysCovered >= 90 ? '✓ Exceeds safe 90-day cash buffer' : '⚠ Action required: Below 90-day safe runway'}
                            </div>
                        </div>
                        <div className="h-[2px] bg-white/[0.04] w-full" />
                        <div>
                            <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-semibold mb-0.5">
                                Monthly Burn Rate
                            </div>
                            <div className="font-mono text-lg font-bold text-txt-primary">
                                {formatCurrency(avgExpenses)}
                            </div>
                            <div className="text-[10px] text-txt-secondary mt-0.5">
                                Historical monthly average outflows
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lists Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">
                            Recent Transactions
                        </h3>
                        <button
                            onClick={() => navigate('/transactions')}
                            className="text-xs text-brand hover:underline cursor-pointer font-semibold"
                        >
                            View Ledger
                        </button>
                    </div>
                    <div className="space-y-3">
                        {recentTx.map((tx) => (
                            <div key={tx.id} className="py-3 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-txt-primary truncate">
                                        {tx.type === 'income' ? tx.name : tx.type === 'expense' ? tx.description : tx.note}
                                    </div>
                                    <div className="text-xs text-txt-secondary mt-0.5">
                                        {(tx as any).category || 'transfer'} · {formatDate(tx.date)}
                                    </div>
                                </div>
                                <span
                                    className={`font-mono text-sm font-bold shrink-0 ${tx.type === 'income' ? 'text-gain' : tx.type === 'expense' ? 'text-loss' : 'text-txt-secondary'
                                        }`}
                                >
                                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                                    {formatCurrency(tx.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">
                            Saving For (Wants)
                        </h3>
                        <button
                            onClick={() => navigate('/expenses?tab=wants')}
                            className="text-xs text-brand hover:underline cursor-pointer font-semibold"
                        >
                            View Wants
                        </button>
                    </div>
                    {pendingWants.length === 0 ? (
                        <p className="text-xs text-txt-secondary py-4 italic">No pending wants tracked</p>
                    ) : (
                        <div className="space-y-3">
                            {pendingWants.map((w) => {
                                const pct = w.target_price > 0 ? (w.current_saved / w.target_price) * 100 : 0;
                                return (
                                    <div key={w.id} className="py-3.5 px-3 rounded-xl bg-white/[0.03] space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-txt-primary truncate">{w.name}</span>
                                            <span className="text-brand font-mono font-medium">
                                                {w.days_to_buy !== null ? `${w.days_to_buy}d left` : '—'}
                                            </span>
                                        </div>
                                        <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand transition-all"
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono text-txt-secondary">
                                            <span>saved: {formatCurrency(w.current_saved)}</span>
                                            <span>target: {formatCurrency(w.target_price)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Predictions & Forecasting Models */}
            <div className="space-y-4 pt-6 border-t border-white/[0.06]">
                <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">
                    Financial Predictions & Forecasting Models
                </h3>
                <PredictionsContent idPrefix="dash" />
            </div>
        </div>
    );
}
