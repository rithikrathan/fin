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
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedSourceId(sourceFundId);
      setAllocations({});
      setLocked({});
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
    const newVal = Math.min(surplus, Math.max(0, parseFloat(value) || 0));

    const otherFunds = destFunds.filter((f) => f.id !== fundId && !locked[f.id]);
    const lockedTotal = destFunds
      .filter((f) => f.id !== fundId && locked[f.id])
      .reduce((s, f) => s + (parseFloat(allocations[f.id]) || 0), 0);

    const remainder = surplus - newVal - lockedTotal;
    const otherTotal = otherFunds.reduce((s, f) => s + (parseFloat(allocations[f.id]) || 0), 0);

    setAllocations((prev) => {
      const next: Record<number, string> = { ...prev, [fundId]: String(newVal) };
      if (otherTotal <= 0 || remainder <= 0) {
        for (const f of otherFunds) next[f.id] = '0';
      } else {
        for (const f of otherFunds) {
          const cur = parseFloat(prev[f.id]) || 0;
          next[f.id] = String(round2((cur / otherTotal) * Math.max(0, remainder)));
        }
      }
      return next;
    });
  };

  const toggleLock = (fundId: number) => {
    setLocked((prev) => ({ ...prev, [fundId]: !prev[fundId] }));
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
            onChange={(e) => { setSelectedSourceId(Number(e.target.value)); setAllocations({}); setLocked({}); }}
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
              Drag sliders or enter amounts to split surplus across other funds:
            </div>

            <div className="space-y-3">
              {destFunds.map((f) => {
                const isLocked = !!locked[f.id];
                const val = parseFloat(allocations[f.id]) || 0;
                return (
                  <div key={f.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                        <span className="text-sm text-txt-primary truncate">{f.name}</span>
                        {isLocked && (
                          <span className="text-[10px] text-txt-secondary bg-white/[0.06] px-1.5 py-0.5 rounded">locked</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-txt-secondary text-xs pointer-events-none select-none">₹</span>
                          <input
                            type="number"
                            value={allocations[f.id] || ''}
                            onChange={(e) => updateAlloc(f.id, e.target.value)}
                            placeholder="0"
                            min="0"
                            max={surplus}
                            className="w-24 bg-white/[0.04] border border-border-subtle rounded-lg pl-5 pr-2 py-1 text-sm text-txt-primary font-mono text-right outline-none focus:border-brand/50 transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => toggleLock(f.id)}
                          className={`text-sm cursor-pointer transition-colors ${isLocked ? 'text-brand' : 'text-txt-secondary/40 hover:text-txt-secondary'}`}
                          title={isLocked ? 'Unlock allocation' : 'Lock allocation'}
                        >
                          {isLocked ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={surplus}
                      step="10"
                      value={val}
                      onChange={(e) => updateAlloc(f.id, e.target.value)}
                      className="w-full h-2 rounded-full appearance-none bg-white/[0.06] accent-brand cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
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
