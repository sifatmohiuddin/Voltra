import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Trash2, BadgeCheck } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import Rating from '../components/Rating';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);

      const data = await adminApi.getReviews({});
      setReviews(data);
    } catch (err) {
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (review, field) => {
    const updated = await adminApi.updateReview(review._id, { [field]: !review[field] });
    setReviews((prev) => prev.map((r) => (r._id === review._id ? updated : r)));
  };

  const remove = async (review) => {
    if (!confirm('Delete this review?')) return;
    await adminApi.deleteReview(review._id);
    setReviews((prev) => prev.filter((r) => r._id !== review._id));
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Reviews</h1>

      {loading ? (
        <p className="text-ink-muted text-sm">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-ink-muted text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border border-line bg-panel p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-ink text-sm">{r.name}</span>
                  <Rating value={r.rating} size={12} />
                  {r.verified && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-stock-in">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {!r.isApproved && <span className="text-[11px] text-stock-low">Pending approval</span>}
                </div>
                <p className="text-sm text-ink-muted mt-1.5">{r.comment}</p>
                {r.product?.slug && (
                  <Link to={`/products/${r.product.slug}`} className="text-xs text-circuit hover:underline mt-1 inline-block">
                    {r.product.name}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggle(r, 'isApproved')}
                  title={r.isApproved ? 'Unapprove' : 'Approve'}
                  className={`p-1.5 ${r.isApproved ? 'text-stock-in' : 'text-ink-faint hover:text-stock-in'}`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggle(r, 'verified')}
                  title={r.verified ? 'Unmark verified' : 'Mark verified'}
                  className={`p-1.5 ${r.verified ? 'text-circuit' : 'text-ink-faint hover:text-circuit'}`}
                >
                  <BadgeCheck className="w-4 h-4" />
                </button>
                <button onClick={() => remove(r)} className="p-1.5 text-ink-faint hover:text-stock-out">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
