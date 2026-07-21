import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  HomeIcon,
  DashboardIcon,
  TransactionsIcon,
  FundsIcon,
  SettingsIcon
} from '../shared/Icons';

const bottomLinks = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/transactions', label: 'Transactions', icon: TransactionsIcon },
  { to: '/funds', label: 'Funds', icon: FundsIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        
        {/* Bottom Navigation for Mobile with Safe Area Padding */}
        <nav className="lg:hidden sticky bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-border-subtle flex items-center justify-around py-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] px-2 shadow-lg">
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
        </nav>
      </div>
    </div>
  );
}
