import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const item = { id, type: 'info', durationMs: 3000, ...toast };
    setToasts((prev) => [...prev, item]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, item.durationMs);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-50 right-4 top-4 space-y-2 w-[320px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-3 py-2 text-xs shadow-lg backdrop-blur ${
              t.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-900/70 text-emerald-100'
                : t.type === 'error'
                ? 'bg-rose-950/70 border-rose-900/70 text-rose-100'
                : 'bg-slate-950/70 border-slate-800 text-slate-100'
            }`}
          >
            {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
            <div className="text-[11px] text-slate-200/90">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

