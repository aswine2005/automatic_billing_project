import { useNavigate } from 'react-router-dom';
import { getUser, clearToken } from '../services/auth';
import { getCurrency, setCurrency, SUPPORTED } from '../services/currency';
import { useState } from 'react';

const Topbar = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [currency, setCurrencyState] = useState(getCurrency());

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6">
      <div className="text-sm font-medium text-slate-200">Terraformers Billing Dashboard</div>
      <div className="flex items-center gap-3 text-xs">
        <label className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Currency</span>
          <select
            value={currency}
            onChange={(e) => {
              const v = e.target.value;
              setCurrencyState(v);
              setCurrency(v);
              window.location.reload();
            }}
            className="px-2 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-[11px] text-slate-200"
          >
            {SUPPORTED.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {user && (
          <div className="flex flex-col items-end">
            <span className="font-medium text-slate-100">{user.name}</span>
            <span className="text-slate-400 text-[11px]">{user.email}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="ml-2 px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;

