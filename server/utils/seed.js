// Populates the database with demo categories, products, and an admin
// account so the store isn't empty on first run. Safe to re-run — it
// wipes and recreates the demo Category/Product/Admin collections
// only (Orders and Reviews are left untouched).
//
// Usage: npm run seed   (make sure .env / MONGODB_URI is set first)

import 'dotenv/config';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Admin from '../models/Admin.js';
import Coupon from '../models/Coupon.js';
import Banner from '../models/Banner.js';

const REVIEWS_BY_PRODUCT_NAME = {
  'Voltra Pulse Wireless Earbuds': [
    { name: 'Rafiul Islam', rating: 5, comment: 'Battery life is exactly as advertised. Bass is strong without drowning out vocals. Worth it at this price.', verified: true },
    { name: 'Nusrat Jahan', rating: 4, comment: 'Great sound, case feels a bit loose after a month but earbuds themselves are solid.', verified: true },
  ],
  'Voltra Fit Watch S2': [
    { name: 'Tanvir Ahmed', rating: 5, comment: 'Screen is bright even in direct sun. Battery easily lasts a week with always-on off.', verified: true },
    { name: 'Sadia Rahman', rating: 5, comment: 'Bought this for step tracking during Ramadan walks, very accurate and the strap doesn\u2019t irritate skin.', verified: true },
  ],
  'Voltra Core 10000mAh Power Bank': [
    { name: 'Mehedi Hasan', rating: 4, comment: 'Slim enough for a pocket, charges my phone fully twice. Pass-through charging works as described.', verified: true },
  ],
  'Voltra Strike Gaming Mouse': [
    { name: 'Fahim Chowdhury', rating: 5, comment: 'Incredibly light, sensor tracks perfectly even at high DPI. Best mouse I\u2019ve used for the price in BD.', verified: true },
  ],
  'Voltra Aero ANC Headphones': [
    { name: 'Ismat Ara', rating: 4, comment: 'ANC handles bus and rickshaw noise well. Ear cushions are genuinely comfortable for long calls.', verified: true },
  ],
};

