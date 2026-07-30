# Shiva Home Tutor — Website

## What's in this project

- `index.html` — homepage
- `about.html`, `services.html`, `contact.html`, `tutor-registration.html`, `privacy-policy.html`, `terms.html` — core pages
- `home-tutor-delhi.html`, `home-tutor-gurgaon.html`, `home-tutor-noida.html`, `home-tutor-greater-noida.html`, `home-tutor-ghaziabad.html`, `home-tutor-faridabad.html`, `home-tuition-near-me.html` — city/local-intent landing pages
- `maths-home-tutor.html`, `science-home-tutor.html`, `physics-home-tutor.html`, `chemistry-home-tutor.html`, `biology-home-tutor.html`, `english-home-tutor.html`, `cbse-home-tutor.html`, `icse-home-tutor.html`, `jee-home-tutor.html`, `neet-home-tutor.html` — subject/exam landing pages
- `blog.html` — 50 planned article topics (titles, summaries, target keywords) grouped by category, ready for you to turn into full posts over time
- `style.css` — shared stylesheet used by every page (loads once, cached by the browser across pages)
- `script.js` — shared JavaScript: mobile menu, both forms, Google Sheet submission, stat-counter animation
- `logo.png` — your logo (used as favicon, header/footer logo, and PWA icon)
- `robots.txt`, `sitemap.xml`, `manifest.json` — technical SEO files
- `google-sheet-setup-code.gs` — Google Apps Script for saving form submissions + email notifications

## Domain used in SEO tags

All canonical URLs, Open Graph tags, and `sitemap.xml` now point to your actual live site: `https://shivahometutorapply-afk.github.io/shiva-home-tutor/`. If you ever move to a custom domain, replace that URL sitewide:

```bash
# from inside this folder, on Mac/Linux:
grep -rl "shivahometutorapply-afk.github.io/shiva-home-tutor" . | xargs sed -i 's|https://shivahometutorapply-afk.github.io/shiva-home-tutor/|https://yourrealdomain.com/|g'
```

## Deploying to GitHub Pages

Your site is already live at `https://shivahometutorapply-afk.github.io/shiva-home-tutor/`. To update it with these latest files:

1. Go to your existing repository on GitHub (the one behind `shivahometutorapply-afk.github.io/shiva-home-tutor`).
2. Delete or overwrite the old files with everything in this folder — all files go in the repository root, in the same folder as each other (no subfolders).
3. The easiest way: use GitHub's web UI → **Add file → Upload files**, then drag every file from this folder in at once (it will overwrite files with matching names).
4. Commit the changes. GitHub Pages will redeploy automatically within a minute or two — refresh your live URL to confirm the update landed.

## Google Sheet / email notifications

Already wired up in `script.js` via the `SHEET_SCRIPT_URL` constant, pointing at your deployed Apps Script. If you ever redeploy the script, update that URL in `script.js` (one file, not per-page).

## What was improved in this pass

- **SEO:** unique title/meta description per page, canonical URLs, Open Graph + Twitter cards, JSON-LD structured data (Organization, FAQPage, BreadcrumbList per page), semantic heading structure, descriptive internal links between city/subject pages, `robots.txt`, `sitemap.xml`.
- **Performance:** CSS and JS extracted into shared cached files instead of being duplicated on every page; no external font files loaded (keeps pages fast, avoids font-swap layout shift); lightweight inline SVG icons instead of icon fonts/images.
- **Accessibility:** skip-to-content link, working keyboard-operable mobile menu with `aria-expanded`, focus-visible outlines, `aria-label`s on icon-only buttons and nav regions, alt text on all images.
- **UX/Design:** working hamburger mobile menu (previously the design had the CSS for one but no actual menu), new "How It Works" and stats sections, breadcrumbs on every subpage, internal link cards connecting related pages.
- **Content:** unique, non-duplicated copy per city and subject page targeting the requested keywords naturally (no keyword-stuffing), 50 blog topic drafts with suggested keywords.
- **New pages:** 7 city/local pages, 10 subject/exam pages, About, Services, Contact, Tutor Registration, Privacy Policy, Terms, and a Blog index — all cross-linked.

## What this pass does **not** claim

- **No fabricated statistics.** Numbers like "500+ tutors" or "24h matching" were already on your original site — I kept them consistent but did not invent new ones (e.g. no fake review counts, no fake `AggregateRating` schema, no invented street address in the business schema).
- **No guaranteed Lighthouse score.** I followed the practices that drive a high score (minimal render-blocking resources, no unused framework CSS/JS, semantic HTML, accessible markup), but I can't run an actual Lighthouse audit from here — test it yourself in Chrome DevTools once it's live, and let me know the results if you want help closing any remaining gaps.
- **No blog articles written yet** — just 50 well-scoped drafts (title + summary + keywords) so you (or I, on request) can turn them into full posts without duplicating topics.
- **Ranking on Google isn't guaranteed by code alone.** Getting indexed in Google Search Console, publishing real content over time, and earning backlinks from other sites all matter alongside a well-built website.
