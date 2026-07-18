import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Milestone } from '../types';
import { formatCurrency, formatDate, generateId, round2, calculateMonthlyRequired, getMonthsRemaining, calculateAccruedInterest } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';

export default function FundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [milestoneOpen, setMilestoneOpen] = useState(false);

  const fundId = Number(id);
  const fund = state.funds.find((f) => f.id === fundId);

  if (!fund) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-32 text-center">
        <div className="text-4xl mb-4">◈</div>
        <h2 className="text-xl font-bold text-txt-primary mb-2">Fund not found</h2>
        <Button variant="secondary" onClick={() => navigate('/funds')}>Back to Funds</Button>
      </div>
    );
  }

  const milestones = state.milestones.filter((m) => m.fund_id === fundId);
  const snapshots = [...state.fund_snapshots]
    .filter((s) => s.fund_id === fundId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const fundTx = state.transactions.filter((t) => {
    if (t.type === 'income') return (t.fund_allocation[fundId] || 0) > 0;
    if (t.type === 'expense') return t.fund_id === fundId;
    if (t.type === 'transfer') return t.from_fund_id === fundId || t.to_fund_id === fundId;
    return false;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyIncome = state.settings.expected_monthly_income;
  const scaleAmount = state.settings.scale_amount;
  const monthlyFromIncome = round2((monthlyIncome * fund.allocation_pct) / 100);

  const unreachedMilestones = milestones.filter((m) => !m.reached);
  const reachedMilestones = milestones.filter((m) => m.reached);
  const hasMilestones = milestones.length > 0;

  const chartData = useMemo(() => {
    if (snapshots.length === 0) return [];
    const historical = snapshots.map((s) => ({
      date: s.date,
      balance: s.balance,
      projected: null as number | null,
      scaleProjected: null as number | null,
    }));

    const lastSnap = snapshots[snapshots.length - 1];
    const lastDate = new Date(lastSnap.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (monthlyFromIncome > 0 || scaleAmount > 0) {
      const projectionMonths = 12;
      let incomeProj = lastSnap.balance;
      let scaleProj = lastSnap.balance;

      for (let i = 1; i <= projectionMonths; i++) {
        const d = new Date(lastDate);
        d.setMonth(d.getMonth() + i);
        const dateStr = d.toISOString().split('T')[0];
        if (d > today) {
          if (monthlyFromIncome > 0) incomeProj = round2(incomeProj + monthlyFromIncome);
          if (scaleAmount > 0) scaleProj = round2(scaleProj + scaleAmount);
          historical.push({
            date: dateStr,
            balance: null as unknown as number,
            projected: monthlyFromIncome > 0 ? incomeProj : null,
            scaleProjected: scaleAmount > 0 ? scaleProj : null,
          });
        }
      }
    }

    return historical;
  }, [snapshots, monthlyFromIncome, scaleAmount]);

  const monthlyRequired = fund.deadline && fund.goal_amount
    ? calculateMonthlyRequired(fund.goal_amount, fund.balance, fund.deadline)
    : null;
  const monthsLeft = fund.deadline ? getMonthsRemaining(fund.deadline) : null;
  const goalProgress = fund.goal_amount ? Math.min(100, (fund.balance / fund.goal_amount) * 100) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/funds')} className="text-txt-secondary hover:text-txt-primary cursor-pointer text-lg shrink-0">
            ←
          </button>
          <div className="h-5 w-5 rounded-full shrink-0" style={{ backgroundColor: fund.color }} />
          <h2 className="text-xl font-bold text-txt-primary uppercase tracking-wider truncate">{fund.name}</h2>
        </div>
        <div className="font-mono text-2xl sm:text-3xl font-bold text-txt-primary min-w-0 break-all">
          {formatCurrency(fund.balance)}
        </div>
      </div>

      {/* Inflow rate (all funds) */}
      {monthlyFromIncome > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-txt-secondary uppercase tracking-widest mb-1">Monthly Inflow</div>
              <div className="font-mono text-xl font-bold text-gain">{formatCurrency(monthlyFromIncome)}/mo</div>
            </div>
            <div className="text-right text-xs text-txt-secondary">
              <div>{fund.allocation_pct}% of {formatCurrency(monthlyIncome)}</div>
              {scaleAmount > 0 && <div className="mt-1">Scale: {formatCurrency(scaleAmount)}/mo</div>}
            </div>
          </div>
        </Card>
      )}

      {/* Accrued interest */}
      {fund.interest_rate && fund.interest_frequency && fund.interest_calc_type && snapshots.length > 0 && (() => {
        const lastSnap = snapshots[snapshots.length - 1];
        const { interest } = calculateAccruedInterest(
          fund.balance, fund.interest_rate, fund.interest_frequency, fund.interest_calc_type, lastSnap.date
        );
        const projectedBalance = round2(fund.balance + interest);
        return interest > 0 ? (
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-txt-secondary uppercase tracking-widest mb-1">Accrued Interest</div>
                <div className="font-mono text-xl font-bold text-gain">+{formatCurrency(interest)}</div>
                <div className="text-xs text-txt-secondary mt-1">
                  Projected balance: <span className="font-mono text-gain">{formatCurrency(projectedBalance)}</span>
                </div>
              </div>
              <div className="text-right text-xs text-txt-secondary">
                <div>{fund.interest_rate}% p.a. · {fund.interest_calc_type}</div>
                <div>{fund.interest_frequency} compounding</div>
                <div className="mt-1">Since {formatDate(lastSnap.date)}</div>
              </div>
            </div>
          </Card>
        ) : null;
      })()}

      {/* Goal tracker */}
      {fund.goal_amount && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-txt-primary">Goal</h3>
            {fund.deadline && (
              <Badge color={monthsLeft !== null && monthsLeft <= 0 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-txt-secondary'}>
                {monthsLeft !== null && monthsLeft > 0 ? `${monthsLeft} months left` : 'Deadline passed'}
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-sm text-txt-secondary">Current</div>
              <div className="font-mono text-xl font-bold text-txt-primary">{formatCurrency(fund.balance)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-txt-secondary">Target</div>
              <div className="font-mono text-xl font-bold text-gain">{formatCurrency(fund.goal_amount)}</div>
            </div>
          </div>

          <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${goalProgress || 0}%`, backgroundColor: fund.color }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-txt-secondary">
            <span>{goalProgress?.toFixed(1)}%</span>
            <span>{formatCurrency(fund.goal_amount - fund.balance)} remaining</span>
          </div>

          {monthlyRequired !== null && monthlyRequired > 0 && (
            <div className="mt-4 bg-white/[0.03] rounded-lg p-3 text-sm text-txt-secondary">
              Save <span className="font-mono text-gain font-semibold">{formatCurrency(monthlyRequired)}</span> per month to reach your goal by the deadline.
            </div>
          )}
        </Card>
      )}

      {/* Milestone predictions (only for funds with milestones) */}
      {hasMilestones && unreachedMilestones.length > 0 && (monthlyFromIncome > 0 || scaleAmount > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-txt-primary mb-4">Milestone Predictions</h3>
          <div className="space-y-3">
            {unreachedMilestones.map((m) => {
              const remaining = Math.max(0, m.target_amount - fund.balance);
              const incomeMonths = monthlyFromIncome > 0 ? Math.ceil(remaining / monthlyFromIncome) : null;
              const scaleMonths = scaleAmount > 0 ? Math.ceil(remaining / scaleAmount) : null;

              return (
                <div key={m.id} className="bg-white/[0.03] rounded-xl p-4 border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-txt-primary">{m.name}</span>
                    <span className="font-mono text-xs text-txt-secondary">{formatCurrency(m.target_amount)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {incomeMonths !== null && incomeMonths > 0 && (
                      <div className="bg-white/[0.03] rounded-lg p-3">
                        <div className="text-[10px] text-txt-secondary uppercase tracking-wider mb-1">Via Income Allocation</div>
                        <div className="font-mono text-sm font-semibold text-gain">
                          {incomeMonths >= 12 ? `${(incomeMonths / 12).toFixed(1)} years` : `${incomeMonths} months`}
                        </div>
                        <div className="text-[10px] text-txt-secondary mt-0.5">
                          At {formatCurrency(monthlyFromIncome)}/mo
                        </div>
                      </div>
                    )}
                    {scaleMonths !== null && scaleMonths > 0 && (
                      <div className="bg-white/[0.03] rounded-lg p-3">
                        <div className="text-[10px] text-txt-secondary uppercase tracking-wider mb-1">Via Scale Amount</div>
                        <div className="font-mono text-sm font-semibold text-gain">
                          {scaleMonths >= 12 ? `${(scaleMonths / 12).toFixed(1)} years` : `${scaleMonths} months`}
                        </div>
                        <div className="text-[10px] text-txt-secondary mt-0.5">
                          At {formatCurrency(scaleAmount)}/mo
                        </div>
                      </div>
                    )}
                    {incomeMonths !== null && incomeMonths > 0 && fund.deadline && (
                      <div className="col-span-2 text-[10px] text-txt-secondary">
                        {incomeMonths <= (monthsLeft || Infinity)
                          ? <span className="text-gain">On track — deadline is {monthsLeft} months away</span>
                          : <span className="text-loss">Behind — deadline is {monthsLeft} months away, needs {formatCurrency(remaining / Math.max(1, monthsLeft || 1))}/mo</span>
                        }
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Balance history chart with projections */}
      {chartData.length > 1 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-txt-primary mb-4">
            Balance History
            {(monthlyFromIncome > 0 || scaleAmount > 0) && (
              <span className="text-sm font-normal text-txt-secondary ml-2">+ 12-month projection</span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id={`grad-${fund.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fund.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={fund.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                stroke="#A1A1AA"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                stroke="#A1A1AA"
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                formatter={(value, name) => value != null ? [formatCurrency(Number(value)), name] : ['', '']}
                contentStyle={{
                  background: 'rgba(25,25,25,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  color: '#F4F4F5',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name="Balance"
                stroke={fund.color}
                strokeWidth={2.5}
                fill={`url(#grad-${fund.id})`}
                connectNulls={false}
              />
              {monthlyFromIncome > 0 && (
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Income Projection"
                  stroke="#4ADE80"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                />
              )}
              {scaleAmount > 0 && (
                <Line
                  type="monotone"
                  dataKey="scaleProjected"
                  name="Scale Projection"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
              )}
              {unreachedMilestones.map((m) => (
                <ReferenceLine
                  key={m.id}
                  y={m.target_amount}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="6 4"
                  label={{ value: m.name, position: 'right', fill: '#A1A1AA', fontSize: 11 }}
                />
              ))}
              {fund.goal_amount && (
                <ReferenceLine
                  y={fund.goal_amount}
                  stroke={fund.color}
                  strokeWidth={1.5}
                  strokeDasharray="8 4"
                  label={{ value: 'Goal', position: 'right', fill: fund.color, fontSize: 12, fontWeight: 600 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          {(monthlyFromIncome > 0 || scaleAmount > 0) && (
            <div className="flex flex-col sm:flex-row sm:gap-4 mt-3 text-xs text-txt-secondary">
              {monthlyFromIncome > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 bg-gain rounded" style={{ borderTop: '2px dashed #4ADE80' }} />
                  <span>Income ({formatCurrency(monthlyFromIncome)}/mo)</span>
                </div>
              )}
              {scaleAmount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 bg-[#A78BFA] rounded" style={{ borderTop: '2px dashed #A78BFA' }} />
                  <span>Scale ({formatCurrency(scaleAmount)}/mo)</span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Milestones */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-txt-primary">
            Milestones
            {milestones.length > 0 && (
              <span className="ml-2 text-sm font-normal text-txt-secondary">
                {reachedMilestones.length}/{milestones.length} reached
              </span>
            )}
          </h3>
          <Button variant="secondary" size="sm" onClick={() => setMilestoneOpen(true)}>
            + Add Milestone
          </Button>
        </div>

        {milestones.length === 0 ? (
          <div className="text-sm text-txt-secondary py-4 text-center">
            No milestones yet. Add one to track progress.
          </div>
        ) : (
          <div className="space-y-3">
            {unreachedMilestones.concat(reachedMilestones).map((m) => {
              const progress = Math.min(100, (fund.balance / m.target_amount) * 100);
              return (
                <div key={m.id} className={`bg-white/[0.03] rounded-xl p-4 border border-border-subtle ${m.reached ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-txt-primary">{m.name}</span>
                      {m.reached && <Badge color="bg-gain/15 text-gain">Reached</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-txt-secondary">{formatCurrency(m.target_amount)}</span>
                      {!m.reached && (
                        <button
                          onClick={() => dispatch({ type: 'UPDATE_MILESTONE', payload: { ...m, reached: true } })}
                          className="text-xs text-gain hover:text-gain/80 cursor-pointer"
                        >
                          Mark Reached
                        </button>
                      )}
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_MILESTONE', payload: m.id })}
                        className="text-xs text-txt-secondary/40 hover:text-red-400 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: m.reached ? '#4ADE80' : fund.color,
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-txt-secondary mt-1">
                    {formatCurrency(fund.balance)} / {formatCurrency(m.target_amount)} ({progress.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent transactions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-txt-primary mb-4">Recent Activity</h3>
        {fundTx.length === 0 ? (
          <div className="text-sm text-txt-secondary py-4 text-center">No transactions for this fund yet.</div>
        ) : (
          <div className="space-y-3">
            {fundTx.slice(0, 15).map((t) => {
              const isIncome = t.type === 'income';
              const isTransfer = t.type === 'transfer';
              const isSelf = isTransfer && (t.from_fund_id === fundId && t.to_fund_id === fundId);
              const isCredit = isTransfer && t.to_fund_id === fundId && !isSelf;
              const isDebit = isTransfer && t.from_fund_id === fundId && !isSelf;

              let label = '';
              let amount = 0;
              let colorClass = '';

              if (isIncome) {
                label = t.name;
                amount = t.fund_allocation[fundId] || 0;
                colorClass = 'text-gain';
              } else if (t.type === 'expense') {
                label = t.description;
                amount = -t.amount;
                colorClass = 'text-loss';
              } else if (isCredit) {
                label = t.note;
                amount = t.amount;
                colorClass = 'text-gain';
              } else if (isDebit) {
                label = t.note;
                amount = -t.amount;
                colorClass = 'text-loss';
              } else {
                return null;
              }

              return (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm text-txt-primary truncate">{label}</div>
                    <div className="text-xs text-txt-secondary">{formatDate(t.date)}</div>
                  </div>
                  <div className={`font-mono text-sm font-semibold shrink-0 ml-3 ${colorClass}`}>
                    {amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(amount))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <MilestoneFormModal
        open={milestoneOpen}
        onClose={() => setMilestoneOpen(false)}
        fundId={fundId}
        dispatch={dispatch}
      />
    </div>
  );
}

function MilestoneFormModal({
  open,
  onClose,
  fundId,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  fundId: number;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  const save = () => {
    const t = parseFloat(target);
    if (!name.trim() || isNaN(t) || t <= 0) return;

    const milestone: Milestone = {
      id: generateId(),
      fund_id: fundId,
      name: name.trim(),
      target_amount: round2(t),
      reached: false,
    };
    dispatch({ type: 'ADD_MILESTONE', payload: milestone });
    setName('');
    setTarget('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Milestone">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emergency Fund 3-month buffer"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Target Amount (₹)</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!name.trim() || !target}>Add</Button>
        </div>
      </div>
    </Modal>
  );
}
