import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Star,
  Zap,
  LogOut,
  Tag,
  Image,
  BarChart3,
  X,
  Bell,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../lib/adminApi';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [newOrder, setNewOrder] = useState(null);

  const latestOrderIdRef = useRef(null);
  const initializedRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/new-order.mp3');
    audioRef.current.volume = 0.8;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkForNewOrders() {
      try {
        const data = await adminApi.getOrders({
          page: 1,
          limit: 1,
          sort: 'createdAt',
          order: 'desc',
        });

        if (cancelled) return;

        // Handles either:
        // [order]
        // or
        // { orders: [order] }
        const orders = Array.isArray(data) ? data : data?.orders || [];

        if (!orders.length) return;

        const newestOrder = orders[0];

        // First request only establishes the current latest order.
        // We don't want an alert for an old order when admin opens.
        if (!initializedRef.current) {
          latestOrderIdRef.current = newestOrder._id;
          initializedRef.current = true;
          return;
        }

        if (newestOrder._id !== latestOrderIdRef.current) {
          latestOrderIdRef.current = newestOrder._id;

          setNewOrder(newestOrder);

          if (audioRef.current) {
            audioRef.current.currentTime = 0;

            audioRef.current.play().catch((error) => {
              console.log('Notification sound was blocked by browser:', error);
            });
          }
        }
      } catch (error) {
        console.error('Failed to check for new orders:', error);
      }
    }

    checkForNewOrders();

    const interval = setInterval(checkForNewOrders, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleViewOrder = () => {
    setNewOrder(null);
    navigate('/admin/orders');
  };

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-60 shrink-0 bg-ink text-white flex flex-col">
        <div className="flex items-center gap-1.5 font-display font-bold text-lg px-6 py-6">
          <Zap className="w-5 h-5 text-volt" fill="currentColor" />
          Voltra Admin
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-6 pt-3 border-t border-white/10">
          <div className="px-3 py-2 text-xs text-white/50">
            {admin?.email}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 sm:p-8">
        <Outlet />
      </main>

      {newOrder && (
        <div className="fixed top-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-black/10 bg-white shadow-2xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-volt/20">
                  <Bell className="h-5 w-5 text-ink" />
                </div>

                <div>
                  <p className="font-semibold text-ink">
                    New order received
                  </p>

                  <p className="text-sm text-black/50">
                    {newOrder.orderNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setNewOrder(null)}
                className="rounded-lg p-1.5 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-black/[0.03] p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-black/50">Customer</span>

                <span className="font-medium text-right">
                  {newOrder.customer?.name || 'Customer'}
                </span>
              </div>

              <div className="mt-2 flex justify-between gap-4 text-sm">
                <span className="text-black/50">Total</span>

                <span className="font-semibold">
                  ৳{Number(newOrder.total || 0).toLocaleString('en-BD')}
                </span>
              </div>
            </div>

            <button
              onClick={handleViewOrder}
              className="mt-4 w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              View order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}