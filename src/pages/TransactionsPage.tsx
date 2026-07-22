import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { IncomeType, IncomeTransaction, ExpenseTransaction, SmsLog } from '../types';
import { formatCurrency, formatDate, generateId, round2 } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import Select from '../components/shared/Select';
import { ReceiptText } from 'lucide-react';
import FilePicker from '../components/shared/FilePicker';
import { getStorageService } from '../storage/StorageService';
import { MessagesIcon, DownloadIcon } from '../components/shared/Icons';
import FloatingAddButton from '../components/shared/FloatingAddButton';
import { runPatterns } from '../utils/matching';

export default function TransactionsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  // Unified view state to switch between transactions ledger and messages log
  const [viewMode, setViewMode] = useState<'transactions' | 'messages'>('transactions');

  // Transactions list filter and modal states
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Messages log states
  const [msgFilter, setMsgFilter] = useState<'all' | 'matched' | 'unmatched' | 'created' | 'dismissed'>('all');
  const [addMsgOpen, setAddMsgOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [downloadOpen, setDownloadOpen] = useState(false);

  // Transactions filtering and sorting
  const filtered = state.transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Messages filtering and sorting
  const filteredMsgs = state.sms_logs.filter((log) => {
    if (msgFilter === 'matched') return log.matched && !log.transaction_id && !log.dismissed;
    if (msgFilter === 'unmatched') return !log.matched && !log.dismissed;
    if (msgFilter === 'created') return !!log.transaction_id;
    if (msgFilter === 'dismissed') return log.dismissed;
    return true;
  });

  const sortedMsgs = [...filteredMsgs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Count of logs that matched but have no transaction yet and aren't dismissed
  const unhandledMsgCount = state.sms_logs.filter(
    (l) => l.matched && !l.transaction_id && !l.dismissed
  ).length;

  const addManualMessage = () => {
    if (!manualText.trim()) return;
    const match = runPatterns(manualText, state.message_patterns);
    const log: SmsLog = {
      id: crypto.randomUUID(),
      message_text: manualText.trim(),
      message_source: null,
      timestamp: new Date().toISOString(),
      pattern_id: match?.pattern.id || null,
      matched: !!match,
      parsed_fields: match?.fields || {},
      transaction_id: null,
      dismissed: false,
      notification_id: null,
    };
    dispatch({ type: 'ADD_SMS_LOG', payload: log });
    setManualText('');
    setAddMsgOpen(false);
  };

  const dismissMsg = (id: string) => {
    const log = state.sms_logs.find((l) => l.id === id);
    if (log) dispatch({ type: 'UPDATE_SMS_LOG', payload: { ...log, dismissed: true } });
  };

  const getPatternName = (patternId: string | null) => {
    if (!patternId) return null;
    return state.message_patterns.find((p) => p.id === patternId)?.name || null;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header controls row */}
      <div className={viewMode === 'messages' ? 'flex flex-col gap-3' : 'flex items-center justify-between gap-2'}>
        {viewMode === 'transactions' ? (
          <>
            <div className="flex items-center gap-1.5 min-w-0">
              {(['all', 'income', 'expense'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                    filter === f
                      ? 'bg-brand/15 text-brand'
                      : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1 items-center shrink-0">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDownloadOpen(!downloadOpen)}
                  className={`!px-2 flex items-center justify-center min-h-[44px] ${downloadOpen ? '!text-brand' : ''}`}
                  title="Download"
                >
                  <DownloadIcon className="w-5 h-5" style={downloadOpen ? { filter: 'drop-shadow(0 0 12px rgba(255,42,42,0.8))' } : undefined} />
                </Button>
                {downloadOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDownloadOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden min-w-[120px]">
                      <button
                        onClick={() => { exportCSV(sorted, state); setDownloadOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => { exportPDF(sorted, state); setDownloadOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="hidden lg:flex gap-2">
                <Button variant="primary" size="sm" onClick={() => setIncomeOpen(true)}>
                  + Income
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setExpenseOpen(true)}>
                  + Expense
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('messages')}
                className="!px-2 flex items-center justify-center min-h-[44px] relative"
                title="SMS Messages Log"
              >
                <MessagesIcon className="w-5 h-5 text-txt-secondary hover:text-txt-primary" />
                {unhandledMsgCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white shadow-glow animate-pulse">
                    {unhandledMsgCount}
                  </span>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('transactions')}
                className="text-txt-secondary hover:text-txt-primary transition-colors cursor-pointer p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-txt-primary">Messages</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
              {(['all', 'matched', 'unmatched', 'created', 'dismissed'] as const).map((f) => {
                const label = f === 'created' ? 'Transaction Created' : f.charAt(0).toUpperCase() + f.slice(1);
                let count = state.sms_logs.length;
                if (f === 'matched') count = state.sms_logs.filter((l) => l.matched && !l.transaction_id && !l.dismissed).length;
                else if (f === 'unmatched') count = state.sms_logs.filter((l) => !l.matched && !l.dismissed).length;
                else if (f === 'created') count = state.sms_logs.filter((l) => !!l.transaction_id).length;
                else if (f === 'dismissed') count = state.sms_logs.filter((l) => l.dismissed).length;

                return (
                  <button
                    key={f}
                    onClick={() => setMsgFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      msgFilter === f
                        ? 'bg-brand/15 text-brand border border-brand/30'
                        : 'text-txt-secondary hover:text-txt-primary bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {viewMode === 'transactions' ? (
        sorted.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="w-8 h-8 text-brand" />}
            title="No transactions recorded"
            description="Add your first income or expense entry to start tracking your cash flow."
          />
        ) : (
          <div className="space-y-3">
            {sorted.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} funds={state.funds} dispatch={dispatch} />
            ))}
          </div>
        )
      ) : (
        sortedMsgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-brand/10 border border-brand/20 shadow-glow-lg flex items-center justify-center text-brand mb-6 animate-pulse">
              <MessagesIcon className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-txt-primary mb-2">
              {state.sms_logs.length === 0 ? 'No messages yet' : 'No messages match'}
            </h3>
            <p className="text-sm text-txt-secondary max-w-xs">
              {state.sms_logs.length === 0
                ? 'Add a message manually or wait for Android capture sync.'
                : 'Try a different filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMsgs.map((log) => (
              <Card key={log.id} className="p-4 bg-white/[0.02] border border-white/[0.04] transition-all hover:bg-white/[0.03]">
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm ${
                    log.transaction_id ? 'bg-green-400 shadow-green-400/50' : log.matched ? 'bg-amber-400 shadow-amber-400/50' : log.dismissed ? 'bg-txt-secondary/30' : 'bg-red-400 shadow-red-400/50'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-txt-secondary font-mono mb-1">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                      {log.message_source ? ` · ${log.message_source}` : ''}
                    </p>
                    <p className="text-sm text-txt-primary whitespace-pre-wrap break-words">{log.message_text}</p>
                    
                    {log.matched && log.pattern_id && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/20">
                          {getPatternName(log.pattern_id)}
                        </span>
                        {Object.entries(log.parsed_fields).map(([k, v]) => (
                          <span key={k} className="text-xs bg-white/[0.06] text-txt-secondary px-2 py-0.5 rounded border border-white/[0.03]">
                            <span className="text-txt-secondary/60">{k}:</span> <span className="font-mono text-txt-primary">{v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {log.transaction_id && (
                      <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 inline-block mt-2 font-medium">
                        ✓ Transaction Created
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    {log.matched && !log.transaction_id && !log.dismissed && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/detect/${log.id}`)}
                      >
                        Detect
                      </Button>
                    )}
                    {!log.dismissed && !log.transaction_id && (
                      <Button variant="ghost" size="sm" onClick={() => dismissMsg(log.id)} className="text-txt-secondary hover:text-red-400">
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Modals */}
      <AddIncomeModal
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        funds={state.funds}
        dispatch={dispatch}
      />
      <AddExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        funds={state.funds}
        dispatch={dispatch}
      />
      
      <Modal open={addMsgOpen} onClose={() => setAddMsgOpen(false)} title="Add Message Manually">
        <div className="space-y-4">
          <p className="text-sm text-txt-secondary leading-relaxed">
            Paste a bank SMS or notification text to manually run it against your SMS patterns and add it to the message logs.
          </p>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste raw bank SMS text here (e.g. A/c *3003 debited...)"
            rows={4}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddMsgOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={addManualMessage} disabled={!manualText.trim()}>Add Message</Button>
          </div>
        </div>
      </Modal>

      {viewMode === 'transactions' ? (
        <FloatingAddButton
          actions={[
            { label: '+ Income', onClick: () => setIncomeOpen(true) },
            { label: '+ Expense', onClick: () => setExpenseOpen(true) },
          ]}
        />
      ) : (
        <FloatingAddButton onClick={() => setAddMsgOpen(true)} />
      )}
    </div>
  );
}

function TransactionRow({
  tx,
  funds,
  dispatch,
}: {
  tx: import('../types').Transaction;
  funds: import('../types').Fund[];
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const isIncome = tx.type === 'income';
  const isExpense = tx.type === 'expense';
  const [expanded, setExpanded] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const hasFile = tx.file_id && tx.file_name;
  const isImage = hasFile && /\.(jpg|jpeg|png|gif|webp)$/i.test(tx.file_name!);

  useEffect(() => {
    if (!tx.file_id) return;
    let revoke: string | null = null;
    getStorageService().then((svc) => svc.getFile(tx.file_id!)).then((blob) => {
      if (blob) { const url = URL.createObjectURL(blob); setFileUrl(url); revoke = url; }
    });
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [tx.file_id]);

  const downloadFile = async () => {
    if (!fileUrl || !tx.file_name) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = tx.file_name;
    a.click();
  };

  const hasDetails = ('notes' in tx && tx.notes) || hasFile;

  const txName = isIncome ? tx.name : isExpense ? tx.description : tx.note;

  return (
    <div
      className={`group bg-white/[0.03] rounded-xl transition-colors ${
        expanded ? 'ring-1 ring-white/[0.08] bg-white/[0.05]' : 'hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isIncome
              ? 'bg-gain/10 text-gain border border-gain/20'
              : isExpense
              ? 'bg-loss/10 text-loss border border-loss/20'
              : 'bg-brand/10 text-brand border border-brand/20'
          }`}
        >
          {isIncome ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          ) : isExpense ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-txt-primary leading-snug break-words">{txName}</div>
          <div className="mt-1">
            {isExpense && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                tx.planned ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {tx.planned ? 'Planned' : 'Unplanned'}
              </span>
            )}
            {isIncome && (
              <span className="text-[10px] font-medium text-txt-secondary bg-white/5 px-1.5 py-0.5 rounded">
                {tx.income_type}
              </span>
            )}
          </div>
          <div className="text-xs text-txt-secondary mt-1">
            {isExpense ? tx.category : isTransfer(tx) ? 'Transfer' : tx.category} · {formatDate(tx.date)}
          </div>
        </div>

        <div className="text-right shrink-0 self-start">
          <span
            className={`font-mono text-sm font-semibold ${
              isIncome ? 'text-gain' : isExpense ? 'text-loss' : 'text-txt-secondary'
            }`}
          >
            {isIncome ? '+' : isExpense ? '-' : ''}
            {formatCurrency(tx.amount)}
          </span>
          {isIncome && (
            <div className="text-[10px] text-txt-secondary mt-0.5 font-mono">
              {Object.entries(tx.fund_allocation)
                .filter(([, v]) => v > 0)
                .map(([fundId, val]) => {
                  const f = funds.find((f) => f.id === Number(fundId));
                  return `${f?.name?.[0]?.toUpperCase() || '?'}:${formatCurrency(val)}`;
                })
                .join(' ')}
            </div>
          )}
          {isExpense && (
            <div className="text-[10px] text-txt-secondary mt-0.5">
              from {tx.fund_name}
            </div>
          )}
          <button
            onClick={() => dispatch({ type: 'REMOVE_TRANSACTION', payload: tx.id })}
            className="text-txt-secondary/30 hover:text-red-400 text-sm mt-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {hasDetails && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-4 pb-2 text-[10px] text-txt-secondary/50 hover:text-txt-secondary transition-colors cursor-pointer"
        >
          {expanded ? '▲ less' : '▼ more'}
        </button>
      )}

      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          expanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-3 pt-1 border-t border-white/[0.04] space-y-2">
          {'notes' in tx && tx.notes && (
            <p className="text-xs text-txt-secondary italic">{tx.notes}</p>
          )}
          {hasFile && fileUrl && (
            <div className="flex items-center gap-2">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={tx.file_name!}
                  className="h-16 rounded-lg border border-white/[0.08] object-cover cursor-pointer hover:border-white/[0.15] transition-colors"
                  onClick={downloadFile}
                />
              ) : (
                <button
                  onClick={downloadFile}
                  className="text-xs text-brand hover:underline cursor-pointer flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.98-9.104a3 3 0 1 1 4.243 4.243l-10.98 9.104a1.5 1.5 0 0 1-2.121-2.121l7.693-7.693a.75.75 0 0 1 1.06 1.06Z" />
                  </svg>
                  {tx.file_name}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function isTransfer(tx: import('../types').Transaction): tx is import('../types').TransferTransaction {
  return tx.type === 'transfer';
}

function AddIncomeModal({
  open,
  onClose,
  funds,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  funds: import('../types').Fund[];
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeType, setIncomeType] = useState<IncomeType>('monthly');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name || isNaN(amt) || amt <= 0) return;

    const tx: IncomeTransaction = {
      id: generateId(),
      type: 'income',
      name,
      amount: amt,
      income_type: incomeType,
      category: category || 'general',
      date: new Date().toISOString().split('T')[0],
      notes,
      fund_allocation: Object.fromEntries(
        funds.map((f) => [f.id, round2(amt * (f.allocation_pct / 100))])
      ) as Record<number, number>,
      file_id: fileId,
      file_name: fileName,
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    setName('');
    setAmount('');
    setCategory('');
    setNotes('');
    setFileId(null);
    setFileName(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Income">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Salary"
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
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs text-txt-secondary font-medium shrink-0">Type</label>
          <Select
            value={incomeType}
            onChange={(val) => setIncomeType(val as IncomeType)}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'one_time', label: 'One-Time' },
              { value: 'irregular', label: 'Irregular' },
            ]}
            buttonClassName="py-2 text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. salary, freelance"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Attachment</label>
          <FilePicker
            fileId={fileId}
            fileName={fileName}
            onFileUploaded={(id, name) => { setFileId(id); setFileName(name); }}
            onFileRemoved={() => { setFileId(null); setFileName(null); }}
          />
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div className="py-3 border-b border-white/[0.06] text-xs text-txt-secondary space-y-1">
            <div className="font-semibold text-txt-primary text-sm mb-2">
              Auto-allocation
            </div>
            {funds.map((f) => (
              <div key={f.id} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                  {f.name}
                </span>
                <span className="font-mono text-gain">
                  {formatCurrency(round2(parseFloat(amount) * (f.allocation_pct / 100)))}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Income
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddExpenseModal({
  open,
  onClose,
  funds,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  funds: import('../types').Fund[];
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [fundId, setFundId] = useState(funds[0]?.id || 1);
  const [planned, setPlanned] = useState(false);
  const [notes, setNotes] = useState('');
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const selectedFund = funds.find((f) => f.id === fundId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description || isNaN(amt) || amt <= 0 || !category) return;

    const tx: ExpenseTransaction = {
      id: generateId(),
      type: 'expense',
      description,
      amount: amt,
      category,
      fund_id: fundId,
      fund_name: selectedFund?.name || 'needs',
      planned,
      date: new Date().toISOString().split('T')[0],
      is_misc: category === 'Miscellaneous',
      notes,
      file_id: fileId,
      file_name: fileName,
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    setDescription('');
    setAmount('');
    setCategory('');
    setPlanned(false);
    setNotes('');
    setFileId(null);
    setFileName(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Groceries"
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
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Category</label>
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {['Snacks', 'Transport', 'Shopping', 'Health', 'Miscellaneous'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-brand/15 border-brand/30 text-brand'
                    : 'bg-white/[0.02] border-border-subtle text-txt-secondary hover:text-txt-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Or type a custom category"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs text-txt-secondary font-medium shrink-0">Fund</label>
          <Select
            value={fundId}
            onChange={(val) => setFundId(val)}
            options={funds.map((f) => ({
              value: f.id,
              label: `${f.name.charAt(0).toUpperCase() + f.name.slice(1)} — ${formatCurrency(f.balance)}`,
            }))}
            buttonClassName="py-2 text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Planned?</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPlanned(true)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                planned
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-white/[0.01] border-white/10 text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
              }`}
            >
              Planned
            </button>
            <button
              type="button"
              onClick={() => setPlanned(false)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                !planned
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-white/[0.01] border-white/10 text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
              }`}
            >
              Unplanned
            </button>
          </div>
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
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Attachment</label>
          <FilePicker
            fileId={fileId}
            fileName={fileName}
            onFileUploaded={(id, name) => { setFileId(id); setFileName(name); }}
            onFileRemoved={() => { setFileId(null); setFileName(null); }}
          />
        </div>

        {selectedFund && (
          <div className="py-3 border-b border-white/[0.06] text-xs text-txt-secondary">
            <div className="flex justify-between">
              <span>{selectedFund.name} balance after</span>
              <span className="font-mono text-txt-primary">
                {formatCurrency(selectedFund.balance - parseFloat(amount || '0'))}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function exportCSV(transactions: import('../types').Transaction[], state: import('../types').AppState) {
  const header = 'Date,Type,Name/Description,Amount,Fund,Category,Notes';
  const rows = transactions.map((t) => {
    if (t.type === 'income') {
      const alloc = Object.entries(t.fund_allocation)
        .map(([id, amt]) => {
          const f = state.funds.find((f) => f.id === Number(id));
          return `${f?.name || id}: ${amt}`;
        }).join('; ');
      return `"${t.date}","Income","${t.name}",${t.amount},"${alloc}","${t.category}","${t.notes}"`;
    }
    if (t.type === 'expense') {
      return `"${t.date}","Expense","${t.description}",${t.amount},"${t.fund_name}","${t.category}","${t.is_misc ? 'misc' : ''}"`;
    }
    const from = state.funds.find((f) => f.id === t.from_fund_id);
    const to = state.funds.find((f) => f.id === t.to_fund_id);
    return `"${t.date}","Transfer","${t.note}",${t.amount},"${from?.name} → ${to?.name}","",""`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(transactions: import('../types').Transaction[], state: import('../types').AppState) {
  const rows = transactions.map((t) => {
    let name = '', amount = 0, fund = '', category = '', type = '';
    if (t.type === 'income') {
      type = 'Income'; name = t.name; amount = t.amount;
      fund = Object.entries(t.fund_allocation).map(([id, amt]) => {
        const f = state.funds.find((f) => f.id === Number(id));
        return `${f?.name || id}: ₹${amt}`;
      }).join(', ');
      category = t.category;
    } else if (t.type === 'expense') {
      type = 'Expense'; name = t.description; amount = -t.amount;
      fund = t.fund_name; category = t.category;
    } else {
      const from = state.funds.find((f) => f.id === t.from_fund_id);
      const to = state.funds.find((f) => f.id === t.to_fund_id);
      type = 'Transfer'; name = t.note; amount = t.amount;
      fund = `${from?.name} → ${to?.name}`;
    }
    return `<tr>
      <td>${t.date}</td><td>${type}</td><td>${name}</td>
      <td style="font-family:monospace;${amount >= 0 ? 'color:#4ADE80' : 'color:#FB923C'}">${amount >= 0 ? '+' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}</td>
      <td>${fund}</td><td>${category}</td>
    </tr>`;
  }).join('');

  const printWin = window.open('', '_blank');
  if (!printWin) return;
  printWin.document.write(`<!DOCTYPE html><html><head><title>Transactions</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Inter,sans-serif;background:#050505;color:#F4F4F5;padding:40px}
      h1{font-size:24px;margin-bottom:8px}
      .sub{color:#A1A1AA;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;font-size:11px;color:#A1A1AA;text-transform:uppercase;letter-spacing:1px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.08)}
      td{padding:8px 10px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04)}
      @media print{body{background:#fff;color:#111}th,td{border-bottom-color:#ddd}th{color:#666}}
    </style></head><body>
    <h1>Transactions</h1>
    <div class="sub">${transactions.length} transactions · Generated ${new Date().toLocaleDateString('en-IN')}</div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Amount</th><th>Fund</th><th>Category</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 500);
}
