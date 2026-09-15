import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import NotFound from './pages/NotFound';
import { initAnalytics } from './lib/analytics';

// Admin panel (plus recharts) is a meaningfully large bundle that only
// admin users ever need — lazy-loaded so a customer browsing products
// never downloads any of it.
const ProtectedRoute = lazy(() => import('./admin/ProtectedRoute'));
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const AdminProducts = lazy(() => import('./admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./admin/AdminProductForm'));
const AdminCategories = lazy(() => import('./admin/AdminCategories'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./admin/AdminOrderDetail'));
const AdminReviews = lazy(() => import('./admin/AdminReviews'));
const AdminCoupons = lazy(() => import('./admin/AdminCoupons'));
const AdminBanners = lazy(() => import('./admin/AdminBanners'));
const AdminAnalytics = lazy(() => import('./admin/AdminAnalytics'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AnalyticsInit() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}

function AdminFallback() {
  return <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm">Loading admin...</div>;
}

function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
          <Route path="/track" element={<OrderTracking />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ScrollToTop />
            <AnalyticsInit />
            <Suspense fallback={<AdminFallback />}>
              <Routes>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<AdminProductForm />} />
                  <Route path="products/:id/edit" element={<AdminProductForm />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<AdminOrderDetail />} />
                  <Route path="reviews" element={<AdminReviews />} />
                </Route>
                <Route path="/*" element={<StorefrontLayout />} />
              </Routes>
            </Suspense>
          </WishlistProvider>
        </CartProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
