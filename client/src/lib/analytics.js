// Meta Pixel + Google Analytics 4.
//
// Both stay completely inactive until you set their IDs — nothing loads,
// nothing fires, no console errors. Add to client/.env:
//   VITE_META_PIXEL_ID=123456789
//   VITE_GA_MEASUREMENT_ID=G-XXXXXXX
//
// Standard e-commerce events are wired at the natural funnel points:
// product view, add to cart, checkout start, purchase — the same shape
// Meta/Google's own docs recommend, so ad campaign optimization actually
// has something to learn from.

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  initialized = true;

  if (PIXEL_ID) {
    injectMetaPixel(PIXEL_ID);
  }
  if (GA_ID) {
    injectGA(GA_ID);
  }
}

function injectMetaPixel(pixelId) {
  if (window.fbq) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  const fbq = function (...args) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function injectGA(measurementId) {
  if (window.gtag) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

function fbTrack(event, params) {
  if (window.fbq) window.fbq('track', event, params);
}

function gaTrack(event, params) {
  if (window.gtag) window.gtag('event', event, params);
}

const priceOf = (p) => p.discountPrice ?? p.basePrice;

export function trackViewContent(product) {
  const value = priceOf(product);
  fbTrack('ViewContent', { content_ids: [product._id], content_name: product.name, currency: 'BDT', value });
  gaTrack('view_item', { currency: 'BDT', value, items: [{ item_id: product._id, item_name: product.name, price: value }] });
}

export function trackAddToCart(product, quantity, unitPrice) {
  const value = unitPrice * quantity;
  fbTrack('AddToCart', { content_ids: [product._id], content_name: product.name, currency: 'BDT', value });
  gaTrack('add_to_cart', {
    currency: 'BDT',
    value,
    items: [{ item_id: product._id, item_name: product.name, price: unitPrice, quantity }],
  });
}

export function trackInitiateCheckout(items, subtotal) {
  fbTrack('InitiateCheckout', {
    content_ids: items.map((i) => i.productId),
    num_items: items.reduce((s, i) => s + i.quantity, 0),
    currency: 'BDT',
    value: subtotal,
  });
  gaTrack('begin_checkout', {
    currency: 'BDT',
    value: subtotal,
    items: items.map((i) => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}

export function trackPurchase(order) {
  fbTrack('Purchase', {
    content_ids: order.items.map((i) => i.product),
    currency: 'BDT',
    value: order.total,
  });
  gaTrack('purchase', {
    transaction_id: order.orderNumber,
    currency: 'BDT',
    value: order.total,
    shipping: order.deliveryCharge,
    items: order.items.map((i) => ({ item_id: i.product, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}
