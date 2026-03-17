import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Table, Select, PrimaryButton, Badge } from '../components/ui';
import { useToast } from '../components/toast';
import { convertFromUsd, getCurrency } from '../services/currency';
import { Pagination } from '../components/pagination';

const InvoicesPage = () => {
  const toast = useToast();
  const currency = getCurrency();
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(null);
  const [reminding, setReminding] = useState(null);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async (status) => {
    setLoading(true);
    try {
      const { data } = await api.get('/invoice/invoices', {
        params: status ? { status } : undefined
      });
      setInvoices(data);
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
  }, [statusFilter]);

  const sorted = [...invoices].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'totalAmount') return (a.totalAmount - b.totalAmount) * mult;
    return (new Date(a.createdAt) - new Date(b.createdAt)) * mult;
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    { key: 'invoiceId', label: 'Invoice ID' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const s = row.status;
        const tone =
          s === 'PAID'
            ? 'success'
            : s === 'UNPAID'
            ? 'danger'
            : 'warning';
        return (
          <div className="flex flex-col gap-1">
            <Badge tone={tone}>{s}</Badge>
            {row.lifecycleStatus && (
              <span className="text-[10px] text-slate-400">
                Lifecycle: {row.lifecycleStatus}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (row) => {
        const usd = row.totalAmount;
        const converted = convertFromUsd(usd, currency);
        return (
          <div className="flex flex-col">
            <span>${usd.toFixed(2)} USD</span>
            {currency !== 'USD' && (
              <span className="text-[10px] text-slate-400">
                {converted.toFixed(2)} {currency}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => new Date(row.createdAt).toLocaleString()
    },
    {
      key: 'pdfUrl',
      label: 'PDF',
      render: (row) =>
        row.pdfUrl ? (
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${row.pdfUrl}`}
            className="text-[11px] text-indigo-300 hover:text-indigo-200 underline"
          >
            Download
          </a>
        ) : (
          <span className="text-[11px] text-slate-500">Pending</span>
        )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1 text-[11px]">
          <button
            className="px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800"
            onClick={() => handlePayNow(row.invoiceId)}
            disabled={simulating === row.invoiceId}
          >
            {simulating === row.invoiceId ? 'Opening…' : 'Pay now'}
          </button>
          <button
            className="px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800"
            onClick={() => handleReminder(row.invoiceId)}
            disabled={reminding === row.invoiceId}
          >
            {reminding === row.invoiceId ? 'Sending…' : 'Send reminder'}
          </button>
          <Link
            to={`/invoices/${row.invoiceId}`}
            className="px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800"
          >
            Details
          </Link>
        </div>
      )
    }
  ];

  const handlePayNow = async (invoiceId) => {
    try {
      setSimulating(invoiceId);
      const { data } = await api.post('/create-order', { invoiceId });

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key) {
        toast.push({
          type: 'error',
          title: 'Missing Razorpay key',
          message: 'Set VITE_RAZORPAY_KEY_ID in frontend .env'
        });
        return;
      }

      const order = data.order;

      const options = {
        key,
        name: 'Automated Billing System',
        description: `Invoice ${invoiceId}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/verify-payment', {
              invoiceId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.push({
              type: 'success',
              title: 'Payment successful',
              message: 'Payment successful and email sent (if SMTP configured).'
            });
            await load(statusFilter);
          } catch (err) {
            toast.push({
              type: 'error',
              title: 'Verification failed',
              message: err.response?.data?.message || 'Could not verify payment.'
            });
          }
        },
        modal: {
          ondismiss: () => {
            toast.push({
              type: 'info',
              title: 'Payment cancelled',
              message: 'You can pay later from the invoice list.'
            });
          }
        }
      };

      // eslint-disable-next-line no-undef
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err) {
      console.error(err);
      toast.push({
        type: 'error',
        title: 'Payment error',
        message: err.response?.data?.message || 'Failed to start payment'
      });
    } finally {
      setSimulating(null);
    }
  };

  const handleReminder = async (invoiceId) => {
    try {
      setReminding(invoiceId);
      await api.post(`/invoice/${invoiceId}/remind`);
      await load(statusFilter);
      toast.push({
        type: 'success',
        title: 'Email sent successfully',
        message: 'Reminder sent (simulated) and activity log updated.'
      });
    } catch (err) {
      console.error(err);
      toast.push({
        type: 'error',
        title: 'Reminder failed',
        message: err.response?.data?.message || 'Failed to send reminder'
      });
    } finally {
      setReminding(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
          <p className="text-xs text-slate-400">
            Track issued invoices, payment status and PDFs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            label="Filter status"
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val);
              load(val);
            }}
          >
            <option value="">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="PAID">Paid</option>
          </Select>
          <Link to="/invoices/new">
            <PrimaryButton>New invoice</PrimaryButton>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          label="Sort by"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
        >
          <option value="createdAt">Created date</option>
          <option value="totalAmount">Total amount</option>
        </Select>
        <Select
          label="Direction"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </Select>
      </div>

      {loading && <div className="text-xs text-slate-400">Loading invoices…</div>}

      <Table
        columns={columns}
        rows={paged.map((inv) => ({ ...inv, id: inv.invoiceId }))}
        emptyMessage="No invoices issued yet."
      />

      <Pagination
        page={page}
        pageCount={pageCount}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
      />
    </div>
  );
};

export default InvoicesPage;

