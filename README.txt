FreeToolHub Tools Patch
-----------------------
What this archive contains:
- /tools/ : 10 fully functional client-side tool pages (ready to drop into your site)
- seo_snippet.html : meta tags + JSON-LD snippet to paste into your HEAD
- robots.txt, sitemap.xml : basic SEO files (update the domain)

How to merge into your existing site (the one you sent):
1. Unzip your site, and copy the entire /tools/ folder from this patch into your site's root (so you have site-root/tools/...).
2. Open your site's index.html and paste the contents of seo_snippet.html into the <head> section. Update the URLs (yourdomain.com) and og-image path.
3. Place robots.txt and sitemap.xml in your site's root and update the domain in sitemap.xml.
4. If your index.html already has tool cards, ensure the links point to /tools/<file>.html (e.g. tools/png-to-pdf.html).
5. Test locally with a simple HTTP server:
   python3 -m http.server 8000
   open http://localhost:8000
6. If you want, reply here with your ZIP and I will merge the files for you and return a single merged ZIP.

Notes:
- These tools run entirely in the browser using CDN libs; no backend required.
- Background remover is a simple chroma-key algorithm (not a heavy AI model).
- Word->PDF (mammoth) is basic and may not preserve complex layouts.
