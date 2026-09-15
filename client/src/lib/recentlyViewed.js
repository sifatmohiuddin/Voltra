const STORAGE_KEY = 'voltra-recently-viewed';
const MAX_ITEMS = 8;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable — silently skip
  }
}

/** Call once when a product detail page mounts. */
export function trackProductView(product) {
  const entry = {
    productId: product._id,
    slug: product.slug,
    name: product.name,
    image: product.images?.[0] || '',
    basePrice: product.basePrice,
    discountPrice: product.discountPrice ?? null,
  };

  const existing = load().filter((i) => i.productId !== product._id);
  save([entry, ...existing].slice(0, MAX_ITEMS));
}

/** Optionally exclude the product currently being viewed. */
export function getRecentlyViewed(excludeId) {
  return load().filter((i) => i.productId !== excludeId);
}
