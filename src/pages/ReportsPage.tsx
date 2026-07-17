import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { ReportData, ExpenseTransaction, SavedReport } from '../types';
import { formatCurrency, formatDate, getROI, generateId } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

type ReportType = 'daily' | 'weekly' | 'monthly';

function computeReport(transactions: import('../types').Transaction[], startStr: string): ReportData {
  const txInRange = transactions.filter((t) => t.date >= startStr);
  const incomes = txInRange.filter((t) => t.type === 'income');
  const expenses = txInRange.filter((t): t is ExpenseTransaction => t.type === 'expense');

  const totalIncome = incomes.reduce((s, t) => (t.type === 'income' ? s + t.amount : s), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const byFund: Record<string, number> = {};
  expenses.forEach((e) => {
    byFund[e.fund_name] = (byFund[e.fund_name] || 0) + e.amount;
  });

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  return {
    period: { start: startStr, end: new Date().toISOString().split('T')[0] },
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net: totalIncome - totalExpenses,
    by_fund: byFund,
    by_category: byCategory,
    planned_total: expenses.filter((e) => e.planned).reduce((s, e) => s + e.amount, 0),
    unplanned_total: expenses.filter((e) => !e.planned).reduce((s, e) => s + e.amount, 0),
    transaction_count: txInRange.length,
    income_count: incomes.length,
    expense_count: expenses.length,
  };
}

export default function ReportsPage() {
  const { state, dispatch } = useApp();
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [showHistory, setShowHistory] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  let startDate: Date;
  switch (reportType) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly': {
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    }
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startStr = startDate.toISOString().split('T')[0];
  const report = computeReport(state.transactions, startStr);

  const totalInvested = state.investments.reduce((s, i) => s + i.invest_amount, 0);
  const totalCurrent = state.investments.reduce((s, i) => s + i.current_value, 0);

  const saveReport = () => {
    const saved: SavedReport = {
      id: generateId(),
      name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${formatDate(report.period.start)}`,
      period_start: report.period.start,
      period_end: report.period.end,
      generated_at: new Date().toISOString(),
      data: report,
    };
    dispatch({ type: 'SAVE_REPORT', payload: saved });
  };

  const printReport = useCallback(() => {
    const el = reportRef.current;
    if (!el) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Finance Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #050505; color: #F4F4F5; padding: 40px; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          h2 { font-size: 18px; color: #A1A1AA; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 2px; }
          .subtitle { color: #A1A1AA; font-size: 14px; margin-bottom: 32px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .card { background: rgba(25,25,25,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; }
          .card-label { font-size: 11px; color: #A1A1AA; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .card-value { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: bold; }
          .gain { color: #4ADE80; }
          .loss { color: #FB923C; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; font-size: 11px; color: #A1A1AA; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
          td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
          .mono { font-family: 'JetBrains Mono', monospace; }
          @media print { body { background: white; color: #111; } .card { border: 1px solid #ddd; } th, td { border-bottom-color: #ddd; } .card-label { color: #666; } h2 { color: #666; } .subtitle { color: #666; } }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`px-4 py-2 rounded-xl text-base font-medium transition-all cursor-pointer ${
                reportType === t
                  ? 'bg-brand/15 text-brand'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowHistory((h) => !h)}>
            History ({state.reports.length})
          </Button>
          <Button variant="secondary" onClick={saveReport}>
            Save Report
          </Button>
          <Button variant="primary" onClick={printReport}>
            Export PDF
          </Button>
        </div>
      </div>

      {showHistory && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-txt-primary mb-4">Report History</h3>
          {state.reports.length === 0 ? (
            <div className="text-base text-txt-secondary py-4 text-center">
              No saved reports yet. Generate and save a report first.
            </div>
          ) : (
            <div className="space-y-3">
              {state.reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                  <div>
                    <div className="text-base text-txt-primary font-medium">{r.name}</div>
                    <div className="text-sm text-txt-secondary">
                      {formatDate(r.period_start)} — {formatDate(r.period_end)} · Generated {formatDate(r.generated_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-base font-semibold ${r.data.net >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {formatCurrency(r.data.net)} net
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_REPORT', payload: r.id })}
                      className="text-txt-secondary/40 hover:text-red-400 text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="text-sm text-txt-secondary">
        {formatDate(report.period.start)} — {formatDate(report.period.end)}
      </div>

      {/* Printable report */}
      <div ref={reportRef}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Finance Report
        </h1>
        <p style={{ color: '#A1A1AA', fontSize: '14px', marginBottom: '32px' }}>
          {formatDate(report.period.start)} — {formatDate(report.period.end)} · Generated {formatDate(new Date().toISOString())}
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 text-center">
            <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Income</div>
            <div className="font-mono text-2xl font-bold text-gain">{formatCurrency(report.total_income)}</div>
          </Card>
          <Card className="p-5 text-center">
            <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Expenses</div>
            <div className="font-mono text-2xl font-bold text-loss">{formatCurrency(report.total_expenses)}</div>
          </Card>
          <Card className="p-5 text-center">
            <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Net</div>
            <div className={`font-mono text-2xl font-bold ${report.net >= 0 ? 'text-gain' : 'text-loss'}`}>
              {formatCurrency(report.net)}
            </div>
          </Card>
          <Card className="p-5 text-center">
            <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Transactions</div>
            <div className="font-mono text-2xl font-bold text-txt-primary">{report.transaction_count}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-txt-primary mb-4">Planned vs Unplanned</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-base mb-2">
                  <span className="text-blue-400">Planned</span>
                  <span className="font-mono text-txt-primary">{formatCurrency(report.planned_total)}</span>
                </div>
                <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${report.total_expenses ? (report.planned_total / report.total_expenses) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-base mb-2">
                  <span className="text-amber-400">Unplanned</span>
                  <span className="font-mono text-txt-primary">{formatCurrency(report.unplanned_total)}</span>
                </div>
                <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${report.total_expenses ? (report.unplanned_total / report.total_expenses) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-semibold text-txt-primary mb-4">Expenses by Fund</h3>
            <div className="space-y-4">
              {state.funds.map((f) => {
                const amt = report.by_fund[f.name] || 0;
                return (
                  <div key={f.id}>
                    <div className="flex justify-between text-base mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: f.color }} />
                        <span className="text-txt-primary capitalize">{f.name}</span>
                      </div>
                      <span className="font-mono text-txt-secondary">{formatCurrency(amt)}</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${report.total_expenses ? (amt / report.total_expenses) * 100 : 0}%`, backgroundColor: f.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {Object.keys(report.by_category).length > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-base font-semibold text-txt-primary mb-4">Expenses by Category</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(report.by_category)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-base">
                    <span className="text-txt-primary">{cat}</span>
                    <span className="font-mono text-txt-secondary">{formatCurrency(amt)}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {state.investments.length > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-base font-semibold text-txt-primary mb-4">Investment Snapshot</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-txt-secondary mb-1">Invested</div>
                <div className="font-mono text-lg font-semibold text-txt-primary">{formatCurrency(totalInvested)}</div>
              </div>
              <div>
                <div className="text-xs text-txt-secondary mb-1">Current</div>
                <div className="font-mono text-lg font-semibold text-txt-primary">{formatCurrency(totalCurrent)}</div>
              </div>
              <div>
                <div className="text-xs text-txt-secondary mb-1">ROI</div>
                <div className={`font-mono text-lg font-semibold ${getROI(totalInvested, totalCurrent) >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {getROI(totalInvested, totalCurrent) >= 0 ? '+' : ''}{getROI(totalInvested, totalCurrent).toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
