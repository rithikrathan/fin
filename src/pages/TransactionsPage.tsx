import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { IncomeType, IncomeTransaction, ExpenseTransaction } from '../types';
import { formatCurrency, formatDate, generateId, round2 } from '../utils/helpers';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => exportCSV(sorted, state)}>
            CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exportPDF(sorted, state)}>
            PDF
          </Button>
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
            <TransactionRow key={tx.id} tx={tx} funds={state.funds} dispatch={dispatch} />
          ))}
        </div>
      )}

      <AddIncomeModal
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        funds={state.funds}
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
  funds,
  dispatch,
}: {
  tx: import('../types').Transaction;
  funds: import('../types').Fund[];
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
              {tx.type === 'income' ? tx.name : tx.type === 'expense' ? tx.description : tx.note}
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
            {tx.type === 'expense' ? tx.category : tx.type === 'transfer' ? 'Transfer' : tx.category} · {formatDate(tx.date)}
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
          {tx.type === 'income' && (
            <div className="text-[10px] text-txt-secondary mt-0.5 font-mono">
              {Object.entries(tx.fund_allocation)
                .filter(([, v]) => v > 0)
                .map(([fundId, val]) => {
                  const f = funds.find((f) => f.id === Number(fundId));
                  return `${f?.name?.[0]?.toUpperCase() || '?'}:${formatCurrency(val)}`;
                })
                .join(' ')}
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
  funds,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  funds: import('../types').Fund[];
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
      fund_allocation: Object.fromEntries(
        funds.map((f) => [f.id, round2(amt * (f.allocation_pct / 100))])
      ) as Record<number, number>,
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
              Auto-allocation
            </div>
            {funds.map((f) => (
              <div key={f.id} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                  {f.name}
                </span>
                <span className="font-mono text-gain">
                  {formatCurrency(round2(parseFloat(amount) * (f.allocation_pct / 100)))}
                </span>
              </div>
            ))}
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
      is_misc: category === 'Miscellaneous',
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
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {['Snacks', 'Transport', 'Shopping', 'Health', 'Miscellaneous'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-brand/15 border-brand/30 text-brand'
                    : 'bg-white/[0.02] border-border-subtle text-txt-secondary hover:text-txt-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Or type a custom category"
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

function exportCSV(transactions: import('../types').Transaction[], state: import('../types').AppState) {
  const header = 'Date,Type,Name/Description,Amount,Fund,Category,Notes';
  const rows = transactions.map((t) => {
    if (t.type === 'income') {
      const alloc = Object.entries(t.fund_allocation)
        .map(([id, amt]) => {
          const f = state.funds.find((f) => f.id === Number(id));
          return `${f?.name || id}: ${amt}`;
        }).join('; ');
      return `"${t.date}","Income","${t.name}",${t.amount},"${alloc}","${t.category}","${t.notes}"`;
    }
    if (t.type === 'expense') {
      return `"${t.date}","Expense","${t.description}",${t.amount},"${t.fund_name}","${t.category}","${t.is_misc ? 'misc' : ''}"`;
    }
    const from = state.funds.find((f) => f.id === t.from_fund_id);
    const to = state.funds.find((f) => f.id === t.to_fund_id);
    return `"${t.date}","Transfer","${t.note}",${t.amount},"${from?.name} → ${to?.name}","",""`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(transactions: import('../types').Transaction[], state: import('../types').AppState) {
  const rows = transactions.map((t) => {
    let name = '', amount = 0, fund = '', category = '', type = '';
    if (t.type === 'income') {
      type = 'Income'; name = t.name; amount = t.amount;
      fund = Object.entries(t.fund_allocation).map(([id, amt]) => {
        const f = state.funds.find((f) => f.id === Number(id));
        return `${f?.name || id}: ₹${amt}`;
      }).join(', ');
      category = t.category;
    } else if (t.type === 'expense') {
      type = 'Expense'; name = t.description; amount = -t.amount;
      fund = t.fund_name; category = t.category;
    } else {
      const from = state.funds.find((f) => f.id === t.from_fund_id);
      const to = state.funds.find((f) => f.id === t.to_fund_id);
      type = 'Transfer'; name = t.note; amount = t.amount;
      fund = `${from?.name} → ${to?.name}`;
    }
    return `<tr>
      <td>${t.date}</td><td>${type}</td><td>${name}</td>
      <td style="font-family:monospace;${amount >= 0 ? 'color:#4ADE80' : 'color:#FB923C'}">${amount >= 0 ? '+' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}</td>
      <td>${fund}</td><td>${category}</td>
    </tr>`;
  }).join('');

  const printWin = window.open('', '_blank');
  if (!printWin) return;
  printWin.document.write(`<!DOCTYPE html><html><head><title>Transactions</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Inter,sans-serif;background:#050505;color:#F4F4F5;padding:40px}
      h1{font-size:24px;margin-bottom:8px}
      .sub{color:#A1A1AA;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;font-size:11px;color:#A1A1AA;text-transform:uppercase;letter-spacing:1px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.08)}
      td{padding:8px 10px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04)}
      @media print{body{background:#fff;color:#111}th,td{border-bottom-color:#ddd}th{color:#666}}
    </style></head><body>
    <h1>Transactions</h1>
    <div class="sub">${transactions.length} transactions · Generated ${new Date().toLocaleDateString('en-IN')}</div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Amount</th><th>Fund</th><th>Category</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 500);
}
