import { useState, useEffect, useRef } from 'react';

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
        const scrollEl = ref.current?.closest('main') || document.querySelector('main');
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
        const scrollEl = ref.current?.closest('main') || document.querySelector('main');
        if (scrollEl) {
            scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div
            ref={ref}
            className={`fab-container fixed right-4 z-30 lg:hidden transition-all duration-250 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
            style={{ bottom: 'max(1.5rem, calc(80px + env(safe-area-inset-bottom, 0px)))' }}
        >
            {open && actions && (
                <>
                    <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="absolute bottom-16 right-0 space-y-2 mb-2 z-30">
                        {actions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => { action.onClick(); setOpen(false); }}
                                className="block w-full whitespace-nowrap px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-sm font-semibold text-txt-primary hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-95 shadow-lg cursor-pointer"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div className="flex flex-col items-center gap-3">
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        aria-label="Scroll to top"
                        className="w-10 h-10 rounded-full bg-[#191919]/90 border border-white/15 text-txt-primary flex items-center justify-center shadow-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer backdrop-blur-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                    </button>
                )}

                <button
                    onClick={handleClick}
                    className="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-[0_0_24px_rgba(255,42,42,0.5)] hover:bg-brand/90 hover:shadow-[0_0_32px_rgba(255,42,42,0.65)] transition-all active:scale-95 cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
