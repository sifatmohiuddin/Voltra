import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'popularity', label: 'Popularity' },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ products: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    featured: searchParams.get('featured') || '',
    bestSeller: searchParams.get('bestSeller') || '',
    discounted: searchParams.get('discounted') || '',
    page: searchParams.get('page') || '1',
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => { });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getProducts({ ...params, limit: 12 })
      .then(setResult)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const activeCategory = categories.find((c) => c._id === params.category);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">
            {params.q ? `Results for "${params.q}"` : activeCategory ? activeCategory.name : 'All products'}
          </h1>
          <p className="text-sm text-ink-muted mt-1">{result.pagination.total} products</p>
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="lg:hidden inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="grid lg:grid-cols-[220px,1fr] gap-8">
        <FilterPanel
          categories={categories}
          params={params}
          updateParam={updateParam}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />

        <div>
          <div className="flex items-center justify-end mb-5">
            <select
              value={params.sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="rounded-full border border-line bg-panel px-4 py-2 text-sm text-ink outline-none focus:border-circuit"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-line animate-pulse" />
              ))}
            </div>
          ) : result.products.length === 0 ? (
            <p className="text-ink-muted py-16 text-center">No products match these filters.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {result.products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {result.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                disabled={Number(params.page) <= 1}
                onClick={() => updateParam('page', String(Number(params.page) - 1))}
                className="p-2 rounded-full border border-line disabled:opacity-40 text-ink"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink-muted font-mono">
                {params.page} / {result.pagination.pages}
              </span>
              <button
                disabled={Number(params.page) >= result.pagination.pages}
                onClick={() => updateParam('page', String(Number(params.page) + 1))}
                className="p-2 rounded-full border border-line disabled:opacity-40 text-ink"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ categories, params, updateParam, open, onClose }) {
  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-ink/40 z-40" onClick={onClose} />}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-panel p-6 transition-transform duration-300 lg:sticky lg:top-20 lg:z-auto lg:h-fit lg:p-0 ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <span className="font-display font-semibold text-ink">Filters</span>
          <button onClick={onClose} className="p-1 text-ink-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Category</h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => updateParam('category', '')}
              className={`text-left text-sm py-1 ${!params.category ? 'text-volt font-medium' : 'text-ink-muted hover:text-ink'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => updateParam('category', c._id)}
                className={`text-left text-sm py-1 ${params.category === c._id ? 'text-volt font-medium' : 'text-ink-muted hover:text-ink'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Price range (\u09F3)</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={params.minPrice}
              onBlur={(e) => updateParam('minPrice', e.target.value)}
              className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-circuit"
            />
            <span className="text-ink-faint">–</span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={params.maxPrice}
              onBlur={(e) => updateParam('maxPrice', e.target.value)}
              className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-circuit"
            />
          </div>
        </div>

        <button
          onClick={() => {
            updateParam('category', '');
            updateParam('minPrice', '');
            updateParam('maxPrice', '');
          }}
          className="text-sm text-circuit hover:underline"
        >
          Clear filters
        </button>
      </aside>
    </>
  );
}
