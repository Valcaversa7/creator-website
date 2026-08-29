#!/usr/bin/env node
/**
 * SiteForge build script
 * ----------------------
 * Reads source files from ./site/, processes them, and writes a
 * production-ready static site to ./dist/.
 *
 * What it does:
 *   1. Cleans ./dist/
 *   2. Copies everything in ./site/ -> ./dist/
 *   3. Reads dist/index.html, parses <link href="styles.css"> and
 *      <script src="script.js">, rewrites them to versioned filenames
 *      (styles.<hash>.css, script.<hash>.js), copies the assets under
 *      the new names, and rewrites internal references inside the
 *      CSS/JS too.
 *   4. Minifies the HTML, CSS and JS (light, dependency-free minify).
 *   5. Generates dist/robots.txt and dist/sitemap.xml.
 *   6. Copies anything in ./public/ on top.
 *
 * Usage:
 *   npm run build
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.lstatSync(p);
    if (stat.isDirectory()) rimraf(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    // skip documentation files
    if (/\.md$/i.test(src)) return;
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function readText(p) { return fs.readFileSync(p, 'utf8'); }
function writeText(p, content) { ensureDir(path.dirname(p)); fs.writeFileSync(p, content, 'utf8'); }

function sha8(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

/* ------------------------------------------------------------------ */
/*  Tiny minifiers (no deps, good-enough for hand-rolled code)         */
/* ------------------------------------------------------------------ */

function minifyHTML(html) {
  return html
    // collapse runs of whitespace between tags (handles > <, /> <, > </, etc.)
    .replace(/>\s+</g, '><')
    // remove HTML comments (keep conditional ones for IE/legacy — none here)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // collapse internal whitespace runs (but preserve one space in text)
    .replace(/\s{2,}/g, ' ')
    // trim
    .trim();
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')        // strip comments
    .replace(/\s+/g, ' ')                    // collapse whitespace
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')    // remove around punctuation
    .replace(/;}/g, '}')                     // drop trailing semis
    .trim();
}

function minifyJS(js) {
  // Conservative: strip block comments and line comments, but only
  // outside of string literals. Safe for our script.js.
  let out = '';
  let i = 0;
  const n = js.length;
  let mode = 'code'; // 'code' | 'sq' | 'dq' | 'bt' | 'lc' | 'bc' | 'rgx'
  while (i < n) {
    const c = js[i];
    const c2 = js[i + 1];
    if (mode === 'code') {
      if (c === '/' && c2 === '/') { mode = 'lc'; i += 2; continue; }
      if (c === '/' && c2 === '*') { mode = 'bc'; i += 2; continue; }
      if (c === "'") { out += c; mode = 'sq'; i++; continue; }
      if (c === '"') { out += c; mode = 'dq'; i++; continue; }
      if (c === '`') { out += c; mode = 'bt'; i++; continue; }
      out += c; i++;
    } else if (mode === 'sq') {
      out += c;
      if (c === '\\' && i + 1 < n) { out += js[++i]; i++; continue; }
      if (c === "'") mode = 'code';
      i++;
    } else if (mode === 'dq') {
      out += c;
      if (c === '\\' && i + 1 < n) { out += js[++i]; i++; continue; }
      if (c === '"') mode = 'code';
      i++;
    } else if (mode === 'bt') {
      out += c;
      if (c === '\\' && i + 1 < n) { out += js[++i]; i++; continue; }
      if (c === '`') mode = 'code';
      i++;
    } else if (mode === 'lc') {
      if (c === '\n') { out += '\n'; mode = 'code'; }
      i++;
    } else if (mode === 'bc') {
      if (c === '*' && c2 === '/') { mode = 'code'; i += 2; continue; }
      i++;
    }
  }
  // collapse blank lines & trailing whitespace
  return out
    .split('\n')
    .map(l => l.replace(/\s+$/g, ''))
    .filter(l => l.length > 0)
    .join('\n');
}

/* ------------------------------------------------------------------ */
/*  Build pipeline                                                    */
/* ------------------------------------------------------------------ */

