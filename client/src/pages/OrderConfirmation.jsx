import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Package } from 'lucide-react';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import { resolveImage } from '../lib/api';
import { trackPurchase } from '../lib/analytics';
import { formatPrice } from '../content/siteContent';

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  useEffect(() => {
    if (order) trackPurchase(order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderNumber]);

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <Package className="w-10 h-10 text-ink-faint mx-auto mb-4" />
        <h1 className="font-display font-bold text-xl text-ink">Order details not available here</h1>
        <p className="mt-2 text-ink-muted text-sm">
          This page only shows details right after checkout. Use order tracking with your order number and phone to look it up.
        </p>
        <Link to="/track" className="mt-6 inline-block rounded-full bg-volt text-white px-6 py-3 font-medium hover:bg-volt-dim transition-colors">
          Track my order
        </Link>
      </div>
    );
  }

  const estDays = order.deliveryZone === 'Inside Dhaka' ? '1\u20132 days' : '3\u20135 days';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <CheckCircle2 className="w-12 h-12 text-stock-in mx-auto mb-3" />
        <h1 className="font-display font-bold text-2xl text-ink">Order placed</h1>
        <p className="text-ink-muted mt-1">
          Order <span className="font-mono text-ink">{order.orderNumber}</span> — save this to track it later.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 mb-6">
        <OrderStatusTimeline status={order.status} statusHistory={order.statusHistory} />
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 mb-6">
        <h2 className="font-display font-semibold text-ink mb-4">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <img src={resolveImage(item.image)} alt="" className="w-12 h-12 rounded-lg object-cover border border-line" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.name}</p>
                {item.variant?.label && (
                  <p className="text-xs text-ink-faint">{item.variant.label} \u00D7 {item.quantity}</p>
                )}
              </div>
              <span className="font-mono text-sm text-ink">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-line mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Subtotal</span>
            <span className="font-mono text-ink">{formatPrice(order.subtotal)}</span>
          </div>
          {order.coupon?.discountAmount > 0 && (
            <div className="flex justify-between text-volt-dim">
              <span>Discount ({order.coupon.code})</span>
              <span className="font-mono">\u2212{formatPrice(order.coupon.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-muted">
            <span>Delivery</span>
            <span className="font-mono text-ink">{formatPrice(order.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink pt-1.5 border-t border-line">
            <span>Total</span>
            <span className="font-mono">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex gap-3">
          <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-ink">
              {order.customer.address}, {order.customer.area && `${order.customer.area}, `}
              {order.customer.city}
            </p>
            <p className="text-ink-muted mt-1">{order.customer.phone}</p>
            <p className="text-ink-muted mt-2">
              Estimated delivery: {estDays} \u00B7 Paying via {order.payment.method}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link to="/products" className="text-sm font-medium text-circuit hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
