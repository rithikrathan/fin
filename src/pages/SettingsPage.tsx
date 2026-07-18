import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { AppState } from '../types';
import { round2 } from '../utils/helpers';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetTxOpen, setResetTxOpen] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const exportData = () => {
    const { loading, ...data } = state;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finmanager-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
  };

  const shareData = async () => {
    const { loading, ...data } = state;
    const text = JSON.stringify(data);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Finance Manager Data', text });
        showToast('Shared');
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as AppState;
        dispatch({ type: 'LOAD_DATA', payload: data });
        showToast('Data imported successfully');
      } catch {
        showToast('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const deleteAll = () => {
    dispatch({ type: 'DELETE_ALL' });
    setDeleteOpen(false);
    showToast('All data deleted');
  };

  const resetTransactions = () => {
    dispatch({ type: 'RESET_TRANSACTIONS' });
    setResetTxOpen(false);
    showToast('Transactions cleared, fund balances preserved');
  };

  const [pctValues, setPctValues] = useState<Record<number, string>>(
    Object.fromEntries(state.funds.map((f) => [f.id, String(f.allocation_pct)]))
  );

  const totalPct = Object.values(pctValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const pctValid = totalPct === 100;

  const savePercentages = () => {
    if (!pctValid) return;
    for (const fund of state.funds) {
      const val = parseFloat(pctValues[fund.id]);
      if (isNaN(val)) continue;
      dispatch({ type: 'UPDATE_FUND', payload: { ...fund, allocation_pct: round2(val) } });
    }
    showToast('Allocation saved');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold text-txt-primary mb-5">Fund Allocation</h3>
        <p className="text-base text-txt-secondary mb-5">
          Percentage split for incoming income. Must sum to 100%.
        </p>
        <div className="space-y-4 mb-5">
          {state.funds.map((f) => (
            <div key={f.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: f.color }} />
                  <label className="text-sm text-txt-primary">{f.name}</label>
                </div>
                <span className="font-mono text-sm text-txt-secondary">{pctValues[f.id] || 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={pctValues[f.id] || 0}
                onChange={(e) => setPctValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                className="w-full h-2 rounded-full appearance-none bg-white/[0.06] accent-brand cursor-pointer"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-base text-txt-secondary">Total</span>
          <span className={`font-mono text-base font-semibold ${pctValid ? 'text-gain' : 'text-loss'}`}>
            {totalPct}%
          </span>
        </div>
        <Button variant="primary" onClick={savePercentages} disabled={!pctValid}>
          Save Allocation
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-txt-primary mb-5">Data Management</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <div>
              <div className="text-base font-medium text-txt-primary">Export Data</div>
              <div className="text-sm text-txt-secondary">Download all data as a JSON file</div>
            </div>
            <Button variant="secondary" onClick={exportData}>
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <div>
              <div className="text-base font-medium text-txt-primary">Share Data</div>
              <div className="text-sm text-txt-secondary">Copy data to clipboard or share</div>
            </div>
            <Button variant="secondary" onClick={shareData}>
              Share
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <div>
              <div className="text-base font-medium text-txt-primary">Import Data</div>
              <div className="text-sm text-txt-secondary">Load data from a JSON backup file</div>
            </div>
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Import
              </Button>
            </>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <div>
              <div className="text-base font-medium text-amber-400">Reset Transactions</div>
              <div className="text-sm text-txt-secondary">
                Clear all transactions but keep fund balances, milestones, and snapshots.
              </div>
            </div>
            <Button variant="secondary" onClick={() => setResetTxOpen(true)}>
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-base font-medium text-red-400">Delete All Data</div>
              <div className="text-sm text-txt-secondary">
                Permanently remove everything. This cannot be undone.
              </div>
            </div>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete All
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-txt-primary mb-3">About</h3>
        <div className="space-y-2 text-base text-txt-secondary">
          <div className="flex justify-between">
            <span>Funds</span>
            <span className="font-mono text-txt-primary">{state.funds.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Transactions</span>
            <span className="font-mono text-txt-primary">{state.transactions.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Wants</span>
            <span className="font-mono text-txt-primary">{state.wants.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Needs</span>
            <span className="font-mono text-txt-primary">{state.needs.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Investments</span>
            <span className="font-mono text-txt-primary">{state.investments.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Milestones</span>
            <span className="font-mono text-txt-primary">{state.milestones.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Saved Reports</span>
            <span className="font-mono text-txt-primary">{state.reports.length}</span>
          </div>
        </div>
      </Card>

      <Modal open={resetTxOpen} onClose={() => setResetTxOpen(false)} title="Reset Transactions">
        <p className="text-base text-txt-secondary mb-6">
          This will clear all transaction history but keep your fund balances, milestones, and snapshots. You can still see your current fund balances.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setResetTxOpen(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={resetTransactions}>
            Reset Transactions
          </Button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete All Data">
        <p className="text-base text-txt-secondary mb-6">
          This will permanently delete all your transactions, wants, needs, investments, and reports. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteAll}>
            Delete Everything
          </Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl bg-surface/95 backdrop-blur-md border border-border-subtle text-base text-txt-primary shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
