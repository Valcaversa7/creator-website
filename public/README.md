# public/

Any file you put in this folder will be copied **verbatim** into the final
`dist/` output during the build. Useful for:

- `favicon.ico`
- `apple-touch-icon.png`
- `og-image.png` / social share images
- A custom `robots.txt` (overrides the auto-generated one)
- A static `CNAME` (for custom domains outside Vercel)
- A `_redirects` file (Vercel uses `vercel.json`, but this is here for portability)

The contents of this folder are NOT processed — files are copied as-is.
Do not put your editable HTML/CSS/JS here; those belong in `site/`.
