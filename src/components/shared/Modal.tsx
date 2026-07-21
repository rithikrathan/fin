import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export default function Modal({
  open,
  isOpen,
  onClose,
  title,
  children,
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const isModalOpen = open ?? isOpen ?? false;
  const [rendered, setRendered] = useState(isModalOpen);
  const [animatingIn, setAnimatingIn] = useState(false);

  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  useEffect(() => {
    if (isModalOpen) {
      setRendered(true);
      requestAnimationFrame(() => setAnimatingIn(true));
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      setAnimatingIn(false);
      const timer = setTimeout(() => setRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!rendered) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [rendered]);

  const handleClose = () => {
    setAnimatingIn(false);
    setTimeout(() => onClose(), 220);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    
    if (deltaY > 0) {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchCurrentY.current - touchStartY.current;
    const el = e.currentTarget as HTMLElement;
    el.style.transform = '';

    if (deltaY > 100) {
      handleClose();
    }
    touchStartY.current = 0;
    touchCurrentY.current = 0;
  };

  if (!rendered) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] select-none flex items-end sm:items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-250 ${animatingIn ? 'opacity-100' : 'opacity-0'}`} 
        onClick={handleClose} 
      />

      {/* Modal Container */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative z-10 w-full sm:max-w-lg bg-[#141414]/95 backdrop-blur-md border-t sm:border border-border-subtle rounded-t-2xl sm:rounded-2xl max-h-[88dvh] sm:max-h-[85vh] p-6 shadow-2xl overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 transition-all duration-250 ease-out ${animatingIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 sm:translate-y-8 sm:scale-95'}`}
      >
        <div className="w-12 h-1 bg-txt-secondary/30 rounded-full mx-auto sm:hidden mb-6 cursor-grab active:cursor-grabbing" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-txt-primary tracking-tight">{title}</h2>
          <button
            onClick={handleClose}
            className="text-txt-secondary hover:text-txt-primary text-xl leading-none p-1.5 -mr-2 cursor-pointer active:scale-90 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
