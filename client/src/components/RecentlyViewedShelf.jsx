import { useEffect, useState } from 'react';
import ProductShelf from './ProductShelf';
import { getRecentlyViewed } from '../lib/recentlyViewed';

export default function RecentlyViewedShelf({ excludeId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed(excludeId));
  }, [excludeId]);

  if (items.length === 0) return null;

  // ProductShelf/ProductCard expect the full product shape (basePrice,
  // discountPrice, images...) — the stored entries already match that subset.
  const products = items.map((i) => ({
    _id: i.productId,
    slug: i.slug,
    name: i.name,
    images: [i.image],
    basePrice: i.basePrice,
    discountPrice: i.discountPrice,
  }));

  return <ProductShelf title="Recently viewed" subtitle="PICK UP WHERE YOU LEFT OFF" products={products} accent="circuit" />;
}
