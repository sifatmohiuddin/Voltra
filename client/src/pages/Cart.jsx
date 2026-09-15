import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { resolveImage } from '../lib/api';
import { formatPrice } from '../content/siteContent';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <ShoppingBag className="w-10 h-10 text-ink-faint mx-auto mb-4" />
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink mb-3">
          Thank you for your order!
        </h1>

        <p className="text-ink-muted text-sm mb-6">
          We truly appreciate your support. We hope you love your purchase and
          look forward to seeing you again!
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-volt text-white px-6 py-3 font-medium hover:bg-volt-dim transition-colors"
        >
          Browse products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Your cart</h1>

      <div className="grid md:grid-cols-[1fr,300px] gap-8">
        <div className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <div key={item.key} className="flex gap-4 py-5">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-panel border border-line shrink-0">
                <img src={resolveImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.slug}`} className="font-medium text-ink text-sm hover:text-volt transition-colors line-clamp-2">
                  {item.name}
                </Link>
                {item.variantLabel && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    {item.variantName}: {item.variantLabel}
                  </p>
                )}
                <p className="font-mono text-sm text-ink mt-1">{formatPrice(item.price)}</p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-line rounded-full">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      className="p-1.5 text-ink-muted hover:text-ink"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.key)} className="text-ink-faint hover:text-stock-out transition-colors" aria-label="Remove item">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <span className="font-mono font-medium text-ink text-sm shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Order summary</h2>
          <div className="flex justify-between text-sm text-ink-muted mb-2">
            <span>Subtotal</span>
            <span className="font-mono text-ink">{formatPrice(subtotal)}</span>
          </div>
          <p className="text-xs text-ink-faint mb-4">Delivery charge is calculated at checkout, based on your area.</p>
          <Link
            to="/checkout"
            className="flex items-center justify-center gap-2 rounded-full bg-volt text-white px-6 py-3.5 font-medium hover:bg-volt-dim transition-colors"
          >
            Proceed to checkout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
