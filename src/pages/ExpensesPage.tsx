import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Want } from '../types';
import { formatCurrency, formatDate, generateId, priorityLabels, round2 } from '../utils/helpers';
import { showToast } from '../utils/toast';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import Select from '../components/shared/Select';
import FloatingAddButton from '../components/shared/FloatingAddButton';
import { Plus, Check, ExternalLink, Sparkles, ArrowLeftRight, ReceiptText, ShoppingBag } from 'lucide-react';

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
    const [addMoneyWant, setAddMoneyWant] = useState<Want | null>(null);
    const [editingNeed, setEditingNeed] = useState<import('../types').Need | null>(null);

    const openNeedForm = (need: import('../types').Need | null) => {
        setEditingNeed(need);
        setNeedFormOpen(true);
    };

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

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-24">
            {/* Page Title Header */}
            <div className="border-b border-white/[0.06] pb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-txt-primary capitalize">{activeTab}</h1>
                    <p className="text-xs text-txt-secondary mt-0.5">
                        {activeTab === 'needs' ? 'Manage recurring obligations & fixed bills' : 'Wishlist items & purchase prediction tracking'}
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => (activeTab === 'needs' ? openNeedForm(null) : setWantFormOpen(true))}
                    className="hidden lg:flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" />
                    Add {activeTab === 'needs' ? 'Need' : 'Want'}
                </Button>
            </div>

            {/* --- PANEL A: NEEDS TABS --- */}
            {activeTab === 'needs' && (
                <div key="needs" className="space-y-6 animate-slide-up-scale">
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${needsSubTab === st
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
                            icon={<ReceiptText className="w-8 h-8 text-brand" />}
                            title={`No ${needsSubTab} needs`}
                            description={
                                needsSubTab === 'recurring'
                                    ? 'Add your recurring bills, rent, subscriptions, etc.'
                                    : 'Add one-time purchases or payments you need to make.'
                            }
                            action={{ label: 'Add Need', onClick: () => openNeedForm(null) }}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filteredNeeds.map((need) => (
                                <div
                                    key={need.id}
                                    className={`py-4 px-3 rounded-xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${!need.active && need.recurring ? 'opacity-40' : ''
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
                                            {need.paid && (
                                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                                    Paid{need.paid_date ? ` ${need.paid_date}` : ''}
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
                                            {!need.balance_account_id && !need.paid && (
                                                <Button
                                                    size="sm"
                                                    variant="outlined"
                                                    className="text-gain border-green-500/30 hover:bg-green-500/10 font-semibold"
                                                    onClick={() => {
                                                        const fund = state.funds.find((f) => f.id === need.fund_id);
                                                        if (fund && fund.balance < need.amount) {
                                                            showToast(`Insufficient ${fund.name} balance`);
                                                            return;
                                                        }
                                                        dispatch({ type: 'MARK_NEED_PAID', payload: need.id });
                                                    }}
                                                >
                                                    Mark Paid
                                                </Button>
                                            )}
                                            {!need.balance_account_id && (
                                                <Button
                                                    size="sm"
                                                    variant="outlined"
                                                    onClick={() => openNeedForm(need)}
                                                >
                                                    Edit
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
                <div key="wants" className="space-y-6 animate-slide-up-scale">
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
                            icon={<ShoppingBag className="w-8 h-8 text-brand" />}
                            title="No pending wants"
                            description="Add something you're saving for."
                            action={{ label: 'Add Want', onClick: () => setWantFormOpen(true) }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {pendingWants.map((w) => (
                                <WantCard key={w.id} want={w} funds={state.funds} impulseTaxPct={state.settings.impulse_tax_pct} dispatch={dispatch} onAddMoney={setAddMoneyWant} />
                            ))}
                        </div>
                    )}

                    {purchasedWants.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.06]">
                                Purchased ({purchasedWants.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {purchasedWants.map((w) => (
                                    <WantCard key={w.id} want={w} funds={state.funds} impulseTaxPct={state.settings.impulse_tax_pct} dispatch={dispatch} onAddMoney={setAddMoneyWant} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Mobile Contextual FAB */}
            <FloatingAddButton
                onClick={() => (activeTab === 'needs' ? openNeedForm(null) : setWantFormOpen(true))}
            />

            {/* Left-Side Viewport Category Selector Dropdown (Rendered in top-level body portal at same level as FAB) */}
            <CategoryDropdownPortal activeTab={activeTab} navigate={navigate} />

            {/* Form Modals */}
            <NeedForm
                open={needFormOpen}
                onClose={() => { setEditingNeed(null); setNeedFormOpen(false); }}
                editing={editingNeed}
                funds={state.funds}
                dispatch={dispatch}
            />
            <WantForm open={wantFormOpen} onClose={() => setWantFormOpen(false)} dispatch={dispatch} />
            {addMoneyWant && (
                <AddWantMoneyModal
                    want={addMoneyWant}
                    funds={state.funds}
                    onClose={() => setAddMoneyWant(null)}
                    dispatch={dispatch}
                />
            )}
        </div>
    );
}

function CategoryDropdownPortal({ activeTab, navigate }: { activeTab: 'needs' | 'wants'; navigate: (path: string) => void }) {
    const targetTab = activeTab === 'needs' ? 'wants' : 'needs';

    return createPortal(
        <div className="fab-container fixed left-4 bottom-[calc(84px+env(safe-area-inset-bottom,8px))] z-50 lg:hidden">
            <button
                onClick={() => navigate(`/expenses?tab=${targetTab}`)}
                className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#121212]/95 border border-brand/60 text-txt-primary shadow-[0_0_18px_rgba(255,42,42,0.35),inset_0_0_10px_rgba(255,42,42,0.15)] hover:shadow-[0_0_24px_rgba(255,42,42,0.5),inset_0_0_14px_rgba(255,42,42,0.25)] hover:border-brand active:scale-95 transition-all duration-300 ease-out backdrop-blur-md cursor-pointer select-none font-bold text-[11px]"
            >
                <ArrowLeftRight className={`w-3.5 h-3.5 text-brand transition-transform duration-500 ease-out group-hover:scale-125 ${activeTab === 'wants' ? 'rotate-180' : 'rotate-0'}`} />
                <span className="capitalize text-txt-primary font-bold tracking-wide transition-opacity duration-300">
                    To {targetTab}
                </span>
            </button>
        </div>,
        document.body
    );
}

// Subcomponents: WantCard (Restored v1.1.2 Card Style)
function WantCard({
    want,
    funds,
    impulseTaxPct,
    dispatch,
    onAddMoney,
}: {
    want: Want;
    funds: import('../types').Fund[];
    impulseTaxPct: number;
    dispatch: React.Dispatch<import('../types').AppAction>;
    onAddMoney: (want: Want) => void;
}) {
    const pct = want.target_price > 0 ? (want.current_saved / want.target_price) * 100 : 0;
    const tax = want.include_impulse_tax
        ? round2((want.target_price * (impulseTaxPct || 0)) / 100)
        : 0;

    const handlePurchase = () => {
        const wantsFund = funds.find((f) => f.name.toLowerCase() === 'wants') || funds[0];
        if (!wantsFund) {
            showToast('No fund available to pay from');
            return;
        }
        const total = want.include_impulse_tax
            ? round2(want.target_price + (want.target_price * (impulseTaxPct || 0)) / 100)
            : want.target_price;
        if (wantsFund.balance < total) {
            showToast(`Insufficient ${wantsFund.name} balance`);
            return;
        }
        dispatch({ type: 'PURCHASE_WANT', payload: want.id });
        showToast(`${want.name} purchased`);
    };

    return (
        <div className={`rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden flex flex-col justify-between transition-all hover:border-white/20 ${want.purchased ? 'opacity-60' : ''}`}>
            {want.photo_url && (
                <div className="h-44 w-full overflow-hidden bg-white/[0.03] border-b border-white/[0.06]">
                    <img src={want.photo_url} alt={want.name} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-txt-primary truncate">{want.name}</h4>
                        <span
                            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shrink-0 border border-white/10 ${want.priority === 2
                                ? 'text-red-400 border-red-500/20 bg-red-500/10'
                                : want.priority === 1
                                    ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                                    : 'text-blue-400 border-blue-500/20 bg-blue-500/10'
                                }`}
                        >
                            {priorityLabels[want.priority]}
                        </span>
                    </div>

                    <div className="text-xs text-txt-secondary uppercase tracking-wider font-semibold">
                        {want.category}
                    </div>

                    {want.notes && <p className="text-xs text-txt-secondary/80 line-clamp-2">{want.notes}</p>}
                </div>

                <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-txt-secondary">Saved / Target</span>
                            <span className="text-txt-primary font-bold">
                                {formatCurrency(want.current_saved)} / {formatCurrency(want.target_price)}
                                {tax > 0 && <span className="text-amber-400"> +{formatCurrency(tax)}</span>}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand rounded-full transition-all"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                        </div>
                        <div className="text-right text-[10px] font-mono text-brand font-bold">
                            {pct.toFixed(0)}% Saved
                        </div>
                    </div>

                    {want.include_impulse_tax && !want.purchased && (
                        <div className="text-[10px] text-amber-400/80 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>Includes {impulseTaxPct}% impulse tax on purchase (+{formatCurrency(tax)})</span>
                        </div>
                    )}

                    {want.predicted_date && !want.purchased && (
                        <div className="text-xs text-txt-secondary flex items-center gap-1.5 pt-1 border-t border-white/[0.04]">
                            <Sparkles className="w-3.5 h-3.5 text-brand shrink-0" />
                            <span>
                                Target: <span className="text-brand font-mono font-semibold">{formatDate(want.predicted_date)}</span> ({want.days_to_buy} days)
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                        {!want.purchased && (
                            <>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={handlePurchase}
                                    className="flex-1 justify-center"
                                >
                                    Purchase
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outlined"
                                    onClick={() => onAddMoney(want)}
                                    className="shrink-0"
                                    title="Add money toward this want"
                                >
                                    + Money
                                </Button>
                                {want.purchase_link && (
                                    <a
                                        href={want.purchase_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-txt-primary hover:bg-white/[0.04] transition-all text-center flex items-center gap-1 shrink-0"
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
                            <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-gain font-mono flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    Bought {want.purchase_date && formatDate(want.purchase_date)}
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
            </div>
        </div>
    );
}

// Subcomponents: NeedForm
function NeedForm({
    open,
    onClose,
    editing,
    funds,
    dispatch,
}: {
    open: boolean;
    onClose: () => void;
    editing: import('../types').Need | null;
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
    const [recurringDay, setRecurringDay] = useState('');
    const [notes, setNotes] = useState('');

    const selectedFund = funds.find((f) => f.id === fundId);

    useEffect(() => {
        if (open) {
            setName(editing?.name || '');
            setAmount(editing ? String(editing.amount) : '');
            setCategory(editing?.category || '');
            setRecurring(editing ? editing.recurring : true);
            setFrequency((editing?.frequency as any) || 'monthly');
            setDueDate(editing?.due_date || '');
            setFundId(editing?.fund_id || funds[0]?.id || 1);
            setAutopay(editing?.autopay || false);
            setRecurringDay(editing?.recurring_day ? String(editing.recurring_day) : '');
            setNotes(editing?.notes || '');
        }
    }, [open, editing, funds]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!name || isNaN(amt) || amt <= 0) return;

        if (editing) {
            dispatch({
                type: 'UPDATE_NEED',
                payload: {
                    ...editing,
                    name,
                    amount: amt,
                    category: category || 'general',
                    recurring,
                    frequency: recurring ? frequency : null,
                    due_date: dueDate || null,
                    fund_id: fundId,
                    fund_name: selectedFund?.name || editing.fund_name,
                    autopay,
                    notes,
                    active: editing.active,
                    reapproval_required: editing.reapproval_required,
                    recurring_day: recurring && recurringDay ? parseInt(recurringDay) : null,
                },
            });
        } else {
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
                    paid: false,
                    paid_date: null,
                    recurring_day: recurring && recurringDay ? parseInt(recurringDay) : null,
                },
            });
        }
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title={editing ? 'Edit Need' : 'Add Need'}>
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
                            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${recurring
                                ? 'bg-brand/10 border-brand/20 text-brand'
                                : 'bg-white/[0.01] border-white/10 text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                                }`}
                        >
                            Recurring Bill
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecurring(false)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${!recurring
                                ? 'bg-brand/10 border-brand/20 text-brand'
                                : 'bg-white/[0.01] border-white/10 text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                                }`}
                        >
                            One-Time Need
                        </button>
                    </div>
                </div>

                {recurring && (
                    <div className="flex items-center justify-between gap-3">
                        <label className="text-xs text-txt-secondary font-medium shrink-0">Frequency</label>
                        <Select
                            value={frequency}
                            onChange={(val) => setFrequency(val as any)}
                            options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'yearly', label: 'Yearly' },
                            ]}
                            buttonClassName="py-2 text-sm font-medium"
                        />
                    </div>
                )}

                {recurring && frequency === 'monthly' && (
                    <div>
                        <label className="block text-xs text-txt-secondary mb-1">Billing Day of Month</label>
                        <input
                            type="number"
                            value={recurringDay}
                            onChange={(e) => setRecurringDay(e.target.value)}
                            placeholder="e.g. 3 (every month at the 3rd)"
                            min="1"
                            max="31"
                            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors"
                        />
                        <p className="text-xs text-txt-secondary mt-1">
                            The due date advances to this day each cycle (months without it use the last day).
                        </p>
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

                <div className="flex items-center justify-between gap-3">
                    <label className="text-xs text-txt-secondary font-medium shrink-0">Pay From Fund</label>
                    <Select
                        value={fundId}
                        onChange={(val) => setFundId(val)}
                        options={funds.map((f) => ({
                            value: f.id,
                            label: `${f.name.toUpperCase()} (₹${f.balance.toLocaleString('en-IN')})`,
                        }))}
                        buttonClassName="py-2 text-sm font-medium"
                    />
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
                        {editing ? 'Save Changes' : 'Add Need'}
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
    const [includeImpulseTax, setIncludeImpulseTax] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const { state } = useApp();

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
                include_impulse_tax: includeImpulseTax,
            },
        });
        setName('');
        setTarget('');
        setCategory('');
        setPriority(1);
        setNotes('');
        setPurchaseLink('');
        setPhotoUrl(null);
        setIncludeImpulseTax(false);
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
                                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${priority === p
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

                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={includeImpulseTax}
                        onChange={(e) => setIncludeImpulseTax(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-brand cursor-pointer"
                    />
                    <span>
                        <span className="block text-sm text-txt-primary font-medium">
                            Add impulse tax on purchase
                        </span>
                        <span className="block text-xs text-txt-secondary mt-0.5">
                            {state.settings.impulse_tax_pct}% of target is charged as extra when buying
                        </span>
                    </span>
                </label>

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

// Subcomponents: AddWantMoneyModal
function AddWantMoneyModal({
    want,
    funds,
    onClose,
    dispatch,
}: {
    want: Want;
    funds: import('../types').Fund[];
    onClose: () => void;
    dispatch: React.Dispatch<import('../types').AppAction>;
}) {
    const wantsFund = funds.find((f) => f.name.toLowerCase() === 'wants');
    const sourceFunds = funds.filter((f) => f.id !== wantsFund?.id);
    const [fundId, setFundId] = useState(sourceFunds[0]?.id || funds[0]?.id || 1);
    const [amount, setAmount] = useState('');

    const selectedFund = funds.find((f) => f.id === fundId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = round2(parseFloat(amount) || 0);
        if (amt <= 0) {
            showToast('Enter a valid amount');
            return;
        }
        if (!wantsFund) {
            showToast('No wants fund available');
            return;
        }
        if (selectedFund && selectedFund.balance < amt) {
            showToast(`Insufficient balance in ${selectedFund.name}`);
            return;
        }
        dispatch({
            type: 'ADD_WANT_SAVINGS',
            payload: { want_id: want.id, amount: amt, from_fund_id: fundId },
        });
        showToast(`Added ${formatCurrency(amt)} toward ${want.name}`);
        onClose();
    };

    return (
        <Modal open onClose={onClose} title={`Add Money — ${want.name}`}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-txt-secondary">Saved / Target</span>
                    <span className="font-mono font-bold text-txt-primary">
                        {formatCurrency(want.current_saved)} / {formatCurrency(want.target_price)}
                    </span>
                </div>

                <div>
                    <label className="block text-xs text-txt-secondary mb-1">Transfer From</label>
                    <select
                        value={fundId}
                        onChange={(e) => setFundId(parseInt(e.target.value))}
                        className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors cursor-pointer"
                    >
                        {sourceFunds.map((f) => (
                            <option key={f.id} value={f.id} className="bg-[#18181B]">
                                {f.name} ({formatCurrency(f.balance)})
                            </option>
                        ))}
                    </select>
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
                        autoFocus
                        className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
                    />
                </div>

                {wantsFund && (
                    <p className="text-xs text-txt-secondary">
                        Will be added to <span className="text-txt-primary font-semibold">{wantsFund.name}</span> fund balance and marked as saved.
                    </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                        Add Money
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
