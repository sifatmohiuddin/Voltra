const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  getCategories: () => request('/categories'),

  getProducts: (params) => request(`/products${toQueryString(params)}`),
  getProduct: (slug) => request(`/products/${slug}`),

  getReviews: (productId) => request(`/products/${productId}/reviews`),
  postReview: (productId, payload) =>
    request(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),
  getFeaturedReviews: () => request('/reviews/featured'),

  placeOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  trackOrder: (orderNumber, phone) =>
    request(`/orders/track${toQueryString({ orderNumber, phone })}`),
  getDeliveryRates: () => request('/delivery-rates'),

  getBanners: () => request('/banners'),
  validateCoupon: (code, subtotal, phone) =>
    request('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal, phone }) }),
  reportCartEvent: (payload) =>
    fetch(`${BASE_URL}/api/analytics/cart-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {}), // analytics — never let a failure here affect checkout
};

// Product images are stored as relative paths (e.g. /uploads/products/x.jpg)
// or absolute placeholder URLs (picsum). This makes either work.
export function resolveImage(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return `${BASE_URL}${src}`;
}
