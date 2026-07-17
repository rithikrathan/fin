import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { AppState } from '../types';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  const [needsPct, setNeedsPct] = useState(String(state.settings.needs_pct));
  const [wantsPct, setWantsPct] = useState(String(state.settings.wants_pct));
  const [savingsPct, setSavingsPct] = useState(String(state.settings.savings_pct));

  const savePercentages = () => {
    const n = parseFloat(needsPct);
    const w = parseFloat(wantsPct);
    const s = parseFloat(savingsPct);
    if (isNaN(n) || isNaN(w) || isNaN(s)) return;
    if (n + w + s !== 100) {
      showToast('Percentages must sum to 100');
      return;
    }
    dispatch({ type: 'UPDATE_SETTINGS', payload: { needs_pct: n, wants_pct: w, savings_pct: s } });
    showToast('Settings saved');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold text-txt-primary mb-5">Fund Allocation</h3>
        <p className="text-base text-txt-secondary mb-5">
          Percentage split for incoming income. Must sum to 100%.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Needs %</label>
            <input
              type="number"
              value={needsPct}
              onChange={(e) => setNeedsPct(e.target.value)}
              min="0"
              max="100"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Wants %</label>
            <input
              type="number"
              value={wantsPct}
              onChange={(e) => setWantsPct(e.target.value)}
              min="0"
              max="100"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-txt-secondary mb-1.5">Savings %</label>
            <input
              type="number"
              value={savingsPct}
              onChange={(e) => setSavingsPct(e.target.value)}
              min="0"
              max="100"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-base text-txt-primary font-mono outline-none focus:border-brand/50 transition-colors"
            />
          </div>
        </div>
        <Button variant="primary" onClick={savePercentages}>
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
            <span>Saved Reports</span>
            <span className="font-mono text-txt-primary">{state.reports.length}</span>
          </div>
        </div>
      </Card>

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
