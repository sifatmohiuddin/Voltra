# Voltra — MERN e-commerce platform

A full-stack electronics/gadgets storefront: React front end (Vite) for customers, a
separate admin panel in the same app, and an Express + MongoDB backend behind both.
Built around a real product concept — "Voltra," an audio/wearables/smart-accessories
brand — with 15 seeded products across 5 categories, sample coupons and banners, and a
live flash sale, so it's a working store on first run, not an empty shell.

## Stack

- **Client:** React 18, Vite, Tailwind CSS, Framer Motion, React Router, Recharts, lucide-react
- **Server:** Node.js, Express 5, MongoDB via Mongoose, JWT auth, Multer (image uploads)

## Folder structure

```
voltra-ecommerce/
├── client/                       React app — storefront + admin, one build
│   └── src/
│       ├── pages/                 Home, listing, detail, cart, wishlist, checkout, tracking...
│       ├── admin/                 Login, dashboard, analytics, product/category/coupon/banner/order/review management
│       ├── components/            Shared UI (product card, rating, countdown timer, banner carousel...)
│       ├── context/                CartContext, WishlistContext (both localStorage), AdminAuthContext (JWT)
│       └── lib/                    api.js (public), adminApi.js (authenticated), analytics.js (Pixel/GA), recentlyViewed.js
└── server/                       Express API
    ├── models/                    Product, Category, Order, Review, Admin, Coupon, Banner, CartEvent
    ├── routes/                    public + /admin/* (protected) routes
    └── utils/                     seed script, order numbers, delivery pricing, bKash/Nagad services
```

## 1. Set up the database

Free tier is enough. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
(~2 min), add a database user, allow your IP under Network Access, and copy the
connection string from **Connect → Drivers**.

## 2. Configure environment variables

```bash
cd server
cp .env.example .env
# paste your MongoDB URI into .env, and set JWT_SECRET to any long random string
```

```bash
cd ../client
cp .env.example .env
# leave everything blank for local dev — see "Optional integrations" below
```

## 3. Install, seed, and run

```bash
# terminal 1 — API
cd server
npm install
npm run seed        # categories, 15 products, reviews, 2 coupons, 2 banners, a live flash sale, an admin login
npm run dev           # http://localhost:5000

# terminal 2 — client
cd client
npm install
npm run dev            # http://localhost:5173
```

The seed script prints the admin email/password it created (defaults to
`admin@voltra.test` / `changeme123` — override via `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` in `server/.env` before seeding). Log in at
`http://localhost:5173/admin/login`. Try coupon codes `WELCOME10` or `FLASH500` at
checkout.

## What's fully working out of the box

- Browsing, search, filters, sort, product variants, cart, wishlist, recently viewed
- Guest checkout with coupon codes, delivery-zone pricing, Cash on Delivery
- **Transaction-safe stock decrementing** — two people can't buy the last unit at once
- **Transaction-safe coupon redemption** — usage limits and per-customer caps enforced
  atomically, same as stock
- Flash-sale countdown timers, homepage banner carousel, order tracking
- Cart-abandonment tracking (checkout-start vs. completed-order rate)
- Admin: dashboard, analytics charts (revenue trend, order quality, cart conversion),
  product/category/coupon/banner CRUD, order management with fraud-vs-cancellation
  flagging, review moderation
- WhatsApp contact button (edit the number in `client/src/content/siteContent.js`)

## Optional integrations — inactive until you add credentials

Nothing below causes errors when left unconfigured — each one just stays off.

- **bKash** — `server/utils/bkash.js` implements the real Tokenized Checkout flow. Add
  `BKASH_*` values to `server/.env`.
- **Nagad** — requires RSA key exchange per-request; `server/utils/nagad.js` is a
  documented interface stub, not guessed-at crypto code.
- **Meta Pixel / Google Analytics** — add `VITE_META_PIXEL_ID` / `VITE_GA_MEASUREMENT_ID`
  to `client/.env`. Standard events (ViewContent/AddToCart/InitiateCheckout/Purchase)
  already fire at the right points in `src/lib/analytics.js` — they just have nowhere
  to send data until an ID is set.
- **SMS/email order notifications** — not implemented; no provider wired up. The `Order`
  model's status-update flow is built so adding this is a matter of calling a provider
  from `routes/orders.js`.

## What's still not included

Returns/refunds admin workflow, and actual abandoned-cart *recovery* (you get the
abandonment rate now; emailing/texting those customers back needs the notification
provider above). Both were deferred for the same reason Phase 1 came before Phase 2 —
sequencing what's genuinely load-bearing first.

## Rebranding

- **Store name/copy:** `client/src/content/siteContent.js` (also the WhatsApp number)
- **Colors/fonts:** `client/tailwind.config.js` (`paper`/`ink`/`volt`/`circuit` palette,
  `display`/`body`/`mono` fonts)
- **Demo catalog/coupons/banners:** edit `server/utils/seed.js` and re-run `npm run seed`
  (wipes and recreates categories/products/reviews/coupons/banners — orders untouched)

## Deployment notes

```bash
cd client && npm run build     # outputs client/dist — deploy as a static site
cd ../server && npm start       # deploy the API to a Node host
```

If client and server end up on different origins, set `VITE_API_URL` in `client/.env`
before building, and `CLIENT_URL` in `server/.env`. Product images are stored on local
disk by default — fine for a single-server VPS, but won't survive a redeploy on
ephemeral/serverless hosts. Swap `middleware/upload.js` for Cloudinary or S3 if needed.

## API reference

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/products` | — | search/filter/sort/paginate, incl. `?discounted=true` |
| GET | `/api/products/:slug` | — | detail + related products |
| GET/POST | `/api/products/:id/reviews` | — | POST is guest-submittable |
| GET | `/api/categories` | — | `?includeInactive=true` for admin use |
| GET | `/api/reviews/featured` | — | homepage social proof |
| POST | `/api/coupons/validate` | — | check-only, real redemption happens at order time |
| GET | `/api/banners` | — | active, in-date-range banners only |
| POST | `/api/orders` | — | place order — reserves stock + redeems coupon atomically |
| GET | `/api/orders/track` | — | `?orderNumber=&phone=` |
| GET | `/api/delivery-rates` | — | current zone pricing |
| POST | `/api/analytics/cart-event` | — | logs a checkout-start event |
| POST | `/api/admin/auth/login` | — | returns a JWT |
| \* | `/api/admin/products` | JWT | full CRUD + image upload |
| \* | `/api/coupons`, `/api/banners` | JWT | admin CRUD (GET / is public per above) |
| \* | `/api/admin/reviews` | JWT | moderation |
| GET/PATCH | `/api/orders`, `/api/orders/:id/status`, `/api/orders/:id/fraud-flag` | JWT | admin order management |
| GET | `/api/admin/dashboard/stats` | JWT | revenue, order counts, low stock |
| GET | `/api/analytics/revenue-trend`, `/order-quality`, `/cart-conversion` | JWT | chart data |

All public write endpoints (orders, reviews, admin login, coupon checks) are rate-limited.
