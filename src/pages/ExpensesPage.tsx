import { useApp } from '../context/AppContext';
import type { ExpenseTransaction } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import Card from '../components/shared/Card';
import Badge from '../components/shared/Badge';
import EmptyState from '../components/shared/EmptyState';

export default function ExpensesPage() {
  const { state } = useApp();

  const expenses = state.transactions
    .filter((t): t is ExpenseTransaction => t.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const planned = expenses.filter((e) => e.planned);
  const unplanned = expenses.filter((e) => !e.planned);
  const misc = expenses.filter((e) => e.is_misc);
  const miscTotal = misc.reduce((s, e) => s + e.amount, 0);

  const byCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const categories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxCat = categories[0]?.[1] || 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-xs text-txt-secondary mb-1">Total Spent</div>
          <div className="font-mono text-xl font-bold text-loss">
            {formatCurrency(totalSpent)}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-txt-secondary mb-1">Planned</div>
          <div className="font-mono text-xl font-bold text-blue-400">
            {formatCurrency(planned.reduce((s, e) => s + e.amount, 0))}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-txt-secondary mb-1">Unplanned</div>
          <div className="font-mono text-xl font-bold text-amber-400">
            {formatCurrency(unplanned.reduce((s, e) => s + e.amount, 0))}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-txt-secondary mb-1">Miscellaneous</div>
          <div className="font-mono text-xl font-bold text-txt-primary">
            {formatCurrency(miscTotal)}
          </div>
          <div className="text-[10px] text-txt-secondary mt-0.5">
            {misc.length} items
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-txt-primary mb-4">
            By Category
          </h3>
          <div className="space-y-3">
            {categories.map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-txt-primary">{cat}</span>
                  <span className="font-mono text-txt-secondary">
                    {formatCurrency(amt)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand/70 rounded-full"
                    style={{ width: `${(amt / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-txt-primary mb-4">
            By Fund
          </h3>
          <div className="space-y-3">
            {state.funds.map((f) => {
              const amt = expenses
                .filter((e) => e.fund_id === f.id)
                .reduce((s, e) => s + e.amount, 0);
              return (
                <div key={f.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: f.color }}
                      />
                      <span className="text-txt-primary capitalize">{f.name}</span>
                    </div>
                    <span className="font-mono text-txt-secondary">
                      {formatCurrency(amt)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalSpent ? (amt / totalSpent) * 100 : 0}%`,
                        backgroundColor: f.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-txt-primary mb-4">
          All Expenses
        </h3>
        {expenses.length === 0 ? (
          <EmptyState
            icon="▽"
            title="No expenses yet"
            description="Log your first expense from the Transactions page."
          />
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-sm text-txt-primary truncate">
                    {e.description}
                  </span>
                  <Badge color="bg-white/5 text-txt-secondary">{e.category}</Badge>
                  {e.is_misc && (
                    <Badge color="bg-amber-500/10 text-amber-400">Misc</Badge>
                  )}
                  <Badge
                    color={
                      e.planned
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }
                  >
                    {e.planned ? 'Planned' : 'Unplanned'}
                  </Badge>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono text-sm font-semibold text-loss">
                    -{formatCurrency(e.amount)}
                  </div>
                  <div className="text-[10px] text-txt-secondary">
                    {e.fund_name} · {formatDate(e.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
