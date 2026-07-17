import type { ReactNode } from 'react';
import { useEffect } from 'react';

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#191919]/90 backdrop-blur-md border border-border-subtle rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-txt-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-txt-secondary hover:text-txt-primary text-xl leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