function build() {
  console.log('▸ cleaning dist/');
  rimraf(DIST);
  ensureDir(DIST);

  console.log('▸ copying site/ -> dist/');
  copyRecursive(SITE, DIST);
  // strip any README.md that snuck into site/
  for (const f of fs.readdirSync(DIST)) {
    if (f.toLowerCase() === 'readme.md') fs.unlinkSync(path.join(DIST, f));
  }
  // also remove README.md inside any subfolder
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      const s = fs.statSync(p);
      if (s.isDirectory()) walk(p);
      else if (entry.toLowerCase() === 'readme.md') fs.unlinkSync(p);
    }
  })(DIST);

  // ------------------------------------------------------------------
  // Process index.html: rewrite CSS/JS references to hashed filenames
  // ------------------------------------------------------------------
  const htmlPath = path.join(DIST, 'index.html');
  let html = readText(htmlPath);

  const refRe = /<(link[^>]+?href=["']|script[^>]+?src=["'])([^"']+)(["'][^>]*?\/?>)/g;
  const replacements = [];
  html = html.replace(refRe, (full, tag, url, suffix) => {
    if (/^https?:\/\//i.test(url) || url.startsWith('//') || url.startsWith('data:')) {
      return full;
    }
    // skip Vercel-specific paths (analytics, speed insights, etc.)
    if (url.startsWith('/_vercel/')) {
      return full;
    }
    // only rewrite local CSS/JS references
    if (!/\.(css|js)(\?|$)/i.test(url)) return full;
    const base = path.basename(url).split('?')[0];
    const srcPath = path.join(DIST, base);
    if (!fs.existsSync(srcPath)) return full;
    const buf = fs.readFileSync(srcPath);
    const hash = sha8(buf);
    const ext = path.extname(base);
    const stem = base.slice(0, -ext.length);
    const newName = `${stem}.${hash}${ext}`;
    fs.renameSync(srcPath, path.join(DIST, newName));
    replacements.push({ from: base, to: newName });
    return `<${tag}${newName}${suffix}`;
  });

  // If index.html referenced the file with a subpath, also rewrite
  // occurrences of `styles.css` and `script.js` inside the (new) files
  // in case any text references slipped through. Our files don't, but
  // it's defensive. Skip replacements that would affect Vercel paths.
  for (const { from, to } of replacements) {
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    html = html.replace(re, (match, offset) => {
      // Don't replace if it's part of a /_vercel/ path
      const before = html.slice(Math.max(0, offset - 20), offset);
      if (before.includes('/_vercel/')) {
        return match;
      }
      return to;
    });
  }

  // ------------------------------------------------------------------
  // Minify assets
  // ------------------------------------------------------------------
  console.log('▸ minifying HTML, CSS, JS');
  const minified = minifyHTML(html);
  writeText(htmlPath, minified);

  for (const file of fs.readdirSync(DIST)) {
    if (file.endsWith('.css')) {
      writeText(path.join(DIST, file), minifyCSS(readText(path.join(DIST, file))));
    } else if (file.endsWith('.js')) {
      writeText(path.join(DIST, file), minifyJS(readText(path.join(DIST, file))));
    }
  }

  // ------------------------------------------------------------------
  // Generate robots.txt + sitemap.xml
  // ------------------------------------------------------------------
  const siteUrl = process.env.SITE_URL || 'https://example.com';
  console.log(`▸ generating robots.txt + sitemap.xml (site url: ${siteUrl})`);

  writeText(path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml\n`);

  writeText(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n` +
    `    <loc>${siteUrl.replace(/\/$/, '')}/</loc>\n` +
    `    <changefreq>monthly</changefreq>\n` +
    `    <priority>1.0</priority>\n` +
    `  </url>\n` +
    `</urlset>\n`);

  // ------------------------------------------------------------------
  // Public folder overlay
  // ------------------------------------------------------------------
  if (fs.existsSync(PUBLIC)) {
    console.log('▸ overlaying public/');
    copyRecursive(PUBLIC, DIST);
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  const sizes = fs.readdirSync(DIST).map(f => {
    const s = fs.statSync(path.join(DIST, f));
    return { file: f, kb: (s.size / 1024).toFixed(2) };
  });
  console.log('▸ build complete:');
  for (const { file, kb } of sizes) console.log(`    ${file.padEnd(28)} ${kb} kB`);
}

try {
  build();
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
