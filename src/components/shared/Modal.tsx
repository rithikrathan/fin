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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-[#191919]/90 backdrop-blur-md border border-border-subtle rounded-2xl w-full max-w-lg p-5 sm:p-7 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-txt-primary tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-txt-secondary hover:text-txt-primary text-2xl leading-none p-2 -mr-2 cursor-pointer active:scale-90 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
