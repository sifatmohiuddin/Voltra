import { Link } from 'react-router-dom';
import { Quote, BadgeCheck } from 'lucide-react';
import Rating from './Rating';

export default function ReviewsShowcase({ reviews }) {
  if (!reviews?.length) return null;

  return (
    <section className="bg-panel border-y border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-6">What customers say</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {reviews.slice(0, 3).map((r) => (
            <div key={r._id} className="rounded-2xl border border-line bg-paper p-6 flex flex-col">
              <Quote className="w-5 h-5 text-volt/60 mb-3" />
              <Rating value={r.rating} size={13} />
              <p className="mt-3 text-sm text-ink leading-relaxed flex-1">&ldquo;{r.comment}&rdquo;</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-ink">{r.name}</span>
                  {r.verified && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] text-stock-in">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                {r.product?.slug && (
                  <Link to={`/products/${r.product.slug}`} className="text-xs text-circuit hover:underline">
                    {r.product.name}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
