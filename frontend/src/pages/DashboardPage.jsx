import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const DashboardPage = () => {
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-1">Dashboard</h2>
        <p className="text-xs text-slate-400">
          High-level view of your revenue, customers and billing health.
        </p>
      </div>
      {loading && <div className="text-xs text-slate-400">Loading analytics…</div>}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Total Revenue"
              value={`$${stats.totalRevenue.toFixed(2)}`}
              subtitle="All-time captured payments"
            />
            <Card
              title="Total Customers"
              value={stats.totalCustomers}
              subtitle="Active billing relationships"
            />
            <Card
              title="Pending Amount"
              value={`$${stats.pendingAmount.toFixed(2)}`}
              subtitle="Unpaid or partially paid invoices"
            />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="text-xs text-slate-400 mb-2">Monthly Revenue (current year)</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.monthlyStats.map((m) => ({
                    name: new Date(0, m.month - 1).toLocaleString('default', { month: 'short' }),
                    revenue: Number(m.revenue.toFixed(2))
                  }))}
                >
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;

