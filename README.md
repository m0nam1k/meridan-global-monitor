# AEGIS — Live Global Alert Monitor

A GitHub Pages dashboard showing near-real-time earthquake reports, NASA natural-event observations, and official **U.S.** severe-weather alerts.

## Live tracking

**No scheduled GitHub Actions delay.** A visitor's open browser fetches the providers directly:

| Feed | Poll interval while page is visible | Meaning |
| --- | --- | --- |
| [USGS GeoJSON](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) | **30 seconds** | Earthquakes magnitude 2.5+ over the last 24 hours; USGS feed typically publishes about once per minute |
| [NASA EONET v3](https://eonet.gsfc.nasa.gov/docs/v3) | **2 minutes** | Curated open natural events from the last 30 days, e.g. wildfires, storms and volcanoes |
| [NOAA / NWS alerts](https://www.weather.gov/documentation/services-web-alerts) | **60 seconds** | Official active weather watches/warnings for the United States and its territories |

The browser checks at these intervals **while the page remains open and visible**, with immediate checks on initial load and when the tab becomes active after the interval has expired. The refresh button requests all feeds (but cannot bypass source publication latency). A countdown and independent online/offline indicators report the state of each provider. Source failures preserve last good data in the current tab; a saved `data/alerts.json` is also a last-resort **stale fallback** when available.

This is polling, **not** true server-push/WebSocket alerts, background monitoring, or emergency notification. Closing the website stops checks; no browser notifications are sent. Provider publication, caching, browser throttling, rate limits, CORS restrictions and outages can delay new events. No application can guarantee warnings appear before their original provider publishes them.

## Deploy (GitHub Pages)

1. Repository: `https://github.com/m0nam1k/aegis-global-alerts`.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/(root)**, then Save.
4. Wait for Pages to deploy and check `https://m0nam1k.github.io/aegis-global-alerts/`.
5. Open the browser's Developer Tools → Network if a source displays Offline: third-party API requests may be blocked by the provider or network.

**Do not run a GitHub Action to get live updates.** `.github/workflows/refresh.yml` is manual-only and writes a backup snapshot when triggered. It is not part of the live refresh loop and is not necessary for the dashboard.

## Local development

Run `python -m http.server 8000` from the repository directory and visit `http://localhost:8000/`. The live feeds require internet access.

## Data integrity & limitations

- **NOAA** weather warnings are U.S.-only, not global official weather-warning coverage. NOAA alert severity is mapped from `Extreme/Severe/Moderate/Minor/Unknown` to `critical/high/moderate/low/unrated`. NOAA alerts without source geometry remain visible in the feed but are not mapped.
- **USGS** earthquake magnitude bands are convenience categories, **not official emergency threat ratings**.
- **NASA EONET** tracks observations and does **not** assign an official hazard severity. Shown as *Unrated*.
- Point markers are only representative locations, **not impacted-area boundaries**; source geometry may be unavailable or generalized.
- Displayed counts reflect fetched provider records, not all hazards or an independently verified global inventory.
- Events are advisory data **only**. For immediate danger, always consult local meteorological agencies and emergency authorities.
- The dashboard uses OpenStreetMap Standard raster tiles (key-free) with an optional dark CSS filter. Tiles are community-funded and are **not intended for high-volume commercial traffic**; follow https://operations.osmfoundation.org/policies/tiles/ (visible attribution, browser caching, Referer, no bulk downloads). For a production-scale website, subscribe to a commercial tile provider or host your own. CARTO's dark basemap now requires a separate API key and is **not** used by this version.

## Possible next phase

For continuous ingestion even with nobody viewing, persistent alert history, worldwide official weather warnings, region-specific push notifications, and automatic health monitoring, deploy an always-running backend (e.g. Node.js worker + database + WebSocket/SSE) using a real server or managed hosting. GitHub Pages alone is a static hosting service.
