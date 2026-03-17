import { useEffect, useState } from 'react';
import api from '../services/api';
import { TextInput, Select, PrimaryButton, Table, Badge } from '../components/ui';

const CreateInvoicePage = () => {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [customerId, setCustomerId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [items, setItems] = useState([
    { description: 'Service fee', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const { data } = await api.get('/customer/customers');
        setCustomers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const total = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/invoice', {
        customerId,
        items,
        isRecurring
      });
      setSuccess(`Invoice ${data.invoiceId} created. Status: ${data.status}`);
      setItems([{ description: 'Service fee', quantity: 1, unitPrice: 0 }]);
      setIsRecurring(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'description', label: 'Description' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unitPrice', label: 'Unit Price' },
    {
      key: 'total',
      label: 'Line Total',
      render: (row) =>
        `$${((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)).toFixed(2)}`
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Create invoice</h2>
          <p className="text-xs text-slate-400">
            Issue a new invoice for a customer and automatically generate a PDF.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)] gap-5 text-xs">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <Select
              label="Customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.customerId} value={c.customerId}>
                  {c.name} ({c.email})
                </option>
              ))}
            </Select>
            {loadingCustomers && (
              <div className="text-xs text-slate-400">Loading customers…</div>
            )}
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-3 w-3 rounded border-slate-700 bg-slate-900"
              />
              <span>Recurring monthly invoice</span>
            </label>
            {isRecurring && (
              <p className="text-[11px] text-slate-400">
                A new invoice will be auto-generated every month (simulated when you view reports).
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">Line items</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] text-indigo-300 hover:text-indigo-200"
              >
                + Add line
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)] gap-2"
                >
                  <TextInput
                    label="Description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(idx, 'description', e.target.value)
                    }
                    placeholder="Design work"
                    required
                  />
                  <TextInput
                    label="Qty"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, 'quantity', e.target.value)
                    }
                    required
                  />
                  <TextInput
                    label="Unit price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(idx, 'unitPrice', e.target.value)
                    }
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <h3 className="text-sm font-semibold">Summary</h3>
            <Table
              columns={columns}
              rows={items.map((item, idx) => ({ ...item, id: idx }))}
              emptyMessage="Add line items to this invoice."
            />
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-2">
              <span className="text-xs text-slate-400">Total</span>
              <span className="text-base font-semibold">
                ${Number.isFinite(total) ? total.toFixed(2) : '0.00'}
              </span>
            </div>
            <Badge tone="warning">Status after creation: UNPAID · Lifecycle: CREATED</Badge>
          </div>

          <div className="space-y-2">
            {error && (
              <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-900/60 rounded-md px-3 py-2">
                {success}
              </div>
            )}
            <PrimaryButton type="submit" loading={submitting} className="w-full">
              Create invoice &amp; PDF
            </PrimaryButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;

