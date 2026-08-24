---
name: testing-angular-app-2
description: How to run and end-to-end test the ShopSmart Angular 21 SSR app (login, cart, products) locally, including the required mock backend and a headless-safe browser automation fallback.
---

# Testing Angular-app-2 (ShopSmart) locally

## Run the app
- Node 20 in PATH is too old for the Angular CLI. Use: `source ~/.nvm/nvm.sh && nvm use 22.12.0 && npm start`
- Dev server (SSR + HMR) listens on http://localhost:65434 (`ng serve --port 65434`).

## Mock backend is REQUIRED for /products and cart tests
- `ProductListComponent` (`src/app/features/products/pages/product-list/product-list.component.ts`) hits `http://localhost:3001/api/v1/products` and `/categories` via `httpResource`. No backend exists in this repo.
- With nothing on port 3001 the page renders the "Unable to load products / Connection was interrupted" error card and NO product cards, so "Add to Cart" cannot be exercised. (The component has `sampleProducts` fallback data but the template shows the error card instead, so it is never visible.)
- Workaround: run a tiny mock server on 3001 returning JSON arrays for `/api/v1/products` (fields: id, title, name, price, categoryId, category{id,name}, images) and `/api/v1/categories`. CORS `Access-Control-Allow-Origin: *` needed.
- SSR also fetches 3001 server-side; without it the terminal prints `ResourceValueError ... Http failure ... localhost:3001` — noise, not a real bug.

## Auth model (all client-side, localStorage)
- Keys: `auth_token`, `registered_credentials`, `cartItems` (see `src/app/core/services/auth.service.ts`, `cart.service.ts`).
- Demo login: `john@example.com` / `123456`. Register at `/register` (username ≥3 chars, valid email, password ≥6) → redirects to `/login`; then log in → `/dashboard`.
- `isAuthenticated()` is true if `auth_token` exists, so seeding `localStorage.setItem('auth_token','local-token-john')` puts the app in a logged-in state on reload (navbar shows generic "Account" since `currentUser` is not persisted — expected).

## Cart effect-loop regression (PR #5)
- Repro of the old bug: `auth_token` present AND no `cartItems` key → constructor `effect()` self-retriggered forever and froze the tab on every route (navbar injects CartService). Verify by seeding that exact state and loading `/login`; the form must render and `page.evaluate()` must return promptly.
- Useful negative control: `git show <pre-fix-commit>:src/app/core/services/cart.service.ts > src/app/core/services/cart.service.ts`, re-test (page hangs, screenshots time out), then restore the fixed file.

## Browser automation when computer-use/X is unavailable
- Computer use may be dead on the box (`enigo init failed: no connection could be established`). Fallback that works:
  - `setsid nohup Xvfb :1 -screen 0 1400x900x24 &`
  - `npm i puppeteer-core` in a scratch dir, launch `executablePath: '/home/ubuntu/.local/bin/google-chrome'`, `headless: false`, with `DISPLAY=:1`.
  - Record video with `setsid nohup ffmpeg -y -f x11grab -video_size 1400x900 -framerate 10 -i :1 -pix_fmt yuv420p out.mp4 &` (video_size must match the Xvfb screen exactly, and `setsid` matters or the recorder dies with the shell).
- Handy selectors: login inputs `input[placeholder="you@example.com or username"]` / `input[placeholder="Enter your password"]`; register `input[placeholder="Choose a username"]`, `input[placeholder="you@example.com"]`, `input[placeholder="Enter a secure password"]`; product cards `app-product-card` with `button` = "Add to Cart"; navbar cart badge `.badge`; account menu `.avatar-button` then `.account-menu button` (Logout).

## Devin Secrets Needed
- None; the app is fully local with client-side auth.
