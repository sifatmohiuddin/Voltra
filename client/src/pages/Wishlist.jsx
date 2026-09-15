import { Link } from 'react-router-dom';
import { Heart, X, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { resolveImage } from '../lib/api';
import { formatPrice } from '../content/siteContent';

export default function Wishlist() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <Heart className="w-10 h-10 text-ink-faint mx-auto mb-4" />
        <h1 className="font-display font-bold text-xl text-ink">Your wishlist is empty</h1>
        <p className="mt-2 text-ink-muted text-sm">Tap the heart on anything you like — it'll show up here.</p>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-volt text-white px-6 py-3 font-medium hover:bg-volt-dim transition-colors">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Your wishlist</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const price = item.discountPrice ?? item.basePrice;
          return (
            <div key={item.productId} className="flex gap-4 rounded-2xl border border-line bg-panel p-4">
              <Link to={`/products/${item.slug}`} className="w-20 h-20 rounded-xl overflow-hidden bg-paper border border-line shrink-0">
                <img src={resolveImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.slug}`} className="font-medium text-ink text-sm hover:text-volt transition-colors line-clamp-2">
                  {item.name}
                </Link>
                <p className="font-mono text-sm text-ink mt-1">{formatPrice(price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => addItem({ _id: item.productId, slug: item.slug, name: item.name, images: [item.image], basePrice: item.basePrice, discountPrice: item.discountPrice }, {})}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-circuit hover:underline"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to cart
                  </button>
                  <button onClick={() => removeItem(item.productId)} className="text-ink-faint hover:text-stock-out transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
