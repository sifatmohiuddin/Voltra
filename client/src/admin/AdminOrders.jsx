import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { formatPrice } from '../content/siteContent';

const STATUSES = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    adminApi
      .getOrders({ status, limit: 30 })
      .then((res) => setOrders(res.orders))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Orders</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-line bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-4 py-3">Order</th>
              <th className="text-left font-medium px-4 py-3">Customer</th>
              <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Payment</th>
              <th className="text-left font-medium px-4 py-3">Total</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={5} className="text-center text-ink-muted py-8">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-ink-muted py-8">No orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="hover:bg-paper cursor-pointer" onClick={() => navigate(`/admin/orders/${o._id}`)}>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${o._id}`} className="font-mono text-xs text-circuit hover:underline">
                      {o.orderNumber}
                    </Link>
                    {o.isFraudSuspected && (
                      <span className="ml-1.5 inline-block text-[10px] font-medium text-stock-out align-middle">FAKE?</span>
                    )}
                    <p className="text-xs text-ink-faint mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{o.customer.name}</p>
                    <p className="text-xs text-ink-faint">{o.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-ink-muted">
                    {o.payment.method}
                    <span className={`ml-1.5 text-xs ${o.payment.status === 'paid' ? 'text-stock-in' : 'text-stock-low'}`}>
                      ({o.payment.status})
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const color =
    status === 'Delivered'
      ? 'bg-stock-in/10 text-stock-in'
      : status === 'Cancelled'
        ? 'bg-stock-out/10 text-stock-out'
        : 'bg-circuit-soft text-circuit';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
}
