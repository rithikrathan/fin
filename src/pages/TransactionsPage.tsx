import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { IncomeType, IncomeTransaction, ExpenseTransaction } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';

export default function TransactionsPage() {
  const { state, dispatch } = useApp();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = state.transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === f
                  ? 'bg-brand/15 text-brand'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setIncomeOpen(true)}>
            + Income
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setExpenseOpen(true)}>
            + Expense
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon="⇄"
          title="No transactions yet"
          description="Add your first income or expense to get started."
          action={{ label: '+ Add Income', onClick: () => setIncomeOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} dispatch={dispatch} />
          ))}
        </div>
      )}

      <AddIncomeModal
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        settings={state.settings}
        dispatch={dispatch}
      />
      <AddExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        funds={state.funds}
        dispatch={dispatch}
      />
    </div>
  );
}

function TransactionRow({
  tx,
  dispatch,
}: {
  tx: import('../types').Transaction;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const isIncome = tx.type === 'income';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
            isIncome ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
          }`}
        >
          {isIncome ? '↗' : '↙'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-txt-primary truncate">
              {isIncome ? tx.name : tx.description}
            </span>
            {tx.type === 'expense' && (
              <Badge
                color={
                  tx.planned
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-amber-500/10 text-amber-400'
                }
              >
                {tx.planned ? 'Planned' : 'Unplanned'}
              </Badge>
            )}
            {tx.type === 'income' && (
              <Badge color="bg-white/5 text-txt-secondary">{tx.income_type}</Badge>
            )}
          </div>
          <div className="text-xs text-txt-secondary mt-0.5">
            {tx.category} · {formatDate(tx.date)}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`font-mono text-sm font-semibold ${
              isIncome ? 'text-gain' : 'text-loss'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(tx.amount)}
          </div>
          {isIncome && (
            <div className="text-[10px] text-txt-secondary mt-0.5 font-mono">
              N:{formatCurrency(tx.fund_allocation.needs)} W:
              {formatCurrency(tx.fund_allocation.wants)} S:
              {formatCurrency(tx.fund_allocation.savings)}
            </div>
          )}
          {tx.type === 'expense' && (
            <div className="text-[10px] text-txt-secondary mt-0.5">
              from {tx.fund_name}
            </div>
          )}
        </div>

        <button
          onClick={() => dispatch({ type: 'REMOVE_TRANSACTION', payload: tx.id })}
          className="text-txt-secondary/40 hover:text-red-400 text-sm ml-2 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </Card>
  );
}

function AddIncomeModal({
  open,
  onClose,
  settings,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  settings: import('../types').Settings;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeType, setIncomeType] = useState<IncomeType>('monthly');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name || isNaN(amt) || amt <= 0) return;

    const tx: IncomeTransaction = {
      id: generateId(),
      type: 'income',
      name,
      amount: amt,
      income_type: incomeType,
      category: category || 'general',
      date: new Date().toISOString().split('T')[0],
      notes,
      fund_allocation: {
        needs: amt * (settings.needs_pct / 100),
        wants: amt * (settings.wants_pct / 100),
        savings: amt * (settings.savings_pct / 100),
      },
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    setName('');
    setAmount('');
    setCategory('');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Income">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Salary"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Type</label>
          <select
            value={incomeType}
            onChange={(e) => setIncomeType(e.target.value as IncomeType)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50 transition-colors"
          >
            <option value="monthly">Monthly</option>
            <option value="one_time">One-Time</option>
            <option value="irregular">Irregular</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. salary, freelance"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div className="bg-white/[0.03] rounded-lg p-3 text-xs text-txt-secondary space-y-1">
            <div className="font-medium text-txt-primary text-sm mb-2">
              Auto-allocation ({settings.needs_pct}/{settings.wants_pct}/{settings.savings_pct})
            </div>
            <div className="flex justify-between">
              <span>Needs</span>
              <span className="font-mono text-gain">
                {formatCurrency(parseFloat(amount) * (settings.needs_pct / 100))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Wants</span>
              <span className="font-mono text-gain">
                {formatCurrency(parseFloat(amount) * (settings.wants_pct / 100))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Savings</span>
              <span className="font-mono text-gain">
                {formatCurrency(parseFloat(amount) * (settings.savings_pct / 100))}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Income
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddExpenseModal({
  open,
  onClose,
  funds,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  funds: import('../types').Fund[];
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [fundId, setFundId] = useState(funds[0]?.id || 1);
  const [planned, setPlanned] = useState(false);

  const selectedFund = funds.find((f) => f.id === fundId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description || isNaN(amt) || amt <= 0 || !category) return;

    const tx: ExpenseTransaction = {
      id: generateId(),
      type: 'expense',
      description,
      amount: amt,
      category,
      fund_id: fundId,
      fund_name: selectedFund?.name || 'needs',
      planned,
      date: new Date().toISOString().split('T')[0],
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    setDescription('');
    setAmount('');
    setCategory('');
    setPlanned(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Groceries"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Groceries, Rent"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Fund</label>
          <select
            value={fundId}
            onChange={(e) => setFundId(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50 transition-colors"
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name.charAt(0).toUpperCase() + f.name.slice(1)} — {formatCurrency(f.balance)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Planned?</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPlanned(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                planned
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-white/[0.02] border-border-subtle text-txt-secondary hover:text-txt-primary'
              }`}
            >
              Planned
            </button>
            <button
              type="button"
              onClick={() => setPlanned(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                !planned
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-white/[0.02] border-border-subtle text-txt-secondary hover:text-txt-primary'
              }`}
            >
              Unplanned
            </button>
          </div>
        </div>

        {selectedFund && (
          <div className="bg-white/[0.03] rounded-lg p-3 text-xs text-txt-secondary">
            <div className="flex justify-between">
              <span>{selectedFund.name} balance after</span>
              <span className="font-mono text-txt-primary">
                {formatCurrency(selectedFund.balance - parseFloat(amount || '0'))}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
