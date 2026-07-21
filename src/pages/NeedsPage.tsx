import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateId } from '../utils/helpers';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import FloatingAddButton from '../components/shared/FloatingAddButton';

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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Flattened top summary */}
      <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.06] pb-6 gap-2">
        <div className="pr-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
            Recurring Monthly
          </div>
          <div className="font-mono text-2xl font-bold text-loss">
            {formatCurrency(monthlyTotal)}
          </div>
          <div className="text-[10px] text-txt-secondary mt-0.5">
            {recurring.length} active bills
          </div>
        </div>
        <div className="pl-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
            One-Time Needs
          </div>
          <div className="font-mono text-2xl font-bold text-txt-primary">
            {oneTime.length} items
          </div>
          <div className="text-[10px] text-txt-secondary mt-0.5">
            {oneTime.filter((n) => n.active).length} pending
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-px">
        <div className="flex gap-2">
          {(['recurring', 'onetime'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold transition-all relative cursor-pointer ${
                tab === t ? 'text-brand font-bold' : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              {t === 'recurring' ? 'Recurring' : 'One-Time'}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand shadow-glow animate-fadeIn" />
              )}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} className="hidden lg:flex">
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
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((need) => (
            <div key={need.id} className={`py-4 px-3 rounded-xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!need.active && need.recurring ? 'opacity-40' : ''}`}>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-bold text-txt-primary truncate">{need.name}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-txt-secondary">
                    {need.category}
                  </span>
                  {need.autopay && (
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Autopay
                    </span>
                  )}
                  {need.recurring && need.frequency && (
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {need.frequency}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-txt-secondary">
                  {need.due_date && (
                    <span>Due: <span className="text-txt-primary font-medium">{need.due_date}</span></span>
                  )}
                  <span>Paid from: <span className="text-txt-primary font-medium capitalize">{need.fund_name}</span> fund</span>
                  {need.notes && <span className="italic">“{need.notes}”</span>}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                <span className="font-mono text-lg font-bold text-txt-primary">
                  {formatCurrency(need.amount)}
                </span>
                
                <div className="flex items-center gap-2">
                  {need.recurring && (
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={() =>
                        dispatch({
                          type: 'UPDATE_NEED',
                          payload: { ...need, active: !need.active },
                        })
                      }
                    >
                      {need.active ? 'Pause' : 'Resume'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={() => dispatch({ type: 'REMOVE_NEED', payload: need.id })}
                    className="hover:text-red-400 hover:border-red-500/20"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NeedForm open={formOpen} onClose={() => setFormOpen(false)} funds={state.funds} dispatch={dispatch} />
      <FloatingAddButton onClick={() => setFormOpen(true)} />
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent, Netflix, Electricity"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
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
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Housing, Utilities, Subscriptions"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1.5">Intent Type</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecurring(true)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                recurring
                  ? 'bg-brand/10 border-brand/20 text-brand'
                  : 'bg-white/[0.01] border-white/10 text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
              }`}
            >
              Recurring Bill
            </button>
            <button
              type="button"
              onClick={() => setRecurring(false)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                !recurring
                  ? 'bg-brand/10 border-brand/20 text-brand'
                  : 'bg-white/[0.01] border-white/10 text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
              }`}
            >
              One-Time Need
            </button>
          </div>
        </div>

        {recurring && (
          <div>
            <label className="block text-xs text-txt-secondary mb-1.5">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-txt-secondary mb-1.5">
            {recurring ? 'Next Due Date' : 'Due Date'}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1.5">Pay From Fund</label>
          <select
            value={fundId}
            onChange={(e) => setFundId(Number(e.target.value))}
            className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors"
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name.toUpperCase()} (₹{f.balance.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="autopay"
            checked={autopay}
            onChange={(e) => setAutopay(e.target.checked)}
            className="h-4.5 w-4.5 accent-brand"
          />
          <label htmlFor="autopay" className="text-sm font-semibold text-txt-primary select-none cursor-pointer">
            Autopay enabled (marks as automatically paid on due date)
          </label>
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
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
