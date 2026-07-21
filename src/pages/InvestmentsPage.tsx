import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AssetType } from '../types';
import { formatCurrency, formatDate, getROI, generateId, assetTypeLabels } from '../utils/helpers';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import FloatingAddButton from '../components/shared/FloatingAddButton';

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
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Flattened top summary */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06] pb-6 text-center sm:text-left gap-2">
        <div className="pr-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Total Invested</div>
          <div className="font-mono text-xl font-bold text-txt-primary">
            {formatCurrency(totalInvested)}
          </div>
        </div>
        <div className="px-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Current Value</div>
          <div className="font-mono text-xl font-bold text-txt-primary">
            {formatCurrency(totalCurrent)}
          </div>
        </div>
        <div className="pl-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Overall ROI</div>
          <div
            className={`font-mono text-xl font-bold ${totalROI >= 0 ? 'text-gain' : 'text-loss'}`}
          >
            {totalROI >= 0 ? '+' : ''}
            {totalROI.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Allocation */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.06]">
            Allocation by Asset Type
          </h3>
          <div className="space-y-3">
            {Object.entries(byType).map(([type, data]) => {
              const roi = getROI(data.invested, data.current);
              return (
                <div key={type} className="py-3 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-txt-primary">
                      {assetTypeLabels[type] || type}
                    </span>
                    <div className="flex gap-2 text-[10px] text-txt-secondary font-mono mt-0.5">
                      <span>Invested: {formatCurrency(data.invested)}</span>
                      <span>·</span>
                      <span>Valued: {formatCurrency(data.current)}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold ${roi >= 0 ? 'text-gain' : 'text-loss'}`}
                  >
                    {roi >= 0 ? '+' : ''}
                    {roi.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Holdings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
            <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">Holdings List</h3>
            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} className="hidden lg:flex">
              + Add holding
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
                    className="py-3 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-txt-primary truncate">{inv.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-txt-secondary mt-0.5">
                        <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-txt-secondary font-mono">
                          {assetTypeLabels[inv.asset_type]}
                        </span>
                        <span>{formatDate(inv.purchase_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-txt-primary">
                          {formatCurrency(inv.current_value)}
                        </div>
                        <div
                          className={`font-mono text-[10px] font-semibold ${roi >= 0 ? 'text-gain' : 'text-loss'}`}
                        >
                          {roi >= 0 ? '+' : ''}
                          {roi.toFixed(1)}%
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          dispatch({ type: 'REMOVE_INVESTMENT', payload: inv.id })
                        }
                        className="text-txt-secondary/40 hover:text-red-400 text-xs ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <InvestmentForm open={formOpen} onClose={() => setFormOpen(false)} dispatch={dispatch} />
      <FloatingAddButton onClick={() => setFormOpen(true)} />
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Reliance Industries, Parag Parikh Mutual Fund"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1.5">Asset Type</label>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as AssetType)}
            className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors"
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
            <label className="block text-xs text-txt-secondary mb-1">Invested Amount (₹)</label>
            <input
              type="number"
              value={invested}
              onChange={(e) => setInvested(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Current Valuation (₹)</label>
            <input
              type="number"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1.5">Purchase Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors font-mono"
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
            Add Investment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
