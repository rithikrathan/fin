import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Want } from '../types';
import { formatCurrency, formatDate, generateId, priorityLabels } from '../utils/helpers';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import FloatingAddButton from '../components/shared/FloatingAddButton';

export default function WantsPage() {
    const { state, dispatch } = useApp();
    const [formOpen, setFormOpen] = useState(false);

    const pending = state.wants.filter((w) => !w.purchased);
    const purchased = state.wants.filter((w) => w.purchased);

    const totalSaved = pending.reduce((s, w) => s + w.current_saved, 0);
    const totalTarget = pending.reduce((s, w) => s + w.target_price, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Flattened top summary */}
            <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.06] pb-6 gap-2">
                <div className="pr-4">
                    <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
                        Total Saved
                    </div>
                    <div className="font-mono text-2xl font-bold text-gain">
                        {formatCurrency(totalSaved)}
                    </div>
                </div>
                <div className="pl-4">
                    <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
                        Total Target
                    </div>
                    <div className="font-mono text-2xl font-bold text-txt-primary">
                        {formatCurrency(totalTarget)}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">
                    Pending wants ({pending.length})
                </h3>
                <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} className="hidden lg:flex">
                    + Add Want
                </Button>
            </div>

            {pending.length === 0 ? (
                <EmptyState
                    icon="☆"
                    title="No pending wants"
                    description="Add something you're saving for."
                />
            ) : (
                <div className="space-y-3">
                    {pending.map((w) => (
                        <WantRow key={w.id} want={w} dispatch={dispatch} />
                    ))}
                </div>
            )}

            {purchased.length > 0 && (
                <div className="space-y-4 pt-4">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.06]">
                        Purchased ({purchased.length})
                    </h3>
                    <div className="space-y-3">
                        {purchased.map((w) => (
                            <WantRow key={w.id} want={w} dispatch={dispatch} />
                        ))}
                    </div>
                </div>
            )}

            <WantForm open={formOpen} onClose={() => setFormOpen(false)} dispatch={dispatch} />
            <FloatingAddButton onClick={() => setFormOpen(true)} />
        </div>
    );
}

function WantRow({
    want,
    dispatch,
}: {
    want: Want;
    dispatch: React.Dispatch<import('../types').AppAction>;
}) {
    const pct = want.target_price > 0 ? (want.current_saved / want.target_price) * 100 : 0;

    return (
        <div className={`py-5 px-3 rounded-xl bg-white/[0.03] flex flex-col md:flex-row md:items-center gap-4 ${want.purchased ? 'opacity-50' : ''}`}>
            {want.photo_url && (
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-white/[0.03] shrink-0 border border-white/[0.06]">
                    <img
                        src={want.photo_url}
                        alt={want.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-txt-primary truncate">{want.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-txt-secondary">
                        {want.category}
                    </span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${want.priority === 2 ? 'text-red-400 border-red-500/20' : want.priority === 1 ? 'text-amber-400 border-amber-500/20' : 'text-blue-400 border-blue-500/20'
                        }`}>
                        {priorityLabels[want.priority]}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 max-w-md h-1.5 bg-white/[0.06] rounded-full overflow-hidden shrink-0">
                        <div
                            className="h-full bg-brand rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-txt-secondary">
                        <span className="text-txt-primary font-bold">{formatCurrency(want.current_saved)}</span>
                        <span>/</span>
                        <span>{formatCurrency(want.target_price)}</span>
                        <span className="text-[10px] text-brand font-semibold">({pct.toFixed(0)}%)</span>
                    </div>
                </div>

                {want.predicted_date && !want.purchased && (
                    <div className="text-xs text-txt-secondary">
                        Expected purchase window: <span className="text-brand font-mono font-semibold">{formatDate(want.predicted_date)}</span> ({want.days_to_buy} days)
                    </div>
                )}

                {want.notes && (
                    <p className="text-xs text-txt-secondary truncate max-w-2xl">{want.notes}</p>
                )}
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
                                    payload: { ...want, purchased: true, purchase_date: new Date().toISOString().split('T')[0] },
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
                                className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-txt-primary hover:bg-white/[0.04] transition-all text-center"
                            >
                                Buy
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
                        <span className="text-xs text-gain font-mono">
                            ✓ {want.purchase_date && formatDate(want.purchase_date)}
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
                        className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs text-txt-secondary mb-1">Photo</label>
                    <div className="flex items-center gap-3 pt-1">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhoto}
                            className="hidden"
                        />
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
