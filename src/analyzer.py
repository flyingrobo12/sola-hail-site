import os
import json
import csv
from shapely.geometry import Point
from spatial_utils import extract_polygons_from_geojson, extract_features

# -------------------------
# Constants
# -------------------------
DATA_FOLDER = "data/hail_maps"
LAT, LON = 32.7969, -96.7824  # Pecan Lodge coordinates
ANNUAL_PAYOUT = 10_000
NEAR_MISS_THRESHOLD_METERS = 2000
FULL_PAYOUT = ANNUAL_PAYOUT
TIER_1_DIST = 500
TIER_2_DIST = 1000
TIER_3_DIST = 2000
OUTPUT_CSV = "output/payout_results.csv"


# -------------------------
# Main Processing
# -------------------------
results = []
hits = []
misses = []

target = Point(LON, LAT)  # Shapely uses (x=lon, y=lat)

for filename in sorted(os.listdir(DATA_FOLDER)):
    if filename.endswith(".geojson"):
        year = filename.split("_")[1].split(".")[0]
        file_path = os.path.join(DATA_FOLDER, filename)

        with open(file_path) as f:
            geojson_data = json.load(f)

        polygons = extract_polygons_from_geojson(geojson_data)

        # Extract hit, distance, polygon count, and area (m²)
        hit, distance, num_polygons, total_area_km2 = extract_features(polygons, target)

        if hit:
            hits.append((year, 0))
            print(f"{year}: ✅ HIT")
        else:
            misses.append((year, distance))
            print(f"{year}: ❌ MISS – Closest polygon: {distance:.2f} meters")

        results.append((year, hit, distance, num_polygons, total_area_km2))

# -------------------------
# Stats
# -------------------------
# Only one payout per year max — count years with a hit
unique_hit_years = {year for year, _ in hits}
total_years = len(results)

# Long-run expected value = total payouts / number of years
expected_annual_payout = (len(unique_hit_years) * ANNUAL_PAYOUT) / total_years

# more clarity printout
print(f"\n📊 Total Years Analyzed: {total_years}")
print(f"✅ Years with Payouts: {len(unique_hit_years)}")
print("🎯 Long-Run Expected Annual Payout: ${:,.2f}".format(expected_annual_payout))

# -------------------------
# Ranked Near Misses
# -------------------------
print("\n📏 Closest Misses (Ranked by Proximity):")
sorted_misses = sorted(misses, key=lambda x: x[1])
for year, dist in sorted_misses:
    print(f"{year}: {dist:.2f} meters")

# -------------------------
# Area Stats
# -------------------------
print("\n🧮 Total Storm Area (per year):")
for year, hit, dist, num_polys, area_km2 in results:
    print(f"{year}: {num_polys} polygons, {area_km2:,.2f} km²")
# -------------------------
# Near Miss Summary
# -------------------------
near_miss_years = [year for (year, hit, dist, _, _) in results if not hit and dist is not None and dist <= NEAR_MISS_THRESHOLD_METERS]

if near_miss_years:
    print("\n🟡 Near Misses (within {} meters):".format(NEAR_MISS_THRESHOLD_METERS))
    for year in near_miss_years:
        print(f"  - {year}")
else:
    print("\n✅ No Near Misses (within {} meters)".format(NEAR_MISS_THRESHOLD_METERS))

# -------------------------
# Save to CSV with Adjusted Payouts
# -------------------------
total_adjusted_payout = 0

os.makedirs("output", exist_ok=True)

with open(OUTPUT_CSV, "w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    
    # Updated header
    writer.writerow(["Year", "Hit", "DistanceToPolygon_m", "NumPolygons", "TotalArea_km2", "NearMiss", "AdjustedPayout"])
    
    for year, hit, dist, num_polys, area_km2 in results:
        is_near_miss = (not hit and dist is not None and dist <= NEAR_MISS_THRESHOLD_METERS)

        # Adjusted payout based on distance
        if hit:
            adjusted_payout = FULL_PAYOUT
        elif dist is not None:
            if dist <= TIER_1_DIST:
                adjusted_payout = FULL_PAYOUT * 0.75
            elif dist <= TIER_2_DIST:
                adjusted_payout = FULL_PAYOUT * 0.5
            elif dist <= TIER_3_DIST:
                adjusted_payout = FULL_PAYOUT * 0.25
            else:
                adjusted_payout = 0
        else:
            adjusted_payout = 0

        total_adjusted_payout += adjusted_payout

        writer.writerow([
            year,
            hit,
            f"{dist:.2f}",
            num_polys,
            f"{area_km2:.2f}",
            is_near_miss,
            f"{adjusted_payout:.2f}"
        ])
    
    # Summary stats (empty line + labeled section)
    writer.writerow([])
    writer.writerow(["Summary Statistics"])
    writer.writerow(["Total Years Analyzed", total_years])
    writer.writerow(["Years with Payouts", len(unique_hit_years)])
    writer.writerow(["Expected Annual Payout", f"${expected_annual_payout:,.2f}"])
    writer.writerow(["Years with Near Misses", len([year for (year, hit, dist, _, _) in results if not hit and dist is not None and dist <= NEAR_MISS_THRESHOLD_METERS])])
    writer.writerow(["Near Miss Threshold (m)", NEAR_MISS_THRESHOLD_METERS])
    writer.writerow(["Total Adjusted Payout (with Near Miss Tiers)", f"${total_adjusted_payout:,.2f}"])

print(f"\n📁 Results saved to {OUTPUT_CSV}")
# -------------------------
# Terminal Summary for Adjusted Payouts
# -------------------------
print("\n💵 Adjusted Payout Summary (Including Near Miss Tiers):")

print(f"- Total Years Analyzed: {total_years}")
print(f"- Years with Direct Hits: {len(unique_hit_years)}")
print(f"- Years with Near Misses (<= {NEAR_MISS_THRESHOLD_METERS}m): {len([year for (year, hit, dist, _, _) in results if not hit and dist is not None and dist <= NEAR_MISS_THRESHOLD_METERS])}")
print(f"- Total Adjusted Payout (2011–2020): ${total_adjusted_payout:,.2f}")
print(f"- Average Adjusted Annual Payout: ${total_adjusted_payout / total_years:,.2f}")

# year-by-year adjusted payouts
print("\n📆 Year-by-Year Adjusted Payouts:")
for year, hit, dist, num_polys, area_km2 in results:
    if hit:
        payout = FULL_PAYOUT
        tier = "✅ Direct Hit"
    elif dist is not None:
        if dist <= TIER_1_DIST:
            payout = FULL_PAYOUT * 0.75
            tier = "🟧 Tier 1 Near Miss"
        elif dist <= TIER_2_DIST:
            payout = FULL_PAYOUT * 0.5
            tier = "🟨 Tier 2 Near Miss"
        elif dist <= TIER_3_DIST:
            payout = FULL_PAYOUT * 0.25
            tier = "🟦 Tier 3 Near Miss"
        else:
            payout = 0
            tier = "❌ Too Far"
    else:
        payout = 0
        tier = "❌ No Data"

    print(f"  - {year}: ${payout:,.2f} ({tier})")
