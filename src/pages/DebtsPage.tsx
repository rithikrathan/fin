import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Debt } from '../types';
import { formatCurrency, generateId, round2 } from '../utils/helpers';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import Select from '../components/shared/Select';
import FloatingAddButton from '../components/shared/FloatingAddButton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Landmark } from 'lucide-react';

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

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Flattened summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06] border-b border-white/[0.06] pb-6 gap-2 text-center sm:text-left">
        <div className="pr-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Total Remaining</div>
          <div className="font-mono text-xl font-bold text-loss">{formatCurrency(totalRemaining)}</div>
        </div>
        <div className="px-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Monthly EMI</div>
          <div className="font-mono text-xl font-bold text-txt-primary">{formatCurrency(totalEmi)}</div>
        </div>
        <div className="px-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Active Debts</div>
          <div className="font-mono text-xl font-bold text-txt-primary">{activeDebts.length}</div>
        </div>
        <div className="pl-4">
          <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Closed</div>
          <div className="font-mono text-xl font-bold text-gain">{closedDebts.length}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">Active Debts</h3>
        <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} className="hidden lg:flex">+ Add Debt</Button>
      </div>

      {activeDebts.length === 0 ? (
        <EmptyState icon={<Landmark className="w-8 h-8 text-brand" />} title="No active debts" description="Add loans, EMIs, or credit cards to track." />
      ) : (
        <div className="space-y-3">
          {activeDebts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} funds={state.funds} dispatch={dispatch} onEdit={() => setEditDebt(debt)} onPayoff={() => setPayoffDebt(debt)} />
          ))}
        </div>
      )}

      {paydownData.length > 0 && (
        <div className="space-y-4">
          <div className="border-b border-white/[0.06] pb-2">
            <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">
              Debt Paydown Projection
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
            <AreaChart data={paydownData} margin={{ top: 10, right: isMobile ? 15 : 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: AXIS_COLOR, fontSize: 10 }} interval={isMobile ? 2 : 0} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 10 }} width={isMobile ? 40 : 60} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="balance" name="Remaining" stroke="#FB923C" fill="#FB923C" fillOpacity={0.15} />
              <Area type="monotone" dataKey="interest" name="Total Interest" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {closedDebts.length > 0 && (
        <>
          <div className="border-b border-white/[0.06] pb-2 mt-8">
            <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary">
              Closed ({closedDebts.length})
            </h3>
          </div>
          <div className="space-y-3">
            {closedDebts.map((debt) => (
              <div key={debt.id} className="py-3 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between opacity-60">
                <div>
                  <span className="text-sm font-medium text-txt-primary">{debt.name}</span>
                  <span className="text-xs text-txt-secondary ml-2">{formatCurrency(debt.total_principal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="bg-gain/10 text-gain">Closed</Badge>
                  <button onClick={() => dispatch({ type: 'REMOVE_DEBT', payload: debt.id })} className="text-txt-secondary/40 hover:text-red-400 text-sm cursor-pointer">✕</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <DebtForm open={formOpen} onClose={() => setFormOpen(false)} funds={state.funds} dispatch={dispatch} />
      <DebtForm open={!!editDebt} onClose={() => setEditDebt(null)} funds={state.funds} dispatch={dispatch} debt={editDebt} />
      <EarlyPayoffModal debt={payoffDebt} onClose={() => setPayoffDebt(null)} />
      <FloatingAddButton onClick={() => setFormOpen(true)} />
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
    <div className="py-4 px-3 rounded-xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-bold text-txt-primary truncate">{debt.name}</h4>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-txt-secondary">
            {debt.interest_rate}% APR
          </span>
          {debt.notes && <span className="text-xs text-txt-secondary italic truncate max-w-48">"{debt.notes}"</span>}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-txt-secondary">
          <span>Remaining: <span className="font-mono font-bold text-loss">{formatCurrency(debt.remaining_balance)}</span></span>
          <span>EMI: <span className="font-mono font-bold text-txt-primary">{formatCurrency(debt.emi_amount)}</span></span>
          <span>Months: <span className="font-mono font-bold text-txt-primary">{monthsLeft}</span></span>
          <span>Due: day {debt.due_date} · <span className="text-txt-primary capitalize">{fund?.name || '—'}</span></span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-xs h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <span className="text-[10px] font-mono text-txt-secondary">
            {formatCurrency(paid)} / {formatCurrency(debt.total_principal)}
          </span>
        </div>

        {!canPay && (
          <div className="text-xs text-loss">Insufficient balance in {fund?.name || 'linked'} fund</div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="primary" disabled={!canPay} onClick={() => dispatch({ type: 'PAY_DEBT_EMI', payload: { debt_id: debt.id } })}>
          Pay EMI
        </Button>
        <Button size="sm" variant="secondary" onClick={onPayoff}>
          Early Payoff
        </Button>
        <Button size="sm" variant="outlined" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="outlined" onClick={() => dispatch({ type: 'REMOVE_DEBT', payload: debt.id })} className="hover:text-red-400 hover:border-red-500/20">
          ✕
        </Button>
      </div>
    </div>
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home Loan, Car EMI" className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Total Principal (₹)</label>
            <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} min="0" className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Remaining (₹)</label>
            <input type="number" value={remaining} onChange={(e) => setRemaining(e.target.value)} min="0" className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-txt-secondary mb-1">EMI (₹)</label>
            <input type="number" value={emi} onChange={(e) => setEmi(e.target.value)} min="0" className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Interest Rate (%)</label>
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} min="0" step="0.1" className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-txt-secondary mb-1">Due Day of Month</label>
            <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} min="1" max="31" className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs text-txt-secondary font-medium shrink-0">Linked Fund</label>
            <Select
              value={fundId}
              onChange={(val) => setFundId(val)}
              options={funds.map((f) => ({
                value: f.id,
                label: `${f.name} — ${formatCurrency(f.balance)}`,
              }))}
              buttonClassName="py-2 text-sm font-medium"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors" />
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
          <label className="block text-xs text-txt-secondary mb-1">Extra Monthly Payment (₹)</label>
          <input
            type="number"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="py-3 border-b border-white/[0.06]">
            <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">Baseline ({formatCurrency(debt.emi_amount)}/mo)</div>
            <div className="font-mono text-sm text-txt-primary">{baseline.months} months</div>
            <div className="text-xs text-txt-secondary mt-0.5">Interest: {formatCurrency(baseline.totalInterest)}</div>
          </div>
          <div className="py-3 border-b border-white/[0.06]">
            <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">With Extra ({formatCurrency(totalPayment)}/mo)</div>
            <div className="font-mono text-sm text-gain">{earlyPayoff.months} months</div>
            <div className="text-xs text-txt-secondary mt-0.5">Interest: {formatCurrency(earlyPayoff.totalInterest)}</div>
          </div>
        </div>

        {extra > 0 && (
          <div className="py-3 border-b border-white/[0.06]">
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Months saved</span>
              <span className="font-mono font-bold text-gain">{savedMonths}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
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
