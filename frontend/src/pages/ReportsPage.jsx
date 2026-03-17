import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui';

const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/report');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Reports</h2>
        <p className="text-xs text-slate-400">
          Revenue, pending amounts and monthly performance at a glance.
        </p>
      </div>

      {loading && <div className="text-xs text-slate-400">Loading reports…</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Total Revenue"
              value={`$${stats.totalRevenue.toFixed(2)}`}
              subtitle="Captured payments"
            />
            <Card
              title="Total Customers"
              value={stats.totalCustomers}
              subtitle="Unique billed customers"
            />
            <Card
              title="Pending Amount"
              value={`$${stats.pendingAmount.toFixed(2)}`}
              subtitle="Outstanding invoices"
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <h3 className="text-sm font-semibold mb-3">Monthly revenue breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {stats.monthlyStats.map((m) => (
                <div
                  key={m.month}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 flex flex-col gap-1"
                >
                  <span className="text-[11px] text-slate-400">
                    {new Date(0, m.month - 1).toLocaleString('default', {
                      month: 'long'
                    })}
                  </span>
                  <span className="font-semibold">${m.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;

