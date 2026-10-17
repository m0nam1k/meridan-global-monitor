# MERIDIAN — Global Monitor

> A calm, live view of reported events around the world.

MERIDIAN (formerly AEGIS) is a responsive, dark, map-first situational awareness dashboard. It combines **USGS earthquakes**, **NASA EONET open natural events**, and **NOAA/NWS active U.S. weather alerts** on a single public website. The latest design rebuild uses understated dark glass panels, restrained color, and responsive navigation.

**Website:** https://m0nam1k.github.io/aegis-global-alerts/

**Repository:** https://github.com/m0nam1k/aegis-global-alerts

> Note: MERIDIAN is currently the product's working brand. The existing repository slug stays `aegis-global-alerts` so GitHub Pages links continue to work; renaming the GitHub repository requires a repository-settings action not exposed to this connector.

## Current, implemented features

- Interactive Leaflet world map with report markers and popups; no map API key
- Event feed, text search, category and severity filters
- Counters for reported earthquakes, natural events, U.S. weather alerts, and high/critical report categories
- Source-health indicators, timestamps, and manual refresh
- Direct polling from an **open browser tab**, no paid provider credentials:
  - USGS magnitude 2.5+ feed, every **30 seconds** (provider publishes less often)
  - NASA EONET active natural events, every **2 minutes**
  - NOAA active weather alerts, every **60 seconds**
- Last-known in-memory source data retained during fetch errors; optional committed JSON backup is not live

A "live" result means the browser fetched a provider successfully, **not** that each event is occurring right now. Publication delays, provider caching, geo coverage, access restrictions and API outages apply.

### Planned next phase (NOT implemented)

- **Historical alerts with a 5-hour / 24-hour selector.** This needs actual historical storage or endpoint query support; merely retaining the active feed does not recover expired advisories.
- **Conflict and geopolitical event coverage**, clearly separated from verified weather/seismic alerts and labeled by publisher and source confidence. Requires suitable evidence-based feeds and a careful deduplication/reliability pipeline.
- A deeper navigation structure for history, world events, and data provenance.
- Optional saved areas and notifications after a persistent backend exists.

No war/conflict records, historical archive, or push notifications are fabricated by the current release.

## Deployment

Static GitHub Pages site:

1. Open repository **Settings → Pages**.
2. Choose **Deploy from a branch**, `main`, `/(root)`.
3. The live viewer will be at https://m0nam1k.github.io/aegis-global-alerts/.
4. If an older design remains visible, hard-refresh the browser or wait for Pages deployment to finish.

No GitHub Actions schedule is required for live browser fetching. The action `.github/workflows/refresh.yml` is manual-only and creates an optional stale backup snapshot. GitHub Pages does not continue polling while no visitors have the dashboard open.

## Data interpretation

| Provider | Coverage | Notes |
| --- | --- | --- |
| [USGS earthquake GeoJSON](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) | Worldwide earthquakes M2.5+ in the past day | The dashboard's magnitude thresholds are illustrative categories, **not official danger ratings**. |
| [NASA EONET v3](https://eonet.gsfc.nasa.gov/docs/v3) | Natural events curated by NASA | EONET does not provide a universal severity scale; these are *unrated*. |
| [NOAA/NWS alert API](https://www.weather.gov/documentation/services-web-alerts) | Active weather alerts, U.S. and territories | Not global official weather warning coverage. NOAA feeds may include tests. Severity labels follow source metadata. |

Some NOAA records contain no geographic polygon and are shown in the feed without a fabricated pin. For mapped regions, a single marker is **only an approximate representative position** and never substitutes for affected-area boundaries.

The base map uses OpenStreetMap Standard tiles with a dark visual filter. Follow their [tile usage policy](https://operations.osmfoundation.org/policies/tiles/); use a licensed provider or self-hosting if the project becomes high-traffic or commercial.

For local development run `python -m http.server 8000` from the repository root and open http://localhost:8000/.

**Safety:** MERIDIAN is an informational dashboard, not an official public-warning service. Follow authoritative local advisories and emergency responders.
