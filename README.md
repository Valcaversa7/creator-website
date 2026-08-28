# SiteForge — Premium Websites for Modern Businesses

A single-page, premium black-and-white marketing site for a freelance web designer.
Static. Dependency-free. Built to deploy to **Vercel** in one click.

## Stack

- **HTML5** — semantic markup, single `site/index.html`
- **CSS3** — hand-rolled design system, custom properties, fully responsive
- **Vanilla JS** — animations, scroll effects, mobile menu, form validation
- **Custom Node build** — `build.js` minifies, content-hashes and produces `dist/`

No framework, no bundler, no `node_modules` at runtime. `build.js` is the only thing
that needs Node (≥ 18), and only for the build step.

## Project structure

```
creator-website/
├── site/              ← editable source (HTML, CSS, JS, assets)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── assets/        ← drop images / fonts here
├── public/            ← files copied verbatim to dist/ (favicon, robots overrides, etc.)
├── dist/              ← build output (gitignored, generated)
├── build.js           ← build script: minify, hash, sitemap, robots
├── vercel.json        ← Vercel config: build cmd, output dir, headers, redirects
├── .vercelignore      ← files Vercel should skip when uploading
├── package.json
├── .env.example       ← set SITE_URL before `npm run build`
├── .gitignore
└── README.md
```

## Quick start

```bash
# 1. install nothing — there are no runtime dependencies
# 2. build the production site into ./dist
npm run build

# 3. preview the built site locally
npm run preview
# -> http://localhost:5173

# or one-shot:
npm run dev   # build + serve
```

## Deploy to Vercel

### Option A — Git integration (recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects everything from `vercel.json` — no config needed.
4. Click **Deploy**. Done.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel              # first-time: link to your Vercel account, accept defaults
vercel --prod       # promote to production
```

The CLI reads `vercel.json`, runs `node build.js`, and deploys the contents of `dist/`.

### Option C — Drag & drop

1. Run `npm run build` locally.
2. Zip the `dist/` folder.
3. Go to [vercel.com/new](https://vercel.com/new) and drag the zip onto the page.

## Configuration

| Variable     | Where         | Default                | Purpose                                  |
|--------------|---------------|------------------------|------------------------------------------|
| `SITE_URL`   | `.env.local`  | `https://example.com`  | Used in `robots.txt` and `sitemap.xml`. |

Set it before building:

```bash
echo "SITE_URL=https://your-domain.vercel.app" > .env.local
npm run build
```

On Vercel, set `SITE_URL` in **Project Settings → Environment Variables** and it
will be picked up automatically by `build.js`.

## Sections

1. Sticky minimal nav with animated mobile hamburger menu
2. Hero — split-line animated headline, CTAs, trust stats, floating preview with parallax
3. WHAT I BUILD — 6 service cards with hover fill animation
4. WHY YOUR BUSINESS NEEDS A WEBSITE — 4 large-typography blocks
5. MY WORK — portfolio grid (placeholder — add your own)
6. HOW IT WORKS — 4-step dark process section
7. LET'S TALK — single "CUSTOM" pricing card
8. Main CTA — dramatic black "READY TO TAKE YOUR BUSINESS ONLINE?"
9. Contact — full form + sidebar with WhatsApp/Email quick actions
10. Footer

## Editing your details

All personal/contact info is in `site/index.html`. To change site-wide values, search for:

| What                          | Search for                  |
|-------------------------------|-----------------------------|
| Email (placeholder for now)   | `email@example.com`         |
| Phone (placeholder for now)   | `XXXXX`                     |
| Brand / studio name           | `SITEFORGE`                 |

To add a project screenshot, drop the file into `site/assets/` and replace a
`.work-card` block in `site/index.html` (there's a commented-out template in the
PORTFOLIO section).

## Build output

After `npm run build`, `dist/` looks like:

```
dist/
├── index.html           ← minified
├── styles.<hash>.css    ← minified, content-hashed
├── script.<hash>.js     ← minified, content-hashed
├── robots.txt
└── sitemap.xml
```

The `vercel.json` headers send `Cache-Control: public, max-age=31536000, immutable`
for all hashed assets, so visitors get instant loads after the first visit.

## License

Private project — all rights reserved.
