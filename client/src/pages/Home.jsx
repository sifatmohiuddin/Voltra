import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import BannerCarousel from '../components/BannerCarousel';
import CategoryGrid from '../components/CategoryGrid';
import ProductShelf from '../components/ProductShelf';
import ReviewsShowcase from '../components/ReviewsShowcase';
import { api } from '../lib/api';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [discounted, setDiscounted] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.getCategories(),
      api.getProducts({ featured: true, limit: 8 }),
      api.getProducts({ bestSeller: true, limit: 8 }),
      api.getProducts({ discounted: true, limit: 8 }),
      api.getFeaturedReviews(),
    ])
      .then(([cats, feat, best, disc, rev]) => {
        if (cancelled) return;
        setCategories(cats);
        setFeatured(feat.products);
        setBestSellers(best.products);
        setDiscounted(disc.products);
        setReviews(rev || []);
      })
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <Hero />
      <BannerCarousel />
      <CategoryGrid categories={categories} />
      <ProductShelf
        title="Featured picks"
        subtitle="HAND-PICKED"
        products={featured}
        viewAllHref="/products?featured=true"
        accent="circuit"
      />
      <ProductShelf
        title="Deals right now"
        subtitle="LIMITED-TIME"
        products={discounted}
        viewAllHref="/products?discounted=true"
        accent="volt"
      />
      <ProductShelf
        title="Best sellers"
        subtitle="CUSTOMER FAVORITES"
        products={bestSellers}
        viewAllHref="/products?bestSeller=true"
        accent="circuit"
      />
      <ReviewsShowcase reviews={reviews} />
      {error && (
        <p className="max-w-6xl mx-auto px-6 py-6 text-sm text-stock-out">
          Couldn&rsquo;t load some content — is the API running? ({error})
        </p>
      )}
    </div>
  );
}
