import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Star,
  Heart,
} from 'lucide-react';

import Rating from '../components/Rating';
import ProductCard from '../components/ProductCard';
import CountdownTimer from '../components/CountdownTimer';
import RecentlyViewedShelf from '../components/RecentlyViewedShelf';

import { api, resolveImage } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { trackProductView } from '../lib/recentlyViewed';
import { trackViewContent, trackAddToCart } from '../lib/analytics';
import { formatPrice } from '../content/siteContent';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlist();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // groupId -> optionId
  const [selectedOptions, setSelectedOptions] = useState({});

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setSelectedOptions({});
    setQuantity(1);

    api
      .getProduct(slug)
      .then((d) => {
        setData(d);

        const groups = d.product.variants || [];
        const initialSelections = {};

        groups.forEach((group) => {
          if (group.options?.length) {
            initialSelections[String(group._id)] = String(
              group.options[0]._id
            );
          }
        });

        setSelectedOptions(initialSelections);

        trackProductView(d.product);
        trackViewContent(d.product);

        return api.getReviews(d.product._id);
      })
      .then(setReviews)
      .finally(() => setLoading(false));
  }, [slug]);

  // Safe reference variables derived before hooks
  const product = data?.product;
  const related = data?.related;
  const variantGroups = product?.variants || [];
  const hasVariants = variantGroups.length > 0;

  /*
   * Move useMemo ABOVE early returns so React calls
   * hooks in the exact same order every render.
   */
  const selectedCombination = useMemo(() => {
    if (!hasVariants || !product) return null;

    const combinations = product.variantCombinations || [];

    return (
      combinations.find((combination) => {
        return variantGroups.every((group) => {
          const selectedOptionId = selectedOptions[String(group._id)];

          if (!selectedOptionId) return false;

          return combination.options?.some(
            (selection) =>
              String(selection.groupId) === String(group._id) &&
              String(selection.optionId) === String(selectedOptionId)
          );
        });
      }) || null
    );
  }, [hasVariants, product, variantGroups, selectedOptions]);

  // Early returns placed AFTER all hooks
  if (loading) return <DetailSkeleton />;

  if (!data || !product) {
    return (
      <p className="max-w-3xl mx-auto px-6 py-20 text-center text-ink-muted">
        Product not found.
      </p>
    );
  }

  /*
   * Price
   */
  const basePrice = product.discountPrice ?? product.basePrice;

  const priceModifier = hasVariants
    ? Number(selectedCombination?.priceModifier || 0)
    : 0;

  const finalPrice = basePrice + priceModifier;
  const originalPrice = Number(product.basePrice) + priceModifier;

  const hasDiscount =
    product.discountPrice != null &&
    product.discountPrice < product.basePrice;

  /*
   * Stock
   */
  const stock = hasVariants
    ? Number(selectedCombination?.stock || 0)
    : Number(product.stock || 0);

  const stockLabel =
    stock === 0
      ? hasVariants && !selectedCombination
        ? 'Select all options'
        : 'Out of stock'
      : stock <= 5
        ? `Only ${stock} left`
        : 'In stock';

  const stockColor =
    stock === 0
      ? 'text-stock-out'
      : stock <= 5
        ? 'text-stock-low'
        : 'text-stock-in';

  const handleOptionChange = (groupId, optionId) => {
    setSelectedOptions((current) => ({
      ...current,
      [String(groupId)]: String(optionId),
    }));
    setQuantity(1);
  };

  const isOptionAvailable = (group, option) => {
    if (!hasVariants) return true;

    const combinations = product.variantCombinations || [];

    return combinations.some((combination) => {
      const containsThisOption = combination.options?.some(
        (selection) =>
          String(selection.groupId) === String(group._id) &&
          String(selection.optionId) === String(option._id)
      );

      if (!containsThisOption) return false;

      return (
        variantGroups.every((otherGroup) => {
          if (String(otherGroup._id) === String(group._id)) {
            return true;
          }

          const selectedId = selectedOptions[String(otherGroup._id)];
          if (!selectedId) return true;

          return combination.options?.some(
            (selection) =>
              String(selection.groupId) === String(otherGroup._id) &&
              String(selection.optionId) === String(selectedId)
          );
        }) && Number(combination.stock || 0) > 0
      );
    });
  };

  const handleAdd = () => {
    if (stock === 0) return;
    if (hasVariants && !selectedCombination) return;

    const selectedVariantOptions = hasVariants
      ? variantGroups.map((group) => {
        const optionId = selectedOptions[String(group._id)];
        const option = group.options?.find(
          (item) => String(item._id) === String(optionId)
        );

        return {
          groupId: group._id,
          groupName: group.name,
          optionId: option?._id,
          optionLabel: option?.label,
        };
      })
      : [];

    addItem(product, {
      variantCombinationId: selectedCombination?._id,
      variantOptions: selectedVariantOptions,
      priceModifier,
      maxStock: stock,
      quantity,
    });

    trackAddToCart(product, quantity, finalPrice);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (stock === 0) return;
    if (hasVariants && !selectedCombination) return;

    handleAdd();
    navigate('/checkout');
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-2 gap-10">
          {/* GALLERY */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-panel border border-line">
              <img
                src={resolveImage(product.images?.[activeImage])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2.5 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === activeImage ? 'border-volt' : 'border-line'
                      }`}
                  >
                    <img
                      src={resolveImage(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                {product.brand && (
                  <span className="text-xs text-ink-faint uppercase tracking-wide">
                    {product.brand}
                  </span>
                )}

                <h1 className="mt-1 font-display font-bold text-2xl sm:text-3xl text-ink">
                  {product.name}
                </h1>
              </div>

              <button
                onClick={() => toggleItem(product)}
                aria-label={
                  isWishlisted(product._id)
                    ? 'Remove from wishlist'
                    : 'Add to wishlist'
                }
                className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-line hover:border-volt transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${isWishlisted(product._id)
                    ? 'text-volt'
                    : 'text-ink-muted'
                    }`}
                  fill={isWishlisted(product._id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            {product.rating > 0 && (
              <div className="mt-2">
                <Rating
                  value={product.rating}
                  count={product.reviewCount}
                />
              </div>
            )}

            {/* PRICE */}
            <div className="mt-4 flex items-center flex-wrap gap-3">
              <span className="font-mono font-bold text-2xl text-ink">
                {formatPrice(finalPrice)}
              </span>

              {product.isOnFlashSale && (
                <CountdownTimer
                  endsAt={product.saleEndsAt}
                  size="md"
                />
              )}

              {hasDiscount && (
                <span className="font-mono text-base text-ink-faint line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p className="mt-3 text-ink-muted leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* VARIANTS */}
            {hasVariants && (
              <div className="mt-6 space-y-5">
                {variantGroups.map((group) => {
                  const selectedId = selectedOptions[String(group._id)];
                  const selectedOption = group.options?.find(
                    (option) => String(option._id) === String(selectedId)
                  );

                  return (
                    <div key={group._id}>
                      <span className="text-sm font-medium text-ink">
                        {group.name}:{' '}
                        <span className="text-ink-muted">
                          {selectedOption?.label || 'Select'}
                        </span>
                      </span>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {group.options?.map((option) => {
                          const selected =
                            String(option._id) === String(selectedId);
                          const available = isOptionAvailable(
                            group,
                            option
                          );

                          return (
                            <button
                              key={option._id}
                              onClick={() =>
                                handleOptionChange(group._id, option._id)
                              }
                              disabled={!available}
                              className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-40 disabled:line-through ${selected
                                ? 'border-volt bg-volt-soft text-volt-dim font-medium'
                                : 'border-line text-ink-muted hover:border-ink'
                                }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* STOCK */}
            <p className={`mt-4 text-sm font-medium ${stockColor}`}>
              {stockLabel}
            </p>

            {/* QUANTITY */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center border border-line rounded-full">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-ink-muted hover:text-ink"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="w-8 text-center font-mono text-sm">
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(stock, q + 1))
                  }
                  disabled={quantity >= stock}
                  className="p-2.5 text-ink-muted hover:text-ink disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAdd}
                disabled={
                  stock === 0 || (hasVariants && !selectedCombination)
                }
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink text-ink px-6 py-3.5 font-medium hover:bg-ink hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {justAdded ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                {justAdded ? 'Added to cart' : 'Add to cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={
                  stock === 0 || (hasVariants && !selectedCombination)
                }
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-volt text-white px-6 py-3.5 font-medium hover:bg-volt-dim transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <Zap className="w-4 h-4" fill="currentColor" />
                Buy now
              </button>
            </div>
          </div>
        </div>

        <ProductTabs product={product} />

        <ReviewsSection
          productId={product._id}
          reviews={reviews}
          onSubmitted={(r) => setReviews((prev) => [r, ...prev])}
        />

        {related?.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display font-bold text-2xl text-ink mb-6">
              You may also like
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <RecentlyViewedShelf excludeId={product._id} />
    </>
  );
}

function ProductTabs({ product }) {
  const [tab, setTab] = useState('description');

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specs', label: 'Specifications' },
  ];

  return (
    <div className="mt-14 border-t border-line pt-8">
      <div className="flex gap-6 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id
              ? 'border-volt text-ink'
              : 'border-transparent text-ink-muted hover:text-ink'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-6 max-w-2xl">
        {tab === 'description' ? (
          <p className="text-ink-muted leading-relaxed whitespace-pre-line">
            {product.description || 'No description provided yet.'}
          </p>
        ) : (
          <dl className="divide-y divide-line">
            {product.specifications?.length ? (
              product.specifications.map((s) => (
                <div key={s.label} className="flex py-2.5 text-sm">
                  <dt className="w-40 shrink-0 text-ink-muted">
                    {s.label}
                  </dt>
                  <dd className="text-ink font-medium">{s.value}</dd>
                </div>
              ))
            ) : (
              <p className="text-ink-muted text-sm py-2">
                No specifications listed.
              </p>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}

function ReviewsSection({ productId, reviews, onSubmitted }) {
  const [form, setForm] = useState({ name: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const review = await api.postReview(productId, form);
      onSubmitted(review);
      setForm({ name: '', rating: 5, comment: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 border-t border-line pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-2xl text-ink">
          Reviews ({reviews.length})
        </h2>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium text-circuit hover:underline"
        >
          {showForm ? 'Cancel' : 'Write a review'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden mb-8"
          >
            <div className="rounded-2xl border border-line bg-panel p-5 space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  >
                    <Star
                      width={20}
                      height={20}
                      className={
                        n <= form.rating ? 'text-volt' : 'text-line'
                      }
                      fill="currentColor"
                    />
                  </button>
                ))}
              </div>

              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
              />

              <textarea
                required
                rows={3}
                placeholder="How is it?"
                value={form.comment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, comment: e.target.value }))
                }
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit resize-none"
              />

              {error && <p className="text-sm text-stock-out">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-ink text-white px-5 py-2 text-sm font-medium disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {reviews.length === 0 ? (
        <p className="text-ink-muted text-sm">
          No reviews yet — be the first.
        </p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r._id} className="border-b border-line pb-5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink text-sm">
                  {r.name}
                </span>
                <span className="text-xs text-ink-faint">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-1">
                <Rating value={r.rating} size={13} />
              </div>

              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-2 gap-10">
      <div className="aspect-square rounded-2xl bg-line animate-pulse" />
      <div className="space-y-4">
        <div className="h-4 w-24 bg-line rounded animate-pulse" />
        <div className="h-8 w-3/4 bg-line rounded animate-pulse" />
        <div className="h-6 w-32 bg-line rounded animate-pulse" />
        <div className="h-24 w-full bg-line rounded animate-pulse" />
      </div>
    </div>
  );
}