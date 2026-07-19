import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getROI } from '../utils/helpers';
import Card from '../components/shared/Card';

export default function HomePage() {
    const { state } = useApp();
    const navigate = useNavigate();

    const totalBalance = state.funds.reduce((s, f) => s + f.balance, 0);
    const totalInvested = state.investments.reduce((s, i) => s + i.invest_amount, 0);
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
        .slice(0, 8);

    const pendingWants = state.wants
        .filter((w) => !w.purchased)
        .sort((a, b) => (a.days_to_buy ?? Infinity) - (b.days_to_buy ?? Infinity))
        .slice(0, 4);

    const hasData = state.transactions.length > 0;

    if (!hasData) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="h-20 w-20 rounded-2xl bg-brand/10 shadow-glow-lg flex items-center justify-center text-4xl mb-8">
                        ◉
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-txt-primary mb-4">
                        Welcome to Fin
                    </h1>
                    <p className="text-base sm:text-lg text-txt-secondary max-w-md mb-10 leading-relaxed px-4">
                        Track your income, split into funds, and manage expenses. Start by adding your first transaction.
                    </p>
                    <button
                        onClick={() => navigate('/transactions')}
                        className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-brand text-white text-lg sm:text-xl font-bold shadow-glow hover:bg-brand/90 transition-all cursor-pointer"
                    >
                        + Add Your First Transaction
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Hero row — net worth + total balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Card className="p-8">
                    <div className="text-sm text-txt-secondary uppercase tracking-widest mb-3 font-medium">
                        Net Worth
                    </div>
                    <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-txt-primary mb-2 min-w-0 break-all">
                        {formatCurrency(netWorth)}
                    </div>
                    <div className="text-base text-txt-secondary">
                        Funds + Investments
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-5">
                    <Card className="p-6">
                        <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">
                            Total Income
                        </div>
                        <div className="font-mono text-2xl font-bold text-gain">
                            {formatCurrency(totalIncome)}
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">
                            Total Spent
                        </div>
                        <div className="font-mono text-2xl font-bold text-loss">
                            {formatCurrency(totalExpenses)}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Fund cards — big and bold */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {state.funds.map((fund) => {
                    const pct = totalBalance > 0 ? (fund.balance / totalBalance) * 100 : 0;
                    return (
                        <Card key={fund.id} className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: fund.color }}
                                />
                                <span className="text-sm text-txt-secondary uppercase tracking-widest font-medium">
                                    {fund.name}
                                </span>
                            </div>
                            <div className="font-mono text-2xl sm:text-3xl lg:text-4xl font-bold text-txt-primary mb-1 min-w-0 break-all">
                                {formatCurrency(fund.balance)}
                            </div>
                            <div className="text-sm text-txt-secondary">
                                {fund.allocation_pct}% allocation · {pct.toFixed(1)}% of total
                            </div>
                            <div className="mt-4 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: fund.color }}
                                />
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Recent transactions + Investments side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-txt-primary">
                            Recent Transactions
                        </h3>
                        <button
                            onClick={() => navigate('/transactions')}
                            className="text-sm text-brand hover:text-brand/80 transition-colors cursor-pointer"
                        >
                            View All
                        </button>
                    </div>
                    {recentTx.length === 0 ? (
                        <div className="text-base text-txt-secondary py-8 text-center">
                            No transactions yet
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentTx.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div
                                            className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm shrink-0 ${tx.type === 'income'
                                                    ? 'bg-gain/10 text-gain'
                                                    : 'bg-loss/10 text-loss'
                                                }`}
                                        >
                                            {tx.type === 'income' ? '↗' : '↙'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-base text-txt-primary truncate font-medium">
                                                {tx.type === 'income' ? tx.name : tx.type === 'expense' ? tx.description : tx.note}
                                            </div>
                                            <div className="text-sm text-txt-secondary">
                                                {tx.type === 'expense' ? tx.category : tx.type === 'transfer' ? 'Transfer' : tx.category} · {formatDate(tx.date)}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`font-mono text-lg font-bold shrink-0 ml-4 ${tx.type === 'income' ? 'text-gain' : 'text-loss'
                                            }`}
                                    >
                                        {tx.type === 'income' ? '+' : '-'}
                                        {formatCurrency(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-txt-primary mb-5">
                            Investments
                        </h3>
                        {state.investments.length === 0 ? (
                            <div className="text-base text-txt-secondary py-4 text-center">
                                No investments tracked
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <div className="text-xs text-txt-secondary mb-1">Invested</div>
                                        <div className="font-mono text-xl font-bold text-txt-primary">
                                            {formatCurrency(totalInvested)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-txt-secondary mb-1">Current</div>
                                        <div className="font-mono text-xl font-bold text-txt-primary">
                                            {formatCurrency(totalCurrentValue)}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {state.investments.map((inv) => {
                                        const roi = getROI(inv.invest_amount, inv.current_value);
                                        return (
                                            <div
                                                key={inv.id}
                                                className="flex items-center justify-between"
                                            >
                                                <span className="text-base text-txt-primary truncate">
                                                    {inv.name}
                                                </span>
                                                <span
                                                    className={`font-mono text-base font-semibold shrink-0 ml-3 ${roi >= 0 ? 'text-gain' : 'text-loss'
                                                        }`}
                                                >
                                                    {roi >= 0 ? '+' : ''}
                                                    {roi.toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </Card>

                    {pendingWants.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-txt-primary mb-5">
                                Saving For
                            </h3>
                            <div className="space-y-4">
                                {pendingWants.map((w) => {
                                    const pct = (w.current_saved / w.target_price) * 100;
                                    return (
                                        <div key={w.id}>
                                            <div className="flex justify-between text-base mb-2">
                                                <span className="text-txt-primary font-medium">{w.name}</span>
                                                <span className="text-txt-secondary">
                                                    {w.days_to_buy !== null ? `${w.days_to_buy}d left` : '—'}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-1">
                                                <div
                                                    className="h-full bg-brand rounded-full transition-all"
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-sm font-mono text-txt-secondary">
                                                <span>{formatCurrency(w.current_saved)}</span>
                                                <span>{formatCurrency(w.target_price)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
