import { useState, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { ReportData, ExpenseTransaction, SavedReport } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

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
  const [activeTab, setActiveTab] = useState<'spending' | 'statements'>('spending');
  
  // Statements tab states
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [showHistory, setShowHistory] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // General expense filter calculations (for Spending Breakdown tab)
  const expenses = useMemo(() => {
    return state.transactions
      .filter((t): t is ExpenseTransaction => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions]);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const planned = expenses.filter((e) => e.planned);
  const unplanned = expenses.filter((e) => !e.planned);
  const misc = expenses.filter((e) => e.is_misc);
  const miscTotal = misc.reduce((s, e) => s + e.amount, 0);

  const byCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const categories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxCat = categories[0]?.[1] || 1;

  // Monthly Statements tab calculations
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
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startStr = startDate.toISOString().split('T')[0];
  const report = computeReport(state.transactions, startStr);


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
      {/* Sliding Underline Tabs */}
      <div className="flex border-b border-white/[0.06] overflow-x-auto pb-px max-w-full hide-scrollbar">
        {[
          { id: 'spending', label: 'Spending Breakdown' },
          { id: 'statements', label: 'Monthly Statements' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-sm font-semibold transition-all relative shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'text-brand font-bold'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand shadow-glow animate-fadeIn" />
            )}
          </button>
        ))}
      </div>

      <div className="animate-fadeIn">
        {/* TAB 1: SPENDING BREAKDOWN */}
        {activeTab === 'spending' && (
          <div className="space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06] border-b border-white/[0.06] pb-6 gap-2 text-center sm:text-left">
              <div className="pr-4">
                <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Total Spent</div>
                <div className="font-mono text-xl font-bold text-loss">{formatCurrency(totalSpent)}</div>
              </div>
              <div className="px-4">
                <div className="text-[10px] text-txt-secondary uppercase tracking-widest mb-1 font-bold">Planned</div>
                <div className="font-mono text-xl font-bold text-blue-400">{formatCurrency(planned.reduce((s, e) => s + e.amount, 0))}</div>
              </div>
              <div className="px-4">
                <div className="text-[10px] text-txt-secondary uppercase tracking-widest mb-1 font-bold">Unplanned</div>
                <div className="font-mono text-xl font-bold text-amber-400">{formatCurrency(unplanned.reduce((s, e) => s + e.amount, 0))}</div>
              </div>
              <div className="pl-4">
                <div className="text-[10px] text-txt-secondary uppercase tracking-widest mb-1 font-bold">Miscellaneous</div>
                <div className="font-mono text-xl font-bold text-txt-primary">{formatCurrency(miscTotal)}</div>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="py-12 text-center text-sm text-txt-secondary italic">
                No expense transactions recorded to display categories.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.04]">
                    Expenses By Category
                  </h3>
                  <div className="space-y-3">
                    {categories.map(([cat, amt]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-txt-primary capitalize">{cat}</span>
                          <span className="font-mono text-txt-secondary">{formatCurrency(amt)}</span>
                        </div>
                        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${(amt / maxCat) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funds */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.04]">
                    Expenses By Fund source
                  </h3>
                  <div className="space-y-3">
                    {state.funds.map((f) => {
                      const amt = expenses.filter((e) => e.fund_id === f.id).reduce((s, e) => s + e.amount, 0);
                      return (
                        <div key={f.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                              <span className="text-txt-primary capitalize">{f.name}</span>
                            </div>
                            <span className="font-mono text-txt-secondary">{formatCurrency(amt)}</span>
                          </div>
                          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${totalSpent ? (amt / totalSpent) * 100 : 0}%`,
                                backgroundColor: f.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MONTHLY STATEMENTS */}
        {activeTab === 'statements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex gap-2 flex-wrap">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setReportType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      reportType === t
                        ? 'bg-brand/10 text-brand border border-brand/20 animate-pulse-slow'
                        : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap shrink-0">
                <Button variant="secondary" size="sm" onClick={() => setShowHistory((h) => !h)}>
                  History ({state.reports.length})
                </Button>
                <Button variant="secondary" size="sm" onClick={saveReport}>
                  Save Report
                </Button>
                <Button variant="primary" size="sm" onClick={printReport}>
                  Print / Export
                </Button>
              </div>
            </div>

            {showHistory && (
              <div className="space-y-3 p-4 border border-white/[0.06] rounded-xl bg-white/[0.01]">
                <h4 className="text-xs uppercase tracking-wider font-bold text-txt-primary mb-1">Report History</h4>
                {state.reports.length === 0 ? (
                  <p className="text-xs text-txt-secondary py-2 italic text-center">No saved reports found.</p>
                ) : (
                  <div className="divide-y divide-white/[0.04] text-sm">
                    {state.reports.map((r) => (
                      <div key={r.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-txt-primary">{r.name}</div>
                          <div className="text-xs text-txt-secondary mt-0.5 font-mono">
                            {formatDate(r.period_start)} — {formatDate(r.period_end)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-base font-bold ${r.data.net >= 0 ? 'text-gain' : 'text-loss'}`}>
                            {formatCurrency(r.data.net)} net
                          </span>
                          <button
                            onClick={() => dispatch({ type: 'REMOVE_REPORT', payload: r.id })}
                            className="text-txt-secondary/40 hover:text-red-400 text-xs ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Printable Report body */}
            <div ref={reportRef} className="space-y-6">
              <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-txt-primary">Account Balance Statement</h3>
                  <div className="text-xs text-txt-secondary font-mono mt-0.5">
                    {formatDate(report.period.start)} — {formatDate(report.period.end)}
                  </div>
                </div>
                <div className="text-xs text-txt-secondary font-mono">
                  Generated {formatDate(new Date().toISOString())}
                </div>
              </div>

              {/* Stats values grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-[10px] text-txt-secondary uppercase tracking-widest mb-1.5">Inflows</div>
                  <div className="font-mono text-xl font-bold text-gain">{formatCurrency(report.total_income)}</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-[10px] text-txt-secondary uppercase tracking-widest mb-1.5">Outflows</div>
                  <div className="font-mono text-xl font-bold text-loss">{formatCurrency(report.total_expenses)}</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-[10px] text-txt-secondary uppercase tracking-widest mb-1.5">Net cashflow</div>
                  <div className={`font-mono text-xl font-bold ${report.net >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {formatCurrency(report.net)}
                  </div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-[10px] text-txt-secondary uppercase tracking-widest mb-1.5">Tx counts</div>
                  <div className="font-mono text-xl font-bold text-txt-primary">{report.transaction_count}</div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
                {/* Intent details */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-txt-secondary border-b border-white/[0.04] pb-2">
                    Expenses Intent Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-blue-400">Planned (Budgeted)</span>
                        <span className="font-mono text-txt-primary">{formatCurrency(report.planned_total)}</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400"
                          style={{ width: `${report.total_expenses ? (report.planned_total / report.total_expenses) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-amber-400">Unplanned (Impulse)</span>
                        <span className="font-mono text-txt-primary">{formatCurrency(report.unplanned_total)}</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${report.total_expenses ? (report.unplanned_total / report.total_expenses) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Funds details */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-txt-secondary border-b border-white/[0.04] pb-2">
                    Expenses Source Fund
                  </h4>
                  <div className="space-y-3">
                    {state.funds.map((f) => {
                      const amt = report.by_fund[f.name] || 0;
                      return (
                        <div key={f.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-txt-primary capitalize">{f.name}</span>
                            <span className="font-mono text-txt-secondary">{formatCurrency(amt)}</span>
                          </div>
                          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${report.total_expenses ? (amt / report.total_expenses) * 100 : 0}%`,
                                backgroundColor: f.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {Object.keys(report.by_category).length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-txt-secondary border-b border-white/[0.04] pb-2">
                    Expenses by category
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(report.by_category)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between text-xs border-b border-white/[0.03] pb-1.5">
                          <span className="text-txt-secondary capitalize">{cat}</span>
                          <span className="font-mono font-semibold text-txt-primary">{formatCurrency(amt)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
