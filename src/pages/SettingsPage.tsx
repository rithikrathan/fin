import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getStorageService } from '../storage/StorageService';
import { saveAs } from 'file-saver';
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

    const exportData = async () => {
        const { loading, ...data } = state;
        const svc = await getStorageService();
        const blob = await svc.exportZip(data);
        saveAs(blob, `finmanager-backup-${new Date().toISOString().split('T')[0]}.zip`);
        showToast('Data exported');
    };

    const shareData = async () => {
        const { loading, ...data } = state;
        const text = JSON.stringify(data);
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Fin Data', text });
                showToast('Shared');
            } catch { }
        } else {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard');
        }
    };

    const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const svc = await getStorageService();
            const data = await svc.importZip(file);
            dispatch({ type: 'LOAD_DATA', payload: data as AppState });
            showToast('Data imported successfully');
        } catch {
            showToast('Invalid file format');
        }
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

    // ── Predictions settings ──
    const [incomeInput, setIncomeInput] = useState(String(state.settings.expected_monthly_income || ''));
    const [scaleInput, setScaleInput] = useState(String(state.settings.scale_amount || ''));

    const savePredictions = () => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                expected_monthly_income: round2(parseFloat(incomeInput) || 0),
                scale_amount: round2(parseFloat(scaleInput) || 0),
            },
        });
        showToast('Prediction settings saved');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* ── Predictions ── */}
            <Card className="p-6">
                <h3 className="text-xl font-bold text-txt-primary mb-5">Predictions</h3>
                <p className="text-base text-txt-secondary mb-5">
                    Configure values used for milestone predictions and projections across fund detail pages.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-txt-primary mb-1">Expected Monthly Income</label>
                        <p className="text-xs text-txt-secondary mb-2">
                            Your recurring salary or base income. Used to predict when milestones can be reached based on allocation %.
                        </p>
                        <input
                            type="number"
                            value={incomeInput}
                            onChange={(e) => setIncomeInput(e.target.value)}
                            placeholder="e.g. 80000"
                            min="0"
                            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-txt-primary mb-1">Scale Amount</label>
                        <p className="text-xs text-txt-secondary mb-2">
                            A "what-if" amount per month. Predicts how long milestones take at this investment rate.
                        </p>
                        <input
                            type="number"
                            value={scaleInput}
                            onChange={(e) => setScaleInput(e.target.value)}
                            placeholder="e.g. 5000"
                            min="0"
                            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 transition-colors"
                        />
                    </div>
                </div>
                <div className="mt-5">
                    <Button variant="primary" onClick={savePredictions}>
                        Save Prediction Settings
                    </Button>
                </div>
            </Card>

            {/* ── Data Management ── */}
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
                                accept=".zip"
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
                            <div className="text-base font-medium text-red-400">Reset Transactions</div>
                            <div className="text-sm text-txt-secondary">
                                Clear all transactions but keep fund balances, milestones, and snapshots.
                            </div>
                        </div>
                        <Button variant="danger" onClick={() => setResetTxOpen(true)}>
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

            {/* ── About ── */}
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
