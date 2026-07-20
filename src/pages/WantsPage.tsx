import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Want } from '../types';
import { formatCurrency, formatDate, generateId, priorityLabels, priorityColors } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';

export default function WantsPage() {
  const { state, dispatch } = useApp();
  const [formOpen, setFormOpen] = useState(false);

  const pending = state.wants.filter((w) => !w.purchased);
  const purchased = state.wants.filter((w) => w.purchased);

  const totalSaved = pending.reduce((s, w) => s + w.current_saved, 0);
  const totalTarget = pending.reduce((s, w) => s + w.target_price, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="text-sm text-txt-secondary uppercase tracking-widest mb-2">
            Total Saved
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-gain min-w-0 break-all">
            {formatCurrency(totalSaved)}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-txt-secondary uppercase tracking-widest mb-2">
            Total Target
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-txt-primary min-w-0 break-all">
            {formatCurrency(totalTarget)}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-txt-primary">
          Pending ({pending.length})
        </h3>
        <Button variant="primary" size="md" onClick={() => setFormOpen(true)}>
          + Add Want
        </Button>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon="☆"
          title="No pending wants"
          description="Add something you're saving for."
          action={{ label: '+ Add Want', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pending.map((w) => (
            <WantCard key={w.id} want={w} dispatch={dispatch} />
          ))}
        </div>
      )}

      {purchased.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-txt-secondary mt-8">
            Purchased ({purchased.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {purchased.map((w) => (
              <WantCard key={w.id} want={w} dispatch={dispatch} />
            ))}
          </div>
        </>
      )}

      <WantForm open={formOpen} onClose={() => setFormOpen(false)} dispatch={dispatch} />
    </div>
  );
}

function WantCard({
  want,
  dispatch,
}: {
  want: Want;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const pct = (want.current_saved / want.target_price) * 100;

  return (
    <Card className={`p-0 overflow-hidden ${want.purchased ? 'opacity-60' : ''}`}>
      {want.photo_url && (
        <div className="h-44 w-full overflow-hidden bg-white/[0.03]">
          <img
            src={want.photo_url}
            alt={want.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h4 className="text-lg font-semibold text-txt-primary truncate">{want.name}</h4>
            <div className="text-sm text-txt-secondary">{want.category}</div>
          </div>
          <Badge color={priorityColors[want.priority]}>
            {priorityLabels[want.priority]}
          </Badge>
        </div>

        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm font-mono text-txt-secondary mb-3">
          <span>{formatCurrency(want.current_saved)}</span>
          <span>{formatCurrency(want.target_price)}</span>
        </div>

        {want.predicted_date && !want.purchased && (
          <div className="text-sm text-txt-secondary mb-3">
            Predicted: <span className="text-brand font-mono">{formatDate(want.predicted_date)}</span>
            {' '}({want.days_to_buy} days)
          </div>
        )}

        {want.notes && (
          <div className="text-sm text-txt-secondary mb-3">{want.notes}</div>
        )}

        <div className="flex gap-2">
          {!want.purchased && (
            <>
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
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
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-border-subtle text-sm text-txt-primary hover:bg-white/[0.1] transition-all text-center"
                >
                  Buy Link
                </a>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dispatch({ type: 'REMOVE_WANT', payload: want.id })}
              >
                ✕
              </Button>
            </>
          )}
          {want.purchased && (
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm text-gain">
                Purchased {want.purchase_date && formatDate(want.purchase_date)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => dispatch({ type: 'REMOVE_WANT', payload: want.id })}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. iPhone 16"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Photo</label>
          <div className="flex items-center gap-3">
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
              className="px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              {photoUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {photoUrl && (
              <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-0 right-0 h-5 w-5 bg-black/60 text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Target Price (₹)</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
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
            placeholder="e.g. electronics, travel"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Priority</label>
          <div className="flex gap-2">
            {([0, 1, 2] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                  priority === p
                    ? `${priorityColors[p]} border-current`
                    : 'bg-white/[0.02] border-border-subtle text-txt-secondary'
                }`}
              >
                {priorityLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Purchase Link</label>
          <input
            value={purchaseLink}
            onChange={(e) => setPurchaseLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
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
            Add Want
          </Button>
        </div>
      </form>
    </Modal>
  );
}
