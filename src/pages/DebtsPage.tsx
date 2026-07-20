import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Debt } from '../types';
import { formatCurrency, generateId, round2 } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const AXIS_COLOR = '#A1A1AA';

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#191919]/95 backdrop-blur-md border border-border-subtle rounded-xl px-4 py-3 shadow-xl">
      <div className="text-xs text-txt-secondary mb-2">{label || ''}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-sm font-mono font-semibold text-txt-primary">
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function DebtsPage() {
  const { state, dispatch } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [payoffDebt, setPayoffDebt] = useState<Debt | null>(null);

  const activeDebts = state.debts.filter((d) => d.active);
  const closedDebts = state.debts.filter((d) => !d.active);
  const totalRemaining = activeDebts.reduce((s, d) => s + d.remaining_balance, 0);
  const totalEmi = activeDebts.reduce((s, d) => s + d.emi_amount, 0);

  const paydownData = useMemo(() => {
    if (activeDebts.length === 0) return [];
    const months: { month: string; balance: number; interest: number }[] = [];
    let remaining = activeDebts.reduce((s, d) => s + d.remaining_balance, 0);
    let totalInterest = 0;
    months.push({ month: 'Now', balance: remaining, interest: 0 });

    for (let m = 1; m <= 60 && remaining > 0; m++) {
      const weightedRate = activeDebts.reduce((s, d) => s + (d.remaining_balance / (totalRemaining || 1)) * d.interest_rate, 0);
      const monthlyInterest = round2(remaining * (weightedRate / 100 / 12));
      const principalPaid = round2(totalEmi - monthlyInterest);
      totalInterest = round2(totalInterest + monthlyInterest);
      remaining = round2(Math.max(0, remaining - principalPaid));
      months.push({ month: `M${m}`, balance: remaining, interest: totalInterest });
    }
    return months;
  }, [activeDebts, totalRemaining, totalEmi]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Total Remaining</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-loss">{formatCurrency(totalRemaining)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Monthly EMI</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-txt-primary">{formatCurrency(totalEmi)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Active Debts</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-txt-primary">{activeDebts.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-txt-secondary uppercase tracking-widest mb-2">Closed</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-gain">{closedDebts.length}</div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-txt-primary">Active Debts</h3>
        <Button variant="primary" size="md" onClick={() => setFormOpen(true)}>+ Add Debt</Button>
      </div>

      {activeDebts.length === 0 ? (
        <EmptyState icon="▽" title="No active debts" description="Add loans, EMIs, or credit cards to track." action={{ label: '+ Add Debt', onClick: () => setFormOpen(true) }} />
      ) : (
        <div className="space-y-4">
          {activeDebts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} funds={state.funds} dispatch={dispatch} onEdit={() => setEditDebt(debt)} onPayoff={() => setPayoffDebt(debt)} />
          ))}
        </div>
      )}

      {paydownData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-txt-primary mb-4">Debt Paydown Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={paydownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="balance" name="Remaining" stroke="#FB923C" fill="#FB923C" fillOpacity={0.15} />
              <Area type="monotone" dataKey="interest" name="Total Interest" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {closedDebts.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-txt-secondary mt-8">Closed ({closedDebts.length})</h3>
          <div className="space-y-3">
            {closedDebts.map((debt) => (
              <Card key={debt.id} className="p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-txt-primary">{debt.name}</span>
                    <span className="text-xs text-txt-secondary ml-2">{formatCurrency(debt.total_principal)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge color="bg-gain/10 text-gain">Closed</Badge>
                    <button onClick={() => dispatch({ type: 'REMOVE_DEBT', payload: debt.id })} className="text-txt-secondary/40 hover:text-red-400 text-sm cursor-pointer">✕</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <DebtForm open={formOpen} onClose={() => setFormOpen(false)} funds={state.funds} dispatch={dispatch} />
      <DebtForm open={!!editDebt} onClose={() => setEditDebt(null)} funds={state.funds} dispatch={dispatch} debt={editDebt} />
      <EarlyPayoffModal debt={payoffDebt} onClose={() => setPayoffDebt(null)} />
    </div>
  );
}

function DebtCard({
  debt,
  funds,
  dispatch,
  onEdit,
  onPayoff,
}: {
  debt: Debt;
  funds: { id: number; name: string; balance: number; color: string }[];
  dispatch: React.Dispatch<import('../types').AppAction>;
  onEdit: () => void;
  onPayoff: () => void;
}) {
  const fund = funds.find((f) => f.id === debt.linked_fund_id);
  const paid = debt.total_principal - debt.remaining_balance;
  const pct = debt.total_principal > 0 ? (paid / debt.total_principal) * 100 : 0;
  const canPay = fund ? fund.balance >= debt.emi_amount : false;

  const monthlyInterest = round2(debt.remaining_balance * (debt.interest_rate / 100 / 12));
  const monthsLeft = debt.emi_amount > monthlyInterest ? Math.ceil(debt.remaining_balance / (debt.emi_amount - monthlyInterest)) : 999;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h4 className="text-lg font-semibold text-txt-primary">{debt.name}</h4>
          <div className="text-sm text-txt-secondary">{debt.notes}</div>
        </div>
        <Badge color="bg-blue-500/10 text-blue-400">{`${debt.interest_rate}% APR`}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-xs text-txt-secondary">Remaining</div>
          <div className="font-mono text-lg font-bold text-loss">{formatCurrency(debt.remaining_balance)}</div>
        </div>
        <div>
          <div className="text-xs text-txt-secondary">EMI</div>
          <div className="font-mono text-lg font-bold text-txt-primary">{formatCurrency(debt.emi_amount)}</div>
        </div>
        <div>
          <div className="text-xs text-txt-secondary">Months Left</div>
          <div className="font-mono text-lg font-bold text-txt-primary">{monthsLeft}</div>
        </div>
      </div>

      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs text-txt-secondary mb-4">
        <span>Paid: {formatCurrency(paid)}</span>
        <span>Due: day {debt.due_date} · {fund?.name || '—'} fund</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="primary" disabled={!canPay} onClick={() => dispatch({ type: 'PAY_DEBT_EMI', payload: { debt_id: debt.id } })}>
          Pay EMI
        </Button>
        <Button size="sm" variant="secondary" onClick={onPayoff}>
          Early Payoff
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'REMOVE_DEBT', payload: debt.id })}>
          ✕
        </Button>
      </div>

      {!canPay && (
        <div className="text-xs text-loss mt-2">Insufficient balance in {fund?.name || 'linked'} fund</div>
      )}
    </Card>
  );
}

