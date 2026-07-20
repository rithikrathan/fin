import Database from '@tauri-apps/plugin-sql';
import type { Fund, Milestone, FundSnapshot, Transaction, Want, Need, Investment, Debt, SavedReport, Settings, IncomeTransaction, ExpenseTransaction, MessagePattern, SmsLog, DetectedTransaction } from '../types/index.ts';
import { initialState } from '../context/initialState.ts';
import type { StorageService, StorageState } from './StorageService.ts';
import schemaSql from './schema.sql?raw';

const DB_PATH = 'sqlite:finmanager.db';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load(DB_PATH);
  return db;
}

async function ensureSchema(): Promise<void> {
  const d = await getDb();
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await d.execute(stmt + ';');
  }
}

function rowToNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
}

function rowToBool(val: unknown): boolean {
  return val === 1 || val === true;
}

function rowToOptionalString(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null;
  return String(val);
}

function parseFund(r: Record<string, unknown>): Fund {
  return {
    id: rowToNumber(r.id),
    name: String(r.name),
    balance: rowToNumber(r.balance),
    allocation_pct: rowToNumber(r.allocation_pct),
    allocation_locked: rowToBool(r.allocation_locked),
    color: String(r.color),
    deadline: rowToOptionalString(r.deadline),
    goal_amount: r.goal_amount != null ? rowToNumber(r.goal_amount) : null,
    interest_rate: r.interest_rate != null ? rowToNumber(r.interest_rate) : null,
    interest_frequency: rowToOptionalString(r.interest_frequency) as Fund['interest_frequency'],
    interest_calc_type: rowToOptionalString(r.interest_calc_type) as Fund['interest_calc_type'],
    is_career_fund: rowToBool(r.is_career_fund),
  };
}

function parseSnapshot(r: Record<string, unknown>): FundSnapshot {
  return {
    id: rowToNumber(r.id),
    fund_id: rowToNumber(r.fund_id),
    balance: rowToNumber(r.balance),
    date: String(r.date),
  };
}

function parseMilestone(r: Record<string, unknown>): Milestone {
  return {
    id: rowToNumber(r.id),
    fund_id: rowToNumber(r.fund_id),
    name: String(r.name),
    target_amount: rowToNumber(r.target_amount),
    reached: rowToBool(r.reached),
  };
}

function parseTransaction(r: Record<string, unknown>): Transaction {
  const type = String(r.type);

  if (type === 'income') {
    return {
      id: rowToNumber(r.id),
      type: 'income',
      name: String(r.name || ''),
      amount: rowToNumber(r.amount),
      income_type: String(r.income_type || 'monthly') as IncomeTransaction['income_type'],
      category: String(r.category || ''),
      date: String(r.date),
      notes: String(r.notes || ''),
      fund_allocation: r.fund_allocation ? JSON.parse(String(r.fund_allocation)) : {},
      file_id: rowToOptionalString(r.file_id),
      file_name: rowToOptionalString(r.file_name),
    };
  }

  if (type === 'expense') {
    return {
      id: rowToNumber(r.id),
      type: 'expense',
      description: String(r.description || ''),
      amount: rowToNumber(r.amount),
      category: String(r.category || ''),
      fund_id: rowToNumber(r.fund_id),
      fund_name: String(r.fund_name || ''),
      planned: rowToBool(r.planned),
      date: String(r.date),
      is_misc: rowToBool(r.is_misc),
      notes: String(r.notes || ''),
      file_id: rowToOptionalString(r.file_id),
      file_name: rowToOptionalString(r.file_name),
    };
  }

  return {
    id: rowToNumber(r.id),
    type: 'transfer',
    from_fund_id: rowToNumber(r.from_fund_id),
    to_fund_id: rowToNumber(r.to_fund_id),
    amount: rowToNumber(r.amount),
    date: String(r.date),
    note: String(r.note || ''),
    file_id: rowToOptionalString(r.file_id),
    file_name: rowToOptionalString(r.file_name),
  };
}

function parseWant(r: Record<string, unknown>): Want {
  return {
    id: rowToNumber(r.id),
    name: String(r.name),
    target_price: rowToNumber(r.target_price),
    current_saved: rowToNumber(r.current_saved),
    category: String(r.category),
    priority: rowToNumber(r.priority) as 0 | 1 | 2,
    purchased: rowToBool(r.purchased),
    purchase_date: rowToOptionalString(r.purchase_date),
    notes: String(r.notes || ''),
    days_to_buy: r.days_to_buy != null ? rowToNumber(r.days_to_buy) : null,
    predicted_date: rowToOptionalString(r.predicted_date),
    photo_url: rowToOptionalString(r.photo_url),
    purchase_link: rowToOptionalString(r.purchase_link),
    added_at: String(r.added_at),
    no_lock: rowToBool(r.no_lock),
  };
}

