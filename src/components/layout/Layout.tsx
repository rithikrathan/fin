import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { CreditCard, Landmark, PieChart, TrendingUp, BarChart3, Sliders } from 'lucide-react';
import {
    HomeIcon,
    TransactionsIcon,
    ExpensesIcon,
    DashboardIcon,
} from '../shared/Icons';

const bottomLinks = [
    { to: '/', label: 'Home', icon: HomeIcon },
    { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/transactions', label: 'Ledger', icon: TransactionsIcon },
    { to: '/expenses', label: 'Expenses', icon: ExpensesIcon },
];

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const mainEl = mainRef.current;
        if (!mainEl) return;

        const handleScroll = () => {
            if (mainEl.scrollTop > 200) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        mainEl.addEventListener('scroll', handleScroll, { passive: true });
        return () => mainEl.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    const scrollToTop = () => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const touchStartY = useRef(0);
    const touchCurrentY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        touchCurrentY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const el = e.currentTarget as HTMLElement;
        touchCurrentY.current = e.touches[0].clientY;

        if (el.scrollTop > 0) {
            touchStartY.current = touchCurrentY.current;
            el.style.transform = '';
            return;
        }

        const deltaY = touchCurrentY.current - touchStartY.current;
        if (deltaY > 0) {
            el.style.transform = `translateY(${deltaY}px)`;
        } else {
            el.style.transform = '';
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const el = e.currentTarget as HTMLElement;
        const deltaY = touchCurrentY.current - touchStartY.current;
        el.style.transform = '';
        if (deltaY > 100 && el.scrollTop <= 0) {
            setMoreOpen(false);
        }
        touchStartY.current = 0;
        touchCurrentY.current = 0;
    };

    useEffect(() => {
        if (!window.__TAURI_INTERNALS__) return;

        let unlisten: (() => void) | undefined;

        const setupListener = async () => {
            try {
                const { listen } = await import('@tauri-apps/api/event');
                unlisten = await listen('tauri://back-button', async () => {
                    if (location.pathname !== '/') {
                        navigate(-1);
                    } else {
                        // On home screen, minimize/exit the app
                        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
                        const win = getCurrentWebviewWindow();
                        await win.close();
                    }
                });
            } catch (err) {
                console.error('Failed to register back button listener:', err);
            }
        };

        setupListener();

        return () => {
            if (unlisten) unlisten();
        };
    }, [navigate, location.pathname]);

    useEffect(() => {
        if (moreOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [moreOpen]);


    return (
        <div className="flex h-screen bg-base overflow-hidden select-none">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <main ref={mainRef} key={location.pathname} className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(96px+env(safe-area-inset-bottom,8px))] lg:pb-6 page-enter">
                    <Outlet />
                </main>

                {/* Global Floating Scroll-To-Top Button (only on pages without dedicated FABs) */}
                {(() => {
                    const fabRoutes = ['/transactions', '/expenses', '/balances', '/funds/manage', '/investments'];
                    const hasPageFab = fabRoutes.some((route) => location.pathname.startsWith(route));
                    if (hasPageFab) return null;

                    return (
                        <button
                            onClick={scrollToTop}
                            aria-label="Scroll to top"
                            className={`fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom,8px))] lg:bottom-6 z-30 w-11 h-11 rounded-full bg-surface border border-border-subtle text-txt-primary scroll-to-top-btn flex items-center justify-center shadow-lg hover:border-brand/40 hover:text-brand active:scale-90 transition-all duration-300 ease-out cursor-pointer backdrop-blur-md ${showScrollTop
                                ? 'opacity-100 translate-y-0 scale-100'
                                : 'opacity-0 translate-y-6 scale-75 pointer-events-none'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        </button>
                    );
                })()}

                {/* Backdrop for Mobile Bottom Drawer */}
                {moreOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn"
                        onClick={() => setMoreOpen(false)}
                    />
                )}

                {/* Sliding Mobile Bottom Drawer */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`fixed bottom-0 left-0 right-0 z-50 bg-[#141414]/95 backdrop-blur-md border-t border-border-subtle rounded-t-2xl p-6 transition-transform duration-300 transform lg:hidden pb-[calc(64px+env(safe-area-inset-bottom,0px))] ${moreOpen ? 'translate-y-0' : 'translate-y-full'
                        }`}
                >
                    <div className="w-12 h-1 bg-txt-secondary/30 mx-auto rounded-full mb-6 cursor-grab active:cursor-grabbing" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary mb-4">More Options</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { to: '/balances', label: 'Store Balances', icon: CreditCard },
                            { to: '/debts', label: 'Debts & Loans', icon: Landmark },
                            { to: '/funds', label: 'Funds Split', icon: PieChart },
                            { to: '/investments', label: 'Investments', icon: TrendingUp },
                            { to: '/reports', label: 'Reports', icon: BarChart3 },
                            { to: '/settings', label: 'Settings', icon: Sliders },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/funds'}
                                    onClick={() => setMoreOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.04] transition-all active:scale-95 ${isActive
                                            ? 'bg-brand/10 text-brand border-brand/20 font-semibold'
                                            : 'bg-white/[0.01] text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                                        }`
                                    }
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <span className="text-sm font-semibold">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Navigation — hidden when more drawer is open */}
                {!moreOpen && (
                    <nav id="bottom-nav" className="lg:hidden sticky bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border-subtle flex items-center justify-around py-1.5 pb-[calc(8px+env(safe-area-inset-bottom,8px))] px-2 shadow-[0_-5px_25px_rgba(0,0,0,0.3)]">
                        {bottomLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to === '/expenses' ? '/expenses?tab=needs' : link.to}
                                    end={link.to === '/'}
                                    className="flex flex-col items-center justify-center transition-all duration-200 min-w-[64px] min-h-[52px] py-1 cursor-pointer active:scale-90"
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`px-4 py-1 rounded-full transition-all duration-300 flex items-center justify-center ${isActive ? 'bg-brand/15 text-brand shadow-[0_0_12px_rgba(255,42,42,0.25)]' : 'bg-transparent text-txt-secondary'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold text-brand' : 'font-medium text-txt-secondary'}`}>{link.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}

                        {/* More Action Toggle Button */}
                        {(() => {
                            const isMoreActive = ['/funds', '/investments', '/reports', '/settings'].some((p) => location.pathname.startsWith(p));
                            return (
                                <button
                                    onClick={() => setMoreOpen(!moreOpen)}
                                    className="flex flex-col items-center justify-center transition-all duration-200 min-w-[64px] min-h-[52px] py-1 cursor-pointer active:scale-90"
                                >
                                    <div className={`px-4 py-1 rounded-full transition-all duration-300 flex items-center justify-center ${isMoreActive ? 'bg-brand/15 text-brand shadow-[0_0_12px_rgba(255,42,42,0.25)]' : 'bg-transparent text-txt-secondary'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                        </svg>
                                    </div>
                                    <span className={`text-[10px] tracking-tight ${isMoreActive ? 'font-bold text-brand' : 'font-medium text-txt-secondary'}`}>More</span>
                                </button>
                            );
                        })()}
                    </nav>
                )}
            </div>
        </div>
    );
}