function DebtForm({
  open,
  onClose,
  funds,
  dispatch,
  debt,
}: {
  open: boolean;
  onClose: () => void;
  funds: { id: number; name: string; balance: number }[];
  dispatch: React.Dispatch<import('../types').AppAction>;
  debt?: Debt | null;
}) {
  const [name, setName] = useState(debt?.name || '');
  const [principal, setPrincipal] = useState(debt ? String(debt.total_principal) : '');
  const [remaining, setRemaining] = useState(debt ? String(debt.remaining_balance) : '');
  const [emi, setEmi] = useState(debt ? String(debt.emi_amount) : '');
  const [rate, setRate] = useState(debt ? String(debt.interest_rate) : '');
  const [dueDay, setDueDay] = useState(debt ? String(debt.due_date) : '1');
  const [fundId, setFundId] = useState(debt?.linked_fund_id || funds[0]?.id || 1);
  const [notes, setNotes] = useState(debt?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(principal);
    const r = parseFloat(remaining);
    const emiAmt = parseFloat(emi);
    const rateVal = parseFloat(rate);
    if (!name || isNaN(p) || p <= 0 || isNaN(r) || isNaN(emiAmt) || isNaN(rateVal)) return;

    const payload: Debt = {
      id: debt?.id ?? generateId(),
      name,
      total_principal: p,
      remaining_balance: r,
      emi_amount: emiAmt,
      interest_rate: rateVal,
      due_date: parseInt(dueDay) || 1,
      linked_fund_id: fundId,
      notes,
      active: r > 0,
    };

    dispatch({ type: debt ? 'UPDATE_DEBT' : 'ADD_DEBT', payload });
    setName(''); setPrincipal(''); setRemaining(''); setEmi(''); setRate(''); setDueDay('1'); setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={debt ? 'Edit Debt' : 'Add Debt'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home Loan, Car EMI" className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Total Principal (₹)</label>
            <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} min="0" className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Remaining (₹)</label>
            <input type="number" value={remaining} onChange={(e) => setRemaining(e.target.value)} min="0" className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">EMI (₹)</label>
            <input type="number" value={emi} onChange={(e) => setEmi(e.target.value)} min="0" className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Interest Rate (%)</label>
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} min="0" step="0.1" className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Due Day of Month</label>
            <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} min="1" max="31" className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Linked Fund</label>
            <select value={fundId} onChange={(e) => setFundId(Number(e.target.value))} className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary outline-none focus:border-brand/50 transition-colors">
              {funds.map((f) => (
                <option key={f.id} value={f.id}>{f.name} — {formatCurrency(f.balance)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{debt ? 'Save' : 'Add Debt'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EarlyPayoffModal({
  debt,
  onClose,
}: {
  debt: Debt | null;
  onClose: () => void;
}) {
  const [extraPayment, setExtraPayment] = useState('');

  if (!debt) return null;

  const extra = parseFloat(extraPayment) || 0;
  const totalPayment = debt.emi_amount + extra;
  const monthlyInterestRate = debt.interest_rate / 100 / 12;

  const baseline = (() => {
    let rem = debt.remaining_balance;
    let months = 0;
    let totalInterest = 0;
    while (rem > 0 && months < 600) {
      const interest = rem * monthlyInterestRate;
      totalInterest += interest;
      const principalPaid = Math.min(debt.emi_amount - interest, rem);
      rem -= principalPaid;
      months++;
    }
    return { months, totalInterest: round2(totalInterest) };
  })();

  const earlyPayoff = (() => {
    let rem = debt.remaining_balance;
    let months = 0;
    let totalInterest = 0;
    while (rem > 0 && months < 600) {
      const interest = rem * monthlyInterestRate;
      totalInterest += interest;
      const principalPaid = Math.min(totalPayment - interest, rem);
      rem -= principalPaid;
      months++;
    }
    return { months, totalInterest: round2(totalInterest) };
  })();

  const savedMonths = baseline.months - earlyPayoff.months;
  const savedInterest = round2(baseline.totalInterest - earlyPayoff.totalInterest);

  return (
    <Modal open={!!debt} onClose={onClose} title={`Early Payoff: ${debt.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">Extra Monthly Payment (₹)</label>
          <input
            type="number"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <div className="text-xs text-txt-secondary mb-1">Baseline ({formatCurrency(debt.emi_amount)}/mo)</div>
            <div className="font-mono text-sm text-txt-primary">{baseline.months} months</div>
            <div className="text-xs text-txt-secondary">Interest: {formatCurrency(baseline.totalInterest)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <div className="text-xs text-txt-secondary mb-1">With Extra ({formatCurrency(totalPayment)}/mo)</div>
            <div className="font-mono text-sm text-gain">{earlyPayoff.months} months</div>
            <div className="text-xs text-txt-secondary">Interest: {formatCurrency(earlyPayoff.totalInterest)}</div>
          </div>
        </div>

        {extra > 0 && (
          <div className="p-3 rounded-lg bg-gain/5 border border-gain/20">
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Months saved</span>
              <span className="font-mono font-bold text-gain">{savedMonths}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Interest saved</span>
              <span className="font-mono font-bold text-gain">{formatCurrency(savedInterest)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
