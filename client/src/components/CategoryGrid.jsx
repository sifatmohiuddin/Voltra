import { Link } from 'react-router-dom';
import { resolveImage } from '../lib/api';

export default function CategoryGrid({ categories }) {
  if (!categories?.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-6">Shop by category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {categories.map((c) => (
          <Link
            key={c._id}
            to={`/products?category=${c._id}`}
            className="group relative rounded-2xl overflow-hidden aspect-square bg-ink"
          >
            <img
              src={resolveImage(c.image)}
              alt={c.name}
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-55 group-hover:scale-105 transition-all duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 font-display font-semibold text-white text-sm">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