function parseNeed(r: Record<string, unknown>): Need {
  return {
    id: rowToNumber(r.id),
    name: String(r.name),
    amount: rowToNumber(r.amount),
    category: String(r.category),
    recurring: rowToBool(r.recurring),
    frequency: rowToOptionalString(r.frequency) as Need['frequency'],
    due_date: rowToOptionalString(r.due_date),
    fund_id: rowToNumber(r.fund_id),
    fund_name: String(r.fund_name),
    autopay: rowToBool(r.autopay),
    notes: String(r.notes || ''),
    active: rowToBool(r.active),
    reapproval_required: rowToBool(r.reapproval_required),
  };
}

function parseInvestment(r: Record<string, unknown>): Investment {
  return {
    id: rowToNumber(r.id),
    name: String(r.name),
    asset_type: String(r.asset_type) as Investment['asset_type'],
    invest_amount: rowToNumber(r.invest_amount),
    current_value: rowToNumber(r.current_value),
    purchase_date: String(r.purchase_date),
    notes: String(r.notes || ''),
  };
}

function parseDebt(r: Record<string, unknown>): Debt {
  return {
    id: rowToNumber(r.id),
    name: String(r.name),
    total_principal: rowToNumber(r.total_principal),
    remaining_balance: rowToNumber(r.remaining_balance),
    emi_amount: rowToNumber(r.emi_amount),
    interest_rate: rowToNumber(r.interest_rate),
    due_date: rowToNumber(r.due_date),
    linked_fund_id: rowToNumber(r.linked_fund_id),
    notes: String(r.notes || ''),
    active: rowToBool(r.active),
  };
}

function parseReport(r: Record<string, unknown>): SavedReport {
  return {
    id: rowToNumber(r.id),
    name: String(r.name),
    period_start: String(r.period_start),
    period_end: String(r.period_end),
    generated_at: String(r.generated_at),
    data: JSON.parse(String(r.data)),
  };
}

