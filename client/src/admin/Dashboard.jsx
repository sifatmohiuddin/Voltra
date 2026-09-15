import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { formatPrice } from '../content/siteContent';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getDashboardStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-stock-out text-sm">{error}</p>;
  if (!stats) return <p className="text-ink-muted text-sm">Loading...</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Dashboard</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Total revenue" value={formatPrice(stats.totalRevenue)} />
        <StatCard icon={ShoppingBag} label="Total orders" value={stats.totalOrders} />
        <StatCard icon={Package} label="Active products" value={stats.totalProducts} />
      </div>

      {stats.lowStockCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-stock-low/30 bg-stock-low/5 p-4 mb-8">
          <AlertTriangle className="w-4 h-4 text-stock-low shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-ink">{stats.lowStockCount} product(s) running low on stock</p>
            <p className="text-ink-muted mt-0.5">{stats.lowStockProducts.join(', ')}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Orders by status</h2>
          <div className="space-y-2.5">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{status}</span>
                <span className="font-mono font-medium text-ink">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs text-circuit hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.map((o) => (
              <Link
                key={o._id}
                to={`/admin/orders/${o._id}`}
                className="flex items-center justify-between text-sm hover:bg-paper -mx-2 px-2 py-1.5 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-mono text-xs text-ink">{o.orderNumber}</p>
                  <p className="text-ink-muted text-xs">{o.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-ink">{formatPrice(o.total)}</p>
                  <p className="text-ink-faint text-xs">{o.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6">
      <Icon className="w-5 h-5 text-volt mb-3" />
      <p className="font-mono font-bold text-2xl text-ink">{value}</p>
      <p className="text-sm text-ink-muted mt-1">{label}</p>
    </div>
  );
}
