export const Card = ({ title, value, subtitle, accent }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-1">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="text-xl font-semibold tracking-tight">{value}</div>
      {subtitle && <div className="text-[11px] text-slate-500">{subtitle}</div>}
      {accent && <div className="mt-1 text-[11px] text-emerald-400">{accent}</div>}
    </div>
  );
};

export const Table = ({ columns, rows, emptyMessage }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                className="px-4 py-6 text-center text-xs text-slate-500"
                colSpan={columns.length}
              >
                {emptyMessage || 'No records found.'}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-slate-900/60 odd:bg-slate-950/60 even:bg-slate-950/40"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-xs text-slate-100">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const TextInput = ({ label, error, ...props }) => {
  return (
    <label className="text-xs flex flex-col gap-1 text-slate-200">
      <span>{label}</span>
      <input
        {...props}
        className={`px-3 py-2 rounded-md bg-slate-950/70 border text-xs placeholder:text-slate-500 ${
          error ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
        }`}
      />
      {error && <span className="text-[11px] text-rose-400">{error}</span>}
    </label>
  );
};

export const Select = ({ label, error, children, ...props }) => {
  return (
    <label className="text-xs flex flex-col gap-1 text-slate-200">
      <span>{label}</span>
      <select
        {...props}
        className={`px-3 py-2 rounded-md bg-slate-950/70 border text-xs ${
          error ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
        }`}
      >
        {children}
      </select>
      {error && <span className="text-[11px] text-rose-400">{error}</span>}
    </label>
  );
};

export const PrimaryButton = ({ children, loading, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition ${
      props.className || ''
    }`}
  >
    {loading && (
      <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    )}
    <span>{children}</span>
  </button>
);

export const Badge = ({ children, tone = 'default' }) => {
  const map = {
    default: 'bg-slate-800 text-slate-100',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
        map[tone]
      }`}
    >
      {children}
    </span>
  );
};

