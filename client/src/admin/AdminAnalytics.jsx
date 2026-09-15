import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { ShoppingBag, ShieldAlert, XCircle, TrendingUp } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { formatPrice } from '../content/siteContent';

const COLORS = { volt: '#FF5A1F', circuit: '#3452FF', out: '#D8443C', low: '#E4A317', in: '#17A673' };

export default function AdminAnalytics() {
  const [revenue, setRevenue] = useState([]);
  const [quality, setQuality] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    adminApi.getRevenueTrend(days).then(setRevenue);
  }, [days]);

  useEffect(() => {
    adminApi.getOrderQuality().then(setQuality);
    adminApi.getCartConversion().then(setConversion);
  }, []);

  const chartData = revenue.map((r) => ({
    ...r,
    label: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-volt" />
          <h2 className="font-display font-semibold text-ink">Revenue trend</h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EE" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9AA0AE' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9AA0AE' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `\u09F3${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              formatter={(value, name) => [
                name === 'revenue' ? formatPrice(value) : value,
                name === 'revenue' ? 'Revenue' : 'Orders',
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid #E7E9EE', fontSize: 13 }}
            />
            <Line type="monotone" dataKey="revenue" stroke={COLORS.volt} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-stock-out" />
            <h2 className="font-display font-semibold text-ink">Order quality</h2>
          </div>
          {quality && (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: 'Delivered', value: quality.deliveredOrders, fill: COLORS.in },
                    { name: 'Cancelled', value: quality.cancelledOrders, fill: COLORS.low },
                    { name: 'Fraud flagged', value: quality.fraudOrders, fill: COLORS.out },
                  ]}
                  margin={{ left: 10 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#5B6270' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E7E9EE', fontSize: 13 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs text-ink-muted mt-2 px-1">
                <span>
                  Cancellation rate: <span className="font-mono text-ink">{quality.cancellationRate}%</span>
                </span>
                <span>
                  Fraud rate: <span className="font-mono text-ink">{quality.fraudRate}%</span>
                </span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-circuit" />
            <h2 className="font-display font-semibold text-ink">Cart conversion</h2>
          </div>
          {conversion && (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-3xl text-ink">{conversion.conversionRate}%</span>
                <span className="text-sm text-ink-muted">of checkouts became orders</span>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-paper overflow-hidden">
                <div
                  className="h-full bg-circuit rounded-full transition-all"
                  style={{ width: `${Math.min(100, conversion.conversionRate)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-ink-muted mt-3">
                <span>{conversion.started} checkouts started</span>
                <span>{conversion.converted} completed</span>
                <span className="inline-flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-stock-out" /> {conversion.abandoned} abandoned
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
