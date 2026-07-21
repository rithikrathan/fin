import { useState, useRef } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useApp } from '../../context/AppContext';
import { formatCurrency, round2 } from '../../utils/helpers';
import { showToast } from '../../utils/toast';
import { Plus, Trash2 } from 'lucide-react';
import type { BalanceLineItem, BalanceTransaction } from '../../types';

interface ItemDraft {
    id: string;
    item_name: string;
    count_qty: string;
    unit_cost: string;
}

export default function AddBillModal({
    isOpen,
    onClose,
    accountId,
}: {
    isOpen: boolean;
    onClose: () => void;
    accountId: string;
}) {
    const { dispatch } = useApp();
    const itemsContainerRef = useRef<HTMLDivElement>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemDraft[]>([
        { id: 'item_1', item_name: '', count_qty: '1', unit_cost: '' },
    ]);

    const addItemRow = () => {
        setItems((prev) => [
            ...prev,
            { id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3), item_name: '', count_qty: '1', unit_cost: '' },
        ]);
        setTimeout(() => {
            if (itemsContainerRef.current) {
                itemsContainerRef.current.scrollTo({
                    top: itemsContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }, 50);
    };

    const removeItemRow = (id: string) => {
        if (items.length <= 1) {
            showToast('A bill must have at least one line item');
            return;
        }
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const updateItem = (id: string, field: keyof ItemDraft, val: string) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
        );
    };

    const lineTotals = items.map((i) => {
        const q = parseFloat(i.count_qty) || 0;
        const c = parseFloat(i.unit_cost) || 0;
        return round2(q * c);
    });

    const grandTotal = round2(lineTotals.reduce((sum, val) => sum + val, 0));

    const handleSaveBill = (e: React.FormEvent) => {
        e.preventDefault();

        const validItems = items.filter((i) => i.item_name.trim() !== '' && (parseFloat(i.unit_cost) || 0) > 0);
        if (validItems.length === 0) {
            showToast('Please add at least one valid item with name and cost');
            return;
        }

        const txId = 'bal_tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        const createdLineItems: BalanceLineItem[] = validItems.map((i) => {
            const qty = parseInt(i.count_qty, 10) || 1;
            const cost = parseFloat(i.unit_cost) || 0;
            return {
                id: 'li_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                transaction_id: txId,
                item_name: i.item_name.trim(),
                count_qty: qty,
                unit_cost: cost,
                line_total: round2(qty * cost),
            };
        });

        const txTotal = round2(createdLineItems.reduce((sum, li) => sum + li.line_total, 0));

        const newTx: BalanceTransaction = {
            id: txId,
            account_id: accountId,
            type: 'Addition',
            transaction_total: txTotal,
            date,
            reference_number: referenceNumber.trim() || undefined,
            notes: notes.trim() || undefined,
        };

        dispatch({
            type: 'ADD_BALANCE_TRANSACTION',
            payload: { transaction: newTx, line_items: createdLineItems },
        });

        showToast(`Bill added: ${formatCurrency(txTotal)}`);
        setItems([{ id: 'item_1', item_name: '', count_qty: '1', unit_cost: '' }]);
        setReferenceNumber('');
        setNotes('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Bill (Itemized Purchase)">
            <form onSubmit={handleSaveBill} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-sm text-txt-primary outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
                            Bill / Receipt Ref (Optional)
                        </label>
                        <input
                            type="text"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="e.g. INV-9021"
                            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-sm text-txt-primary outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Dynamic Itemized Rows */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center text-[10px] uppercase tracking-widest font-bold text-txt-secondary pb-1 border-b border-white/10 gap-2">
                        <span className="flex-1 min-w-0">Item Name</span>
                        <span className="w-14 text-center shrink-0">Qty</span>
                        <span className="w-20 text-right shrink-0">Cost</span>
                        <span className="w-20 text-right shrink-0">Total</span>
                        <span className="w-7 shrink-0"></span>
                    </div>

                    <div ref={itemsContainerRef} className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {items.map((item) => {
                            const qty = parseFloat(item.count_qty) || 0;
                            const cost = parseFloat(item.unit_cost) || 0;
                            const lineTotal = round2(qty * cost);

                            return (
                                <div key={item.id} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={item.item_name}
                                        onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                                        placeholder="Item description"
                                        required
                                        className="flex-1 min-w-0 bg-transparent border-b border-white/20 focus:border-brand py-1.5 text-xs text-txt-primary outline-none transition-colors truncate"
                                    />
                                    <input
                                        type="number"
                                        value={item.count_qty}
                                        onChange={(e) => updateItem(item.id, 'count_qty', e.target.value)}
                                        min="1"
                                        placeholder="1"
                                        className="w-14 shrink-0 text-center bg-transparent border-b border-white/20 focus:border-brand py-1.5 text-xs text-txt-primary font-mono outline-none transition-colors"
                                    />
                                    <input
                                        type="number"
                                        value={item.unit_cost}
                                        onChange={(e) => updateItem(item.id, 'unit_cost', e.target.value)}
                                        min="0"
                                        step="any"
                                        placeholder="₹0.00"
                                        required
                                        className="w-20 shrink-0 text-right bg-transparent border-b border-white/20 focus:border-brand py-1.5 text-xs text-txt-primary font-mono outline-none transition-colors"
                                    />
                                    <span className="w-20 shrink-0 text-right text-xs font-mono font-bold text-txt-primary truncate">
                                        {formatCurrency(lineTotal)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeItemRow(item.id)}
                                        className="w-7 shrink-0 text-txt-secondary hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={addItemRow}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline pt-1 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add another item
                    </button>
                </div>

                {/* Grand Total Banner */}
                <div className="p-4 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-bold text-txt-secondary">
                        Grand Total
                    </span>
                    <span className="text-xl font-bold font-mono text-brand">
                        {formatCurrency(grandTotal)}
                    </span>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outlined" type="button" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" className="flex-1">
                        Save Bill
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
