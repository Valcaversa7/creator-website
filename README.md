# SiteForge — Premium Websites for Modern Businesses

A single-page, premium black-and-white marketing site for a freelance web designer.
Built with plain HTML, CSS and vanilla JavaScript — no build step, no dependencies, no framework.

## Stack

- **HTML5** — semantic markup, single `index.html`
- **CSS3** — hand-rolled design system, custom properties, fully responsive
- **Vanilla JS** — animations, scroll effects, mobile menu, form validation

No build tools. No `node_modules`. Open `index.html` in a browser or serve the folder with any static server.

## File structure

```
creator-website/
├── index.html      # All markup (sections, nav, footer)
├── styles.css      # Design system, layout, components, responsive
├── script.js       # Interactions, animations, mobile menu, form
├── README.md
└── .gitignore
```

## Run locally

Any static file server works. A few options:

```bash
# Python (built in)
python3 -m http.server 5173
# then open http://localhost:5173

# Node
npx serve .

# PHP
php -S localhost:5173
```

## Deploy

Because this is a static site, you can deploy it to any static host:

- **GitHub Pages** — push to `main`, enable Pages in repo settings, point at the root
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder, or connect the repo
- **Any web host** — upload the three files (`index.html`, `styles.css`, `script.js`) via FTP

## Sections

1. **Sticky minimal nav** with animated mobile hamburger menu
2. **Hero** — split-line animated headline, CTAs, trust stats, floating preview with parallax
3. **WHAT I BUILD** — 6 service cards with hover fill animation
4. **WHY YOUR BUSINESS NEEDS A WEBSITE** — 4 large-typography blocks
5. **MY WORK** — portfolio grid (placeholder — add your own)
6. **HOW IT WORKS** — 4-step dark process section
7. **LET'S TALK** — single "CUSTOM" pricing card
8. **Main CTA** — dramatic black "READY TO TAKE YOUR BUSINESS ONLINE?"
9. **Contact** — full form + sidebar with WhatsApp/Email quick actions
10. **Footer**

## Editing your details

All personal/contact info is in `index.html`. To change site-wide values, search for these strings:

| What | Search for |
|---|---|
| Your personal name (footer, sidebar) | `Belsso` |
| WhatsApp / phone number | `9176300158` |
| Email | `belssobelsso81@gmail.com` |
| Brand / studio name | `SITEFORGE` |

To swap the placeholder portfolio mockups for real screenshots, see the comment block in the **PORTFOLIO** section of `index.html` — it includes a ready-to-fill template for each project.

## Customizing the pricing

The Custom card's price text and features are in the **PRICING** section. Edit the `<li>` items inside `.price-features` to reflect what you actually include.

## License

Private project — all rights reserved.
