# Sola Insurance: Hail Risk Payout Estimator

This project models hailstorm-triggered insurance payouts using historical geospatial data and spatial logic to estimate long-term expected liability.

## Final Payout Summary

Based on ten years of storm polygon data, the model estimates an average annual payout of **$1,250** using proximity-weighted probability tiers.

## Methodology

- Ingested annual GeoJSON files of verified hailstorm polygon footprints.
- Used Shapely to detect direct hits (point-in-polygon).
- Calculated minimum distance to polygons for near-miss scenarios.
- Defined near misses as events within 2,000 meters of the insured location.
- Assigned partial payout tiers for near-misses:
  - Within 500m → 75%
  - 500–1,000m → 50%
  - 1,000–2,000m → 25%
- Aggregated adjusted payouts over a decade.
- Exposed results through a Next.js API route (`/api/payout`) and rendered dynamically in the frontend.

## Code Structure

### Python Backend (`/src`)

- `analyzer.py` — Main payout logic and distance-based classification
- `spatial_utils.py` — Polygon containment and geospatial math
- `debug_distance.py` — Logs for near-miss proximity analysis
- `test_containment.py` — Placeholder for unit tests

### React/Next.js Frontend (`/app`)

- `page.tsx` — Landing page with Final Answer, Methodology, Code Walkthrough, and Ideation sections
- `payout/page.tsx` — Full payout summary table from API
- `styles/global.css` — Custom site styling

## Ideation Process

The initial approach used a strict binary trigger model (hit vs. no hit). However, after reviewing the data, the model was redesigned to capture proximity-based risk through near-miss detection. This resulted in a more accurate and probabilistically nuanced payout estimator.

If extended, the model would incorporate:
- Real-time weather feeds
- Visual overlays of hail paths
- Meteorological risk metrics (e.g., hail size, NOAA warnings)
- An interactive dashboard for user exploration

## Live Demo

Visit the deployed site at:

[https://sola-hail-site-rt.vercel.app](https://sola-hail-site-rt.vercel.app)

## Author

Robert Thomas  
[LinkedIn](https://www.linkedin.com/in/robert-thomas-46b713219/)
[GitHub](https://github.com/flyingrobo12/sola-hail-site)
