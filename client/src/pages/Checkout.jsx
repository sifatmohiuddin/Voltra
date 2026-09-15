import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Truck, Banknote, Smartphone, Loader2, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api, resolveImage } from '../lib/api';
import { trackInitiateCheckout } from '../lib/analytics';
import { formatPrice } from '../content/siteContent';

const PAYMENT_OPTIONS = [
  { value: 'COD', label: 'Cash on Delivery', icon: Banknote, hint: 'Pay when your order arrives' },
  { value: 'bKash', label: 'bKash', icon: Smartphone, hint: "You'll approve the payment from your bKash app" },
  { value: 'Nagad', label: 'Nagad', icon: Smartphone, hint: "You'll approve the payment from your Nagad app" },
];

const SESSION_KEY = 'voltra-checkout-session';

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [rates, setRates] = useState({ 'Inside Dhaka': 70, 'Outside Dhaka': 130 });
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    area: '',
    deliveryZone: 'Inside Dhaka',
    paymentMethod: 'COD',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discountAmount }
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    api.getDeliveryRates().then(setRates).catch(() => { });
  }, []);

  // Checkout starting is a real signal of purchase intent — this is where
  // an abandoned-cart event gets logged, not on every add-to-cart.
  useEffect(() => {
    if (items.length === 0) return;
    api.reportCartEvent({
      sessionId: getSessionId(),
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
    });
    trackInitiateCheckout(items, subtotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const deliveryCharge = rates[form.deliveryZone] ?? 0;
  const discountAmount = coupon?.discountAmount || 0;
  const total = Math.max(0, subtotal + deliveryCharge - discountAmount);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError('');
    try {
      const result = await api.validateCoupon(couponInput.trim(), subtotal, form.phone);
      setCoupon({ code: couponInput.trim().toUpperCase(), discountAmount: result.discountAmount });
    } catch (err) {
      setCouponError(err.message);
      setCoupon(null);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const order = await api.placeOrder({
        items: items.map((i) => ({
          productId: i.productId,
          variantCombinationId: i.variantCombinationId || undefined,
          quantity: i.quantity,
        })),
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          area: form.area,
        },
        deliveryZone: form.deliveryZone,
        payment: { method: form.paymentMethod },
        couponCode: coupon?.code || undefined,
        cartSessionId: getSessionId(),
      });
      clearCart();
      localStorage.removeItem(SESSION_KEY);
      navigate(`/order-confirmation/${order.orderNumber}`, { state: { order } });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr,320px] gap-8">
        <div className="space-y-8">
          <section>
            <h2 className="font-display font-semibold text-ink mb-3">Delivery details</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full name" required value={form.name} onChange={update('name')} />
              <Field label="Phone number" required type="tel" value={form.phone} onChange={update('phone')} />
              <Field label="Email (optional)" type="email" value={form.email} onChange={update('email')} className="sm:col-span-2" />
              <Field label="Street address" required value={form.address} onChange={update('address')} className="sm:col-span-2" />
              <Field label="City" required value={form.city} onChange={update('city')} />
              <Field label="Area / landmark (optional)" value={form.area} onChange={update('area')} />
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink mb-3">Delivery method</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {['Inside Dhaka', 'Outside Dhaka'].map((zone) => (
                <label
                  key={zone}
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${form.deliveryZone === zone ? 'border-volt bg-volt-soft' : 'border-line hover:border-ink-faint'
                    }`}
                >
                  <input
                    type="radio"
                    name="deliveryZone"
                    className="accent-volt"
                    checked={form.deliveryZone === zone}
                    onChange={() => setForm((f) => ({ ...f, deliveryZone: zone }))}
                  />
                  <Truck className="w-4 h-4 text-ink-muted shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-ink">{zone}</span>
                  </div>
                  <span className="font-mono text-sm text-ink">{formatPrice(rates[zone] ?? 0)}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink mb-3">Payment method</h2>
            <div className="space-y-2.5">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${form.paymentMethod === opt.value ? 'border-volt bg-volt-soft' : 'border-line hover:border-ink-faint'
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="accent-volt"
                    checked={form.paymentMethod === opt.value}
                    onChange={() => setForm((f) => ({ ...f, paymentMethod: opt.value }))}
                  />
                  <opt.icon className="w-4 h-4 text-ink-muted shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-ink">{opt.label}</span>
                    <p className="text-xs text-ink-muted">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-2xl border border-line bg-panel p-6 space-y-4">
          <h2 className="font-display font-semibold text-ink">Order summary</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.key} className="flex gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-paper border border-line shrink-0">
                  <img src={resolveImage(item.image)} alt="" className="w-full h-full object-cover" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ink text-white text-[10px] flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink line-clamp-1">{item.name}</p>
                  {item.variantLabel && <p className="text-[11px] text-ink-faint">{item.variantLabel}</p>}
                </div>
                <span className="font-mono text-xs text-ink shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          {coupon ? (
            <div className="flex items-center justify-between rounded-lg bg-volt-soft px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-volt-dim">
                <Tag className="w-3.5 h-3.5" /> {coupon.code}
              </span>
              <button type="button" onClick={removeCoupon} className="text-volt-dim hover:text-ink">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 min-w-0 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={checkingCoupon || !couponInput.trim()}
                  className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:border-circuit disabled:opacity-50"
                >
                  {checkingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs text-stock-out mt-1.5">{couponError}</p>}
            </div>
          )}

          <div className="border-t border-line pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span className="font-mono text-ink">{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-volt-dim">
                <span>Discount</span>
                <span className="font-mono">\u2212{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-muted">
              <span>Delivery</span>
              <span className="font-mono text-ink">{formatPrice(deliveryCharge)}</span>
            </div>
            <div className="flex justify-between font-semibold text-ink pt-1.5 border-t border-line">
              <span>Total</span>
              <span className="font-mono">{formatPrice(total)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-stock-out">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-volt text-white px-6 py-3.5 font-medium hover:bg-volt-dim transition-colors disabled:opacity-70"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Place order
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-circuit transition-colors"
      />
    </label>
  );
}
