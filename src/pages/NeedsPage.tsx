import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateId } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';

export default function NeedsPage() {
  const { state, dispatch } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [tab, setTab] = useState<'recurring' | 'onetime'>('recurring');

  const recurring = state.needs.filter((n) => n.recurring && n.active);
  const oneTime = state.needs.filter((n) => !n.recurring);
  const monthlyTotal = recurring.reduce((s, n) => {
    if (n.frequency === 'monthly') return s + n.amount;
    if (n.frequency === 'weekly') return s + n.amount * 4;
    if (n.frequency === 'yearly') return s + n.amount / 12;
    return s + n.amount;
  }, 0);

  const filtered = tab === 'recurring' ? recurring : oneTime;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="text-sm text-txt-secondary uppercase tracking-widest mb-2">
            Recurring Monthly
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-loss min-w-0 break-all">
            {formatCurrency(monthlyTotal)}
          </div>
          <div className="text-sm text-txt-secondary mt-1">
            {recurring.length} active bills
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-txt-secondary uppercase tracking-widest mb-2">
            One-Time Needs
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-txt-primary">
            {oneTime.length}
          </div>
          <div className="text-sm text-txt-secondary mt-1">
            {oneTime.filter((n) => n.active).length} pending
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['recurring', 'onetime'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-base font-semibold transition-all transform duration-150 active:scale-95 cursor-pointer ${
                tab === t
                  ? 'bg-brand/15 text-brand border border-brand/20 shadow-glow'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
              }`}
            >
              {t === 'recurring' ? 'Recurring' : 'One-Time'}
            </button>
          ))}
        </div>
        <Button variant="primary" size="md" onClick={() => setFormOpen(true)}>
          + Add Need
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="▽"
          title={`No ${tab} needs`}
          description={
            tab === 'recurring'
              ? 'Add your recurring bills, rent, subscriptions, etc.'
              : 'Add one-time purchases or payments you need to make.'
          }
          action={{ label: '+ Add Need', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((need) => (
            <Card key={need.id} className={`p-5 ${!need.active && need.recurring ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-txt-primary truncate">{need.name}</h4>
                  <div className="text-sm text-txt-secondary">{need.category}</div>
                </div>
                <div className="flex gap-2">
                  {need.recurring && (
                    <Badge color="bg-blue-500/10 text-blue-400">{need.frequency || 'recurring'}</Badge>
                  )}
                  {need.autopay && (
                    <Badge color="bg-gain/10 text-gain">Autopay</Badge>
                  )}
                </div>
              </div>

              <div className="font-mono text-2xl font-bold text-txt-primary mb-3">
                {formatCurrency(need.amount)}
              </div>

              {need.due_date && (
                <div className="text-sm text-txt-secondary mb-3">
                  Due: <span className="text-txt-primary">{need.due_date}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-txt-secondary mb-4">
                <span>From</span>
                <span className="text-txt-primary capitalize font-medium">{need.fund_name}</span>
                <span>fund</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_NEED',
                      payload: { ...need, active: !need.active },
                    })
                  }
                >
                  {need.active ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => dispatch({ type: 'REMOVE_NEED', payload: need.id })}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NeedForm open={formOpen} onClose={() => setFormOpen(false)} funds={state.funds} dispatch={dispatch} />
    </div>
  );
}

function NeedForm({
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
  const [category, setCategory] = useState('');
  const [recurring, setRecurring] = useState(true);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [dueDate, setDueDate] = useState('');
  const [fundId, setFundId] = useState(funds[0]?.id || 1);
  const [autopay, setAutopay] = useState(false);
  const [notes, setNotes] = useState('');

  const selectedFund = funds.find((f) => f.id === fundId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name || isNaN(amt) || amt <= 0) return;

    dispatch({
      type: 'ADD_NEED',
      payload: {
        id: generateId(),
        name,
        amount: amt,
        category: category || 'general',
        recurring,
        frequency: recurring ? frequency : null,
        due_date: dueDate || null,
        fund_id: fundId,
        fund_name: selectedFund?.name || 'needs',
        autopay,
        notes,
        active: true,
        reapproval_required: false,
      },
    });
    setName('');
    setAmount('');
    setCategory('');
    setNotes('');
    setDueDate('');
    setAutopay(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Need">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent, Netflix, Electricity"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Housing, Utilities, Subscriptions"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRecurring(true)}
            className={`flex-1 py-3 rounded-xl text-base font-semibold border transition-all transform duration-150 active:scale-95 cursor-pointer ${
              recurring
                ? 'bg-brand/10 border-brand/30 text-brand shadow-glow'
                : 'bg-white/[0.02] border-border-subtle text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
            }`}
          >
            Recurring
          </button>
          <button
            type="button"
            onClick={() => setRecurring(false)}
            className={`flex-1 py-3 rounded-xl text-base font-semibold border transition-all transform duration-150 active:scale-95 cursor-pointer ${
              !recurring
                ? 'bg-brand/10 border-brand/30 text-brand shadow-glow'
                : 'bg-white/[0.02] border-border-subtle text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
            }`}
          >
            One-Time
          </button>
        </div>
        {recurring && (
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'monthly' | 'yearly' | 'weekly')}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary outline-none focus:border-brand/50 transition-colors"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">
            {recurring ? 'Next Due Date' : 'Due Date'}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Pay From Fund</label>
          <select
            value={fundId}
            onChange={(e) => setFundId(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary outline-none focus:border-brand/50 transition-colors"
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name.charAt(0).toUpperCase() + f.name.slice(1)} — {formatCurrency(f.balance)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autopay"
            checked={autopay}
            onChange={(e) => setAutopay(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          <label htmlFor="autopay" className="text-base text-txt-primary">
            Autopay enabled
          </label>
        </div>
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Need
          </Button>
        </div>
      </form>
    </Modal>
  );
}