const img = (seed, w = 800, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const CATEGORIES = [
  { name: 'Audio', description: 'Earbuds, headphones, and speakers.' },
  { name: 'Wearables', description: 'Smartwatches and fitness bands.' },
  { name: 'Smart Home', description: 'Plugs, bulbs, and mini cameras.' },
  { name: 'Power & Cables', description: 'Chargers, power banks, and cables.' },
  { name: 'Gaming Gear', description: 'Mice, keyboards, and controllers.' },
];

function colorVariant(...colors) {
  return [
    {
      name: 'Color',
      options: colors.map((label, i) => ({
        label,
        priceModifier: 0,
        stock: 15 + i * 5,
        sku: `${slugify(label, { lower: true })}-${i}`,
      })),
    },
  ];
}

const PRODUCTS_BY_CATEGORY = {
  Audio: [
    {
      name: 'Voltra Pulse Wireless Earbuds',
      brand: 'Voltra',
      basePrice: 3490,
      discountPrice: 2990,
      isFeatured: true,
      isBestSeller: true,
      shortDescription: 'True wireless earbuds with 30-hour total battery life.',
      description:
        'Compact wireless earbuds tuned for clear vocals and deep bass, with a pocket-sized charging case that adds three extra full charges on the go.',
      specifications: [
        { label: 'Battery life', value: '7h (earbuds) + 23h (case)' },
        { label: 'Bluetooth', value: '5.3' },
        { label: 'Water resistance', value: 'IPX5' },
        { label: 'Charging', value: 'USB-C, 10 min = 1.5h playback' },
      ],
      images: [img('voltra-pulse-1'), img('voltra-pulse-2'), img('voltra-pulse-3')],
      variants: colorVariant('Jet Black', 'Arctic White', 'Ocean Blue'),
      tags: ['earbuds', 'wireless', 'bluetooth'],
    },
    {
      name: 'Voltra Aero ANC Headphones',
      brand: 'Voltra',
      basePrice: 6990,
      shortDescription: 'Over-ear active noise cancelling headphones.',
      description:
        'Full-size over-ear headphones with adaptive noise cancellation and plush memory-foam ear cushions built for long listening sessions.',
      specifications: [
        { label: 'Battery life', value: '40h (ANC on)' },
        { label: 'Bluetooth', value: '5.2' },
        { label: 'Weight', value: '248g' },
      ],
      images: [img('voltra-aero-1'), img('voltra-aero-2')],
      variants: colorVariant('Charcoal', 'Cream'),
      tags: ['headphones', 'anc', 'over-ear'],
    },
    {
      name: 'Voltra Boom Mini Speaker',
      brand: 'Voltra',
      basePrice: 2290,
      isFeatured: true,
      shortDescription: 'Pocket-sized Bluetooth speaker, big sound.',
      description: 'A rugged, splash-proof speaker small enough to clip to a bag, loud enough to fill a room.',
      specifications: [
        { label: 'Battery life', value: '12h' },
        { label: 'Water resistance', value: 'IPX6' },
        { label: 'Output', value: '10W' },
      ],
      images: [img('voltra-boom-1'), img('voltra-boom-2')],
      stock: 40,
      tags: ['speaker', 'bluetooth', 'portable'],
    },
    {
      name: 'Voltra Studio Pro Earbuds',
      brand: 'Voltra',
      basePrice: 4990,
      discountPrice: 4290,
      shortDescription: 'Studio-tuned earbuds with wireless charging case.',
      description: 'Balanced, studio-tuned drivers with a wireless-charging case and low-latency gaming mode.',
      specifications: [
        { label: 'Battery life', value: '8h (earbuds) + 24h (case)' },
        { label: 'Charging', value: 'USB-C + Qi wireless' },
      ],
      images: [img('voltra-studiopro-1'), img('voltra-studiopro-2')],
      variants: colorVariant('Black', 'White'),
      tags: ['earbuds', 'wireless charging'],
    },
  ],
  Wearables: [
    {
      name: 'Voltra Fit Watch S2',
      brand: 'Voltra',
      basePrice: 4290,
      discountPrice: 3690,
      isBestSeller: true,
      shortDescription: 'AMOLED smartwatch with 10-day battery.',
      description: 'A 1.43" AMOLED smartwatch that tracks heart rate, sleep, and 100+ workout modes, with up to 10 days between charges.',
      specifications: [
        { label: 'Display', value: '1.43" AMOLED' },
        { label: 'Battery life', value: 'Up to 10 days' },
        { label: 'Water resistance', value: '5 ATM' },
      ],
      images: [img('voltra-fitwatch-1'), img('voltra-fitwatch-2'), img('voltra-fitwatch-3')],
      variants: colorVariant('Black', 'Silver', 'Rose Gold'),
      tags: ['smartwatch', 'fitness'],
    },
    {
      name: 'Voltra Band Lite',
      brand: 'Voltra',
      basePrice: 1690,
      shortDescription: 'Lightweight fitness band, 14-day battery.',
      description: 'A slim fitness band for step counting, heart-rate tracking, and phone notifications, built to disappear on your wrist.',
      specifications: [
        { label: 'Battery life', value: 'Up to 14 days' },
        { label: 'Water resistance', value: 'IP68' },
      ],
      images: [img('voltra-bandlite-1')],
      stock: 50,
      tags: ['fitness band', 'wearable'],
    },
    {
      name: 'Voltra Pulse Pro Smartwatch',
      brand: 'Voltra',
      basePrice: 7990,
      isFeatured: true,
      shortDescription: 'GPS smartwatch with built-in speaker and mic.',
      description: 'A premium smartwatch with built-in GPS, calling via speaker/mic, and a rugged case rated for outdoor training.',
      specifications: [
        { label: 'Display', value: '1.5" AMOLED, sapphire glass' },
        { label: 'GPS', value: 'Dual-band, built-in' },
        { label: 'Battery life', value: 'Up to 7 days' },
      ],
      images: [img('voltra-pulsepro-1'), img('voltra-pulsepro-2')],
      stock: 18,
      tags: ['smartwatch', 'gps'],
    },
  ],
  'Smart Home': [
    {
      name: 'Voltra Smart Plug (2-Pack)',
      brand: 'Voltra',
      basePrice: 1290,
      shortDescription: 'Wi-Fi smart plugs, app + voice control.',
      description: 'Turn any outlet smart. Schedule, group, and control from the Voltra app or your voice assistant of choice.',
      specifications: [
        { label: 'Max load', value: '2400W' },
        { label: 'Connectivity', value: 'Wi-Fi 2.4GHz' },
      ],
      images: [img('voltra-plug-1')],
      stock: 60,
      tags: ['smart plug', 'smart home'],
    },
    {
      name: 'Voltra Glow Smart Bulb',
      brand: 'Voltra',
      basePrice: 890,
      shortDescription: '16 million colors, app + voice control.',
      description: 'A full-color smart bulb with scenes, schedules, and music-sync, controllable from anywhere via the Voltra app.',
      specifications: [
        { label: 'Brightness', value: '800 lumens' },
        { label: 'Lifespan', value: '25,000 hours' },
      ],
      images: [img('voltra-bulb-1')],
      stock: 80,
      tags: ['smart bulb', 'smart home'],
    },
    {
      name: 'Voltra Eye Mini Security Camera',
      brand: 'Voltra',
      basePrice: 2890,
      isFeatured: true,
      shortDescription: '1080p Wi-Fi camera with night vision.',
      description: 'A compact indoor camera with 1080p video, two-way audio, and motion alerts sent straight to your phone.',
      specifications: [
        { label: 'Resolution', value: '1080p' },
        { label: 'Night vision', value: 'Up to 10m' },
        { label: 'Storage', value: 'microSD up to 128GB' },
      ],
      images: [img('voltra-cam-1'), img('voltra-cam-2')],
      stock: 25,
      tags: ['security camera', 'smart home'],
    },
  ],
  'Power & Cables': [
    {
      name: 'Voltra Dash 20W Fast Charger',
      brand: 'Voltra',
      basePrice: 890,
      shortDescription: 'Compact 20W USB-C wall charger.',
      description: 'A pocket-sized 20W USB-C charger with smart overcharge and overheat protection built in.',
      specifications: [{ label: 'Output', value: '20W USB-C PD' }],
      images: [img('voltra-charger-1')],
      stock: 100,
      tags: ['charger', 'fast charging'],
    },
    {
      name: 'Voltra Core 10000mAh Power Bank',
      brand: 'Voltra',
      basePrice: 1890,
      discountPrice: 1590,
      isBestSeller: true,
      shortDescription: 'Slim 10000mAh power bank, dual USB-C/USB-A.',
      description: 'A slim, pocketable power bank with enough capacity for 2 full phone charges, and pass-through charging support.',
      specifications: [
        { label: 'Capacity', value: '10,000mAh' },
        { label: 'Ports', value: 'USB-C in/out, USB-A out' },
      ],
      images: [img('voltra-powerbank-1'), img('voltra-powerbank-2')],
      stock: 45,
      tags: ['power bank', 'battery'],
    },
    {
      name: 'Voltra Link USB-C Cable',
      brand: 'Voltra',
      basePrice: 390,
      shortDescription: 'Braided USB-C cable, 60W fast charging.',
      description: 'A tangle-resistant braided cable rated for 60W fast charging and reinforced connectors for daily use.',
      specifications: [{ label: 'Max output', value: '60W / 3A' }],
      images: [img('voltra-cable-1')],
      variants: [
        {
          name: 'Length',
          options: [
            { label: '1m', priceModifier: 0, stock: 60, sku: 'link-1m' },
            { label: '1.5m', priceModifier: 100, stock: 45, sku: 'link-1-5m' },
            { label: '2m', priceModifier: 200, stock: 30, sku: 'link-2m' },
          ],
        },
      ],
      tags: ['cable', 'usb-c'],
    },
  ],
  'Gaming Gear': [
    {
      name: 'Voltra Strike Gaming Mouse',
      brand: 'Voltra',
      basePrice: 1990,
      isFeatured: true,
      shortDescription: 'Lightweight wireless gaming mouse, 26K DPI.',
      description: 'A 79g wireless gaming mouse with a 26,000 DPI optical sensor and up to 70 hours of battery life.',
      specifications: [
        { label: 'Sensor', value: '26,000 DPI optical' },
        { label: 'Weight', value: '79g' },
        { label: 'Battery life', value: 'Up to 70h' },
      ],
      images: [img('voltra-mouse-1'), img('voltra-mouse-2')],
      stock: 35,
      tags: ['gaming mouse', 'wireless'],
    },
    {
      name: 'Voltra Clix Mechanical Keyboard',
      brand: 'Voltra',
      basePrice: 5490,
      discountPrice: 4790,
      shortDescription: '75% hot-swappable mechanical keyboard.',
      description: 'A compact 75% mechanical keyboard with hot-swappable switches, per-key RGB, and a knurled aluminum volume knob.',
      specifications: [
        { label: 'Layout', value: '75%, 84 keys' },
        { label: 'Switches', value: 'Hot-swappable' },
        { label: 'Connectivity', value: 'USB-C wired + 2.4GHz wireless' },
      ],
      images: [img('voltra-keyboard-1'), img('voltra-keyboard-2')],
      variants: colorVariant('Black', 'White'),
      tags: ['keyboard', 'mechanical'],
    },
  ],
};

async function seed() {
  await connectDB();

  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Coupon.deleteMany({}),
    Banner.deleteMany({}),
  ]);

  const categoryDocs = {};
  for (const c of CATEGORIES) {
    const doc = await Category.create({
      name: c.name,
      slug: slugify(c.name, { lower: true, strict: true }),
      description: c.description,
      image: img(`cat-${c.name}`, 600, 400),
    });
    categoryDocs[c.name] = doc;
  }
  console.log(`✓ Created ${CATEGORIES.length} categories`);

  let productCount = 0;
  let reviewCount = 0;
  for (const [categoryName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    for (const p of products) {
      const product = await Product.create({
        ...p,
        slug: slugify(p.name, { lower: true, strict: true }),
        category: categoryDocs[categoryName]._id,
      });
      productCount += 1;

      const seedReviews = REVIEWS_BY_PRODUCT_NAME[p.name];
      if (seedReviews?.length) {
        await Review.insertMany(seedReviews.map((r) => ({ ...r, product: product._id })));
        const avg = seedReviews.reduce((s, r) => s + r.rating, 0) / seedReviews.length;
        product.rating = avg;
        product.reviewCount = seedReviews.length;
        await product.save();
        reviewCount += seedReviews.length;
      }
    }
  }
  console.log(`✓ Created ${productCount} products and ${reviewCount} reviews`);

  // Give two already-discounted bestsellers a live flash-sale countdown.
  const flashSaleEnd = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await Product.updateMany(
    { name: { $in: ['Voltra Pulse Wireless Earbuds', 'Voltra Core 10000mAh Power Bank'] } },
    { saleEndsAt: flashSaleEnd }
  );
  console.log('✓ Started a 48-hour flash sale on 2 bestsellers');

  await Coupon.insertMany([
    {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 500,
      maxDiscount: 300,
      usageLimit: 200,
      perCustomerLimit: 1,
    },
    {
      code: 'FLASH500',
      type: 'fixed',
      value: 500,
      minOrderAmount: 3000,
      usageLimit: 50,
      perCustomerLimit: 1,
      expiresAt: flashSaleEnd,
    },
  ]);
  console.log('✓ Created 2 sample coupons: WELCOME10, FLASH500');

  await Banner.insertMany([
    {
      title: '48-Hour Flash Sale',
      subtitle: 'Selected audio and power gear, while stock lasts',
      image: img('banner-flash-sale', 1600, 500),
      ctaText: 'Shop the sale',
      ctaLink: '/products?discounted=true',
      order: 0,
    },
    {
      title: 'New in Wearables',
      subtitle: 'AMOLED displays, 10-day battery life',
      image: img('banner-wearables', 1600, 500),
      ctaText: 'Explore',
      ctaLink: `/products?category=${categoryDocs['Wearables']._id}`,
      order: 1,
    },
  ]);
  console.log('✓ Created 2 sample banners');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@voltra.test';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme123';
  await Admin.deleteOne({ email: adminEmail });
  await Admin.create({ name: 'Store Admin', email: adminEmail, password: adminPassword, role: 'owner' });
  console.log(`✓ Created admin login: ${adminEmail} / ${adminPassword}`);

  await mongoose.disconnect();
  console.log('\nDone. Start the server and log in to /admin with the credentials above.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
