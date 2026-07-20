import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import Card from '../shared/Card';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#191919]/95 backdrop-blur-md border border-border-subtle rounded-xl px-4 py-3 shadow-xl">
      {label && <div className="text-xs text-txt-secondary mb-2">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="text-sm font-mono font-semibold text-txt-primary">
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

function CardShell({ title, subtitle, children, inputs }: {
  title: string; subtitle: string; inputs?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Card className="p-6">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between cursor-pointer">
        <div className="text-left">
          <h3 className="text-lg font-bold text-txt-primary">{title}</h3>
          <p className="text-sm text-txt-secondary mt-0.5">{subtitle}</p>
        </div>
        <span className="text-txt-secondary text-xl">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-5 space-y-5">
          {inputs && <div className="flex flex-wrap gap-4 items-end">{inputs}</div>}
          {children}
        </div>
      )}
    </Card>
  );
}

function NumInput({ label, value, onChange, suffix }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="min-w-[120px]">
      <label className="block text-xs text-txt-secondary mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-txt-primary font-mono outline-none focus:border-brand/50 transition-colors"
        />
        {suffix && <span className="text-xs text-txt-secondary whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}

export default function PredictionsContent({ idPrefix = 'pred' }: { idPrefix?: string }) {
  const { state } = useApp();
  const txs = state.transactions;
  const funds = state.funds;
  const wants = state.wants;
  const needs = state.needs;
  const debts = state.debts;

  const avgMonthlyIncome = useMemo(() => {
    const inc = txs.filter((t) => t.type === 'income');
    if (!inc.length) return 0;
    const dates = inc.map((t) => new Date(t.date));
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const months = Math.max(1, (Date.now() - earliest.getTime()) / (30 * 24 * 60 * 60 * 1000));
    return inc.reduce((s, t) => s + t.amount, 0) / months;
  }, [txs]);

  const avgMonthlyExpenses = useMemo(() => {
    const exp = txs.filter((t) => t.type === 'expense');
    if (!exp.length) return 0;
    const dates = exp.map((t) => new Date(t.date));
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const months = Math.max(1, (Date.now() - earliest.getTime()) / (30 * 24 * 60 * 60 * 1000));
    return exp.reduce((s, t) => s + t.amount, 0) / months;
  }, [txs]);

  const hourlyRate = state.settings.hourly_rate || 200;

  // ── 1. Zero-Balance Drop-Dead Date ──
  const [ddFunds, setDdFunds] = useState<Record<number, boolean>>(
    () => Object.fromEntries(funds.map((f) => [f.id, true]))
  );
  const ddData = useMemo(() => {
    const totalExpenses = avgMonthlyExpenses;
    if (totalExpenses <= 0) return [];
    const included = funds.filter((f) => ddFunds[f.id]);
    const totalBalance = included.reduce((s, f) => s + f.balance, 0);
    const monthsLeft = totalBalance / totalExpenses;
    const points: { month: string; balance: number }[] = [];
    const now = new Date();
    const limit = Math.min(Math.ceil(monthsLeft) + 2, 60);
    for (let i = 0; i <= limit; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      points.push({ month: label, balance: Math.max(0, Math.round(totalBalance - totalExpenses * i)) });
    }
    return points;
  }, [funds, ddFunds, avgMonthlyExpenses]);

  // ── 2. Micro-Transaction Wealth Bleed ──
  const [mbThreshold, setMbThreshold] = useState(200);
  const [mbReturnRate, setMbReturnRate] = useState(12);
  const [mbYears, setMbYears] = useState(10);
  const microExpenses = useMemo(() => {
    return txs.filter((t) => t.type === 'expense' && t.amount <= mbThreshold && t.amount > 0);
  }, [txs, mbThreshold]);
  const mbData = useMemo(() => {
    const monthlyMicro = (() => {
      if (!microExpenses.length) return 0;
      const dates = microExpenses.map((t) => new Date(t.date));
      const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
      const months = Math.max(1, (Date.now() - earliest.getTime()) / (30 * 24 * 60 * 60 * 1000));
      return microExpenses.reduce((s, t) => s + t.amount, 0) / months;
    })();
    const r = mbReturnRate / 100 / 12;
    const points: { year: string; lost: number; invested: number }[] = [];
    for (let y = 0; y <= mbYears; y++) {
      let lostWealth = 0;
      let invested = 0;
      for (let m = 0; m < y * 12; m++) {
        invested += monthlyMicro;
        lostWealth = (lostWealth + monthlyMicro) * (1 + r);
      }
      points.push({ year: `Year ${y}`, lost: Math.round(lostWealth), invested: Math.round(invested) });
    }
    return points;
  }, [microExpenses, mbReturnRate, mbYears]);

  // ── 3. Payment Default Predictor ──
  const defaultData = useMemo(() => {
    const items: { name: string; amount: number; due: string; fundBalance: number; daysLeft: number }[] = [];
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    for (const n of needs) {
      if (!n.active || !n.due_date) continue;
      const parsed = new Date(n.due_date);
      const due = isNaN(parsed.getTime()) ? null : parsed;
      if (!due) continue;
      if (due < todayStart) due.setMonth(due.getMonth() + 1);
      const daysLeft = Math.ceil((due.getTime() - todayStart.getTime()) / 86400000);
      const fund = funds.find((f) => f.id === n.fund_id);
      const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
      items.push({ name: n.name, amount: n.amount, due: dueStr, fundBalance: fund?.balance || 0, daysLeft });
    }
    for (const d of debts) {
      if (!d.active) continue;
      const due = new Date();
      due.setDate(d.due_date);
      if (due < todayStart) due.setMonth(due.getMonth() + 1);
      const daysLeft = Math.ceil((due.getTime() - todayStart.getTime()) / 86400000);
      const fund = funds.find((f) => f.id === d.linked_fund_id);
      const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
      items.push({ name: d.name, amount: d.emi_amount, due: dueStr, fundBalance: fund?.balance || 0, daysLeft });
    }
    return items.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [needs, debts, funds]);

  // ── 4. Goal Delay Tracker ──
  const goalData = useMemo(() => {
    return wants.filter((w) => !w.purchased).map((w) => {
      const remaining = w.target_price - w.current_saved;
      const monthsIdeal = avgMonthlyIncome > 0 ? remaining / (avgMonthlyIncome * 0.2) : 99;
      const monthsActual = w.days_to_buy !== null ? w.days_to_buy / 30 : monthsIdeal * 2;
      return { name: w.name.length > 15 ? w.name.slice(0, 15) + '…' : w.name, ideal: Math.ceil(monthsIdeal), actual: Math.ceil(monthsActual) };
    });
  }, [wants, avgMonthlyIncome]);

  // ── 5. True Hourly Wage Converter ──
  const [hwLookback, setHwLookback] = useState(3);
  const hourlyData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - hwLookback);
    const recent = txs.filter((t) => t.type === 'expense' && new Date(t.date) >= cutoff);
    const byCategory = new Map<string, number>();
    for (const t of recent) {
      if (t.type !== 'expense') continue;
      byCategory.set(t.category, (byCategory.get(t.category) || 0) + t.amount);
    }
    return Array.from(byCategory.entries())
      .map(([cat, amount]) => ({ name: cat, hours: Math.round((amount / hourlyRate) * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);
  }, [txs, hwLookback, hourlyRate]);

  // ── 6. Subscription Annual Trap ──
  const subData = useMemo(() => {
    return needs
      .filter((n) => n.recurring && n.active)
      .map((n) => {
        const annual = n.frequency === 'yearly' ? n.amount : n.frequency === 'weekly' ? n.amount * 52 : n.amount * 12;
        return { name: n.name.length > 18 ? n.name.slice(0, 18) + '…' : n.name, monthly: n.amount, annual };
      })
      .sort((a, b) => b.annual - a.annual);
  }, [needs]);

  // ── 7. Irregular Income Gap Buffer ──
  const [igLookback, setIgLookback] = useState(6);
  const gapData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - igLookback);
    const months = new Map<string, number>();
    const inc = txs.filter((t) => t.type === 'income' && new Date(t.date) >= cutoff);
    for (const t of inc) {
      const key = t.date.slice(0, 7);
      months.set(key, (months.get(key) || 0) + t.amount);
    }
    const values = Array.from(months.values());
    if (!values.length) return { points: [], minBuffer: 0, avgIncome: 0 };
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const points = Array.from(months.entries()).sort().map(([m, v]) => ({ month: m, income: v }));
    return { points, minBuffer: Math.max(0, Math.round(avg - min)), avgIncome: Math.round(avg) };
  }, [txs, igLookback]);

  // ── 8. Lifestyle Creep Warning ──
  const [lcMonths, setLcMonths] = useState(6);
  const creepData = useMemo(() => {
    const now = new Date();
    const points: { month: string; wants: number; income: number }[] = [];
    for (let i = lcMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const wantsSpend = txs.filter((t) => t.type === 'expense' && t.date.startsWith(key) && t.fund_name === 'wants')
        .reduce((s, t) => s + t.amount, 0);
      const income = txs.filter((t) => t.type === 'income' && t.date.startsWith(key))
        .reduce((s, t) => (t.type === 'income' ? s + t.amount : s), 0);
      points.push({ month: label, wants: wantsSpend, income });
    }
    return points;
  }, [txs, lcMonths]);

  const creepWarning = useMemo(() => {
    if (creepData.length < 2) return null;
    const first = creepData[0];
    const last = creepData[creepData.length - 1];
    if (first.income === 0 || last.income === 0) return null;
    const wantsGrowth = first.income > 0 ? (last.wants / first.income - first.wants / first.income) : 0;
    return wantsGrowth > 0.05 ? `Wants spending growing ${(wantsGrowth * 100).toFixed(1)}% faster than income` : null;
  }, [creepData]);

  // ── 9. Inflation Deficit ──
  const [infRate, setInfRate] = useState(6);
  const [infYears, setInfYears] = useState(10);
  const inflationData = useMemo(() => {
    const totalBalance = funds.reduce((s, f) => s + f.balance, 0);
    const r = infRate / 100;
    const points: { year: string; nominal: number; real: number }[] = [];
    for (let y = 0; y <= infYears; y++) {
      points.push({
        year: `Year ${y}`,
        nominal: totalBalance,
        real: Math.round(totalBalance / Math.pow(1 + r, y)),
      });
    }
    return points;
  }, [funds, infRate, infYears]);

  // ── 10. Passive Income Snowball ──
  const [piYears, setPiYears] = useState(10);
  const [piRate, setPiRate] = useState(8);
  const passiveData = useMemo(() => {
    const savingsBalance = funds.find((f) => f.name === 'savings')?.balance || 0;
    const r = piRate / 100;
    const points: { year: string; balance: number; interest: number }[] = [];
    let bal = savingsBalance;
    for (let y = 0; y <= piYears; y++) {
      const interest = Math.round(bal * r);
      points.push({ year: `Year ${y}`, balance: Math.round(bal), interest });
      bal += interest;
    }
    return points;
  }, [funds, piRate, piYears]);

  const colors = { brand: '#FF2A2A', gain: '#4ADE80', loss: '#FB923C', purple: '#A78BFA', white10: 'rgba(255,255,255,0.1)' };

  return (
    <div className="space-y-6">
      {/* 1. Zero-Balance Drop-Dead Date */}
      <CardShell
        title="Zero-Balance Drop-Dead Date"
        subtitle="When your funds hit ₹0 at current spending"
        inputs={
          <>
            {funds.map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={ddFunds[f.id] ?? true}
                  onChange={(e) => setDdFunds((p) => ({ ...p, [f.id]: e.target.checked }))}
                  className="accent-brand"
                />
                {f.name}
              </label>
            ))}
          </>
        }
      >
        {ddData.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ddData}>
              <defs>
                <linearGradient id={`${idPrefix}-ddGrad`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.brand} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} stroke="#A1A1AA" tick={{ fontSize: 11 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke={colors.brand} strokeWidth={2} fill={`url(#${idPrefix}-ddGrad)`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-txt-secondary text-sm">Add expenses to see depletion timeline</div>
        )}
      </CardShell>

      {/* 2. Micro-Transaction Wealth Bleed */}
      <CardShell
        title="Micro-Transaction Wealth Bleed"
        subtitle="Small purchases compound into big losses"
        inputs={
          <>
            <NumInput label="Threshold" value={mbThreshold} onChange={setMbThreshold} suffix="₹" />
            <NumInput label="Return Rate" value={mbReturnRate} onChange={setMbReturnRate} suffix="%" />
            <NumInput label="Years" value={mbYears} onChange={setMbYears} />
          </>
        }
      >
        {mbData.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mbData}>
              <defs>
                <linearGradient id={`${idPrefix}-mbGrad`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.loss} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.loss} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} stroke="#A1A1AA" tick={{ fontSize: 11 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="invested" name="Spent" stroke={colors.white10} strokeWidth={1} fill="none" strokeDasharray="4 4" dot={false} />
              <Area type="monotone" dataKey="lost" name="Lost Wealth" stroke={colors.loss} strokeWidth={2} fill={`url(#${idPrefix}-mbGrad)`} dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span className="text-txt-secondary">{v}</span>} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-txt-secondary text-sm">No micro-expenses found</div>
        )}
      </CardShell>

      {/* 3. Payment Default Predictor */}
      <CardShell
        title="Payment Default Predictor"
        subtitle="Upcoming obligations vs fund balances"
      >
        {defaultData.length ? (
          <div className="space-y-3">
            {defaultData.map((item, i) => {
              const atRisk = item.fundBalance < item.amount;
              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${atRisk ? 'border-red-500/30 bg-red-500/5' : 'border-border-subtle bg-white/[0.02]'}`}>
                  <div>
                    <div className="text-sm font-medium text-txt-primary">{item.name}</div>
                    <div className="text-xs text-txt-secondary">Due in {item.daysLeft} days</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-txt-primary">{formatCurrency(item.amount)}</div>
                    <div className={`text-xs font-mono ${atRisk ? 'text-red-400' : 'text-gain'}`}>
                      {formatCurrency(item.fundBalance)} available
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">No upcoming payments found</div>
        )}
      </CardShell>

      {/* 4. Goal Delay Tracker */}
      <CardShell
        title="Goal Delay Tracker"
        subtitle="Actual vs ideal timeline for each want"
      >
        {goalData.length ? (
          <ResponsiveContainer width="100%" height={Math.max(200, goalData.length * 45)}>
            <BarChart data={goalData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" stroke="#A1A1AA" tick={{ fontSize: 11 }} unit="mo" />
              <YAxis type="category" dataKey="name" stroke="#A1A1AA" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ideal" name="Ideal (months)" fill={colors.gain} radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="actual" name="Actual (months)" fill={colors.loss} radius={[0, 4, 4, 0]} barSize={12} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span className="text-txt-secondary">{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">No pending wants</div>
        )}
      </CardShell>

      {/* 5. True Hourly Wage Converter */}
      <CardShell
        title="True Hourly Wage Converter"
        subtitle="How many hours each category costs"
        inputs={<NumInput label="Lookback" value={hwLookback} onChange={setHwLookback} suffix="months" />}
      >
        {hourlyData.length ? (
          <ResponsiveContainer width="100%" height={Math.max(200, hourlyData.length * 40)}>
            <BarChart data={hourlyData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" stroke="#A1A1AA" tick={{ fontSize: 11 }} unit="h" />
              <YAxis type="category" dataKey="name" stroke="#A1A1AA" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => `${v} hours`} contentStyle={{ background: '#191919', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }} />
              <Bar dataKey="hours" name="Hours" fill={colors.purple} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">No expenses in this period</div>
        )}
      </CardShell>

      {/* 6. Subscription Annual Trap */}
      <CardShell
        title="Subscription Annual Trap"
        subtitle="What your recurring bills really cost per year"
      >
        {subData.length ? (
          <ResponsiveContainer width="100%" height={Math.max(200, subData.length * 45)}>
            <BarChart data={subData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" stroke="#A1A1AA" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`} />
              <YAxis type="category" dataKey="name" stroke="#A1A1AA" tick={{ fontSize: 11 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="annual" name="Annual Cost" fill={colors.loss} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">No active subscriptions</div>
        )}
      </CardShell>

      {/* 7. Irregular Income Gap Buffer */}
      <CardShell
        title="Irregular Income Gap Buffer"
        subtitle="Minimum buffer needed for income gaps"
        inputs={<NumInput label="Lookback" value={igLookback} onChange={setIgLookback} suffix="months" />}
      >
        {gapData.points.length > 1 ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="bg-white/[0.03] rounded-lg p-4 flex-1">
                <div className="text-xs text-txt-secondary mb-1">Avg Monthly Income</div>
                <div className="font-mono text-lg font-bold text-gain">{formatCurrency(gapData.avgIncome)}</div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-4 flex-1">
                <div className="text-xs text-txt-secondary mb-1">Min Buffer Needed</div>
                <div className="font-mono text-lg font-bold text-brand">{formatCurrency(gapData.minBuffer)}</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gapData.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} stroke="#A1A1AA" tick={{ fontSize: 11 }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Income" fill={colors.gain} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">Need at least 2 months of income data</div>
        )}
      </CardShell>

      {/* 8. Lifestyle Creep Warning */}
      <CardShell
        title="Lifestyle Creep Warning"
        subtitle="Are your wants growing faster than income?"
        inputs={<NumInput label="Months" value={lcMonths} onChange={setLcMonths} />}
      >
        {creepData.length ? (
          <div className="space-y-4">
            {creepWarning && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 text-sm text-amber-400">
                ⚠ {creepWarning}
              </div>
            )}
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={creepData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} stroke="#A1A1AA" tick={{ fontSize: 11 }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="income" name="Income" stroke={colors.gain} strokeWidth={2} dot={{ r: 3, fill: colors.gain }} />
                <Line type="monotone" dataKey="wants" name="Wants Spend" stroke={colors.loss} strokeWidth={2} dot={{ r: 3, fill: colors.loss }} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span className="text-txt-secondary">{v}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">Need at least 2 months of data</div>
        )}
      </CardShell>

      {/* 9. Inflation Deficit */}
      <CardShell
        title="Inflation Deficit"
        subtitle="Purchasing power erosion over time"
        inputs={
          <>
            <NumInput label="Inflation Rate" value={infRate} onChange={setInfRate} suffix="%" />
            <NumInput label="Years" value={infYears} onChange={setInfYears} />
          </>
        }
      >
        {inflationData.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={inflationData}>
              <defs>
                <linearGradient id={`${idPrefix}-infGrad`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.gain} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={colors.gain} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} stroke="#A1A1AA" tick={{ fontSize: 11 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="nominal" name="Nominal" stroke={colors.white10} strokeWidth={1} fill="none" strokeDasharray="4 4" dot={false} />
              <Area type="monotone" dataKey="real" name="Real Value" stroke={colors.gain} strokeWidth={2} fill={`url(#${idPrefix}-infGrad)`} dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span className="text-txt-secondary">{v}</span>} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">No fund balances</div>
        )}
      </CardShell>

      {/* 10. Passive Income Snowball */}
      <CardShell
        title="Passive Income Snowball"
        subtitle="Compound growth on your savings"
        inputs={
          <>
            <NumInput label="Return Rate" value={piRate} onChange={setPiRate} suffix="%" />
            <NumInput label="Years" value={piYears} onChange={setPiYears} />
          </>
        }
      >
        {passiveData.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={passiveData}>
              <defs>
                <linearGradient id={`${idPrefix}-piGrad`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.gain} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.gain} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} stroke="#A1A1AA" tick={{ fontSize: 11 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke={colors.gain} strokeWidth={2} fill={`url(#${idPrefix}-piGrad)`} dot={false} />
              <Area type="monotone" dataKey="interest" name="Interest Earned" stroke={colors.purple} strokeWidth={1.5} fill="none" dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span className="text-txt-secondary">{v}</span>} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-20 flex items-center justify-center text-txt-secondary text-sm">No savings fund found</div>
        )}
      </CardShell>
    </div>
  );
}