function parseMessagePattern(r: Record<string, unknown>): MessagePattern {
  return {
    id: String(r.id),
    name: String(r.name),
    source_app: rowToOptionalString(r.source_app),
    example_sms: String(r.example_sms || ''),
    field_selectors: JSON.parse(String(r.field_selectors || '[]')),
    full_regex: String(r.full_regex || ''),
    message_type: String(r.message_type || 'transaction') as MessagePattern['message_type'],
    enabled: rowToBool(r.enabled),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function parseSmsLog(r: Record<string, unknown>): SmsLog {
  return {
    id: String(r.id),
    message_text: String(r.message_text),
    message_source: rowToOptionalString(r.message_source),
    timestamp: String(r.timestamp),
    pattern_id: rowToOptionalString(r.pattern_id),
    matched: rowToBool(r.matched),
    parsed_fields: JSON.parse(String(r.parsed_fields || '{}')),
    transaction_id: r.transaction_id != null ? rowToNumber(r.transaction_id) : null,
    dismissed: rowToBool(r.dismissed),
    notification_id: rowToOptionalString(r.notification_id),
  };
}

function parseDetectedTx(r: Record<string, unknown>): DetectedTransaction {
  return {
    id: String(r.id),
    sms_log_id: String(r.sms_log_id),
    amount: rowToNumber(r.amount),
    type: String(r.tx_type) as DetectedTransaction['type'],
    account_number: rowToOptionalString(r.account_number),
    bank_name: rowToOptionalString(r.bank_name),
    merchant: rowToOptionalString(r.merchant),
    date: String(r.date),
    balance_after: r.balance_after != null ? rowToNumber(r.balance_after) : null,
    fund_id: r.fund_id != null ? rowToNumber(r.fund_id) : null,
    category: rowToOptionalString(r.category),
    notes: String(r.notes || ''),
    status: String(r.status || 'detected') as DetectedTransaction['status'],
    created_transaction_id: r.created_transaction_id != null ? rowToNumber(r.created_transaction_id) : null,
  };
}

export class TauriStorageService implements StorageService {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await ensureSchema();
    this.initialized = true;
  }

  async loadState(): Promise<StorageState> {
    await this.init();
    const d = await getDb();

    const [fundRows, snapshotRows, milestoneRows, txRows, wantRows, needRows, invRows, debtRows, settingRows, reportRows, patternRows, smsRows, detRows] = await Promise.all([
      d.select<Fund[]>('SELECT * FROM funds'),
      d.select<FundSnapshot[]>('SELECT * FROM fund_snapshots'),
      d.select<Milestone[]>('SELECT * FROM milestones'),
      d.select<Record<string, unknown>[]>('SELECT * FROM transactions ORDER BY date DESC'),
      d.select<Want[]>('SELECT * FROM wants'),
      d.select<Need[]>('SELECT * FROM needs'),
      d.select<Investment[]>('SELECT * FROM investments'),
      d.select<Debt[]>('SELECT * FROM debts'),
      d.select<{ key: string; value: string }[]>('SELECT * FROM settings'),
      d.select<SavedReport[]>('SELECT * FROM reports'),
      d.select<Record<string, unknown>[]>('SELECT * FROM message_patterns'),
      d.select<Record<string, unknown>[]>('SELECT * FROM sms_logs'),
      d.select<Record<string, unknown>[]>('SELECT * FROM detected_transactions'),
    ]);

    const settings: Settings = { ...initialState.settings };
    for (const row of settingRows) {
      try {
        (settings as unknown as Record<string, unknown>)[row.key] = JSON.parse(row.value);
      } catch {
        (settings as unknown as Record<string, unknown>)[row.key] = row.value;
      }
    }

    const state: StorageState = {
      funds: (fundRows as unknown as Record<string, unknown>[]).map(parseFund),
      fund_snapshots: (snapshotRows as unknown as Record<string, unknown>[]).map(parseSnapshot),
      milestones: (milestoneRows as unknown as Record<string, unknown>[]).map(parseMilestone),
      transactions: (txRows as Record<string, unknown>[]).map(parseTransaction),
      wants: (wantRows as unknown as Record<string, unknown>[]).map(parseWant),
      needs: (needRows as unknown as Record<string, unknown>[]).map(parseNeed),
      investments: (invRows as unknown as Record<string, unknown>[]).map(parseInvestment),
      debts: (debtRows as unknown as Record<string, unknown>[]).map(parseDebt),
      reports: (reportRows as unknown as Record<string, unknown>[]).map(parseReport),
      settings,
      message_patterns: patternRows.map(parseMessagePattern),
      sms_logs: smsRows.map(parseSmsLog),
      detected_transactions: detRows.map(parseDetectedTx),
    };

    if (state.funds.length === 0) return initialState;
    return state;
  }

  async saveState(state: StorageState): Promise<void> {
    await this.init();
    const d = await getDb();

    await d.execute('DELETE FROM funds');
    for (const f of state.funds) {
      await d.execute(
        'INSERT INTO funds (id, name, balance, allocation_pct, allocation_locked, color, deadline, goal_amount, interest_rate, interest_frequency, interest_calc_type, is_career_fund) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [f.id, f.name, f.balance, f.allocation_pct, f.allocation_locked ? 1 : 0, f.color, f.deadline, f.goal_amount, f.interest_rate, f.interest_frequency, f.interest_calc_type, f.is_career_fund ? 1 : 0]
      );
    }

    await d.execute('DELETE FROM milestones');
    for (const m of state.milestones) {
      await d.execute(
        'INSERT INTO milestones (id, fund_id, name, target_amount, reached) VALUES ($1,$2,$3,$4,$5)',
        [m.id, m.fund_id, m.name, m.target_amount, m.reached ? 1 : 0]
      );
    }

    await d.execute('DELETE FROM fund_snapshots');
    for (const s of state.fund_snapshots) {
      await d.execute(
        'INSERT INTO fund_snapshots (id, fund_id, balance, date) VALUES ($1,$2,$3,$4)',
        [s.id, s.fund_id, s.balance, s.date]
      );
    }

    await d.execute('DELETE FROM transactions');
    for (const tx of state.transactions) {
      const notes = tx.type !== 'transfer' ? (tx as IncomeTransaction | ExpenseTransaction).notes : '';
      const base = [tx.id, tx.type, tx.date, notes, tx.file_id, tx.file_name];
      if (tx.type === 'income') {
        await d.execute(
          'INSERT INTO transactions (id, type, date, notes, file_id, file_name, name, amount, income_type, category, fund_allocation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
          [...base, tx.name, tx.amount, tx.income_type, tx.category, JSON.stringify(tx.fund_allocation)]
        );
      } else if (tx.type === 'expense') {
        await d.execute(
          'INSERT INTO transactions (id, type, date, notes, file_id, file_name, description, amount, category, fund_id, fund_name, planned, is_misc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
          [...base, tx.description, tx.amount, tx.category, tx.fund_id, tx.fund_name, tx.planned ? 1 : 0, tx.is_misc ? 1 : 0]
        );
      } else {
        await d.execute(
          'INSERT INTO transactions (id, type, date, notes, file_id, file_name, from_fund_id, to_fund_id, amount, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
          [...base, tx.from_fund_id, tx.to_fund_id, tx.amount, tx.note]
        );
      }
    }

    await d.execute('DELETE FROM wants');
    for (const w of state.wants) {
      await d.execute(
        'INSERT INTO wants (id, name, target_price, current_saved, category, priority, purchased, purchase_date, notes, days_to_buy, predicted_date, photo_url, purchase_link, added_at, no_lock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
        [w.id, w.name, w.target_price, w.current_saved, w.category, w.priority, w.purchased ? 1 : 0, w.purchase_date, w.notes, w.days_to_buy, w.predicted_date, w.photo_url, w.purchase_link, w.added_at, w.no_lock ? 1 : 0]
      );
    }

    await d.execute('DELETE FROM needs');
    for (const n of state.needs) {
      await d.execute(
        'INSERT INTO needs (id, name, amount, category, recurring, frequency, due_date, fund_id, fund_name, autopay, notes, active, reapproval_required) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
        [n.id, n.name, n.amount, n.category, n.recurring ? 1 : 0, n.frequency, n.due_date, n.fund_id, n.fund_name, n.autopay ? 1 : 0, n.notes, n.active ? 1 : 0, n.reapproval_required ? 1 : 0]
      );
    }

    await d.execute('DELETE FROM investments');
    for (const i of state.investments) {
      await d.execute(
        'INSERT INTO investments (id, name, asset_type, invest_amount, current_value, purchase_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [i.id, i.name, i.asset_type, i.invest_amount, i.current_value, i.purchase_date, i.notes]
      );
    }

    await d.execute('DELETE FROM debts');
    for (const db of state.debts) {
      await d.execute(
        'INSERT INTO debts (id, name, total_principal, remaining_balance, emi_amount, interest_rate, due_date, linked_fund_id, notes, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [db.id, db.name, db.total_principal, db.remaining_balance, db.emi_amount, db.interest_rate, db.due_date, db.linked_fund_id, db.notes, db.active ? 1 : 0]
      );
    }

    await d.execute('DELETE FROM settings');
    const settingsObj = state.settings as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(settingsObj)) {
      await d.execute('INSERT INTO settings (key, value) VALUES ($1, $2)', [key, JSON.stringify(value)]);
    }

    await d.execute('DELETE FROM reports');
    for (const r of state.reports) {
      await d.execute(
        'INSERT INTO reports (id, name, period_start, period_end, generated_at, data) VALUES ($1,$2,$3,$4,$5,$6)',
        [r.id, r.name, r.period_start, r.period_end, r.generated_at, JSON.stringify(r.data)]
      );
    }

    await d.execute('DELETE FROM message_patterns');
    for (const p of state.message_patterns) {
      await d.execute(
        'INSERT INTO message_patterns (id, name, source_app, example_sms, field_selectors, full_regex, message_type, enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [p.id, p.name, p.source_app, p.example_sms, JSON.stringify(p.field_selectors), p.full_regex, p.message_type, p.enabled ? 1 : 0, p.created_at, p.updated_at]
      );
    }

    await d.execute('DELETE FROM sms_logs');
    for (const s of state.sms_logs) {
      await d.execute(
        'INSERT INTO sms_logs (id, message_text, message_source, timestamp, pattern_id, matched, parsed_fields, transaction_id, dismissed, notification_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [s.id, s.message_text, s.message_source, s.timestamp, s.pattern_id, s.matched ? 1 : 0, JSON.stringify(s.parsed_fields), s.transaction_id, s.dismissed ? 1 : 0, s.notification_id]
      );
    }

    await d.execute('DELETE FROM detected_transactions');
    for (const t of state.detected_transactions) {
      await d.execute(
        'INSERT INTO detected_transactions (id, sms_log_id, amount, tx_type, account_number, bank_name, merchant, date, balance_after, fund_id, category, notes, status, created_transaction_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
        [t.id, t.sms_log_id, t.amount, t.type, t.account_number, t.bank_name, t.merchant, t.date, t.balance_after, t.fund_id, t.category, t.notes, t.status, t.created_transaction_id]
      );
    }
  }

  async storeFile(id: string, blob: Blob): Promise<void> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const d = await getDb();
    await d.execute('INSERT OR REPLACE INTO files (id, data) VALUES ($1, $2)', [id, bytes]);
  }

  async getFile(id: string): Promise<Blob | null> {
    const d = await getDb();
    const rows = await d.select<{ id: string; data: Uint8Array }[]>('SELECT * FROM files WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    return new Blob([new Uint8Array(rows[0].data)]);
  }

  async removeFile(id: string): Promise<void> {
    const d = await getDb();
    await d.execute('DELETE FROM files WHERE id = $1', [id]);
  }

  async listFiles(): Promise<string[]> {
    const d = await getDb();
    const rows = await d.select<{ id: string }[]>('SELECT id FROM files');
    return rows.map((r) => r.id);
  }

  async exportZip(_state: StorageState): Promise<Blob> {
    throw new Error('Zip export not implemented for Tauri — use native filesystem backup instead');
  }

  async importZip(_file: File): Promise<StorageState> {
    throw new Error('Zip import not implemented for Tauri — use native filesystem restore instead');
  }

  async migrate(): Promise<boolean> {
    await this.init();
    return false;
  }
}
