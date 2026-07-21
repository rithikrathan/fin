import { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useApp } from '../../context/AppContext';
import { showToast } from '../../utils/toast';

export default function AddBalanceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { dispatch } = useApp();
  const [title, setTitle] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a store or account name');
      return;
    }

    const newAccount = {
      id: 'bal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: title.trim(),
      total_due: 0,
      status: 'Paid' as const,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_BALANCE_ACCOUNT', payload: newAccount });
    showToast(`Store ledger "${newAccount.title}" created`);
    setTitle('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Balance Account">
      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-txt-secondary mb-1">
            Store / Vendor Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Main Street Groceries, Local Dairy, Hardware Shop"
            required
            className="w-full bg-transparent border-b border-white/20 focus:border-brand rounded-none py-2 text-base text-txt-primary placeholder:text-txt-secondary/40 outline-none transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outlined" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" type="submit" className="flex-1">
            Create Store Ledger
          </Button>
        </div>
      </form>
    </Modal>
  );
}
