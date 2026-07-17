import { NavLink, useLocation } from 'react-router-dom';

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
  const title = titles[pathname] || 'Finance Manager';

  return (
    <header className="sticky top-0 z-30 h-20 bg-surface/80 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-8">
      <div className="flex items-center gap-5">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-txt-secondary hover:text-txt-primary text-2xl"
        >
          ☰
        </button>
        <h1 className="text-2xl font-bold text-txt-primary">{title}</h1>
      </div>
      <NavLink
        to="/transactions"
        className="px-5 py-2.5 rounded-xl bg-brand text-white text-base font-semibold shadow-glow hover:bg-brand/90 transition-all"
      >
        + New Transaction
      </NavLink>
    </header>
  );
}
