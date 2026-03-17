import { useEffect, useState } from 'react';
import api from '../services/api';
import { Table, TextInput, PrimaryButton } from '../components/ui';
import { Pagination } from '../components/pagination';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async (term) => {
    setLoading(true);
    try {
      const { data } = await api.get('/customer/customers', {
        params: term ? { search: term } : undefined
      });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const sorted = [...customers].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/customer', form);
      setForm({ name: '', email: '', phone: '' });
      await load(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => new Date(row.createdAt).toLocaleString()
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Customers</h2>
          <p className="text-xs text-slate-400">
            Manage the customers you bill and charge.
          </p>
        </div>
        <div className="w-64">
          <TextInput
            label="Search"
            placeholder="Search by name, email or phone"
            value={search}
            onChange={(e) => {
              const term = e.target.value;
              setSearch(term);
              load(term);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-5">
        <div>
          {loading && (
            <div className="text-xs text-slate-400 mb-2">Loading customers…</div>
          )}
          <Table
            columns={columns}
            rows={paged.map((c) => ({ ...c, id: c.customerId }))}
            emptyMessage="No customers found yet."
          />
          <Pagination
            page={page}
            pageCount={pageCount}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
          />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 text-xs">
          <div>
            <h3 className="text-sm font-semibold mb-1">Add customer</h3>
            <p className="text-[11px] text-slate-400">
              Create a customer profile before issuing invoices.
            </p>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <TextInput
              label="Name"
              name="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <TextInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <TextInput
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            {error && (
              <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <PrimaryButton type="submit" loading={creating}>
              Create customer
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;

