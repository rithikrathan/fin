import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import FloatingAddButton from '../components/shared/FloatingAddButton';
import AddBillModal from '../components/balances/AddBillModal';
import LogPaymentModal from '../components/balances/LogPaymentModal';
import { formatCurrency } from '../utils/helpers';
import { showToast } from '../utils/toast';
import {
  ArrowLeft,
  Plus,
  CreditCard,
  MoreVertical,
  Download,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function BalanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isLogPaymentOpen, setIsLogPaymentOpen] = useState(false);
  const [expandedTxIds, setExpandedTxIds] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const account = (state.balance_accounts || []).find((a) => a.id === id);
  const transactions = (state.balance_transactions || []).filter((t) => t.account_id === id);
  const lineItems = state.balance_line_items || [];

  if (!account) {
    return (
      <div className="text-center py-20 space-y-4">
        <h3 className="text-lg font-bold text-txt-primary">Account not found</h3>
        <Button variant="primary" onClick={() => navigate('/balances')}>
          Back to Balances
        </Button>
      </div>
    );
  }

  const toggleExpand = (txId: string) => {
    setExpandedTxIds((prev) => ({ ...prev, [txId]: !prev[txId] }));
  };

  const handleReset = () => {
    if (window.confirm(`Are you sure you want to reset "${account.title}"? This archives all current transactions and resets total due to ₹0.00.`)) {
      dispatch({ type: 'RESET_BALANCE_ACCOUNT', payload: account.id });
      showToast('Store ledger reset to ₹0.00');
      setMenuOpen(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete store ledger "${account.title}"? This action cannot be undone.`)) {
      dispatch({ type: 'REMOVE_BALANCE_ACCOUNT', payload: account.id });
      showToast('Store ledger deleted');
      navigate('/balances');
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('No transactions to export');
      return;
    }

    const rows = [
      ['Date', 'Type', 'Ref Number', 'Item Name', 'Qty', 'Unit Cost (INR)', 'Total (INR)', 'Notes'],
    ];

    for (const tx of transactions) {
      const txItems = lineItems.filter((li) => li.transaction_id === tx.id);
      if (txItems.length > 0) {
        for (const item of txItems) {
          rows.push([
            tx.date,
            tx.type,
            tx.reference_number || '',
            `"${item.item_name.replace(/"/g, '""')}"`,
            String(item.count_qty),
            String(item.unit_cost),
            String(item.line_total),
            `"${(tx.notes || '').replace(/"/g, '""')}"`,
          ]);
        }
      } else {
        rows.push([
          tx.date,
          tx.type,
          tx.reference_number || '',
          'Payment',
          '1',
          String(tx.transaction_total),
          String(tx.transaction_total),
          `"${(tx.notes || '').replace(/"/g, '""')}"`,
        ]);
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${account.title.replace(/\s+/g, '_')}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV ledger');
    setMenuOpen(false);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to generate PDF receipt');
      return;
    }

    const isLight = document.documentElement.classList.contains('light');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${account.title} - Statement</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: ${isLight ? '#0F172A' : '#F4F4F5'}; background: ${isLight ? '#FFFFFF' : '#09090B'}; }
            h1 { margin-bottom: 4px; font-size: 24px; }
            .meta { color: #71717A; font-size: 12px; margin-bottom: 20px; }
            .due-card { background: ${isLight ? '#F1F5F9' : '#18181B'}; padding: 16px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .due-val { font-size: 24px; font-weight: bold; font-family: monospace; color: #DC2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid ${isLight ? '#E2E8F0' : '#27272A'}; font-size: 13px; }
            th { text-transform: uppercase; font-size: 10px; color: #71717A; letter-spacing: 1px; }
            .amount { text-align: right; font-family: monospace; font-weight: bold; }
            .addition { color: #DC2626; }
            .subtraction { color: #059669; }
          </style>
        </head>
        <body>
          <h1>${account.title}</h1>
          <div class="meta">Generated on ${new Date().toLocaleDateString()} • Account Ledger Statement</div>
          
          <div class="due-card">
            <div>
              <div style="text-transform: uppercase; font-size: 10px; color: #71717A;">Total Outstanding Due</div>
              <div class="due-val">${formatCurrency(account.total_due)}</div>
            </div>
            <div>
              <span style="font-weight: bold; text-transform: uppercase; font-size: 11px;">Status: ${account.status}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Details / Items</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map((tx) => {
                  const txItems = lineItems.filter((li) => li.transaction_id === tx.id);
                  const detail =
                    txItems.length > 0
                      ? txItems.map((i) => `${i.item_name} (${i.count_qty} × ${formatCurrency(i.unit_cost)})`).join(', ')
                      : tx.notes || 'Payment Logged';
                  return `
                    <tr>
                      <td>${tx.date}</td>
                      <td style="font-weight: bold;">${tx.type}</td>
                      <td>${tx.reference_number || '-'}</td>
                      <td>${detail}</td>
                      <td class="amount ${tx.type === 'Addition' ? 'addition' : 'subtraction'}">
                        ${tx.type === 'Addition' ? '+' : '-'}${formatCurrency(tx.transaction_total)}
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setMenuOpen(false);
  };

  const isPaid = account.status === 'Paid' || account.total_due === 0;
  const isPartial = account.status === 'Partially Paid';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-44">
      {/* Header Navigation & Title */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/balances')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-txt-secondary hover:text-txt-primary transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-txt-primary truncate">{account.title}</h2>
            <p className="text-xs text-txt-secondary truncate">
              Store Ledger • Created {new Date(account.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Header Options Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-txt-secondary hover:text-txt-primary transition-colors cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#141414] border border-white/10 shadow-xl z-50 py-1 space-y-1">
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-txt-primary hover:bg-white/5 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-brand" />
                Export CSV Ledger
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-txt-primary hover:bg-white/5 flex items-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-brand" />
                Export PDF Receipt
              </button>
              <button
                onClick={handleReset}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-amber-500 hover:bg-white/5 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Account (Clear)
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-500 hover:bg-white/5 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Store Ledger
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Massive Total Due Banner */}
      <Card className="p-6 bg-gradient-to-r from-brand/10 via-surface to-surface border border-brand/30 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-txt-secondary block mb-1">
              Total Outstanding Due
            </span>
            <div className="text-3xl sm:text-5xl font-black font-mono text-brand tracking-tight">
              {formatCurrency(account.total_due)}
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-center ${
              isPaid
                ? 'bg-gain/15 text-gain border border-gain/30'
                : isPartial
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                : 'bg-loss/15 text-loss border border-loss/30'
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isPartial ? (
              <Clock className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {account.status}
          </div>
        </div>
      </Card>

      {/* Timeline Section */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary border-b border-white/[0.06] pb-2">
          Transaction Timeline ({transactions.length})
        </h3>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-txt-secondary text-xs rounded-2xl border border-dashed border-white/10 space-y-2">
            <Receipt className="w-8 h-8 mx-auto opacity-40" />
            <p>No bills or payments logged yet for this store.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const txLineItems = lineItems.filter((li) => li.transaction_id === tx.id);
              const isExpanded = !!expandedTxIds[tx.id];
              const isAddition = tx.type === 'Addition';

              return (
                <Card key={tx.id} className="p-4 space-y-3">
                  <div
                    onClick={() => txLineItems.length > 0 && toggleExpand(tx.id)}
                    className={`flex items-center justify-between gap-3 min-w-0 ${
                      txLineItems.length > 0 ? 'cursor-pointer select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isAddition
                            ? 'bg-loss/10 text-loss border border-loss/20'
                            : 'bg-gain/10 text-gain border border-gain/20'
                        }`}
                      >
                        {isAddition ? <Plus className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-txt-primary truncate">
                            {isAddition ? 'Bill / Purchase' : 'Payment Logged'}
                          </h4>
                          {tx.reference_number && (
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-txt-secondary font-mono">
                              Ref: {tx.reference_number}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-txt-secondary">{tx.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-base font-bold font-mono ${
                          isAddition ? 'text-loss' : 'text-gain'
                        }`}
                      >
                        {isAddition ? '+' : '-'}{formatCurrency(tx.transaction_total)}
                      </span>
                      {txLineItems.length > 0 && (
                        <div className="text-txt-secondary">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {tx.notes && (
                    <p className="text-xs text-txt-secondary/80 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      {tx.notes}
                    </p>
                  )}

                  {/* Itemized Breakdown (Accordion) */}
                  {txLineItems.length > 0 && (isExpanded || txLineItems.length <= 2) && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-txt-secondary">
                        Itemized Breakdown ({txLineItems.length} items)
                      </div>
                      <div className="space-y-1">
                        {txLineItems.map((li) => (
                          <div
                            key={li.id}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white/[0.02]"
                          >
                            <span className="font-medium text-txt-primary truncate">{li.item_name}</span>
                            <div className="flex items-center gap-3 font-mono shrink-0 ml-2">
                              <span className="text-txt-secondary text-[11px]">
                                {li.count_qty} × {formatCurrency(li.unit_cost)}
                              </span>
                              <span className="font-bold text-txt-primary">{formatCurrency(li.line_total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Contextual Floating Add Button with Speed Dial for Log Payment & Add Bill */}
      <FloatingAddButton
        actions={[
          { label: '+ Add Bill', onClick: () => setIsAddBillOpen(true) },
          { label: '💳 Log Payment', onClick: () => setIsLogPaymentOpen(true) },
        ]}
      />

      {/* Modals */}
      <AddBillModal isOpen={isAddBillOpen} onClose={() => setIsAddBillOpen(false)} accountId={account.id} />
      <LogPaymentModal
        isOpen={isLogPaymentOpen}
        onClose={() => setIsLogPaymentOpen(false)}
        accountId={account.id}
        currentDue={account.total_due}
      />
    </div>
  );
}
