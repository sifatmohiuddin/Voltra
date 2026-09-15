const BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'voltra-admin-token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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

export const adminApi = {
  login: (email, password) =>
    request('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/admin/auth/me'),

  getDashboardStats: () => request('/admin/dashboard/stats'),

  getCategories: () => request(`/categories${toQueryString({ includeInactive: 'true' })}`),
  createCategory: (payload) => request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  getProducts: (params) => request(`/admin/products${toQueryString(params)}`),
  getProduct: (id) => request(`/admin/products/${id}`),
  createProduct: (payload) => request('/admin/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  uploadProductImages: (id, files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    return request(`/admin/products/${id}/images`, { method: 'POST', body: formData });
  },
  deleteProductImage: (id, url) =>
    request(`/admin/products/${id}/images`, { method: 'DELETE', body: JSON.stringify({ url }) }),

  getOrders: (params) => request(`/orders${toQueryString(params)}`),
  getOrder: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status, note) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  updateFraudFlag: (id, isFraudSuspected, fraudNote) =>
    request(`/orders/${id}/fraud-flag`, { method: 'PATCH', body: JSON.stringify({ isFraudSuspected, fraudNote }) }),

  getReviews: (params) => request(`/admin/reviews${toQueryString(params)}`),
  updateReview: (id, payload) => request(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),

  getCoupons: () => request('/coupons'),
  createCoupon: (payload) => request('/coupons', { method: 'POST', body: JSON.stringify(payload) }),
  updateCoupon: (id, payload) => request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCoupon: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),

  getBanners: () => request('/banners/all'),
  createBanner: (payload) => request('/banners', { method: 'POST', body: JSON.stringify(payload) }),
  updateBanner: (id, payload) => request(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBanner: (id) => request(`/banners/${id}`, { method: 'DELETE' }),

  getRevenueTrend: (days) => request(`/analytics/revenue-trend${toQueryString({ days })}`),
  getOrderQuality: () => request('/analytics/order-quality'),
  getCartConversion: () => request('/analytics/cart-conversion'),


  uploadCategoryImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);

    return request(`/categories/${id}/image`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteCategoryImage: (id) =>
    request(`/categories/${id}/image`, {
      method: 'DELETE',
    }),


  deleteCategoryImage: (id) =>
    request(`/categories/${id}/image`, {
      method: 'DELETE',
    }),
};

