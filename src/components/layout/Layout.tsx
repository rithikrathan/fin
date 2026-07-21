import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  HomeIcon,
  TransactionsIcon,
  ExpensesIcon,
  InvestmentsIcon,
  FundsIcon,
  DashboardIcon,
  ReportsIcon,
  SettingsIcon
} from '../shared/Icons';

const bottomLinks = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/wants', label: 'Wants', icon: InvestmentsIcon },
  { to: '/transactions', label: 'Ledger', icon: TransactionsIcon },
  { to: '/needs', label: 'Needs', icon: ExpensesIcon },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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


  return (
    <div className="flex h-screen bg-base overflow-hidden select-none">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        
        {/* Backdrop for Mobile Bottom Drawer */}
        {moreOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn"
            onClick={() => setMoreOpen(false)}
          />
        )}

        {/* Sliding Mobile Bottom Drawer */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-subtle rounded-t-2xl p-6 transition-transform duration-300 transform lg:hidden pb-[calc(64px+env(safe-area-inset-bottom,0px))] ${
            moreOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-12 h-1 bg-white/20 mx-auto rounded mb-6" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-txt-secondary mb-4">More Options</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/funds', label: 'Funds Split', icon: FundsIcon },
              { to: '/funds/manage', label: 'Manage Funds', icon: FundsIcon },
              { to: '/investments', label: 'Investments', icon: DashboardIcon },
              { to: '/reports', label: 'Reports', icon: ReportsIcon },
              { to: '/settings', label: 'Settings', icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.04] transition-all active:scale-95 ${
                      isActive
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
          <nav id="bottom-nav" className="lg:hidden sticky bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-border-subtle flex items-center justify-around py-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] px-2 shadow-lg">
            {bottomLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 min-w-[64px] min-h-[48px] justify-center active:scale-95 ${
                      isActive
                        ? 'text-brand font-semibold'
                        : 'text-txt-secondary hover:text-txt-primary'
                    }`
                  }
                >
                  <Icon className="w-5.5 h-5.5" />
                  <span className="text-[10px] tracking-tight">{link.label}</span>
                </NavLink>
              );
            })}
            
            {/* More Action Toggle Button */}
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 min-w-[64px] min-h-[48px] justify-center active:scale-95 cursor-pointer ${
                ['/funds', '/investments', '/reports', '/settings'].some((p) => location.pathname.startsWith(p))
                  ? 'text-brand font-semibold'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5.5 h-5.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="text-[10px] tracking-tight">More</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
