import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { api, resolveImage } from '../lib/api';

const AUTO_ADVANCE_MS = 5000;

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api.getBanners().then(setBanners).catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
      <div className="relative rounded-2xl overflow-hidden h-40 sm:h-52">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <img src={resolveImage(banner.image)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 max-w-md">
              <h3 className="font-display font-bold text-xl sm:text-2xl text-white">{banner.title}</h3>
              {banner.subtitle && <p className="text-sm text-white/80 mt-1">{banner.subtitle}</p>}
              <Link
                to={banner.ctaLink}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white w-fit border-b border-white/40 hover:border-white transition-colors"
              >
                {banner.ctaText} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b._id}
                onClick={() => setIndex(i)}
                aria-label={`Show banner ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
