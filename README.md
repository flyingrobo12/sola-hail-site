# Sola Insurance: Hail Risk Payout Estimator

This project reimagines hailstorm-triggered insurance modeling by combining spatial data science, behavioral risk signals, and proximity-based modifiers to produce transparent and realistic payout estimates.

---

## A. Final Answer

This model analyzes 10 years of hailstorm data to determine risk exposure for a single insured location. It factors in not only direct hits, but near misses—storms that came within 2,000 meters—and modifies the payout using several spatial features.

 **Expected annual payout across all years:** `$1,250`

Each year is scored using:
- Direct hit status (True/False)
- Distance to the insured property
- Area multiplier (based on storm polygon size)
- Directionality bonus (based on incoming angle)
- Shape complexity (how irregular the polygon is)
- Memory multiplier (based on recent history of close storms)

Volatility across years is also measured:

-  **Standard deviation:** `$3,897.41`
-  **Volatility tier:** **High**

---

## B. Methodology

- Parsed 10 years of verified hail event GeoJSON data
- Defined a fixed insured coordinate
- Used Shapely to test point-in-polygon and minimum distance to storm polygons
- Established proximity thresholds:
  - Within 2,000m = considered a near miss
- Computed payout using:
  - Area of storm polygon (area multiplier)
  - Direction of approach (directionality bonus)
  - Storm boundary irregularity (shape complexity)
  - Heat zone proximity (memory zone multiplier)
- Built a payout decay model based on distance
- Calculated adjusted payouts per year, averaged for long-term projection
- Classified volatility using standard deviation thresholds
- Served JSON via a TypeScript Next.js API route

---

## C. Code Walkthrough

### Python Backend (`/src`)
- `enhanced_analyzer.py` — Final payout logic with distance decay, multipliers, and volatility tiering  
- `analyzer.py` — Original binary model (hit/no-hit only)  
- `debug_distance.py` — Logs minimum distances for near-miss storms and supports transparency in payout calculations 
- `spatial_utils.py` — Handles polygon containment, clustering, and geospatial math

### JavaScript / TypeScript Frontend
- `convert.js` — Converts CSV to frontend-usable JSON  
- `app/page.tsx` — Renders Final Answer, Methodology, Code Walkthrough, and Ideation sections  
- `app/api/payout/route.ts` — Serves enhanced payout JSON to frontend  
- `styles/global.css` — Custom styling for the site and table UI

---

## D. Ideation Process

This project started with a binary containment check—was the insured location inside a storm polygon? But real-world risk doesn’t work that way. Storms that *almost* hit still matter.

The enhanced version introduced proximity-based payouts and behavioral multipliers. By modeling how storms behave spatially and historically, the estimator now reflects true exposure and gives underwriters a smarter decision model.

Future improvements would include:
- NOAA storm intensity data integration  
- Real-time storm event tracking  
- Interactive policy toggles and pricing simulation dashboard

---

## Live Demo

🌐 Visit the deployed site:  
https://sola-hail-site-rt.vercel.app

---

## Author

**Robert Thomas**  
[LinkedIn](https://www.linkedin.com/in/robert-m-thomas-iii) | [GitHub](https://github.com/flyingrobo12)

