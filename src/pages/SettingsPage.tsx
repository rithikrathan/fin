import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { getStorageService } from '../storage/StorageService';
import { saveAs } from 'file-saver';
import type { AppState } from '../types';
import { round2 } from '../utils/helpers';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import PatternBuilder from '../components/messages/PatternBuilder';
import Select from '../components/shared/Select';

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
        try {
            const { loading, ...data } = state;
            const svc = await getStorageService();
            const blob = await svc.exportZip(data);
            const filename = `finmanager-backup-${new Date().toISOString().split('T')[0]}.zip`;
            const file = new File([blob], filename, { type: 'application/zip' });

            // On Android / mobile WebViews, try native Web Share API with File payload
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Fin Data Backup',
                        text: 'Fin Personal Finance Manager Backup Data',
                    });
                    showToast('Data exported & shared');
                    return;
                } catch (err: any) {
                    if (err.name === 'AbortError') return; // User cancelled share modal
                }
            }

            // Fallback: Data URL anchor download for Android WebViews where blob: links are blocked
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => document.body.removeChild(a), 100);
                showToast('Data exported');
            };
            reader.onerror = () => {
                saveAs(blob, filename);
                showToast('Data exported');
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('Export failed:', err);
            showToast('Export failed');
        }
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
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Theme / Appearance */}
            <div className="space-y-4">
                <div className="border-b border-white/[0.06] pb-2">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                        Appearance & Theme
                    </h3>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div>
                        <h4 className="text-sm font-bold text-txt-primary">App Theme</h4>
                        <p className="text-xs text-txt-secondary mt-0.5">
                            Choose your preferred theme appearance for the application interface.
                        </p>
                    </div>
                    <Select
                        value={state.settings.theme_mode || 'system'}
                        onChange={(val) => {
                            dispatch({
                                type: 'UPDATE_SETTINGS',
                                payload: { theme_mode: val as 'system' | 'light' | 'dark' },
                            });
                            const labels: Record<string, string> = {
                                system: 'System Default',
                                light: 'Light Mode',
                                dark: 'Dark Mode',
                            };
                            showToast(`Theme set to ${labels[val] || val}`);
                        }}
                        options={[
                            { value: 'system', label: 'System Default' },
                            { value: 'light', label: 'Light Mode' },
                            { value: 'dark', label: 'Dark Mode' },
                        ]}
                    />
                </div>
            </div>

            {/* UI Animations & Friction Controls */}
            <div className="space-y-4">
                <div className="border-b border-white/[0.06] pb-2">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                        Interface & Ghost Balances
                    </h3>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
                        <div>
                            <h4 className="text-sm font-bold text-txt-primary">Ghost Balance Deductions</h4>
                            <p className="text-xs text-txt-secondary mt-0.5">
                                Display Available Balance (minus committed bills & debt EMIs) with Total Balance in small font.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={state.settings.show_ghost_deductions !== false}
                            onChange={(e) => {
                                dispatch({
                                    type: 'UPDATE_SETTINGS',
                                    payload: { show_ghost_deductions: e.target.checked },
                                });
                                showToast(e.target.checked ? 'Ghost deductions enabled' : 'Ghost deductions disabled');
                            }}
                            className="h-5 w-5 accent-brand cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
                        <div>
                            <h4 className="text-sm font-bold text-txt-primary">Income Allocation Mode</h4>
                            <p className="text-xs text-txt-secondary mt-0.5">
                                Waterfall mode fills Needs baseline first before splitting surplus into Savings & Wants.
                            </p>
                        </div>
                        <Select
                            value={state.settings.allocation_mode || 'blind'}
                            onChange={(val) => {
                                dispatch({
                                    type: 'UPDATE_SETTINGS',
                                    payload: { allocation_mode: val as 'blind' | 'waterfall' },
                                });
                                showToast(`Allocation mode: ${val === 'blind' ? 'Pro-Rata (Default)' : 'Waterfall (Needs First)'}`);
                            }}
                            options={[
                                { value: 'blind', label: 'Pro-Rata (Default)', description: 'Splits income proportionally based on fund %' },
                                { value: 'waterfall', label: 'Waterfall (Needs First)', description: 'Fills fixed Needs obligation baseline first' },
                            ]}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
                        <div>
                            <h4 className="text-sm font-bold text-txt-primary">Enable UI Animations</h4>
                            <p className="text-xs text-txt-secondary mt-0.5">
                                Use premium slide and scale transitions. Disable for faster performance.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={state.settings.animations_enabled !== false}
                            onChange={(e) => {
                                dispatch({
                                    type: 'UPDATE_SETTINGS',
                                    payload: { animations_enabled: e.target.checked },
                                });
                                showToast(e.target.checked ? 'Animations enabled' : 'Animations disabled');
                            }}
                            className="h-5 w-5 accent-brand cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Predictions */}
            <div className="space-y-4">
                <div className="border-b border-white/[0.06] pb-2">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                        Predictions
                    </h3>
                </div>
                <p className="text-xs text-txt-secondary">
                    Configure values used for milestone predictions and projections across fund detail pages.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
                            Expected Monthly Income
                        </label>
                        <p className="text-xs text-txt-secondary/60 mb-2">
                            Recurring salary or base income. Used to predict milestone timelines.
                        </p>
                        <input
                            type="number"
                            value={incomeInput}
                            onChange={(e) => setIncomeInput(e.target.value)}
                            placeholder="e.g. 80000"
                            min="0"
                            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
                            Scale Amount
                        </label>
                        <p className="text-xs text-txt-secondary/60 mb-2">
                            A "what-if" monthly investment rate. Predicts how long milestones take at this rate.
                        </p>
                        <input
                            type="number"
                            value={scaleInput}
                            onChange={(e) => setScaleInput(e.target.value)}
                            placeholder="e.g. 5000"
                            min="0"
                            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary font-mono placeholder:text-txt-secondary/30 outline-none transition-colors"
                        />
                    </div>
                </div>
                <div className="pt-2">
                    <Button variant="primary" onClick={savePredictions}>
                        Save Prediction Settings
                    </Button>
                </div>
            </div>

            {/* SMS Patterns */}
            <div className="space-y-4">
                <div className="border-b border-white/[0.06] pb-2">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                        SMS Patterns
                    </h3>
                </div>
                <p className="text-xs text-txt-secondary">
                    Create regex patterns to match bank SMS and auto-detect transactions.
                </p>
                <PatternBuilder />
            </div>

            {/* Data Management */}
            <div className="space-y-4">
                <div className="border-b border-white/[0.06] pb-2">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                        Data Management
                    </h3>
                </div>

                <div className="space-y-3">
                    <div className="py-4 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-txt-primary">Export Data</div>
                            <div className="text-xs text-txt-secondary mt-0.5">Download all data as a zip file</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={exportData}>
                            Export
                        </Button>
                    </div>

                    <div className="py-4 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-txt-primary">Share Data</div>
                            <div className="text-xs text-txt-secondary mt-0.5">Copy data to clipboard or share</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={shareData}>
                            Share
                        </Button>
                    </div>

                    <div className="py-4 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-txt-primary">Import Data</div>
                            <div className="text-xs text-txt-secondary mt-0.5">Load data from a zip backup file</div>
                        </div>
                        <>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".zip"
                                onChange={importData}
                                className="hidden"
                            />
                            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                                Import
                            </Button>
                        </>
                    </div>

                    <div className="py-4 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-red-400">Reset Transactions</div>
                            <div className="text-xs text-txt-secondary mt-0.5">
                                Clear all transactions but keep fund balances, milestones, and snapshots.
                            </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => setResetTxOpen(true)}>
                            Reset
                        </Button>
                    </div>

                    <div className="py-4 px-3 rounded-xl bg-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-red-400">Delete All Data</div>
                            <div className="text-xs text-txt-secondary mt-0.5">
                                Permanently remove everything. This cannot be undone.
                            </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                            Delete
                        </Button>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="space-y-4">
                <div className="border-b border-white/[0.06] pb-2">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-txt-secondary">
                        About
                    </h3>
                </div>
                <div className="space-y-3 text-sm">
                    {[
                        ['Funds', state.funds.length],
                        ['Transactions', state.transactions.length],
                        ['Wants', state.wants.length],
                        ['Needs', state.needs.length],
                        ['Investments', state.investments.length],
                        ['Milestones', state.milestones.length],
                        ['Saved Reports', state.reports.length],
                    ].map(([label, count]) => (
                        <div key={label} className="py-2.5 px-3 rounded-xl bg-white/[0.03] flex justify-between">
                            <span className="text-txt-secondary">{label}</span>
                            <span className="font-mono text-txt-primary">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Modal open={resetTxOpen} onClose={() => setResetTxOpen(false)} title="Reset Transactions">
                <p className="text-sm text-txt-secondary mb-6">
                    This will clear all transaction history but keep your fund balances, milestones, and snapshots.
                </p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setResetTxOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={resetTransactions}>
                        Reset Transactions
                    </Button>
                </div>
            </Modal>

            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete All Data">
                <p className="text-sm text-txt-secondary mb-6">
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

            {toast && createPortal(
                <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,8px))] lg:bottom-6 z-[99999] px-3.5 py-1.5 rounded-full bg-[#18181B]/95 backdrop-blur-md border border-white/15 text-xs font-semibold text-txt-primary shadow-2xl flex items-center gap-2 pointer-events-none whitespace-nowrap animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse" />
                    <span>{toast}</span>
                </div>,
                document.body
            )}
        </div>
    );
}
