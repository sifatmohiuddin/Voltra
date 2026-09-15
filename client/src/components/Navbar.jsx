import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, Menu, X, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { brand } from '../content/siteContent';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-panel/95 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-1.5 font-display font-bold text-lg text-ink shrink-0">
            <Zap className="w-5 h-5 text-volt" fill="currentColor" />
            {brand.name}
          </Link>

          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full bg-paper border border-line pl-4 pr-10 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-circuit outline-none transition-colors"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex-1 sm:flex-none" />

          <Link to="/products" className="hidden sm:block text-sm text-ink-muted hover:text-ink transition-colors">
            Shop
          </Link>
          <Link to="/track" className="hidden sm:block text-sm text-ink-muted hover:text-ink transition-colors">
            Track order
          </Link>

          <Link to="/wishlist" className="relative p-2 text-ink hover:text-volt transition-colors" aria-label="Wishlist">
            <Heart className="w-5 h-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-volt text-white text-[10px] font-medium">
                {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative p-2 -mr-2 text-ink hover:text-volt transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-volt text-white text-[10px] font-medium">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <button className="sm:hidden p-2 text-ink" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden pb-4 flex flex-col gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full bg-paper border border-line pl-4 pr-10 py-2 text-sm outline-none"
              />
              <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted">
                <Search className="w-4 h-4" />
              </button>
            </form>
            <Link to="/products" onClick={() => setMenuOpen(false)} className="text-sm text-ink-muted">
              Shop
            </Link>
            <Link to="/track" onClick={() => setMenuOpen(false)} className="text-sm text-ink-muted">
              Track order
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
