import { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useApp } from '../../context/AppContext';
import { formatCurrency, round2 } from '../../utils/helpers';
import { showToast } from '../../utils/toast';
import type { BalanceTransaction, ExpenseTransaction } from '../../types';

export default function LogPaymentModal({
  isOpen,
  onClose,
  accountId,
  accountTitle,
  currentDue,
}: {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountTitle: string;
  currentDue: number;
}) {
  const { state, dispatch } = useApp();
  const needsFund = state.funds.find((f) => f.name.toLowerCase() === 'needs') || state.funds[0];
  const [fundId, setFundId] = useState(needsFund?.id || 1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountInput, setAmountInput] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const selectedFund = state.funds.find((f) => f.id === fundId) || state.funds[0];

  const handleLogPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = round2(parseFloat(amountInput) || 0);

    if (amount <= 0) {
      showToast('Please enter a valid payment amount');
      return;
    }
    if (!selectedFund) {
      showToast('Create a fund to pay from');
      return;
    }
    if (amount > currentDue) {
      showToast(`Amount exceeds total due of ${formatCurrency(currentDue)}`);
      return;
    }
    if (selectedFund.balance < amount) {
      showToast(`Insufficient balance in ${selectedFund.name}`);
      return;
    }

    const txId = 'bal_tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const expenseId = Date.now() + Math.floor(Math.random() * 1000);

    const newTx: BalanceTransaction = {
      id: txId,
      account_id: accountId,
      type: 'Subtraction',
      transaction_total: amount,
      date,
      reference_number: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const expense: ExpenseTransaction = {
      id: expenseId,
      type: 'expense',
      description: `Store balance payment — ${accountTitle}`,
      amount,
      category: 'Store Balance',
      fund_id: selectedFund.id,
      fund_name: selectedFund.name,
      planned: true,
      date,
      is_misc: false,
      notes: notes.trim() || 'Paid via store balance tab',
      file_id: null,
      file_name: null,
    };

    dispatch({
      type: 'LOG_BALANCE_PAYMENT',
      payload: { balance_tx: newTx, expense },
    });

    showToast(`Payment of ${formatCurrency(amount)} recorded from ${selectedFund.name}`);
    setAmountInput('');
    setReferenceNumber('');
    setNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Payment (Clear Balance)">
      <form onSubmit={handleLogPayment} className="space-y-5">
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
          <span className="text-txt-secondary">Current Total Due</span>
          <span className="font-mono font-bold text-txt-primary">{formatCurrency(currentDue)}</span>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
            Pay From Fund
          </label>
          <select
            value={fundId}
            onChange={(e) => setFundId(parseInt(e.target.value))}
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors cursor-pointer"
          >
            {state.funds.map((f) => (
              <option key={f.id} value={f.id} className="bg-[#18181B]">
                {f.name} ({formatCurrency(f.balance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
            Payment Amount (₹)
          </label>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={`e.g. ${currentDue > 0 ? currentDue : 500}`}
            min="0"
            step="any"
            required
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono outline-none transition-colors"
          />
          {selectedFund && (
            <p className="text-xs text-txt-secondary mt-1">
              Available in {selectedFund.name}: <span className="font-mono">{formatCurrency(selectedFund.balance)}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-sm text-txt-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
              Payment Ref / UPI TXN ID
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UPI-984210"
              className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-sm text-txt-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Paid via GPay"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-sm text-txt-primary outline-none transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outlined" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" type="submit" className="flex-1">
            Log Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
