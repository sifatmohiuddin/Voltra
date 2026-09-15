import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { resolveImage } from '../lib/api';
import { formatPrice } from '../content/siteContent';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

const STATUSES = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fraudNote, setFraudNote] = useState('');
  const [savingFraud, setSavingFraud] = useState(false);

  const load = () =>
    adminApi.getOrder(id).then((o) => {
      setOrder(o);
      setNextStatus(o.status);
      setFraudNote(o.fraudNote || '');
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await adminApi.updateOrderStatus(id, nextStatus, note);
      setOrder(updated);
      setNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleFraudFlag = async () => {
    setSavingFraud(true);
    try {
      const updated = await adminApi.updateFraudFlag(id, !order.isFraudSuspected, fraudNote);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFraud(false);
    }
  };

  if (!order) return <p className="text-ink-muted text-sm">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-ink">{order.orderNumber}</h1>
            {order.isFraudSuspected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stock-out/10 text-stock-out text-xs font-medium px-2.5 py-1">
                <ShieldAlert className="w-3 h-3" /> Suspected fake
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-0.5">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-display font-semibold text-ink mb-1">Fraud / prank order flag</h2>
            <p className="text-xs text-ink-muted">
              Separate from delivery status \u2014 use this for orders that turned out to be fake, so cancellations and fraud
              show up differently in analytics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={fraudNote}
              onChange={(e) => setFraudNote(e.target.value)}
              placeholder="Reason (optional)"
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit w-40"
            />
            <button
              onClick={toggleFraudFlag}
              disabled={savingFraud}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                order.isFraudSuspected
                  ? 'bg-stock-out/10 text-stock-out hover:bg-stock-out/20'
                  : 'border border-line text-ink-muted hover:border-stock-out hover:text-stock-out'
              }`}
            >
              {savingFraud && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {order.isFraudSuspected ? 'Unflag' : 'Flag as fake order'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 mb-6">
        <OrderStatusTimeline status={order.status} statusHistory={order.statusHistory} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-semibold text-ink mb-3">Customer</h2>
          <p className="text-sm text-ink">{order.customer.name}</p>
          <p className="text-sm text-ink-muted">{order.customer.phone}</p>
          {order.customer.email && <p className="text-sm text-ink-muted">{order.customer.email}</p>}
          <p className="text-sm text-ink-muted mt-2">
            {order.customer.address}, {order.customer.area && `${order.customer.area}, `}
            {order.customer.city}
          </p>
          <p className="text-xs text-ink-faint mt-2">{order.deliveryZone}</p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-semibold text-ink mb-3">Payment</h2>
          <p className="text-sm text-ink">{order.payment.method}</p>
          <span
            className={`inline-flex mt-1 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              order.payment.status === 'paid' ? 'bg-stock-in/10 text-stock-in' : 'bg-stock-low/10 text-stock-low'
            }`}
          >
            {order.payment.status}
          </span>
          {order.payment.transactionId && (
            <p className="text-xs text-ink-faint mt-2 font-mono">TX: {order.payment.transactionId}</p>
          )}
        </div>
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
                  <p className="text-xs text-ink-faint">
                    {item.variant.name}: {item.variant.label} \u00D7 {item.quantity}
                  </p>
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

      <form onSubmit={handleStatusUpdate} className="rounded-2xl border border-line bg-panel p-6 space-y-3">
        <h2 className="font-display font-semibold text-ink">Update status</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
            className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
          />
          <button
            type="submit"
            disabled={saving || nextStatus === order.status}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-volt text-white px-5 py-2.5 text-sm font-medium hover:bg-volt-dim transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Update
          </button>
        </div>
        {error && <p className="text-sm text-stock-out">{error}</p>}
      </form>
    </div>
  );
}
