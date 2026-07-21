import { useLocation } from 'react-router-dom';
import { MenuIcon } from '../shared/Icons';

const titles: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/funds': 'Funds',
  '/funds/needs': 'Needs',
  '/funds/wants': 'Wants',
  '/expenses': 'Expenses',
  '/investments': 'Investments',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { pathname } = useLocation();
  const title = titles[pathname] || 'Fin';

  return (
    <header className="sticky top-0 z-30 h-20 pt-[env(safe-area-inset-top,0px)] bg-surface/80 backdrop-blur-md border-b border-border-subtle flex items-center px-4 sm:px-8">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-txt-secondary hover:text-txt-primary p-2 -ml-2 shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-txt-primary truncate">{title}</h1>
      </div>
    </header>
  );
}
