# AEGIS — Global Alert Monitor

A responsive, dark global natural-hazard monitor for **GitHub Pages**, built with plain JavaScript and Leaflet. No API keys, build tooling or server required for viewing.

## Features
- Interactive OpenStreetMap world map with hazard markers and detail popups
- USGS earthquakes (magnitude 2.5+ over the past day) and NASA EONET active natural events
- Filter by category, severity, search text; click any event to fly to it
- Live source-health indicators, last-updated timestamp, metrics, and mobile layout
- GitHub Actions refreshes JSON on a 15-minute schedule (subject to GitHub scheduling delays)
- Stale data preserved during temporary source outages and labeled as such

## Deploy to GitHub
1. Create a **public** GitHub repository and upload all files, keeping `.github/workflows/refresh.yml`.
2. In **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions** for GitHub Actions (if required).
3. Open **Actions → Refresh global alerts → Run workflow** to populate the dataset.
4. In **Settings → Pages**, set **Deploy from a branch**, `main` / `(root)` and save.
5. Visit `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/` after Pages publishes.

The dashboard reloads the generated data every 60 seconds and the GitHub Action requests updated feeds every 15 minutes. GitHub Actions scheduled runs can be delayed. This is **near-real-time**, not instantaneous emergency notification.

## Local development
Run `python scripts/fetch.py` to fetch real data, then `python -m http.server 8000` and browse to `http://localhost:8000/`.

## Data / limitations
- **USGS**: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php — magnitude-based severity is a visual heuristic, **not** an official threat classification.
- **NASA EONET**: https://eonet.gsfc.nasa.gov/docs/v3 — active events are observations, and not all are public safety warnings; these show as **Unrated** rather than claiming danger.
- One point is used per event (for polygons, the first coordinate), so markers are approximate and **do not show affected areas**.
- Only covered hazard feeds appear: this is not comprehensive worldwide official weather-warning coverage. Data provider omissions, mapping imprecision, and publication lag are expected.
- This project is **not** an official emergency warning service. Consult local authorities for instructions.
- Uses OpenStreetMap tiles and Leaflet from CDN; keep map attribution and respect tile usage policy.

## Next integrations
GDACS disaster alert levels, official weather alert CAP feeds region-by-region, tsunami bulletins, notifications with opt-in geofencing, event history and deduplication.