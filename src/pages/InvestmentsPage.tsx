import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AssetType } from '../types';
import { formatCurrency, formatDate, getROI, generateId, assetTypeLabels } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';

export default function InvestmentsPage() {
  const { state, dispatch } = useApp();
  const [formOpen, setFormOpen] = useState(false);

  const totalInvested = state.investments.reduce((s, i) => s + i.invest_amount, 0);
  const totalCurrent = state.investments.reduce((s, i) => s + i.current_value, 0);
  const totalROI = getROI(totalInvested, totalCurrent);

  const byType = state.investments.reduce(
    (acc, i) => {
      const key = i.asset_type;
      if (!acc[key]) acc[key] = { invested: 0, current: 0 };
      acc[key].invested += i.invest_amount;
      acc[key].current += i.current_value;
      return acc;
    },
    {} as Record<string, { invested: number; current: number }>,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-xs text-txt-secondary mb-1">Total Invested</div>
          <div className="font-mono text-xl font-bold text-txt-primary">
            {formatCurrency(totalInvested)}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-txt-secondary mb-1">Current Value</div>
          <div className="font-mono text-xl font-bold text-txt-primary">
            {formatCurrency(totalCurrent)}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-txt-secondary mb-1">Overall ROI</div>
          <div
            className={`font-mono text-xl font-bold ${totalROI >= 0 ? 'text-gain' : 'text-loss'}`}
          >
            {totalROI >= 0 ? '+' : ''}
            {totalROI.toFixed(1)}%
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-txt-primary mb-4">
            Allocation by Type
          </h3>
          <div className="space-y-3">
            {Object.entries(byType).map(([type, data]) => {
              const roi = getROI(data.invested, data.current);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-primary">
                      {assetTypeLabels[type] || type}
                    </span>
                    <span
                      className={`font-mono ${roi >= 0 ? 'text-gain' : 'text-loss'}`}
                    >
                      {roi >= 0 ? '+' : ''}
                      {roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-txt-secondary font-mono">
                    <span>In: {formatCurrency(data.invested)}</span>
                    <span>•</span>
                    <span>Now: {formatCurrency(data.current)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-txt-primary">Holdings</h3>
            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
              + Add
            </Button>
          </div>
          {state.investments.length === 0 ? (
            <EmptyState
              icon="▲"
              title="No investments"
              description="Track your portfolio here."
            />
          ) : (
            <div className="space-y-3">
              {state.investments.map((inv) => {
                const roi = getROI(inv.invest_amount, inv.current_value);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-txt-primary truncate">{inv.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-txt-secondary">
                        <Badge color="bg-white/5 text-txt-secondary">
                          {assetTypeLabels[inv.asset_type]}
                        </Badge>
                        <span>{formatDate(inv.purchase_date)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="font-mono text-sm text-txt-primary">
                        {formatCurrency(inv.current_value)}
                      </div>
                      <div
                        className={`font-mono text-[10px] ${roi >= 0 ? 'text-gain' : 'text-loss'}`}
                      >
                        {roi >= 0 ? '+' : ''}
                        {roi.toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({ type: 'REMOVE_INVESTMENT', payload: inv.id })
                      }
                      className="text-txt-secondary/40 hover:text-red-400 text-xs ml-3 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <InvestmentForm open={formOpen} onClose={() => setFormOpen(false)} dispatch={dispatch} />
    </div>
  );
}

function InvestmentForm({
  open,
  onClose,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(invested);
    const cur = parseFloat(current);
    if (!name || isNaN(inv) || isNaN(cur)) return;

    dispatch({
      type: 'ADD_INVESTMENT',
      payload: {
        id: generateId(),
        name,
        asset_type: assetType,
        invest_amount: inv,
        current_value: cur,
        purchase_date: date,
        notes,
      },
    });
    setName('');
    setInvested('');
    setCurrent('');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Investment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Reliance Industries"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Asset Type</label>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as AssetType)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50 transition-colors"
          >
            {Object.entries(assetTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Invested (₹)</label>
            <input
              type="number"
              value={invested}
              onChange={(e) => setInvested(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Current (₹)</label>
            <input
              type="number"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Purchase Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50 transition-colors"
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
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Investment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
