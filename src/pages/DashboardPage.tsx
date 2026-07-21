import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Card from '../components/shared/Card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area,
  Bar,
  BarChart,
  Line,
  Legend,
} from 'recharts';

interface ProjectionPoint {
  date: string;
  balance: number;
  month: number;
  targets: { name: string; value: number }[];
}

function projectWantsFund(
  currentBalance: number,
  monthlyIncome: number,
  wantsPct: number,
  months: number,
  startDate: Date,
  pendingWants: { name: string; target_price: number; current_saved: number; predicted_date: string | null }[],
): ProjectionPoint[] {
  const monthlyAdd = monthlyIncome * (wantsPct / 100);
  const points: ProjectionPoint[] = [];

  const wantsByMonth = new Map<number, { name: string; value: number }[]>();
  for (const w of pendingWants) {
    if (!w.predicted_date) continue;
    const predDate = new Date(w.predicted_date);
    const diffMonths =
      (predDate.getTime() - startDate.getTime()) / (30.416 * 24 * 60 * 60 * 1000);
    const month = Math.max(0, Math.round(diffMonths));
    if (!wantsByMonth.has(month)) wantsByMonth.set(month, []);
    wantsByMonth.get(month)!.push({ name: w.name, value: w.target_price });
  }

  let runningBalance = currentBalance;
  for (let i = 0; i <= months; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);

    if (i > 0) {
      runningBalance += monthlyAdd;
    }

    const targets = wantsByMonth.get(i) || [];
    const totalDeducted = targets.reduce((sum, item) => sum + item.value, 0);
    runningBalance = Math.max(0, runningBalance - totalDeducted);

    points.push({
      date: d.toISOString().split('T')[0],
      balance: Math.round(runningBalance),
      month: i,
      targets,
    });
  }
  return points;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#191919]/95 backdrop-blur-md border border-border-subtle rounded-xl px-4 py-3 shadow-xl">
      <div className="text-xs text-txt-secondary mb-2">{label ? formatDate(label) : ''}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-sm font-mono font-semibold text-txt-primary">
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { state } = useApp();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalBalance = state.funds.reduce((s, f) => s + f.balance, 0);
  const totalCurrentValue = state.investments.reduce((s, i) => s + i.current_value, 0);
  const netWorth = totalBalance + totalCurrentValue;

  const totalIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => (t.type === 'income' ? s + t.amount : s), 0);

  const avgMonthlyIncome = useMemo(() => {
    if (totalIncome === 0) return 0;
    const dates = state.transactions
      .filter((t) => t.type === 'income')
      .map((t) => new Date(t.date));
    if (dates.length === 0) return 0;
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const months = Math.max(
      1,
      (Date.now() - earliest.getTime()) / (30 * 24 * 60 * 60 * 1000),
    );
    return totalIncome / months;
  }, [state.transactions, totalIncome]);

  const wantsFund = state.funds.find((f) => f.name === 'wants');
  const pendingWants = state.wants.filter((w) => !w.purchased);

  const monthlyIncomeSource = state.settings.expected_monthly_income || avgMonthlyIncome || 80000;

  const chartData = useMemo(() => {
    if (!wantsFund) return { projection: [] as ProjectionPoint[], maxMonths: 12 };
    const now = new Date();
    const maxPredMonth = pendingWants.reduce((max, w) => {
      if (!w.predicted_date) return max;
      const diff =
        (new Date(w.predicted_date).getTime() - now.getTime()) /
        (30.416 * 24 * 60 * 60 * 1000);
      return Math.max(max, Math.ceil(diff) + 2);
    }, 12);

    const projection = projectWantsFund(
      wantsFund.balance,
      monthlyIncomeSource,
      wantsFund.allocation_pct,
      maxPredMonth,
      now,
      pendingWants,
    );

    return { projection, maxMonths: maxPredMonth };
  }, [wantsFund, monthlyIncomeSource, pendingWants]);

  const allTargetValues = pendingWants.map((w) => w.target_price);

  const [cashFlowMonths, setCashFlowMonths] = useState(6);

  const avgExpenses = useMemo(() => {
    const expenseTxs = state.transactions.filter((t) => t.type === 'expense');
    if (expenseTxs.length === 0) return 0;
    const dates = expenseTxs.map((t) => new Date(t.date));
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const months = Math.max(1, (Date.now() - earliest.getTime()) / (30 * 24 * 60 * 60 * 1000));
    return expenseTxs.reduce((s, t) => (t.type === 'expense' ? s + t.amount : s), 0) / months;
  }, [state.transactions]);

  const cashFlowData = useMemo(() => {
    const months: { month: string; income: number; expenses: number }[] = [];
    const now = new Date();
    for (let i = cashFlowMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const income = state.transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(key))
        .reduce((s, t) => (t.type === 'income' ? s + t.amount : s), 0);
      const expenses = state.transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(key))
        .reduce((s, t) => (t.type === 'expense' ? s + t.amount : s), 0);
      months.push({ month: label, income, expenses });
    }
    return months;
  }, [state.transactions, cashFlowMonths]);

  const burnRateData = useMemo(() => {
    const totalBalance = state.funds.reduce((s, f) => s + f.balance, 0);
    const points: { month: string; balance: number; idealBurn: number }[] = [];
    const now = new Date();
    for (let i = 0; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const projectedBalance = Math.max(0, totalBalance - avgExpenses * i);
      points.push({ month: label, balance: projectedBalance, idealBurn: totalBalance });
    }
    return points;
  }, [state.funds, avgExpenses]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6">
          <div className="text-sm text-txt-secondary uppercase tracking-widest mb-2">
            Net Worth
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-brand min-w-0 break-all">
            {formatCurrency(netWorth)}
          </div>
        </Card>
        {state.funds.map((fund) => (
          <Card key={fund.id} className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: fund.color }}
              />
              <div className="text-sm text-txt-secondary uppercase tracking-widest">
                {fund.name}
              </div>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-txt-primary min-w-0 break-all">
              {formatCurrency(fund.balance)}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-txt-primary">
              Wants Fund Projection
            </h3>
            <p className="text-sm text-txt-secondary mt-1">
              Fund growth vs your target wants
            </p>
          </div>
          {wantsFund && (
            <div className="text-right">
              <div className="text-xs text-txt-secondary">Monthly inflow</div>
              <div className="font-mono text-lg font-bold text-gain">
                +{formatCurrency(avgMonthlyIncome * (wantsFund.allocation_pct / 100))}
              </div>
            </div>
          )}
        </div>

        {chartData.projection.length === 0 || !wantsFund ? (
          <div className="h-80 flex items-center justify-center text-txt-secondary text-base">
            Add income and wants to see projections
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 420}>
            <ComposedChart
              data={chartData.projection}
              margin={{ top: 20, right: isMobile ? 15 : 30, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="wantsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => {
                  const date = new Date(d);
                  return date.toLocaleDateString('en-IN', {
                    month: 'short',
                    year: '2-digit',
                  });
                }}
                stroke="#A1A1AA"
                tick={{ fontSize: 10 }}
                interval={isMobile ? 2 : 0}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                }
                stroke="#A1A1AA"
                tick={{ fontSize: 10 }}
                width={isMobile ? 40 : 60}
              />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="balance"
                name="Wants Fund"
                stroke="#A78BFA"
                strokeWidth={2.5}
                fill="url(#wantsGradient)"
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null || !payload) return null;
                  if (payload.targets.length > 0) {
                    const isEven = payload.month % 2 === 0;
                    return (
                      <g
                        key={`dot-${payload.date}`}
                        className="cursor-pointer active:scale-95 transition-all select-none"
                        onClick={() => navigate('/funds/wants')}
                      >
                        <circle cx={cx} cy={cy} r={4} fill="#A78BFA" stroke="#050505" strokeWidth={2} />
                        <circle cx={cx} cy={cy} r={isMobile ? 8 : 12} fill="none" stroke="#FF2A2A" strokeWidth={2} strokeDasharray="3 3" />
                        <circle cx={cx} cy={cy} r={isMobile ? 3.5 : 5} fill="#FF2A2A" />
                        {payload.targets.map((t: { name: string; value: number }, i: number) => {
                          const label = `${t.name} (${t.value >= 1000 ? `₹${(t.value / 1000).toFixed(0)}k` : `₹${t.value}`})`;
                          const offset = i * (isMobile ? 12 : 16);
                          const textY = isEven
                            ? cy - (isMobile ? 14 : 20) - offset
                            : cy + (isMobile ? 22 : 30) + offset;
                          return (
                            <text
                              key={i}
                              x={cx}
                              y={textY}
                              textAnchor="middle"
                              fill={isEven ? "#F4F4F5" : "#A78BFA"}
                              fontSize={isMobile ? 8 : 10}
                              fontFamily="Inter"
                              fontWeight={600}
                            >
                              {label}
                            </text>
                          );
                        })}
                      </g>
                    );
                  }
                  return (
                    <circle
                      key={`dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#A78BFA"
                      stroke="#050505"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: '#A78BFA', stroke: '#050505', strokeWidth: 2 }}
              />

              {allTargetValues.map((val) => (
                <ReferenceLine
                  key={`ref-${val}`}
                  y={val}
                  stroke="rgba(255, 42, 42, 0.12)"
                  strokeDasharray="6 4"
                />
              ))}

              <Legend
                wrapperStyle={{ fontSize: 13, fontFamily: 'Inter' }}
                formatter={(value: string) => (
                  <span className="text-txt-secondary">{value}</span>
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {pendingWants.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingWants.map((w) => {
              const pct = (w.current_saved / w.target_price) * 100;
              return (
                <div
                  key={w.id}
                  className="bg-white/[0.03] rounded-xl p-4 border border-border-subtle"
                >
                  <div className="flex justify-between text-base mb-2">
                    <span className="text-txt-primary font-medium truncate">
                      {w.name}
                    </span>
                    <span className="text-brand font-mono text-sm">
                      {w.days_to_buy !== null ? `${w.days_to_buy}d` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-txt-secondary">
                    <span>{formatCurrency(w.current_saved)}</span>
                    <span>{formatCurrency(w.target_price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Cash Flow Trend ── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-txt-primary">Cash Flow</h3>
            <p className="text-sm text-txt-secondary mt-1">Monthly income vs expenses</p>
          </div>
          <div className="flex gap-1.5">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setCashFlowMonths(m)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all transform duration-150 active:scale-95 cursor-pointer ${
                  cashFlowMonths === m
                    ? 'bg-brand/15 border-brand/30 text-brand shadow-glow'
                    : 'bg-white/[0.02] border-border-subtle text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
          <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fontSize: 10 }} />
            <YAxis
              tickFormatter={(v: number) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
              stroke="#A1A1AA"
              tick={{ fontSize: 10 }}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income" name="Income" fill="#4ADE80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#FB923C" radius={[4, 4, 0, 0]} />
            <Legend
              wrapperStyle={{ fontSize: 13, fontFamily: 'Inter' }}
              formatter={(value: string) => <span className="text-txt-secondary">{value}</span>}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Burn Rate ── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-txt-primary">Burn Rate</h3>
            <p className="text-sm text-txt-secondary mt-1">
              How long your savings last at current spending ({formatCurrency(avgExpenses)}/mo avg)
            </p>
          </div>
          {avgExpenses > 0 && (
            <div className="text-right">
              <div className="text-xs text-txt-secondary">Runway</div>
              <div className={`font-mono text-lg font-bold ${
                burnRateData.length > 0 && burnRateData[burnRateData.length - 1].balance > 0
                  ? 'text-gain' : 'text-loss'
              }`}>
                {Math.floor(state.funds.reduce((s, f) => s + f.balance, 0) / avgExpenses)}mo
              </div>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
          <ComposedChart data={burnRateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB923C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fontSize: 10 }} />
            <YAxis
              tickFormatter={(v: number) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
              stroke="#A1A1AA"
              tick={{ fontSize: 10 }}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,42,42,0.3)" strokeDasharray="6 4" />
            <Line
              type="monotone"
              dataKey="idealBurn"
              name="Current Balance"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="Projected Balance"
              stroke="#FB923C"
              strokeWidth={2.5}
              fill="url(#burnGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#FB923C', stroke: '#050505', strokeWidth: 2 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 13, fontFamily: 'Inter' }}
              formatter={(value: string) => <span className="text-txt-secondary">{value}</span>}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
