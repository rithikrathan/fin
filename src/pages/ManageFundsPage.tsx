import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Fund } from '../types';
import { formatCurrency, round2 } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import FloatingAddButton from '../components/shared/FloatingAddButton';

const PRESET_COLORS = ['#FF2A2A', '#A78BFA', '#4ADE80', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4', '#F97316'];
const PROTECTED_NAMES = ['needs', 'wants', 'savings'];

export default function ManageFundsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Fund | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Fund | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (fund: Fund) => {
    setEditing(fund);
    setFormOpen(true);
  };

  const handleDelete = (fund: Fund) => {
    if (PROTECTED_NAMES.includes(fund.name)) {
      showToast('Default funds cannot be deleted');
      setDeleteConfirm(null);
      return;
    }
    if (fund.balance !== 0) {
      showToast('Transfer balance to another fund before deleting');
      setDeleteConfirm(null);
      return;
    }
    dispatch({ type: 'REMOVE_FUND', payload: fund.id });
    setDeleteConfirm(null);
    showToast(`${fund.name} deleted`);
  };

  const totalPct = state.funds.reduce((s, f) => s + f.allocation_pct, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-txt-primary">Manage Funds</h2>
          <p className="text-sm text-txt-secondary mt-1">
            {state.funds.length} funds · {totalPct}% allocated
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="hidden lg:flex">
          + Create Fund
        </Button>
      </div>

      {state.funds.length === 0 ? (
          <EmptyState
            icon="◈"
            title="No funds created"
            description="Create funds to split your income into buckets."
          />
      ) : (
        <div className="space-y-3">
          {state.funds.map((fund) => {
            const milestones = state.milestones.filter((m) => m.fund_id === fund.id);
            const reached = milestones.filter((m) => m.reached).length;
            const snapshots = state.fund_snapshots
              .filter((s) => s.fund_id === fund.id)
              .sort((a, b) => a.date.localeCompare(b.date));
            const firstSnap = snapshots[0]?.balance || fund.balance;
            const growth = fund.balance - firstSnap;
            const isProtected = PROTECTED_NAMES.includes(fund.name);

            return (
              <Card
                key={fund.id}
                className="p-5 cursor-pointer hover:bg-white/[0.03] transition-all"
                onClick={() => navigate(`/funds/${fund.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-5 w-5 rounded-full shrink-0"
                      style={{ backgroundColor: fund.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-txt-primary">
                          {fund.name}
                        </span>
                        {isProtected && (
                          <Badge color="bg-white/5 text-txt-secondary">default</Badge>
                        )}
                      </div>
                      <div className="font-mono text-2xl font-bold text-txt-primary min-w-0 break-all">
                        {formatCurrency(fund.balance)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color="bg-white/5 text-txt-secondary">{`${fund.allocation_pct}%`}</Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(fund); }}
                      className="text-sm text-txt-secondary hover:text-txt-primary transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    {!isProtected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(fund); }}
                        className="text-sm text-txt-secondary hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs text-txt-secondary">
                  {fund.deadline && (
                    <span>Deadline: {new Date(fund.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                  {fund.goal_amount && (
                    <span>Goal: {formatCurrency(fund.goal_amount)}</span>
                  )}
                  {milestones.length > 0 && (
                    <span>Milestones: {reached}/{milestones.length}</span>
                  )}
                  {growth !== 0 && (
                    <span className={growth >= 0 ? 'text-gain' : 'text-loss'}>
                      {growth >= 0 ? '+' : ''}{formatCurrency(growth)} since first snapshot
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FundFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        editing={editing}
        existingFunds={state.funds}
        dispatch={dispatch}
      />

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Fund">
        <p className="text-base text-txt-secondary mb-6">
          Are you sure you want to delete <strong className="text-txt-primary">{deleteConfirm?.name}</strong>?
          {deleteConfirm && deleteConfirm.balance !== 0 && (
            <span className="block mt-2 text-amber-400">
              This fund has a balance of {formatCurrency(deleteConfirm.balance)}. Transfer it first.
            </span>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          {deleteConfirm && deleteConfirm.balance === 0 && (
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          )}
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl bg-surface/95 backdrop-blur-md border border-border-subtle text-base text-txt-primary shadow-2xl">
          {toast}
        </div>
      )}
      <FloatingAddButton onClick={openCreate} />
    </div>
  );
}

function FundFormModal({
  open,
  onClose,
  editing,
  existingFunds,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  editing: Fund | null;
  existingFunds: Fund[];
  dispatch: React.Dispatch<import('../types').AppAction>;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [pct, setPct] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestFrequency, setInterestFrequency] = useState<string>('');
  const [interestCalcType, setInterestCalcType] = useState<string>('');
  const [nameError, setNameError] = useState('');
  const [toast, setToast] = useState('');

  const isCreating = !editing;

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setColor(editing?.color || PRESET_COLORS[existingFunds.length % PRESET_COLORS.length]);
      setPct(String(editing?.allocation_pct || 0));
      setDeadline(editing?.deadline || '');
      setGoalAmount(editing?.goal_amount ? String(editing.goal_amount) : '');
      setInterestRate(editing?.interest_rate != null ? String(editing.interest_rate) : '');
      setInterestFrequency(editing?.interest_frequency || '');
      setInterestCalcType(editing?.interest_calc_type || '');
      setNameError('');
    }
  }, [editing, open, existingFunds.length]);

  const newPct = parseFloat(pct) || 0;

  const otherFunds = isCreating
    ? existingFunds
    : existingFunds.filter((f) => f.id !== editing!.id);

  const otherTotal = otherFunds.reduce((s, f) => s + f.allocation_pct, 0);

  const rebalancedPcts = isCreating && newPct > 0
    ? (() => {
        const remainder = 100 - newPct;
        if (otherTotal === 0 || remainder <= 0) {
          return Object.fromEntries(otherFunds.map((f) => [f.id, 0]));
        }
        return Object.fromEntries(
          otherFunds.map((f) => [f.id, round2((f.allocation_pct / otherTotal) * remainder)])
        );
      })()
    : {};

  const totalPct = isCreating
    ? newPct + Object.values(rebalancedPcts).reduce((s, v) => s + v, 0)
    : existingFunds.reduce((s, f) => s + (f.id === editing!.id ? newPct : f.allocation_pct), 0);

  const handleNameChange = (val: string) => {
    setName(val);
    setNameError('');
    const trimmed = val.trim().toLowerCase();
    if (trimmed) {
      const duplicate = existingFunds.some(
        (f) => f.name === trimmed && (!editing || f.id !== editing.id)
      );
      if (duplicate) setNameError('A fund with this name already exists');
    }
  };

  const save = () => {
    if (!name.trim()) return;
    const trimmed = name.trim().toLowerCase();
    const duplicate = existingFunds.some(
      (f) => f.name === trimmed && (!editing || f.id !== editing.id)
    );
    if (duplicate) {
      setNameError('A fund with this name already exists');
      return;
    }
    const pctVal = parseFloat(pct) || 0;

    if (editing) {
      dispatch({
        type: 'UPDATE_FUND',
        payload: {
          ...editing,
          name: trimmed,
          color,
          allocation_pct: round2(pctVal),
          allocation_locked: editing.allocation_locked,
          deadline: deadline || null,
          goal_amount: goalAmount ? round2(parseFloat(goalAmount)) : null,
          interest_rate: interestRate ? round2(parseFloat(interestRate)) : null,
          interest_frequency: (interestFrequency || null) as 'daily' | 'weekly' | 'monthly' | 'yearly' | null,
          interest_calc_type: (interestCalcType || null) as 'compound' | 'simple' | null,
        },
      });
      setToast('Fund updated');
    } else {
      const maxId = existingFunds.reduce((max, f) => Math.max(max, f.id), 0);
      dispatch({
        type: 'ADD_FUND',
        payload: {
          id: maxId + 1,
          name: trimmed,
          balance: 0,
          allocation_pct: round2(pctVal),
          allocation_locked: false,
          color,
          deadline: deadline || null,
          goal_amount: goalAmount ? round2(parseFloat(goalAmount)) : null,
          interest_rate: interestRate ? round2(parseFloat(interestRate)) : null,
          interest_frequency: (interestFrequency || null) as 'daily' | 'weekly' | 'monthly' | 'yearly' | null,
          interest_calc_type: (interestCalcType || null) as 'compound' | 'simple' | null,
          is_career_fund: false,
        },
      });
      for (const f of otherFunds) {
        const rebal = rebalancedPcts[f.id] ?? f.allocation_pct;
        if (rebal !== f.allocation_pct) {
          dispatch({ type: 'UPDATE_FUND', payload: { ...f, allocation_pct: round2(rebal) } });
        }
      }
      setToast('Fund created');
    }
    setTimeout(() => { setToast(''); onClose(); }, 800);
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Fund' : 'Create Fund'}>
      <div className="space-y-5">
        <div>
          <label className="block text-xs text-txt-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. emergency, vacation"
            className={`w-full bg-transparent border-b rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/30 outline-none transition-colors ${
              nameError ? 'border-red-400/60 focus:border-red-400' : 'border-white/20 focus:border-brand'
            }`}
          />
          {nameError && (
            <p className="text-xs text-red-400 mt-1">{nameError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full cursor-pointer transition-all ${color === c ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Allocation %</label>
          <input
            type="number"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            min="0"
            max="100"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
          <div className="flex justify-between mt-1 text-xs">
            <span className="text-txt-secondary">Total across all funds</span>
            <span className={`font-mono ${Math.round(totalPct) === 100 ? 'text-gain' : 'text-loss'}`}>{Math.round(totalPct)}%</span>
          </div>
        </div>

        {isCreating && newPct > 0 && otherFunds.length > 0 && (
          <div className="bg-white/[0.03] rounded-lg p-3">
            <div className="text-xs text-txt-secondary mb-2">Other funds will be rebalanced:</div>
            <div className="space-y-1.5">
              {otherFunds.map((f) => {
                const rebal = rebalancedPcts[f.id] ?? f.allocation_pct;
                const diff = rebal - f.allocation_pct;
                return (
                  <div key={f.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                      <span className="text-txt-secondary">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-txt-secondary">{f.allocation_pct}%</span>
                      <span className="text-txt-secondary">→</span>
                      <span className="text-txt-primary">{rebal}%</span>
                      {diff !== 0 && (
                        <span className={diff > 0 ? 'text-gain' : 'text-loss'}>
                          ({diff > 0 ? '+' : ''}{diff.toFixed(1)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Deadline (optional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-txt-secondary mb-1">Goal Amount (optional)</label>
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="Target balance"
            min="0"
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
          />
        </div>

        {deadline && goalAmount && parseFloat(goalAmount) > 0 && (
          <div className="py-3 border-b border-white/[0.06] text-xs text-txt-secondary">
            <div className="text-txt-primary font-semibold mb-1">Savings Plan</div>
            <div>
              Required per month: <span className="font-mono text-gain">{formatCurrency(calculateRequired(parseFloat(goalAmount), editing?.balance || 0, deadline))}</span>
            </div>
          </div>
        )}

          <div className="border-t border-white/[0.06] pt-4 mt-2">
          <div className="text-xs text-txt-secondary uppercase tracking-widest font-bold mb-3">Interest (optional)</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-txt-secondary mb-1">Rate % p.a.</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 7"
                min="0"
                step="0.1"
                className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-txt-secondary mb-1">Frequency</label>
              <select
                value={interestFrequency}
                onChange={(e) => setInterestFrequency(e.target.value)}
                className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors"
              >
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-txt-secondary mb-1">Type</label>
              <select
                value={interestCalcType}
                onChange={(e) => setInterestCalcType(e.target.value)}
                className="w-full bg-[#121212] border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary outline-none transition-colors"
              >
                <option value="">None</option>
                <option value="compound">Compound</option>
                <option value="simple">Simple</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!name.trim() || !!nameError || Math.round(totalPct) !== 100}>
            {editing ? 'Save Changes' : 'Create Fund'}
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

function calculateRequired(goal: number, current: number, deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  const months = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)));
  const remaining = goal - current;
  if (remaining <= 0) return 0;
  return round2(remaining / months);
}
