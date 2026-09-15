import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { resolveImage } from '../lib/api';
import { formatPrice } from '../content/siteContent';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .getProducts({ q, status, page, limit: 15 })
      .then((res) => {
        setProducts(res.products);
        setPagination(res.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    await adminApi.deleteProduct(product._id);
    load();
  };

  const totalStock = (p) =>
    p.variantCombinations?.length
      ? p.variantCombinations.reduce(
        (sum, combination) => sum + Number(combination.stock || 0),
        0
      )
      : Number(p.stock || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Products</h1>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-volt text-white px-4 py-2.5 text-sm font-medium hover:bg-volt-dim transition-colors"
        >
          <Plus className="w-4 h-4" /> Add product
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative flex-1 max-w-sm">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm outline-none focus:border-circuit"
          />
          <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="rounded-2xl border border-line bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-4 py-3">Product</th>
              <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Category</th>
              <th className="text-left font-medium px-4 py-3">Price</th>
              <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Stock</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="text-center text-ink-muted py-8">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-ink-muted py-8">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={resolveImage(p.images?.[0])} alt="" className="w-9 h-9 rounded-lg object-cover border border-line" />
                      <span className="font-medium text-ink line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted hidden sm:table-cell">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatPrice(p.discountPrice ?? p.basePrice)}</td>
                  <td className="px-4 py-3 font-mono text-ink hidden sm:table-cell">{totalStock(p)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === 'active' ? 'bg-stock-in/10 text-stock-in' : 'bg-line text-ink-muted'
                      }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/products/${p._id}/edit`} className="p-1.5 text-ink-muted hover:text-circuit">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(p)} className="p-1.5 text-ink-muted hover:text-stock-out">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.total > 15 && (
        <div className="flex items-center justify-center gap-3 mt-6 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40 text-ink-muted">
            Previous
          </button>
          <span className="font-mono text-ink-muted">Page {page}</span>
          <button
            disabled={page * 15 >= pagination.total}
            onClick={() => setPage((p) => p + 1)}
            className="disabled:opacity-40 text-ink-muted"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
