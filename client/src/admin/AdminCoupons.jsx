import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, X, Tag } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { formatPrice } from '../content/siteContent';

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: 0,
  maxDiscount: '',
  usageLimit: '',
  perCustomerLimit: 1,
  expiresAt: '',
  isActive: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCoupons();
      setCoupons(data);
    } catch (err) {
      setError(err.message || 'Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount,
      maxDiscount: c.maxDiscount ?? '',
      usageLimit: c.usageLimit ?? '',
      perCustomerLimit: c.perCustomerLimit ?? 1,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      perCustomerLimit: form.perCustomerLimit === '' ? null : Number(form.perCustomerLimit),
      expiresAt: form.expiresAt || null,
    };
    try {
      if (editingId) await adminApi.updateCoupon(editingId, payload);
      else await adminApi.createCoupon(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    await adminApi.deleteCoupon(c._id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Coupons</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-1.5 rounded-full bg-volt text-white px-4 py-2.5 text-sm font-medium hover:bg-volt-dim transition-colors"
        >
          <Plus className="w-4 h-4" /> Add coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-panel p-6 mb-6 space-y-3 max-w-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">{editingId ? 'Edit coupon' : 'New coupon'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink-faint hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            required
            placeholder="CODE (e.g. WELCOME10)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit uppercase"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
            <input
              required
              type="number"
              placeholder={form.type === 'percentage' ? 'Value (e.g. 10 = 10%)' : 'Value in \u09F3'}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="Min order (\u09F3)" value={form.minOrderAmount} onChange={(v) => setForm((f) => ({ ...f, minOrderAmount: v }))} />
            {form.type === 'percentage' && (
              <NumField label="Max discount (\u09F3, optional)" value={form.maxDiscount} onChange={(v) => setForm((f) => ({ ...f, maxDiscount: v }))} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="Total usage limit (optional)" value={form.usageLimit} onChange={(v) => setForm((f) => ({ ...f, usageLimit: v }))} />
            <NumField label="Per-customer limit" value={form.perCustomerLimit} onChange={(v) => setForm((f) => ({ ...f, perCustomerLimit: v }))} />
          </div>

          <div>
            <span className="text-xs font-medium text-ink-muted">Expires (optional)</span>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="accent-volt"
            />
            Active
          </label>

          {error && <p className="text-sm text-stock-out">{error}</p>}
          <button type="submit" className="rounded-full bg-ink text-white px-5 py-2 text-sm font-medium">
            {editingId ? 'Save' : 'Create'}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-line bg-panel divide-y divide-line">
        {loading ? (
          <p className="text-ink-muted text-sm p-6">Loading...</p>
        ) : coupons.length === 0 ? (
          <p className="text-ink-muted text-sm p-6">No coupons yet.</p>
        ) : (
          coupons.map((c) => (
            <div key={c._id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-ink-faint" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-ink text-sm">{c.code}</span>
                    {!c.isActive && <span className="text-xs text-ink-faint">(inactive)</span>}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {c.type === 'percentage' ? `${c.value}% off` : `${formatPrice(c.value)} off`}
                    {c.minOrderAmount > 0 && ` \u00B7 min ${formatPrice(c.minOrderAmount)}`}
                    {' \u00B7 used '}
                    {c.usageCount}
                    {c.usageLimit != null ? `/${c.usageLimit}` : ''}
                    {c.expiresAt && ` \u00B7 expires ${new Date(c.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(c)} className="p-1.5 text-ink-muted hover:text-circuit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c)} className="p-1.5 text-ink-muted hover:text-stock-out">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
      />
    </label>
  );
}
