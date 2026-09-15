import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { resolveImage } from '../lib/api';

const emptyForm = {
  title: '',
  subtitle: '',
  image: '',
  ctaText: 'Shop now',
  ctaLink: '/products',
  order: 0,
  isActive: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getBanners();
      setBanners(data);
    } catch (err) {
      setError(err.message || 'Failed to load banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  const startEdit = (b) => {
    setEditingId(b._id);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink,
      order: b.order,
      isActive: b.isActive,
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
    try {
      const payload = { ...form, order: Number(form.order) };
      if (editingId) await adminApi.updateBanner(editingId, payload);
      else await adminApi.createBanner(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    await adminApi.deleteBanner(b._id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Banners</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-1.5 rounded-full bg-volt text-white px-4 py-2.5 text-sm font-medium hover:bg-volt-dim transition-colors"
        >
          <Plus className="w-4 h-4" /> Add banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-panel p-6 mb-6 space-y-3 max-w-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">{editingId ? 'Edit banner' : 'New banner'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink-faint hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
          />
          <input
            placeholder="Subtitle (optional)"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
          />
          <input
            required
            placeholder="Image URL (e.g. https://picsum.photos/seed/sale/1600/500)"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Button text"
              value={form.ctaText}
              onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
            />
            <input
              placeholder="Button link (e.g. /products)"
              value={form.ctaLink}
              onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <span className="text-xs font-medium text-ink-muted">Order</span>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-circuit"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="accent-volt"
              />
              Active
            </label>
          </div>

          {error && <p className="text-sm text-stock-out">{error}</p>}
          <button type="submit" className="rounded-full bg-ink text-white px-5 py-2 text-sm font-medium">
            {editingId ? 'Save' : 'Create'}
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-ink-muted text-sm">Loading...</p>
        ) : banners.length === 0 ? (
          <p className="text-ink-muted text-sm">No banners yet.</p>
        ) : (
          banners.map((b) => (
            <div key={b._id} className="rounded-2xl border border-line bg-panel overflow-hidden">
              <div className="relative h-28 bg-paper">
                {b.image ? (
                  <img src={resolveImage(b.image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-faint">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {!b.isActive && (
                  <span className="absolute top-2 left-2 text-[11px] font-medium bg-panel/90 text-ink-muted rounded-full px-2 py-0.5">
                    Inactive
                  </span>
                )}
              </div>
              <div className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{b.title}</p>
                  <p className="text-xs text-ink-faint mt-0.5">Order {b.order} \u00B7 {b.ctaLink}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(b)} className="p-1.5 text-ink-muted hover:text-circuit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(b)} className="p-1.5 text-ink-muted hover:text-stock-out">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
