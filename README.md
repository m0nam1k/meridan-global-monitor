# MERIDIAN — Global Monitor for iPhone, Android and Web

An installable progressive web app (PWA) for situational awareness, built on public earthquake, natural-event and U.S. weather-warning feeds. Install it on an iPhone Home Screen with **no App Store fee**.

**Live site (current repository slug):** https://m0nam1k.github.io/meridan-global-monitor/

**GitHub repository:** https://github.com/m0nam1k/meridan-global-monitor

> The GitHub slug is currently `meridan` (without the second "i"); the product name and iPhone icon correctly say MERIDIAN. If you change the repository slug again, update links and verify GitHub Pages deployment.

## Install on iPhone

1. Open the live link in **Safari** on iPhone.
2. Tap **Share** (the square with an upward arrow). In some Safari layouts, open the Page Menu and then Share.
3. Select **Add to Home Screen**.
4. Leave **Open as Web App** enabled if that switch is presented.
5. Choose **Add**. Launch MERIDIAN from the Home Screen.

MERIDIAN launches in standalone app mode with a custom 180px iPhone icon, native screen safe areas and bottom navigation. Android/Chromium browsers can install it using their browser menu or the Install app button.

The PWA is **not** an App Store listing and does not require an Apple Developer Program membership.

## Features included

- Live browser polling: USGS magnitude 2.5+ earthquakes every 30 seconds, NASA EONET active natural events every 2 minutes, NOAA active U.S. weather alerts every 60 seconds.
- Full-screen world map, event list, category and severity filters.
- **Reported within the last 5 or 24 hours** filters, applied to currently returned provider records. This is not a complete archive of expired alerts.
- **Saved report links** kept locally on the current device in localStorage, up to 80. They are references, not continuously monitored alerts.
- Install manifest, 192px/512px PWA icons and 180px iOS icon, offline shell, versioned static-cache strategy, app update prompt.
- Offline warning with **no caching of official API responses** by the service worker. Live reports are only live after successful network requests.
- Responsive mobile dock, safer iPhone notches and home-indicator insets, dark semi-transparent UI.

## Important data and safety limitations

- GitHub Pages is static hosting. The browser fetches sources only while MERIDIAN is open. Closing the app stops collection; there are **no push notifications** or automatic background monitoring.
- USGS data is global; NOAA active weather warnings are U.S. and territories only; NASA EONET lists curated open natural events worldwide.
- Provider feeds are not guaranteed instantaneous and may suffer publication delays, rate limits or cross-origin failures.
- USGS magnitude-based `high/critical` tags are a dashboard heuristic, **not an official impact classification**. NASA events are explicitly unrated.
- Map pins are representative points, never affected-area polygons. NOAA warnings lacking geometry remain visible but unmapped.
- A prior `data/alerts.json` may be shown as a **fallback reference**, but the dashboard's source indicators do not mark it live. There is no full historical database.
- MERIDIAN is not a safety-critical emergency warning platform. Follow official emergency authorities.
- OpenStreetMap community-funded raster tiles are acceptable for development with proper attribution, but high traffic needs licensed tiles or self-hosting: https://operations.osmfoundation.org/policies/tiles/

## How the PWA works

- `manifest.webmanifest`: app name, standalone display, icons, in-scope launch URL.
- `sw.js`: caches only same-origin static UI resources, network-first navigation, never intercepts USGS/NASA/NOAA/tiles.
- `pwa.js`: install instructions and browser installation flow, network banners, app updates, saved reports.
- `app.js`: original live-map feed logic and 5h/24h report filters.
- `styles.css`: desktop and native-feeling iPhone layout.

### Test locally

Use a local HTTP server in the project folder: `python -m http.server 8000`, then open http://localhost:8000/ . Offline Service Worker features work on localhost or HTTPS; GitHub Pages provides HTTPS.

### Deploy

GitHub Pages must be enabled in **Settings → Pages**, using the `main` branch and `/(root)` folder. GitHub deploys after the commit. If updates appear stuck, wait for deployment and reload the app; the service worker may show an update prompt.

## Next phase

To achieve a genuine always-on worldwide alert platform: add an ingestion backend, persisted history (including expired alerts), data-source provenance, vetted conflict/geopolitical feeds, reliable event deduplication and consent-based push notifications. None of those capabilities should be claimed before they exist.
