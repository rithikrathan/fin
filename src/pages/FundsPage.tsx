import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
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
  const [configOpen, setConfigOpen] = useState(false);

  const total = state.funds.reduce((s, f) => s + f.balance, 0);

  const pieData = state.funds.map((f) => ({
    name: f.name.charAt(0).toUpperCase() + f.name.slice(1),
    value: f.balance || 0,
    color: f.color,
  }));

  const pendingWants = state.wants.filter((w) => !w.purchased).length;
  const activeNeeds = state.needs.filter((n) => n.active).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Pie Chart + Fund Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie */}
        <Card className="lg:col-span-2 p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-txt-primary mb-4 self-start">
            Fund Split
          </h3>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: string | number | (string | number)[]) => formatCurrency(Number(value))}
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
          ) : (
            <div className="h-64 flex items-center justify-center text-txt-secondary text-base">
              No funds to display
            </div>
          )}
          <div className="flex gap-5 mt-4">
            {state.funds.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-sm">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
                <span className="text-txt-secondary">
                  {f.name.charAt(0).toUpperCase() + f.name.slice(1)}
                </span>
                <span className="font-mono text-txt-primary font-semibold">
                  {f.allocation_pct}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Fund cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            const surplus = fund.balance - committedNeeds;

            return (
              <Card key={fund.id} className="p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: fund.color }}
                  />
                  <h4 className="text-base font-semibold text-txt-primary uppercase tracking-wider">
                    {fund.name}
                  </h4>
                </div>

                <div className="font-mono text-3xl font-bold text-txt-primary mb-1">
                  {formatCurrency(fund.balance)}
                </div>
                <div className="text-sm text-txt-secondary mb-4">
                  {fund.allocation_pct}% allocation
                </div>

                <div className="h-px bg-border-subtle mb-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-txt-secondary">Recurring needs</span>
                    <span className="font-mono text-loss">
                      {formatCurrency(committedNeeds)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-txt-secondary">Spent</span>
                    <span className="font-mono text-loss">
                      {formatCurrency(spent)}
                    </span>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-txt-primary">Surplus</span>
                    <span
                      className={`font-mono ${surplus >= 0 ? 'text-gain' : 'text-loss'}`}
                    >
                      {formatCurrency(surplus)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
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
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick links to Wants + Needs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card
          className="p-6 cursor-pointer hover:bg-white/[0.03] transition-all border-border-subtle"
          onClick={() => navigate('/funds/wants')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-txt-secondary uppercase tracking-widest mb-2">
                Wants
              </div>
              <div className="font-mono text-2xl font-bold text-txt-primary">
                {state.wants.length} items
              </div>
              <div className="text-sm text-txt-secondary mt-1">
                {pendingWants} pending
              </div>
            </div>
            <span className="text-3xl opacity-30">→</span>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:bg-white/[0.03] transition-all border-border-subtle"
          onClick={() => navigate('/funds/needs')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-txt-secondary uppercase tracking-widest mb-2">
                Needs
              </div>
              <div className="font-mono text-2xl font-bold text-txt-primary">
                {state.needs.length} items
              </div>
              <div className="text-sm text-txt-secondary mt-1">
                {activeNeeds} active
              </div>
            </div>
            <span className="text-3xl opacity-30">→</span>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => setConfigOpen(true)}>
          Configure Allocation
        </Button>
      </div>

      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        settings={state.settings}
        dispatch={dispatch}
      />
    </div>
  );
}

function ConfigModal({
  open,
  onClose,
  settings,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  settings: import('../types').Settings;
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [needsPct, setNeedsPct] = useState(String(settings.needs_pct));
  const [wantsPct, setWantsPct] = useState(String(settings.wants_pct));
  const [savingsPct, setSavingsPct] = useState(String(settings.savings_pct));
  const [toast, setToast] = useState('');

  const sum = parseFloat(needsPct || '0') + parseFloat(wantsPct || '0') + parseFloat(savingsPct || '0');
  const valid = sum === 100;

  const save = () => {
    if (!valid) return;
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        needs_pct: parseFloat(needsPct),
        wants_pct: parseFloat(wantsPct),
        savings_pct: parseFloat(savingsPct),
      },
    });
    setToast('Allocation updated');
    setTimeout(() => { setToast(''); onClose(); }, 1000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Configure Fund Allocation">
      <p className="text-base text-txt-secondary mb-6">
        Set the percentage split for incoming income. Must sum to 100%.
      </p>
      <div className="space-y-4">
        {[
          { label: 'Needs', value: needsPct, set: setNeedsPct, color: '#FF2A2A' },
          { label: 'Wants', value: wantsPct, set: setWantsPct, color: '#A78BFA' },
          { label: 'Savings', value: savingsPct, set: setSavingsPct, color: '#4ADE80' },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <label className="text-base text-txt-primary">{item.label}</label>
              </div>
              <span className="font-mono text-base text-txt-secondary">{item.value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={item.value}
              onChange={(e) => item.set(e.target.value)}
              className="w-full h-2 rounded-full appearance-none bg-white/[0.06] accent-brand cursor-pointer"
            />
          </div>
        ))}
        <div className="flex justify-between text-base mt-2">
          <span className="text-txt-secondary">Total</span>
          <span className={`font-mono font-semibold ${valid ? 'text-gain' : 'text-loss'}`}>
            {sum}%
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
