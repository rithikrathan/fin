import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import type { AppState, ReportData, Transaction, BalanceTransaction, BalanceLineItem, BalanceAccount } from '../types';
import { formatCurrency } from './helpers';

function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

function fundName(state: AppState, id: number): string {
  return state.funds.find((f) => f.id === id)?.name || String(id);
}

export function exportTransactionsCSV(transactions: Transaction[], state: AppState) {
  const header = 'Date,Type,Name/Description,Amount,Fund,Category,Notes';
  const rows = transactions.map((t) => {
    if (t.type === 'income') {
      const alloc = Object.entries(t.fund_allocation)
        .map(([id, amt]) => `${fundName(state, Number(id))}: ${amt}`)
        .join('; ');
      return `"${t.date}","Income","${t.name}",${t.amount},"${alloc}","${t.category}","${t.notes}"`;
    }
    if (t.type === 'expense') {
      return `"${t.date}","Expense","${t.description}",${t.amount},"${t.fund_name}","${t.category}","${t.is_misc ? 'misc' : ''}"`;
    }
    return `"${t.date}","Transfer","${t.note}",${t.amount},"${fundName(state, t.from_fund_id)} → ${fundName(state, t.to_fund_id)}","",""`;
  });
  const csv = [header, ...rows].join('\n');
  saveAs(new Blob([csv], { type: 'text/csv' }), `transactions-${dateStamp()}.csv`);
}

export function exportTransactionsPDF(transactions: Transaction[], state: AppState) {
  const rows = transactions.map((t) => {
    let type = '', name = '', amount = '', fund = '', category = '';
    if (t.type === 'income') {
      type = 'Income';
      name = t.name;
      amount = `+${formatCurrency(t.amount)}`;
      fund = Object.entries(t.fund_allocation).map(([id, amt]) => `${fundName(state, Number(id))}: ${amt}`).join(', ');
      category = t.category;
    } else if (t.type === 'expense') {
      type = 'Expense';
      name = t.description;
      amount = `-${formatCurrency(t.amount)}`;
      fund = t.fund_name;
      category = t.category;
    } else {
      type = 'Transfer';
      name = t.note;
      amount = formatCurrency(t.amount);
      fund = `${fundName(state, t.from_fund_id)} → ${fundName(state, t.to_fund_id)}`;
    }
    return [t.date, type, name, amount, fund, category];
  });

  exportTablePDF({
    title: 'Transactions',
    subtitle: `${transactions.length} transactions · Generated ${dateStamp()}`,
    filename: `transactions-${dateStamp()}.pdf`,
    sections: [
      {
        head: ['Date', 'Type', 'Name', 'Amount', 'Fund', 'Category'],
        body: rows,
      },
    ],
  });
}

export function exportReportPDF(report: ReportData, funds: AppState['funds']) {
  const byFundRows = funds.map((f) => [f.name, formatCurrency(report.by_fund[f.name] || 0)]);
  const byCategoryRows = Object.entries(report.by_category)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [cat, formatCurrency(amt)]);

  exportTablePDF({
    title: 'Account Balance Statement',
    subtitle: `${report.period.start} — ${report.period.end} · Generated ${dateStamp()}`,
    filename: `report-${report.period.start}_${report.period.end}.pdf`,
    sections: [
      {
        heading: 'Summary',
        body: [
          ['Inflows', formatCurrency(report.total_income)],
          ['Outflows', formatCurrency(report.total_expenses)],
          ['Net cashflow', formatCurrency(report.net)],
          ['Transactions', String(report.transaction_count)],
        ],
      },
      {
        heading: 'Expenses Intent Breakdown',
        body: [
          ['Planned (Budgeted)', formatCurrency(report.planned_total)],
          ['Unplanned (Impulse)', formatCurrency(report.unplanned_total)],
        ],
      },
      {
        heading: 'Expenses by Fund Source',
        body: byFundRows,
      },
      {
        heading: 'Expenses by Category',
        body: byCategoryRows,
      },
    ],
  });
}

export function exportBalanceStatementPDF(params: {
  account: BalanceAccount;
  transactions: BalanceTransaction[];
  lineItems: BalanceLineItem[];
}) {
  const { account, transactions, lineItems } = params;
  const rows = transactions.map((tx) => {
    const items = lineItems.filter((li) => li.transaction_id === tx.id);
    const detail =
      items.length > 0
        ? items.map((i) => `${i.item_name} (${i.count_qty} × ${formatCurrency(i.unit_cost)})`).join(', ')
        : tx.notes || 'Payment Logged';
    return [
      tx.date,
      tx.type,
      tx.reference_number || '-',
      detail,
      `${tx.type === 'Addition' ? '+' : '-'}${formatCurrency(tx.transaction_total)}`,
    ];
  });

  exportTablePDF({
    title: account.title,
    subtitle: `Total due ${formatCurrency(account.total_due)} · Status: ${account.status} · Generated ${dateStamp()}`,
    filename: `${account.title.replace(/\s+/g, '_')}_ledger-${dateStamp()}.pdf`,
    sections: [
      {
        head: ['Date', 'Type', 'Reference', 'Details / Items', 'Amount'],
        body: rows,
      },
    ],
  });
}

function exportTablePDF(opts: {
  title: string;
  subtitle?: string;
  filename: string;
  sections: {
    heading?: string;
    head?: string[];
    body: (string | number)[][];
  }[];
}) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(15);
  doc.text(opts.title, 14, 16);
  if (opts.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(opts.subtitle, 14, 23);
  }

  let startY = opts.subtitle ? 28 : 20;
  for (const section of opts.sections) {
    if (section.heading) {
      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text(section.heading, 14, startY + 4);
      startY += 10;
    }
    autoTable(doc, {
      startY,
      head: section.head ? [section.head] : undefined,
      body: section.body.map((r) => r.map((c) => String(c))),
      styles: { fontSize: 9, cellPadding: 2.2 },
      headStyles: { fillColor: [255, 42, 42], textColor: 255, fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  doc.save(opts.filename);
}
