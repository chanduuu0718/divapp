# Poster AI

A public-facing product poster generator.

## Complete flow

1. Paste an Amazon or other product URL.
2. The backend reads standard product metadata (JSON-LD/Open Graph) and collects available product images.
3. The frontend displays the images and lets the user select them.
4. The AI design endpoint creates poster copy and visual direction. If no OpenAI key is configured, a safe local fallback is used.
5. The browser composes the selected product image + AI design into a 1080×1350 poster.
6. Download the final poster as PNG.

## Run locally

Terminal 1 — frontend:

```bash
npm install
npm run dev
```

Terminal 2 — backend:

```cd backend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux use `cp .env.example .env` instead of `copy`.

Open the Vite URL shown in Terminal 1 (normally http://localhost:5173).

## Enable real AI copy/design

Put your OpenAI API key in `backend/.env`:

```
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
```

The key stays on the backend and is never placed in the browser.

## Product-link note

The extractor uses standard page metadata rather than an affiliate-link system. Some marketplaces, including Amazon, may block automated page requests or require an approved product-data API. When that happens, the app reports the problem instead of pretending that product data was found. A marketplace-specific approved provider can be plugged into the backend without changing the poster UI.

## Build

```bash
npm run build
```
