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

    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] select-none flex flex-col justify-end sm:justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-[#141414] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[88dvh] sm:max-h-[85vh] p-5 sm:p-7 shadow-2xl overflow-y-auto animate-slide-up-bottom sm:animate-slide-up-scale pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:pb-7">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto sm:hidden mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-txt-primary tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-txt-secondary hover:text-txt-primary text-xl leading-none p-2 -mr-2 cursor-pointer active:scale-90 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
