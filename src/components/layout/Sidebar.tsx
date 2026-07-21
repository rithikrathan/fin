import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  DashboardIcon,
  TransactionsIcon,
  FundsIcon,
  ExpensesIcon,
  InvestmentsIcon,
  ReportsIcon,
  SettingsIcon
} from '../shared/Icons';

const links = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/transactions', label: 'Transactions', icon: TransactionsIcon },
  { to: '/funds', label: 'Funds', icon: FundsIcon },
  { to: '/expenses', label: 'Expenses', icon: ExpensesIcon },
  { to: '/investments', label: 'Investments', icon: InvestmentsIcon },
  { to: '/reports', label: 'Reports', icon: ReportsIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-surface backdrop-blur-md border-r border-border-subtle transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-7 py-7">
          <div className="h-12 w-12 rounded-xl bg-brand shadow-glow flex items-center justify-center text-base font-bold text-white font-mono">
            Fin
          </div>
          <span className="text-xl font-bold text-txt-primary tracking-tight">
            FinManager
          </span>
        </div>

        <nav className="flex flex-col gap-1.5 px-4 overflow-y-auto max-h-[calc(100vh-100px)]">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-5 py-3 rounded-xl text-base transition-all duration-200 ${
                    isActive
                      ? 'bg-brand/10 text-brand border-l-2 border-brand font-semibold'
                      : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04] border-l-2 border-transparent'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
