import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { adminApi } from '../lib/adminApi';

const emptyForm = {
  name: '',
  description: '',
  isActive: true,
  image: '',
  imageFile: null,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (cat) => {
    setEditingId(cat._id);

    setForm({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive,
      image: cat.image || '',
      imageFile: null,
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
      const payload = {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
      };

      let category;

      if (editingId) {
        category = await adminApi.updateCategory(editingId, payload);
      } else {
        category = await adminApi.createCategory(payload);
      }

      if (form.imageFile) {
        await adminApi.uploadCategoryImage(
          category._id,
          form.imageFile
        );
      }

      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? Products in this category won't be deleted, but will lose their category.`)) return;
    await adminApi.deleteCategory(cat._id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Categories</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-1.5 rounded-full bg-volt text-white px-4 py-2.5 text-sm font-medium hover:bg-volt-dim transition-colors"
        >
          <Plus className="w-4 h-4" /> Add category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-panel p-6 mb-6 space-y-3 max-w-md">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">{editingId ? 'Edit category' : 'New category'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink-faint hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
          />

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Category image
            </label>

            {form.image && (
              <img
                src={form.image}
                alt={form.name}
                className="w-24 h-24 object-cover rounded-lg border border-line mb-2"
              />
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  imageFile: e.target.files?.[0] || null,
                }))
              }
              className="w-full text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="accent-volt"
            />
            Visible in store
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
        ) : (
          categories.map((c) => (
            <div key={c._id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <span className="font-medium text-ink text-sm">{c.name}</span>
                {!c.isActive && <span className="ml-2 text-xs text-ink-faint">(hidden)</span>}
                {c.description && <p className="text-xs text-ink-muted mt-0.5">{c.description}</p>}
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
