import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductShelf({ title, subtitle, products, viewAllHref, accent = 'ink' }) {
  if (!products?.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          {subtitle && (
            <span className={`font-mono text-xs tracking-widest ${accent === 'volt' ? 'text-volt' : 'text-circuit'}`}>
              {subtitle}
            </span>
          )}
          <h2 className="mt-1 font-display font-bold text-2xl sm:text-3xl text-ink">{title}</h2>
        </div>
        {viewAllHref && (
          <Link to={viewAllHref} className="hidden sm:flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink transition-colors shrink-0">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
