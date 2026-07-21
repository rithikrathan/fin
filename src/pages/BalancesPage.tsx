import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/shared/Card';
import AddBalanceModal from '../components/balances/AddBalanceModal';
import FloatingAddButton from '../components/shared/FloatingAddButton';
import { formatCurrency } from '../utils/helpers';
import { Store, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function BalancesPage() {
    const { state } = useApp();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const accounts = state.balance_accounts || [];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24">
            {/* Header Banner */}
            <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-txt-primary">Store Balances</h2>
                <p className="text-xs text-txt-secondary">
                    Continuous rolling tabs to track itemized bills and store dues over time.
                </p>
            </div>

            {/* Empty State */}
            {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-[0_0_30px_rgba(255,42,42,0.25)] animate-pulse">
                        <Store className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                        <h3 className="text-lg font-bold text-txt-primary">No balances yet</h3>
                        <p className="text-xs text-txt-secondary">Tap the + button below to add a store and start tracking.</p>
                    </div>
                </div>
            ) : (
                /* Populated State Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((acc) => {
                        const isPaid = acc.status === 'Paid' || acc.total_due === 0;
                        const isPartial = acc.status === 'Partially Paid';

                        return (
                            <Card
                                key={acc.id}
                                onClick={() => navigate(`/balances/${acc.id}`)}
                                className="p-5 flex flex-col justify-between space-y-4 hover:border-brand/40 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between min-w-0">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-txt-primary shrink-0 group-hover:border-brand/30 group-hover:text-brand transition-colors">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-base text-txt-primary truncate group-hover:text-brand transition-colors">
                                                {acc.title}
                                            </h4>
                                            <p className="text-[11px] text-txt-secondary truncate">
                                                Created {new Date(acc.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${isPaid
                                                ? 'bg-gain/10 text-gain border border-gain/20'
                                                : isPartial
                                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    : 'bg-loss/10 text-loss border border-loss/20'
                                            }`}
                                    >
                                        {isPaid ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : isPartial ? (
                                            <Clock className="w-3 h-3" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3" />
                                        )}
                                        {acc.status}
                                    </div>
                                </div>

                                <div className="flex items-end justify-between pt-2 border-t border-white/[0.06]">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-txt-secondary block">
                                            Total Due
                                        </span>
                                        <span className="text-xl font-bold font-mono text-txt-primary">
                                            {formatCurrency(acc.total_due)}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-xs font-semibold text-txt-secondary group-hover:text-brand transition-colors">
                                        View Ledger
                                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Primary Floating Action Button (FAB) */}
            <FloatingAddButton onClick={() => setIsAddModalOpen(true)} />

            {/* Add Modal */}
            <AddBalanceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </div>
    );
}
