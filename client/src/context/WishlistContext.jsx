import { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'voltra-wishlist';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — wishlist just won't persist
    }
  }, [items]);

  const isWishlisted = (productId) => items.some((i) => i.productId === productId);

  const toggleItem = (product) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === product._id)) {
        return prev.filter((i) => i.productId !== product._id);
      }
      return [
        {
          productId: product._id,
          slug: product.slug,
          name: product.name,
          image: product.images?.[0] || '',
          basePrice: product.basePrice,
          discountPrice: product.discountPrice ?? null,
        },
        ...prev,
      ];
    });
  };

  const removeItem = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleItem, removeItem }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
