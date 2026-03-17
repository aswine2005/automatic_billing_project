import { NavLink } from 'react-router-dom';
import { BarChart3, FileText, Users, CreditCard, LayoutDashboard } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: BarChart3 }
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center text-xs font-bold">
          TF
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Terraformers</div>
          <div className="text-[11px] text-slate-400">Automated Billing System</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-slate-50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-[11px] text-slate-500 border-t border-slate-800/80">
        Terraformers Billing Suite
      </div>
    </aside>
  );
};

export default Sidebar;

