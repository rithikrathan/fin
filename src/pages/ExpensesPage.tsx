import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Want } from '../types';
import { formatCurrency, formatDate, generateId, priorityLabels } from '../utils/helpers';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import FloatingAddButton from '../components/shared/FloatingAddButton';
import { Plus, Check, ExternalLink, Sparkles } from 'lucide-react';

export default function ExpensesPage() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Read initial tab from URL query parameter, fallback to 'needs'
  const queryParams = new URLSearchParams(location.search);
  const activeTab = (queryParams.get('tab') as 'needs' | 'wants') || 'needs';

  const [needFormOpen, setNeedFormOpen] = useState(false);
  const [wantFormOpen, setWantFormOpen] = useState(false);
  const [needsSubTab, setNeedsSubTab] = useState<'recurring' | 'onetime'>('recurring');

  // --- Needs Page Calculations & Filters ---
  const recurringNeeds = state.needs.filter((n) => n.recurring && n.active);
  const oneTimeNeeds = state.needs.filter((n) => !n.recurring);
  const recurringMonthlyTotal = recurringNeeds.reduce((s, n) => {
    if (n.frequency === 'monthly') return s + n.amount;
    if (n.frequency === 'weekly') return s + n.amount * 4;
    if (n.frequency === 'yearly') return s + n.amount / 12;
    return s + n.amount;
  }, 0);

  const filteredNeeds = needsSubTab === 'recurring' ? recurringNeeds : oneTimeNeeds;

  // --- Wants Page Calculations & Filters ---
  const pendingWants = state.wants.filter((w) => !w.purchased);
  const purchasedWants = state.wants.filter((w) => w.purchased);
  const wantsTotalSaved = pendingWants.reduce((s, w) => s + w.current_saved, 0);
  const wantsTotalTarget = pendingWants.reduce((s, w) => s + w.target_price, 0);

  const switchTab = (tab: 'needs' | 'wants') => {
    navigate(`?tab=${tab}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      {/* 1. PREMIUM HEADER TAB BAR (No bubble tabs, sliding underline indicator style) */}
      <div className="relative border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex gap-8 relative">
          {(['needs', 'wants'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`py-4 text-base font-black uppercase tracking-wider transition-all relative cursor-pointer outline-none ${
                  isActive
                    ? 'text-brand'
                    : 'text-txt-secondary hover:text-txt-primary'
                }`}
              >
                {tab === 'needs' ? 'Needs (50%)' : 'Wants (20%)'}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand shadow-glow animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Contextual Add Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => (activeTab === 'needs' ? setNeedFormOpen(true) : setWantFormOpen(true))}
          className="hidden lg:flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'needs' ? 'Need' : 'Want'}
        </Button>
      </div>

      {/* --- PANEL A: NEEDS TABS --- */}
      {activeTab === 'needs' && (
        <div className="space-y-6">
          {/* Flattened top summary */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.06] pb-6 gap-2">
            <div className="pr-4">
              <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
                Recurring Monthly Needs
              </div>
              <div className="font-mono text-2xl font-bold text-loss">
                {formatCurrency(recurringMonthlyTotal)}
              </div>
              <div className="text-[10px] text-txt-secondary mt-0.5">
                {recurringNeeds.length} active bills
              </div>
            </div>
            <div className="pl-4">
              <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
                One-Time Needs
              </div>
              <div className="font-mono text-2xl font-bold text-txt-primary">
                {oneTimeNeeds.length} items
              </div>
              <div className="text-[10px] text-txt-secondary mt-0.5">
                {oneTimeNeeds.filter((n) => n.active).length} pending
              </div>
            </div>
          </div>

          {/* Sub Tab Buttons */}
          <div className="flex gap-2 pb-1">
            {(['recurring', 'onetime'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setNeedsSubTab(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  needsSubTab === st
                    ? 'bg-white/5 border-white/10 text-txt-primary'
                    : 'bg-transparent border-transparent text-txt-secondary hover:text-txt-primary'
                }`}
              >
                {st === 'recurring' ? 'Recurring' : 'One-Time'}
              </button>
            ))}
          </div>

          {/* Needs list */}
          {filteredNeeds.length === 0 ? (
            <EmptyState
              icon="▽"
              title={`No ${needsSubTab} needs`}
              description={
                needsSubTab === 'recurring'
                  ? 'Add your recurring bills, rent, subscriptions, etc.'
                  : 'Add one-time purchases or payments you need to make.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredNeeds.map((need) => (
                <div
                  key={need.id}
                  className={`py-4 px-3 rounded-xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    !need.active && need.recurring ? 'opacity-40' : ''
                  }`}
                >
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
                        <span>
                          Due: <span className="text-txt-primary font-medium">{need.due_date}</span>
                        </span>
                      )}
                      <span>
                        Paid from: <span className="text-txt-primary font-medium capitalize">{need.fund_name}</span> fund
                      </span>
                      {need.notes && <span className="italic">“{need.notes}”</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                    <span className="font-mono text-lg font-bold text-txt-primary">
                      {formatCurrency(need.amount)}
                    </span>

                    <div className="flex items-center gap-2">
                      {need.balance_account_id && (
                        <Button
                          size="sm"
                          variant="outlined"
                          onClick={() => navigate(`/balances/${need.balance_account_id}`)}
                          className="text-brand border-brand/30 hover:bg-brand/10 font-semibold"
                        >
                          View Store
                        </Button>
                      )}
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
        </div>
      )}

      {/* --- PANEL B: WANTS TABS --- */}
      {activeTab === 'wants' && (
        <div className="space-y-6">
          {/* Flattened top summary */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.06] pb-6 gap-2">
            <div className="pr-4">
              <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
                Total Saved
              </div>
              <div className="font-mono text-2xl font-bold text-gain">
                {formatCurrency(wantsTotalSaved)}
              </div>
            </div>
            <div className="pl-4">
              <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
                Total Target
              </div>
              <div className="font-mono text-2xl font-bold text-txt-primary">
                {formatCurrency(wantsTotalTarget)}
              </div>
            </div>
          </div>

          <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">
            Pending wants ({pendingWants.length})
          </h3>

          {pendingWants.length === 0 ? (
            <EmptyState
              icon="☆"
              title="No pending wants"
              description="Add something you're saving for."
            />
          ) : (
            <div className="space-y-3">
              {pendingWants.map((w) => (
                <WantRow key={w.id} want={w} dispatch={dispatch} />
              ))}
            </div>
          )}

          {purchasedWants.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.06]">
                Purchased ({purchasedWants.length})
              </h3>
              <div className="space-y-3">
                {purchasedWants.map((w) => (
                  <WantRow key={w.id} want={w} dispatch={dispatch} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Mobile Contextual FAB */}
      <FloatingAddButton
        onClick={() => (activeTab === 'needs' ? setNeedFormOpen(true) : setWantFormOpen(true))}
      />

      {/* Form Modals */}
      <NeedForm open={needFormOpen} onClose={() => setNeedFormOpen(false)} funds={state.funds} dispatch={dispatch} />
      <WantForm open={wantFormOpen} onClose={() => setWantFormOpen(false)} dispatch={dispatch} />
    </div>
  );
}

// Subcomponents: WantRow
function WantRow({
  want,
  dispatch,
}: {
  want: Want;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const pct = want.target_price > 0 ? (want.current_saved / want.target_price) * 100 : 0;

  return (
    <div
      className={`py-5 px-3 rounded-xl bg-white/[0.03] flex flex-col md:flex-row md:items-center gap-4 ${
        want.purchased ? 'opacity-50' : ''
      }`}
    >
      {want.photo_url && (
        <div className="h-16 w-16 rounded-xl overflow-hidden bg-white/[0.03] shrink-0 border border-white/[0.06]">
          <img src={want.photo_url} alt={want.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-bold text-txt-primary truncate">{want.name}</h4>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-txt-secondary">
            {want.category}
          </span>
          <span
            className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${
              want.priority === 2
                ? 'text-red-400 border-red-500/20'
                : want.priority === 1
                ? 'text-amber-400 border-amber-500/20'
                : 'text-blue-400 border-blue-500/20'
            }`}
          >
            {priorityLabels[want.priority]}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 max-w-md h-1.5 bg-white/[0.06] rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-txt-secondary">
            <span className="text-txt-primary font-bold">{formatCurrency(want.current_saved)}</span>
            <span>/</span>
            <span>{formatCurrency(want.target_price)}</span>
            <span className="text-[10px] text-brand font-semibold">({pct.toFixed(0)}%)</span>
          </div>
        </div>

        {want.predicted_date && !want.purchased && (
          <div className="text-xs text-txt-secondary flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            Expected purchase window: <span className="text-brand font-mono font-semibold">{formatDate(want.predicted_date)}</span> ({want.days_to_buy} days)
          </div>
        )}

        {want.notes && <p className="text-xs text-txt-secondary truncate max-w-2xl">{want.notes}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0 md:self-center">
        {!want.purchased && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                dispatch({
                  type: 'UPDATE_WANT',
                  payload: {
                    ...want,
                    purchased: true,
                    purchase_date: new Date().toISOString().split('T')[0]
                  }
                })
              }
            >
              Purchase
            </Button>
            {want.purchase_link && (
              <a
                href={want.purchase_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-txt-primary hover:bg-white/[0.04] transition-all text-center flex items-center gap-1"
              >
                Buy <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Button
              size="sm"
              variant="outlined"
              onClick={() => dispatch({ type: 'REMOVE_WANT', payload: want.id })}
              className="hover:text-red-400 hover:border-red-500/20"
            >
              ✕
            </Button>
          </>
        )}
        {want.purchased && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gain font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {want.purchase_date && formatDate(want.purchase_date)}
            </span>
            <Button
              size="sm"
              variant="outlined"
              onClick={() => dispatch({ type: 'REMOVE_WANT', payload: want.id })}
              className="hover:text-red-400 hover:border-red-500/20"
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponents: NeedForm
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
            required
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
            required
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
            Autopay enabled (marks automatically paid on due date)
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

// Subcomponents: WantForm
function WantForm({
  open,
  onClose,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<0 | 1 | 2>(1);
  const [notes, setNotes] = useState('');
  const [purchaseLink, setPurchaseLink] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = parseFloat(target);
    if (!name || isNaN(tgt) || tgt <= 0) return;

    dispatch({
      type: 'ADD_WANT',
      payload: {
        id: generateId(),
        name,
        target_price: tgt,
        current_saved: 0,
        category: category || 'general',
        priority,
        purchased: false,
        purchase_date: null,
        notes,
        days_to_buy: null,
        predicted_date: null,
        photo_url: photoUrl,
        purchase_link: purchaseLink || null,
        added_at: new Date().toISOString(),
        no_lock: false,
      },
    });
    setName('');
    setTarget('');
    setCategory('');
    setPriority(1);
    setNotes('');
    setPurchaseLink('');
    setPhotoUrl(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Want">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. iPhone 16"
            required
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Photo</label>
          <div className="flex items-center gap-3 pt-1">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-white/20 text-xs font-semibold text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              {photoUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {photoUrl && (
              <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/10">
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-0 right-0 h-5 w-5 bg-black/60 text-white text-[10px] flex items-center justify-center cursor-pointer hover:bg-red-500"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Target Price (₹)</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0"
            min="0"
            required
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. electronics, travel"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1.5">Priority</label>
          <div className="flex gap-2">
            {([0, 1, 2] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  priority === p
                    ? 'bg-brand/10 text-brand border-brand/20'
                    : 'bg-white/[0.01] border-white/10 text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                }`}
              >
                {priorityLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Purchase Link</label>
          <input
            value={purchaseLink}
            onChange={(e) => setPurchaseLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
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
            Add Want
          </Button>
        </div>
      </form>
    </Modal>
  );
}
