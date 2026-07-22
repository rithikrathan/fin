import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Select from '../components/shared/Select';
import type { ExpenseTransaction, IncomeTransaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { ArrowLeft } from 'lucide-react';

export default function DetectTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const log = state.sms_logs.find((l) => l.id === id);

  const [amount, setAmount] = useState(log?.parsed_fields.amount || '');
  const [txType, setTxType] = useState<'credit' | 'debit'>(
    (log?.parsed_fields.type?.toLowerCase().includes('credit') ? 'credit' : 'debit') as 'credit' | 'debit'
  );
  const [account, setAccount] = useState(log?.parsed_fields.account_number || '');
  const [bank, setBank] = useState(log?.parsed_fields.bank_name || '');
  const [date, setDate] = useState(() => {
    const d = log?.parsed_fields.date || '';
    if (!d) return new Date().toISOString().split('T')[0];
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });
  const [balance, setBalance] = useState(log?.parsed_fields.balance || '');
  const [merchant, setMerchant] = useState(log?.parsed_fields.merchant || '');
  const [fundId, setFundId] = useState<number>(state.funds[0]?.id || 1);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  if (!log) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-txt-secondary">Message not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/messages')}>
            Back to Messages
          </Button>
        </Card>
      </div>
    );
  }

  const createTx = (type: 'income' | 'expense') => {
    const numAmount = parseFloat(amount.replace(/[,₹\s]/g, '')) || 0;
    if (numAmount <= 0) return;

    if (type === 'expense') {
      const tx: ExpenseTransaction = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'expense',
        description: merchant || `Bank transaction — ${bank || 'unknown'}`,
        amount: numAmount,
        category: category || 'Miscellaneous',
        fund_id: fundId,
        fund_name: state.funds.find((f) => f.id === fundId)?.name || '',
        planned: false,
        date,
        is_misc: false,
        notes: notes || `Auto-detected from SMS. ${bank ? `Bank: ${bank}` : ''} ${account ? `A/c: ${account}` : ''}`.trim(),
        file_id: null,
        file_name: null,
      };
      dispatch({ type: 'ADD_TRANSACTION', payload: tx });
      dispatch({
        type: 'UPDATE_SMS_LOG',
        payload: { ...log, transaction_id: tx.id },
      });
    } else {
      const alloc: Record<number, number> = {};
      alloc[fundId] = numAmount;
      const tx: IncomeTransaction = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'income',
        name: merchant || `Bank credit — ${bank || 'unknown'}`,
        amount: numAmount,
        income_type: 'one_time',
        category: category || 'other',
        date,
        notes: notes || `Auto-detected from SMS. ${bank ? `Bank: ${bank}` : ''}`.trim(),
        fund_allocation: alloc,
        file_id: null,
        file_name: null,
      };
      dispatch({ type: 'ADD_TRANSACTION', payload: tx });
      dispatch({
        type: 'UPDATE_SMS_LOG',
        payload: { ...log, transaction_id: tx.id },
      });
    }
    navigate('/messages');
  };

  const dismiss = () => {
    dispatch({ type: 'UPDATE_SMS_LOG', payload: { ...log, dismissed: true } });
    navigate('/messages');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/messages')} className="flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <h2 className="text-xl font-bold text-txt-primary">Transaction Detected</h2>
      </div>

      <Card className="p-4">
        <p className="text-xs text-txt-secondary mb-2">Raw Message</p>
        <p className="text-sm text-txt-primary font-mono whitespace-pre-wrap break-words bg-white/[0.03] rounded-lg p-3">
          {log.message_text}
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-txt-primary">Extracted Fields</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Amount</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2499"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono outline-none focus:border-brand/50"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs text-txt-secondary font-medium shrink-0">Type</label>
            <Select
              value={txType}
              onChange={(val) => setTxType(val)}
              options={[
                { value: 'debit', label: 'Debit' },
                { value: 'credit', label: 'Credit' },
              ]}
              buttonClassName="py-2 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Account Number</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="Last 4 digits"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono outline-none focus:border-brand/50"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Bank</label>
            <input
              type="text"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="e.g. HDFC"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Balance After</label>
            <input
              type="text"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="e.g. 45001"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono outline-none focus:border-brand/50"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50"
            />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Shopping"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-xs text-txt-secondary font-medium shrink-0">Fund</label>
          <Select
            value={fundId}
            onChange={(val) => setFundId(val)}
            options={state.funds.map((f) => ({
              value: f.id,
              label: `${f.name} (${formatCurrency(f.balance)})`,
            }))}
            buttonClassName="py-2 text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50"
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="primary" onClick={() => createTx(txType === 'debit' ? 'expense' : 'income')}>
          Create {txType === 'debit' ? 'Expense' : 'Income'}
        </Button>
        <Button variant="ghost" onClick={dismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
