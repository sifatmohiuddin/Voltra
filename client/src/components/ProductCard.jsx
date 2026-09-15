import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Rating from './Rating';
import CountdownTimer from './CountdownTimer';
import { resolveImage } from '../lib/api';
import { formatPrice } from '../content/siteContent';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { isWishlisted, toggleItem } = useWishlist();
  const finalPrice = product.discountPrice ?? product.basePrice;
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)
    : 0;

  const totalStock = product.variants?.length
    ? product.variants.reduce((s, g) => s + g.options.reduce((s2, o) => s2 + o.stock, 0), 0)
    : product.stock;

  const wishlisted = isWishlisted(product._id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to={`/products/${product.slug}`}
        className="group block rounded-2xl bg-panel border border-line overflow-hidden hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="relative aspect-square bg-paper overflow-hidden">
          <img
            src={resolveImage(product.images?.[0])}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="inline-flex items-center rounded-full bg-volt text-white text-[11px] font-semibold px-2 py-0.5">
                -{discountPercent}%
              </span>
            )}
            {product.isBestSeller && (
              <span className="inline-flex items-center rounded-full bg-ink text-white text-[11px] font-semibold px-2 py-0.5">
                Best seller
              </span>
            )}
            {product.isOnFlashSale && <CountdownTimer endsAt={product.saleEndsAt} size="sm" />}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleItem(product);
            }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-full bg-panel/90 backdrop-blur hover:bg-panel transition-colors"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'text-volt' : 'text-ink-muted'}`} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {totalStock === 0 && (
            <div className="absolute inset-0 bg-panel/70 flex items-center justify-center">
              <span className="text-xs font-semibold text-ink-muted bg-panel border border-line rounded-full px-3 py-1">
                Out of stock
              </span>
            </div>
          )}
        </div>

        <div className="p-3.5">
          {product.brand && <span className="text-[11px] text-ink-faint uppercase tracking-wide">{product.brand}</span>}
          <h3 className="font-display font-medium text-sm text-ink mt-0.5 line-clamp-2">{product.name}</h3>
          {product.rating > 0 && (
            <div className="mt-1.5">
              <Rating value={product.rating} count={product.reviewCount} size={12} />
            </div>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono font-semibold text-ink">{formatPrice(finalPrice)}</span>
            {hasDiscount && (
              <span className="font-mono text-xs text-ink-faint line-through">{formatPrice(product.basePrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
