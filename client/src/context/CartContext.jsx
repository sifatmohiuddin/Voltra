import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'voltra-cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sanitize items restored from JSON (convert JSON null maxStock back to Infinity)
    return parsed.map((item) => ({
      ...item,
      maxStock:
        item.maxStock == null || item.maxStock === 'Infinity'
          ? Infinity
          : Number(item.maxStock),
    }));
  } catch {
    return [];
  }
}

function itemKey(productId, variantCombinationId) {
  return `${productId}::${variantCombinationId || 'base'}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  /*
   * Persist cart to localStorage.
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable — cart still works in memory.
    }
  }, [items]);

  /*
   * Add product / variant combination.
   */
  const addItem = useCallback(
    (
      product,
      {
        variantCombinationId = null,
        variantOptions = [],
        priceModifier = 0,
        maxStock,
        quantity = 1,
      }
    ) => {
      const key = itemKey(product._id, variantCombinationId);

      const unitPrice =
        Number(product.discountPrice ?? product.basePrice) +
        Number(priceModifier || 0);

      const safeMaxStock =
        maxStock == null ? Infinity : Number(maxStock);

      const safeQuantity = Math.min(
        Math.max(1, Number(quantity) || 1),
        safeMaxStock
      );

      setItems((prev) => {
        const existing = prev.find((item) => item.key === key);

        if (existing) {
          const nextQty = Math.min(
            existing.quantity + safeQuantity,
            safeMaxStock
          );

          return prev.map((item) =>
            item.key === key
              ? {
                ...item,
                price: unitPrice,
                quantity: nextQty,
                maxStock: safeMaxStock,
              }
              : item
          );
        }

        return [
          ...prev,
          {
            key,
            productId: product._id,
            slug: product.slug,
            name: product.name,
            image: product.images?.[0] || '',
            price: unitPrice,
            variantCombinationId,
            variantOptions,
            priceModifier: Number(priceModifier) || 0,
            quantity: safeQuantity,
            maxStock: safeMaxStock,
          },
        ];
      });
    },
    []
  );

  /*
   * Update quantity.
   */
  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.key !== key) return item;

          // Safe fallback if maxStock was restored as null/undefined
          const max =
            item.maxStock == null || item.maxStock === Infinity
              ? Infinity
              : Number(item.maxStock);

          const nextQuantity = Math.max(
            1,
            Math.min(Number(quantity) || 1, max)
          );

          return {
            ...item,
            quantity: nextQuantity,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  /*
   * Remove one cart item.
   */
  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  /*
   * Empty the entire cart.
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /*
   * Subtotal calculation.
   */
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [items]
  );

  /*
   * Total item count.
   */
  const itemCount = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    [items]
  );

  /*
   * Memoize context value to prevent unnecessary consumer re-renders.
   */
  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      itemCount,
    }),
    [
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      itemCount,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return ctx;
}