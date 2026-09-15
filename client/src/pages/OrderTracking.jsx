import { useState } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import { api, resolveImage } from '../lib/api';
import { formatPrice } from '../content/siteContent';

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const result = await api.trackOrder(orderNumber.trim(), phone.trim());
      setOrder(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Track your order</h1>
      <p className="text-ink-muted text-sm mb-6">Enter your order number and the phone number used at checkout.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number (e.g. VOL-20260830-0007)"
          className="flex-1 rounded-full border border-line px-4 py-3 text-sm outline-none focus:border-circuit"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="flex-1 rounded-full border border-line px-4 py-3 text-sm outline-none focus:border-circuit"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-white px-6 py-3 font-medium hover:bg-ink/90 transition-colors disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Track
        </button>
      </form>

      {error && <p className="text-sm text-stock-out mb-6">{error}</p>}

      {order && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-panel p-6">
            <p className="text-xs text-ink-faint mb-4">
              Order <span className="font-mono text-ink">{order.orderNumber}</span> · placed{' '}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <OrderStatusTimeline status={order.status} statusHistory={order.statusHistory} />
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6">
            <h2 className="font-display font-semibold text-ink mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <img src={resolveImage(item.image)} alt="" className="w-12 h-12 rounded-lg object-cover border border-line" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    {item.variant?.label && (
                      <p className="text-xs text-ink-faint">
                        {item.variant.label} \u00D7 {item.quantity}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-sm text-ink">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            {order.coupon?.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-volt-dim pt-4 mt-4 border-t border-line">
                <span>Discount ({order.coupon.code})</span>
                <span className="font-mono">\u2212{formatPrice(order.coupon.discountAmount)}</span>
              </div>
            )}
            <div className={`flex justify-between font-semibold text-ink text-sm ${order.coupon?.discountAmount > 0 ? 'pt-1.5' : 'pt-4 mt-4 border-t border-line'}`}>
              <span>Total</span>
              <span className="font-mono">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 flex gap-3">
            <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
            <p className="text-sm text-ink">
              {order.customer.address}, {order.customer.area && `${order.customer.area}, `}
              {order.customer.city}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
