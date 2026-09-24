# Riseklix Website — Production Build

A static, deployment-ready site for Riseklix Media / Riseklix Agency.

## Deploy

Upload the full folder to Netlify, Vercel, Cloudflare Pages, or any static host. `netlify.toml`, `robots.txt`, `sitemap.xml`, `404.html`, legal pages, and responsive CSS are included.

## Calendly

The Contact page uses the inline Calendly widget:

`https://calendly.com/riseklix/30min?hide_event_type_details=1&hide_gdpr_banner=1`

## Reel Vault

The Work page uses `portfolio-videos.js`.

Current setup:
- The player first tries each Google Drive file as a native HTML video source.
- When the native stream works, the deck moves to the next reel only on the real `ended` event.
- If Google Drive blocks direct streaming, the site falls back to a Drive preview iframe and stays manual so it never cuts early.

Best production setup:
1. Compress your strongest reels to web-friendly MP4s.
2. Put them in `assets/reels/`.
3. Replace each Drive item with:

```js
{
  title: 'Your reel title',
  label: 'Short-form reel',
  src: 'assets/reels/your-reel.mp4',
  poster: 'assets/reels/your-poster.jpg',
  note: 'Short description.'
}
```

Local MP4s give the cleanest autoplay, progress bar, end-detection, and loop experience.

## Final checks before launch

- Point the domain to the static host.
- Confirm all Google Drive reel files are set to “Anyone with the link can view.”
- Replace placeholder proof metrics only with numbers you can back up.
- Test the Contact page once after deployment to confirm Calendly loads under the production domain.

## v52 Update — Riseklix AI + Rise Weekly beehiiv Integration

This build adds strategic links from the main Riseklix site to the new AI division at `https://ai.riseklix.com/`.

AI division links were added to:
- Primary navigation
- Home hero CTA
- Home acquisition-engine section
- Services page as a dedicated Riseklix AI service layer
- About page positioning block
- Contact page routing block
- Footer navigation and systems links
- HTML sitemap

### Rise Weekly newsletter setup

The footer newsletter form now posts to a Netlify Function at:

`/.netlify/functions/beehiiv-subscribe`

For security, the beehiiv API key is **not hard-coded into the frontend or repository**. Set these environment variables in Netlify before deploying:

- `BEEHIIV_API_KEY` — your beehiiv API key
- `BEEHIIV_PUBLICATION_ID` — `pub_babdd085-ee58-43a5-9841-fd11b4cb743a`
- `BEEHIIV_SEND_WELCOME_EMAIL` — optional, defaults to `true`

The form includes a required consent checkbox and a honeypot field for basic bot filtering.


V52 HOTFIX — DEPLOYMENT ROOT
- Repacked ZIP with index.html at the archive root.
- Previous v51 ZIP contained an outer project folder, which can make drag/drop/manual deploys open to 404 or a blank root if the platform uses the archive root as the publish directory.
- For Netlify drag-and-drop, unzip first and drag the folder that directly contains index.html, or upload this v52 root ZIP if your deploy flow accepts ZIPs.
- Beehiiv API key must be set as Netlify environment variable BEEHIIV_API_KEY; do not paste it into frontend JS.


## v53 legal page update

- Removed starter legal copy from Privacy Policy and Terms pages.
- Replaced both pages with fuller Riseklix-specific legal-style content covering website use, newsletter consent, analytics, client materials, AI tools, third-party processors, retention, data rights, results disclaimer, IP, payments, and governing law.
- Maintained deploy-root ZIP structure for Netlify manual upload.

## v55 SEO / AEO / GEO foundation update

- Added direct-answer sections to the main commercial pages so search and AI answer systems can extract clear buyer-facing answers from visible HTML.
- Rebuilt JSON-LD as page-level graphs with Organization, WebSite, WebPage, BreadcrumbList, Service, CollectionPage, ContactPage, and visible FAQ nodes where appropriate.
- Updated titles, descriptions, robots directives, Open Graph image metadata, Twitter card metadata, image dimensions, sitemap lastmod values, and clean URL redirects.
- Added `llms.txt` as a conservative AI-agent summary file. It is not treated as a Google ranking factor.

## v56 SEO/AEO/GEO resource layer - 2026-07-02

- Published a low-clutter /resources/ library with comparison charts, AI visibility audit, prompt monitoring, content-to-client acquisition, short-form, podcast, LinkedIn, and USA/UK/Australia strategy pages.
- Added Article and CollectionPage JSON-LD on resource pages with canonical URLs, breadcrumbs, and updated sitemap entries.
- Added footer, sitemap, llms.txt, Netlify redirects, and homepage research-desk links so the pages are discoverable without complicating the primary navigation.

## v57 production case-study layer - 2026-07-03

- Added dedicated crawlable case-study pages for Family Friendly OG, Jaxson Da Musicmon, and Dr. Sabine O'Laughlin.
- Linked case studies from Work, Sitemap, sitemap.xml, Netlify redirects, and llms.txt.
- Reworked the public AI visibility monitoring resource to remove raw internal prompt-bank language and present a buyer-ready monitoring framework.
- Added case-study CSS for metrics, snapshots, strategy tables, proof sections, and related systems.


## v58 Category Authority Engine services update - 2026-07-03

- Repositioned the Services page around the Riseklix Category Authority Engine.
- Added a three-layer services section covering Intent Layer AEO/GEO, Cinematic Visual Authority, and Precision Outbound.
- Updated services metadata, FAQ copy, JSON-LD service schema, and llms.txt with ICP mapping, targeted lead lists, and revenue-driving social strategy.


## v59 Ahrefs audit cleanup - 2026-07-03

- Normalized top-level canonical and sitemap URLs to the live slashless 200 URLs used by Netlify.
- Updated top-level .html and trailing-slash redirects to point directly at slashless canonical URLs.
- Fixed one internal redirecting Services CTA, normalized the AI ChatGPT Ads link, added home-page image alt text, and added two additional internal resource links from Services.
