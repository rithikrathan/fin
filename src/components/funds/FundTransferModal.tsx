import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { formatCurrency, generateId, round2 } from '../../utils/helpers';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import Select from '../shared/Select';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FundTransferModal({ open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const [fromFundId, setFromFundId] = useState<number>(state.funds[0]?.id || 0);
  const [toFundId, setToFundId] = useState<number>(state.funds[1]?.id || 0);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');

  const fromFund = state.funds.find((f) => f.id === fromFundId);
  const toFund = state.funds.find((f) => f.id === toFundId);
  const amt = parseFloat(amount) || 0;
  const valid = fromFund && toFund && fromFundId !== toFundId && amt > 0 && amt <= (fromFund?.balance || 0);

  const handleTransfer = () => {
    if (!valid || !fromFund || !toFund) return;

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: generateId(),
        type: 'transfer',
        from_fund_id: fromFundId,
        to_fund_id: toFundId,
        amount: round2(amt),
        note: note || `Transfer: ${fromFund.name} → ${toFund.name}`,
        date: new Date().toISOString().split('T')[0],
        file_id: null,
        file_name: null,
      },
    });

    setAmount('');
    setNote('');
    setToast('Transfer complete');
    setTimeout(() => { setToast(''); onClose(); }, 1000);
  };

  const swap = () => {
    setFromFundId(toFundId);
    setToFundId(fromFundId);
    setAmount('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Transfer Between Funds">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-txt-secondary mb-1">From</label>
            <Select
              value={fromFundId}
              onChange={(val) => setFromFundId(Number(val))}
              className="w-full"
              buttonClassName="w-full py-2 bg-white/[0.04] border-border-subtle hover:border-brand/50"
              options={state.funds.map((f) => ({
                value: f.id,
                label: `${f.name.charAt(0).toUpperCase() + f.name.slice(1)} (${formatCurrency(f.balance)})`,
              }))}
            />
          </div>

          <button
            onClick={swap}
            className="mt-5 h-8 w-8 rounded-lg bg-white/[0.06] border border-border-subtle flex items-center justify-center text-txt-secondary hover:text-txt-primary hover:bg-white/[0.1] transition-all cursor-pointer text-sm shrink-0"
            title="Swap funds"
          >
            ⇄
          </button>

          <div className="flex-1 min-w-0">
            <label className="block text-xs text-txt-secondary mb-1">To</label>
            <Select
              value={toFundId}
              onChange={(val) => setToFundId(Number(val))}
              className="w-full"
              buttonClassName="w-full py-2 bg-white/[0.04] border-border-subtle hover:border-brand/50"
              options={state.funds.map((f) => ({
                value: f.id,
                label: `${f.name.charAt(0).toUpperCase() + f.name.slice(1)} (${formatCurrency(f.balance)})`,
              }))}
            />
          </div>
        </div>

        {fromFundId === toFundId && (
          <div className="text-xs text-amber-400">Select different funds to transfer between.</div>
        )}

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            max={fromFund?.balance || 0}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
          {fromFund && (
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-txt-secondary">Available in {fromFund.name}</span>
              <span className="font-mono text-txt-primary">{formatCurrency(fromFund.balance)}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Move excess to savings"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        {fromFund && toFund && fromFundId !== toFundId && amt > 0 && (
          <div className="bg-white/[0.03] rounded-lg p-3 text-xs text-txt-secondary space-y-1">
            <div className="flex justify-between">
              <span>{fromFund.name} balance after</span>
              <span className="font-mono text-txt-primary">{formatCurrency(fromFund.balance - amt)}</span>
            </div>
            <div className="flex justify-between">
              <span>{toFund.name} balance after</span>
              <span className="font-mono text-gain">{formatCurrency(toFund.balance + amt)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleTransfer} disabled={!valid}>
            Transfer
          </Button>
        </div>
      </div>

      {toast && createPortal(
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,8px))] lg:bottom-6 z-[99999] px-3.5 py-1.5 rounded-full bg-[#18181B]/95 backdrop-blur-md border border-white/15 text-xs font-semibold text-txt-primary shadow-2xl flex items-center gap-2 pointer-events-none whitespace-nowrap animate-fadeIn">
          <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse" />
          <span>{toast}</span>
        </div>,
        document.body
      )}
    </Modal>
  );
}
