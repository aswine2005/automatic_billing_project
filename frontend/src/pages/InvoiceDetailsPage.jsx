import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Badge, Table } from '../components/ui';
import { useToast } from '../components/toast';

const InvoiceDetailsPage = () => {
  const { invoiceId } = useParams();
  const toast = useToast();
  const [invoice, setInvoice] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, actRes] = await Promise.all([
          api.get('/invoice/invoices'),
          api.get(`/invoice/${invoiceId}/activity`)
        ]);
        const inv = invRes.data.find((i) => i.invoiceId === invoiceId);
        setInvoice(inv || null);
        setActivity(actRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invoiceId]);

  if (loading) {
    return <div className="text-xs text-slate-400">Loading invoice…</div>;
  }

  if (!invoice) {
    return <div className="text-xs text-rose-400">Invoice not found.</div>;
  }

  const itemColumns = [
    { key: 'description', label: 'Description' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'unitPrice',
      label: 'Unit price',
      render: (row) => `$${row.unitPrice.toFixed(2)}`
    },
    {
      key: 'total',
      label: 'Line total',
      render: (row) =>
        `$${(row.quantity * row.unitPrice).toFixed(2)}`
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Invoice {invoice.invoiceId}
          </h2>
          <p className="text-xs text-slate-400">
            Created on {new Date(invoice.createdAt).toLocaleString()}
          </p>
          {invoice.dueDate && (
            <p className="text-[11px] text-slate-400">
              Due date: {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          )}
          {invoice.nextBillingDate && (
            <p className="text-[11px] text-slate-400">
              Next billing date: {new Date(invoice.nextBillingDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          <Badge tone={invoice.status === 'PAID' ? 'success' : invoice.status === 'UNPAID' ? 'danger' : 'warning'}>
            {invoice.status}
          </Badge>
          {invoice.lifecycleStatus && (
            <span className="text-[10px] text-slate-400">
              Lifecycle: {invoice.lifecycleStatus}
            </span>
          )}
          {invoice.isRecurring && (
            <span className="text-[10px] text-indigo-300">
              Recurring · Monthly
            </span>
          )}
          {invoice.pdfUrl ? (
            <a
              href={invoice.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition text-[11px]"
              onClick={() =>
                toast.push({
                  type: 'info',
                  title: 'Download started',
                  message: 'Opening invoice PDF from S3.'
                })
              }
            >
              Download invoice PDF
            </a>
          ) : (
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || 'http://65.2.5.194:4003'}/invoice/${invoice.invoiceId}/download`}
              className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition text-[11px]"
              onClick={() =>
                toast.push({
                  type: 'info',
                  title: 'Generating PDF',
                  message: 'PDF missing; generating and redirecting…'
                })
              }
            >
              Generate &amp; download PDF
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)] gap-5">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <h3 className="text-sm font-semibold mb-2">Line items</h3>
            <Table
              columns={itemColumns}
              rows={invoice.items.map((item, idx) => ({ ...item, id: idx }))}
              emptyMessage="No items."
            />
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">Total amount</span>
              <span className="text-base font-semibold">
                ${invoice.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <h3 className="text-sm font-semibold mb-2">Activity</h3>
            {activity.length === 0 && (
              <div className="text-[11px] text-slate-400">
                No activity recorded yet.
              </div>
            )}
            <ol className="space-y-2 text-[11px]">
              {activity.map((a) => (
                <li
                  key={a.activityId}
                  className="border-l border-slate-700 pl-3 ml-1"
                >
                  <div className="text-slate-300">{a.message}</div>
                  <div className="text-slate-500">
                    {new Date(a.createdAt).toLocaleString()} · {a.type}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;
