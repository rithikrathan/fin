import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, round2 } from '../utils/helpers';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import SurplusRedistributeModal from '../components/funds/SurplusRedistributeModal';
import FundTransferModal from '../components/funds/FundTransferModal';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export default function FundsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [configOpen, setConfigOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [redistributeOpen, setRedistributeOpen] = useState(false);
  const [redistributeFundId, setRedistributeFundId] = useState<number | null>(null);

  const total = state.funds.reduce((s, f) => s + f.balance, 0);

  const pieData = state.funds.map((f) => ({
    name: f.name.charAt(0).toUpperCase() + f.name.slice(1),
    value: f.balance || 0,
    color: f.color,
  }));

  const pendingWants = state.wants.filter((w) => !w.purchased).length;
  const activeNeeds = state.needs.filter((n) => n.active).length;

  const fundsWithSurplus = state.funds.filter((f) => {
    if (f.name === 'wants' || f.name === 'savings') return false;
    const fMilestones = state.milestones.filter((m) => m.fund_id === f.id);
    if (fMilestones.length === 0) return false;
    const hasUnreached = fMilestones.some((m) => !m.reached);
    return hasUnreached && f.balance > 0;
  });

  const openRedistribute = (fundId: number) => {
    setRedistributeFundId(fundId);
    setRedistributeOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Surplus banner */}
      {fundsWithSurplus.length > 0 && (
        <div className="bg-gain/5 border border-gain/20 rounded-xl p-4 flex items-center justify-between">
          <div className="text-sm text-txt-secondary">
            {fundsWithSurplus.length === 1
              ? `₹${round2(fundsWithSurplus[0].balance).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} surplus in ${fundsWithSurplus[0].name}`
              : `${fundsWithSurplus.length} funds have surplus`}
          </div>
          <Button variant="secondary" size="sm" onClick={() => openRedistribute(fundsWithSurplus[0].id)}>
            Redistribute
          </Button>
        </div>
      )}

      {/* Pie Chart + Fund Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Pie */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.06] w-full mb-4">
            Fund Allocation Split
          </h3>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 65}
                  outerRadius={isMobile ? 80 : 100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    background: 'rgba(25,25,25,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    color: '#F4F4F5',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-txt-secondary text-sm italic">
              No funds to display
            </div>
          )}
          <div className="flex gap-4 mt-2 flex-wrap justify-center">
            {state.funds.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5 text-xs font-semibold">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
                <span className="text-txt-secondary">
                  {f.name.toUpperCase()}
                </span>
                <span className="font-mono text-txt-primary">
                  {f.allocation_pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fund status balances - Flat grid */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary pb-1 border-b border-white/[0.06]">
            Balances & Target Runways
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {state.funds.map((fund) => {
              const spent = state.transactions
                .filter((t) => t.type === 'expense' && t.fund_id === fund.id)
                .reduce((s, t) => s + t.amount, 0);

              const committedNeeds = state.needs
                .filter((n) => n.fund_id === fund.id && n.active)
                .reduce((s, n) => {
                  if (n.frequency === 'monthly') return s + n.amount;
                  if (n.frequency === 'weekly') return s + n.amount * 4;
                  if (n.frequency === 'yearly') return s + n.amount / 12;
                  return s + n.amount;
                }, 0);

              const showGhost = state.settings.show_ghost_deductions ?? true;
              const committedDebts = state.debts
                .filter((d) => d.linked_fund_id === fund.id && d.active)
                .reduce((s, d) => s + d.emi_amount, 0);

              const totalCommitted = committedNeeds + committedDebts;
              const availableBalance = Math.max(0, fund.balance - totalCommitted);
              const surplus = fund.balance - committedNeeds;

              return (
                <div
                  key={fund.id}
                  className="p-4 border border-white/[0.06] bg-white/[0.01] rounded-xl hover:border-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/funds/${fund.id}`)}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: fund.color }}
                      />
                      <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-widest">
                        {fund.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-txt-secondary">{fund.allocation_pct}%</span>
                  </div>

                  {showGhost ? (
                    <div>
                      <div className="text-[10px] text-txt-secondary uppercase font-bold tracking-wider">Available Balance</div>
                      <div className="font-mono text-xl font-bold text-gain truncate">
                        {formatCurrency(availableBalance)}
                      </div>
                      <div className="text-[10px] font-mono text-txt-secondary/60 mt-0.5">
                        Total: {formatCurrency(fund.balance)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-mono text-xl font-bold text-txt-primary truncate">
                        {formatCurrency(fund.balance)}
                      </div>
                      <div className="text-[10px] text-txt-secondary mb-3.5">
                        {fund.allocation_pct}% split ratio
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs border-t border-white/[0.04] pt-3 mt-3">
                    {totalCommitted > 0 && (
                      <div className="flex justify-between">
                        <span className="text-txt-secondary">Committed Obligations</span>
                        <span className="font-mono text-loss">
                          {formatCurrency(totalCommitted)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-txt-secondary">Spent</span>
                      <span className="font-mono text-loss">
                        {formatCurrency(spent)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-white/[0.04] pt-1.5">
                      <span className="text-txt-primary">Net Surplus</span>
                      <span
                        className={`font-mono ${surplus >= 0 ? 'text-gain' : 'text-loss'}`}
                      >
                        {formatCurrency(surplus)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${
                            fund.balance + spent > 0
                              ? (spent / (fund.balance + spent)) * 100
                              : 0
                          }%`,
                          backgroundColor: fund.color,
                        }}
                      />
                    </div>
                  </div>

                  {fund.deadline && (
                    <div className="mt-2.5 text-[9px] font-mono text-txt-secondary">
                      Limit: {new Date(fund.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick links as flat outline dividers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          className="p-4 border border-white/[0.06] bg-white/[0.01] rounded-xl cursor-pointer hover:border-white/10 transition-colors flex items-center justify-between"
          onClick={() => navigate('/wants')}
        >
          <div>
            <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
              Wants
            </div>
            <div className="font-mono text-lg font-bold text-txt-primary">
              {state.wants.length} Items ({pendingWants} pending)
            </div>
          </div>
          <span className="text-xl text-txt-secondary/30 font-mono">→</span>
        </div>

        <div
          className="p-4 border border-white/[0.06] bg-white/[0.01] rounded-xl cursor-pointer hover:border-white/10 transition-colors flex items-center justify-between"
          onClick={() => navigate('/needs')}
        >
          <div>
            <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
              Needs
            </div>
            <div className="font-mono text-lg font-bold text-txt-primary">
              {state.needs.length} Items ({activeNeeds} active)
            </div>
          </div>
          <span className="text-xl text-txt-secondary/30 font-mono">→</span>
        </div>

        <div
          className="p-4 border border-white/[0.06] bg-white/[0.01] rounded-xl cursor-pointer hover:border-white/10 transition-colors flex items-center justify-between"
          onClick={() => navigate('/funds/manage')}
        >
          <div>
            <div className="text-[10px] text-txt-secondary uppercase tracking-widest font-bold mb-1">
              Manage Funds
            </div>
            <div className="font-mono text-lg font-bold text-txt-primary">
              {state.funds.length} Active Funds
            </div>
          </div>
          <span className="text-xl text-txt-secondary/30 font-mono">→</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-white/[0.06] pt-6">
        <Button variant="ghost" onClick={() => setTransferOpen(true)}>
          Transfer Cash
        </Button>
        <Button variant="ghost" onClick={() => {
          if (fundsWithSurplus.length > 0) {
            openRedistribute(fundsWithSurplus[0].id);
          } else if (state.funds.length > 1) {
            openRedistribute(state.funds[0].id);
          }
        }}>
          Redistribute Surplus
        </Button>
        <Button variant="primary" onClick={() => setConfigOpen(true)}>
          Configure Allocation Ratio
        </Button>
      </div>

      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        funds={state.funds}
        dispatch={dispatch}
      />

      <FundTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
      />

      {redistributeFundId !== null && (
        <SurplusRedistributeModal
          open={redistributeOpen}
          onClose={() => { setRedistributeOpen(false); setRedistributeFundId(null); }}
          sourceFundId={redistributeFundId}
        />
      )}
    </div>
  );
}

function ConfigModal({
  open,
  onClose,
  funds,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  funds: import('../types').Fund[];
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [pctValues, setPctValues] = useState<Record<number, string>>(
    Object.fromEntries(funds.map((f) => [f.id, String(f.allocation_pct)]))
  );
  const [locked, setLocked] = useState<Record<number, boolean>>(
    Object.fromEntries(funds.map((f) => [f.id, f.allocation_locked]))
  );
  const [toast, setToast] = useState('');

  const totalPct = Object.values(pctValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const valid = Math.round(totalPct) === 100;

  const allocPieData = funds.map((f) => ({
    name: f.name.charAt(0).toUpperCase() + f.name.slice(1),
    value: parseFloat(pctValues[f.id]) || 0,
    color: f.color,
  }));

  const handleSliderChange = useCallback((fundId: number, newValue: string) => {
    const newVal = Math.min(100, Math.max(0, parseFloat(newValue) || 0));

    const otherFunds = funds.filter((f) => f.id !== fundId && !locked[f.id]);
    const lockedTotal = funds
      .filter((f) => f.id !== fundId && locked[f.id])
      .reduce((s, f) => s + (parseFloat(pctValues[f.id]) || 0), 0);

    const remainder = 100 - newVal - lockedTotal;
    const otherTotal = otherFunds.reduce((s, f) => s + (parseFloat(pctValues[f.id]) || 0), 0);

    setPctValues((prev) => {
      const next: Record<number, string> = { ...prev, [fundId]: String(newVal) };
      if (otherTotal <= 0 || remainder <= 0) {
        for (const f of otherFunds) next[f.id] = '0';
      } else {
        for (const f of otherFunds) {
          const cur = parseFloat(prev[f.id]) || 0;
          next[f.id] = String(round2((cur / otherTotal) * Math.max(0, remainder)));
        }
      }
      return next;
    });
  }, [funds, locked, pctValues]);

  const toggleLock = (fundId: number) => {
    setLocked((prev) => ({ ...prev, [fundId]: !prev[fundId] }));
  };

  const save = () => {
    if (!valid) return;
    for (const fund of funds) {
      const val = parseFloat(pctValues[fund.id]);
      if (isNaN(val)) continue;
      dispatch({
        type: 'UPDATE_FUND',
        payload: {
          ...fund,
          allocation_pct: round2(val),
          allocation_locked: !!locked[fund.id],
        },
      });
    }
    setToast('Allocation updated');
    setTimeout(() => { setToast(''); onClose(); }, 1000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Configure Fund Allocation">
      <p className="text-xs text-txt-secondary mb-4">
        Drag one slider — unlocked funds rebalance proportionally. Lock funds to freeze their %. Must sum to 100%.
      </p>

      {totalPct > 0 && (
        <div className="flex justify-center mb-4">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={allocPieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {allocPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
                contentStyle={{
                  background: 'rgba(25,25,25,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  color: '#F4F4F5',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-4">
        {funds.map((f) => {
          const isLocked = !!locked[f.id];
          return (
            <div key={f.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: f.color }} />
                  <label className="text-base text-txt-primary">{f.name}</label>
                  {isLocked && (
                    <span className="text-[10px] text-txt-secondary bg-white/[0.06] px-1.5 py-0.5 rounded">locked</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={pctValues[f.id] || '0'}
                      onChange={(e) => handleSliderChange(f.id, e.target.value)}
                      className="w-20 bg-transparent border-b border-white/20 focus:border-brand rounded-none pr-4.5 py-1 text-right font-mono text-sm text-txt-primary outline-none transition-colors"
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-txt-secondary text-xs pointer-events-none select-none">%</span>
                  </div>
                  <button
                    onClick={() => toggleLock(f.id)}
                    className={`text-sm cursor-pointer transition-colors ${isLocked ? 'text-brand' : 'text-txt-secondary/40 hover:text-txt-secondary'}`}
                    title={isLocked ? 'Unlock allocation' : 'Lock allocation'}
                  >
                    {isLocked ? '🔒' : '🔓'}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={pctValues[f.id] || 0}
                onChange={(e) => handleSliderChange(f.id, e.target.value)}
                className="w-full h-2 rounded-full appearance-none bg-white/[0.06] accent-brand cursor-pointer"
              />
            </div>
          );
        })}
        <div className="flex justify-between text-base mt-2">
          <span className="text-txt-secondary">Total</span>
          <span className={`font-mono font-semibold ${valid ? 'text-gain' : 'text-loss'}`}>
            {totalPct.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-end gap-3 pt-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!valid}>
            Save
          </Button>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl bg-surface/95 backdrop-blur-md border border-border-subtle text-base text-txt-primary shadow-2xl">
          {toast}
        </div>
      )}
    </Modal>
  );
}
