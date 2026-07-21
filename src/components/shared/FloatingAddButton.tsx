import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FabAction {
    label: string;
    onClick: () => void;
}

interface FloatingAddButtonProps {
    onClick?: () => void;
    actions?: FabAction[];
}

export default function FloatingAddButton({ onClick, actions }: FloatingAddButtonProps) {
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollEl = document.querySelector('main');
        if (!scrollEl) return;

        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const handler = () => {
            setVisible(false);
            setOpen(false);

            if (scrollEl.scrollTop > 250) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }

            if (timeoutId) clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                setVisible(true);
            }, 350);
        };

        scrollEl.addEventListener('scroll', handler, { passive: true });
        return () => {
            scrollEl.removeEventListener('scroll', handler);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleClick = () => {
        if (actions && actions.length > 1) {
            setOpen((o) => !o);
        } else if (onClick) {
            onClick();
        } else if (actions && actions.length === 1) {
            actions[0].onClick();
        }
    };

    const scrollToTop = () => {
        const scrollEl = document.querySelector('main');
        if (scrollEl) {
            scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return createPortal(
        <div
            ref={ref}
            className={`fab-container fixed right-4 bottom-20 z-50 lg:hidden transition-all duration-250 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            {/* Dark blurred backdrop */}
            {actions && actions.length > 1 && (
                <div
                    className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Radial/Floating Speed Dial Pills */}
            {actions && actions.length > 1 && (
                <div
                    className={`absolute bottom-16 right-0 z-50 flex flex-col items-end space-y-2.5 transition-all duration-300 ease-out origin-bottom-right ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4 pointer-events-none'}`}
                >
                    {actions.map((action, idx) => {
                        const lbl = action.label.toLowerCase();
                        const isIncome = lbl.includes('income') || lbl.includes('payment');
                        const isExpense = lbl.includes('expense') || lbl.includes('bill') || lbl.includes('purchase');

                        return (
                            <button
                                key={action.label}
                                onClick={() => { action.onClick(); setOpen(false); }}
                                style={{ transitionDelay: `${idx * 40}ms` }}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border shadow-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap ${isIncome
                                        ? 'bg-[#18241b]/95 border-gain/30 text-gain hover:bg-gain/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                                        : isExpense
                                            ? 'bg-[#271818]/95 border-loss/30 text-loss hover:bg-loss/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                            : 'bg-[#1a1a1a]/95 border-white/15 text-txt-primary hover:bg-white/10'
                                    }`}
                            >
                                {isIncome && <span className="w-2 h-2 rounded-full bg-gain animate-pulse" />}
                                {isExpense && <span className="w-2 h-2 rounded-full bg-loss animate-pulse" />}
                                <span>{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-col items-center gap-3 relative z-50">
                <button
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                    className={`w-10 h-10 rounded-full bg-[#191919]/90 border border-white/15 text-txt-primary flex items-center justify-center shadow-xl hover:bg-white/10 active:scale-90 transition-all duration-300 ease-out cursor-pointer backdrop-blur-md ${showScrollTop && !open
                            ? 'opacity-100 translate-y-0 scale-100'
                            : 'opacity-0 translate-y-6 scale-75 pointer-events-none'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                </button>

                <button
                    onClick={handleClick}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer select-none ${open
                            ? 'bg-[#121212] border border-brand/60 text-brand shadow-[0_0_18px_rgba(255,42,42,0.35),inset_0_0_12px_rgba(255,42,42,0.2)]'
                            : 'bg-brand text-white shadow-[0_0_20px_rgba(255,42,42,0.4)] hover:bg-brand/90 hover:shadow-[0_0_26px_rgba(255,42,42,0.55)] active:bg-[#121212] active:border active:border-brand/60 active:text-brand active:shadow-[0_0_18px_rgba(255,42,42,0.35),inset_0_0_12px_rgba(255,42,42,0.2)]'
                        }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`w-6 h-6 transition-all duration-300 ease-out ${open ? 'rotate-45 text-brand' : 'rotate-0 text-white'}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </div>
        </div>,
        document.body
    );
}
