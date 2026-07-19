import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, round2 } from '../../utils/helpers';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  sourceFundId: number;
}

export default function SurplusRedistributeModal({ open, onClose, sourceFundId }: Props) {
  const { state, dispatch } = useApp();
  const [selectedSourceId, setSelectedSourceId] = useState(sourceFundId);
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedSourceId(sourceFundId);
      setAllocations({});
    }
  }, [open, sourceFundId]);

  const sourceFund = state.funds.find((f) => f.id === selectedSourceId);
  if (!sourceFund) return null;

  const surplus = sourceFund.balance;
  const destFunds = state.funds.filter((f) => f.id !== selectedSourceId);
  const totalAlloc = Object.entries(allocations).reduce(
    (s, [, v]) => s + (parseFloat(v) || 0), 0
  );
  const valid = totalAlloc > 0 && round2(totalAlloc) <= round2(surplus);

  const updateAlloc = (fundId: number, value: string) => {
    setAllocations((prev) => ({ ...prev, [fundId]: value }));
  };

  const redistribute = () => {
    if (!valid) return;
    const transfers = Object.entries(allocations)
      .map(([fundId, val]) => ({
        from_fund_id: selectedSourceId,
        to_fund_id: Number(fundId),
        amount: round2(parseFloat(val) || 0),
      }))
      .filter((t) => t.amount > 0);

    if (transfers.length === 0) return;

    dispatch({ type: 'REDISTRIBUTE_SURPLUS', payload: { transfers } });
    setAllocations({});
    setToast('Surplus redistributed');
    setTimeout(() => { setToast(''); onClose(); }, 1000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Redistribute Surplus">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Redistribute from</label>
          <select
            value={selectedSourceId}
            onChange={(e) => { setSelectedSourceId(Number(e.target.value)); setAllocations({}); }}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50 transition-colors"
          >
            {state.funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name.charAt(0).toUpperCase() + f.name.slice(1)} — {formatCurrency(f.balance)}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white/[0.03] rounded-lg p-3 text-sm text-txt-secondary">
          <div className="flex justify-between mb-1">
            <span>Available to redistribute</span>
            <span className="font-mono text-gain font-semibold">{formatCurrency(surplus)}</span>
          </div>
        </div>

        {surplus <= 0 ? (
          <div className="text-sm text-txt-secondary py-4 text-center">
            This fund has no balance to redistribute.
          </div>
        ) : (
          <>
            <div className="text-xs text-txt-secondary">
              Split the balance across other funds:
            </div>

            {destFunds.map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 w-1/2">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                  <span className="text-sm text-txt-primary truncate">{f.name}</span>
                  <span className="text-xs text-txt-secondary shrink-0">{formatCurrency(f.balance)}</span>
                </div>
                <input
                  type="number"
                  value={allocations[f.id] || ''}
                  onChange={(e) => updateAlloc(f.id, e.target.value)}
                  placeholder="0"
                  min="0"
                  max={surplus}
                  className="flex-1 bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
                />
              </div>
            ))}

            <div className="flex justify-between text-sm pt-1">
              <span className="text-txt-secondary">Total allocated</span>
              <span className={`font-mono font-semibold ${valid ? 'text-gain' : 'text-loss'}`}>
                {formatCurrency(totalAlloc)} / {formatCurrency(surplus)}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={redistribute} disabled={!valid || surplus <= 0}>
            Redistribute
          </Button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl bg-surface/95 backdrop-blur-md border border-border-subtle text-base text-txt-primary shadow-2xl">
          {toast}
        </div>
      )}
    </Modal>
  );
}
