import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Banknote } from 'lucide-react';

const PERKS = [
  { icon: Truck, label: 'Delivery across Bangladesh' },
  { icon: Banknote, label: 'Cash on Delivery available' },
  { icon: ShieldCheck, label: '7-day replacement warranty' },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,90,31,0.25), transparent 45%), radial-gradient(circle at 85% 60%, rgba(52,82,255,0.25), transparent 45%)'
      }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-volt text-xs font-medium px-3 py-1.5 font-mono">
            NEW SEASON DROP
          </span>
          <h1 className="mt-5 font-display font-bold text-4xl sm:text-5xl text-white leading-[1.1]">
            Wear what feels like you.
          </h1>
          <p className="mt-4 text-white/70 leading-relaxed max-w-md">
            Fresh drops, bold designs, and premium T-shirts — made for everyday style and delivered across Bangladesh.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">

            <Link
              to="/products"
              className="group inline-flex items-center gap-2 rounded-full bg-volt text-white px-6 py-3.5 font-medium hover:bg-volt-dim transition-colors"
            >
              Shop now
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/products?bestSeller=true"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white px-6 py-3.5 font-medium hover:bg-white/10 transition-colors"
            >
              Best sellers
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-14 flex flex-wrap gap-x-8 gap-y-3"
        >
          {PERKS.map((perk) => (
            <div key={perk.label} className="flex items-center gap-2 text-sm text-white/70">
              <perk.icon className="w-4 h-4 text-volt" />
              {perk.label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
