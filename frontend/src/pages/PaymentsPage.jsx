import { useEffect, useState } from 'react';
import api from '../services/api';
import { Table, TextInput, Select, PrimaryButton, Badge } from '../components/ui';
import { useToast } from '../components/toast';
import { Pagination } from '../components/pagination';

const PaymentsPage = () => {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    invoiceId: '',
    amount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async () => {
    setLoading(true);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        api.get('/payment/payments'),
        api.get('/invoice/invoices')
      ]);
      setPayments(paymentsRes.data);
      setInvoices(invoicesRes.data);
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
  }, [payments.length]);

  const sorted = [...payments].sort(
    (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/payment', {
        invoiceId: form.invoiceId,
        amount: Number(form.amount)
      });
      setForm({ invoiceId: '', amount: '' });
      await load();
      toast.push({
        type: 'success',
        title: 'Payment recorded',
        message: 'Invoice status updated automatically.'
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record payment';
      setError(msg);
      toast.push({ type: 'error', title: 'Payment failed', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'paymentId', label: 'Payment ID' },
    { key: 'invoiceId', label: 'Invoice ID' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => `$${row.amount.toFixed(2)}`
    },
    {
      key: 'paymentDate',
      label: 'Payment Date',
      render: (row) => new Date(row.paymentDate).toLocaleString()
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
          <p className="text-xs text-slate-400">
            Capture payments and automatically sync invoice status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] gap-5">
        <div>
          {loading && <div className="text-xs text-slate-400 mb-2">Loading payments…</div>}
          <Table
            columns={columns}
            rows={paged.map((p) => ({ ...p, id: p.paymentId }))}
            emptyMessage="No payments recorded yet."
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
            <h3 className="text-sm font-semibold mb-1">Record payment</h3>
            <p className="text-[11px] text-slate-400">
              Attach payments to invoices and keep status in sync.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Select
              label="Invoice"
              value={form.invoiceId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  invoiceId: e.target.value
                }))
              }
              required
            >
              <option value="">Select invoice</option>
              {invoices.map((inv) => (
                <option key={inv.invoiceId} value={inv.invoiceId}>
                  {inv.invoiceId} — ${inv.totalAmount.toFixed(2)} ({inv.status})
                </option>
              ))}
            </Select>
            <TextInput
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  amount: e.target.value
                }))
              }
              required
            />
            <div className="text-[11px] text-slate-400">
              Payment date will be set to the current time automatically.{' '}
              <button
                type="button"
                className="underline text-indigo-300 hover:text-indigo-200"
                onClick={() => {
                  toast.push({
                    type: 'info',
                    title: 'Auto date/time',
                    message: 'Payment date uses the current server time.'
                  });
                }}
              >
                Use current date &amp; time
              </button>
            </div>
            {error && (
              <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <PrimaryButton type="submit" loading={submitting}>
              Record payment
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;

