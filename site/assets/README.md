# site/assets/

Drop your images, fonts, and other binary assets here.

Anything you put in this folder is processed by `build.js` and ends up in
`dist/assets/` with the same filename. Reference them from `site/index.html` with
a relative path:

```html
<img src="assets/my-photo.jpg" alt="..." />
```

The build also generates content hashes for the top-level CSS/JS files in `site/`,
so they cache aggressively on Vercel. Images, fonts and other assets are NOT
hashed — change the filename if you want to bust their cache.
