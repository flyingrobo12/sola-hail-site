import math
import os
import json
import csv
from shapely.geometry import shape, Point
from shapely.ops import unary_union
from statistics import stdev

# Constants
LOCATION_LAT = 32.7969
LOCATION_LON = -96.7824
MAX_ANNUAL_PAYOUT = 10000
DECAY_RATE = 1 / 5000
MEMORY_ZONE_LAT_OFFSET = 0.2
MEMORY_ZONE_LON_OFFSET = 0.2
DIRECTIONAL_ANGLE_THRESHOLD = 90  # max angular decay range
MEMORY_MAX_DIST_M = 100_000       # 100km max memory influence
AREA_MAX_KM2 = 500                # cap area influence at 500km²
TARGET_POINT = Point(LOCATION_LON, LOCATION_LAT)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def compute_closest_point_distance(polygon, target_point):
    if polygon.contains(target_point):
        return 0.0
    closest_point = min(polygon.exterior.coords, key=lambda coord:
        haversine(target_point.y, target_point.x, coord[1], coord[0])
    )
    return haversine(target_point.y, target_point.x, closest_point[1], closest_point[0])

def calculate_area_weight_multiplier(polygon):
    try:
        # Area in square kilometers (capped)
        area_km2 = min(polygon.area / 1e6, AREA_MAX_KM2)
        if area_km2 <= 0:
            return 1.0

        # Distance from centroid to target
        centroid = polygon.centroid
        distance_m = haversine(centroid.y, centroid.x, LOCATION_LAT, LOCATION_LON)

        # Inverse linear decay for distance bonus (maxed at 50km)
        proximity_multiplier = max(1.0, 1.5 - (distance_m / 50000))  # floor 1.0, cap at 1.5

        # Logarithmic scaling based on area
        area_base = 1.0 + math.log1p(area_km2) / 5  # smooth boost up to ~1.7

        combined = area_base * proximity_multiplier
        return round(min(combined, 2.0), 2)  # cap to 2.0
    except:
        return 1.0


def compute_directionality_bonus(closest_coord):
    angle = math.degrees(math.atan2(
        closest_coord[1] - LOCATION_LAT,
        closest_coord[0] - LOCATION_LON
    ))
    angular_diff = abs(angle - 0)  # deviation from due East
    angular_diff = min(angular_diff, DIRECTIONAL_ANGLE_THRESHOLD)
    linear_decay = 1.15 - ((angular_diff / DIRECTIONAL_ANGLE_THRESHOLD) * 0.15)
    return round(linear_decay, 2)

def compute_perimeter_complexity(polygon):
    try:
        area = polygon.area
        perimeter = polygon.length
        if area == 0:
            return 1.0
        ratio = perimeter / math.sqrt(area)
        return round(min(ratio / 10, 2), 2)
    except:
        return 1.0

def compute_memory_zone_multiplier(closest_coord):
    heat_center = Point(LOCATION_LON + MEMORY_ZONE_LON_OFFSET, LOCATION_LAT + MEMORY_ZONE_LAT_OFFSET)
    dist = haversine(closest_coord[1], closest_coord[0], heat_center.y, heat_center.x)
    dist = min(dist, MEMORY_MAX_DIST_M)
    linear_decay = 1.3 - ((dist / MEMORY_MAX_DIST_M) * 0.3)
    return round(linear_decay, 2)

def payout_formula(distance, area_multiplier, dir_bonus, shape_bonus, memory_bonus):
    decay = math.exp(-DECAY_RATE * distance)
    payout = MAX_ANNUAL_PAYOUT * decay
    payout *= area_multiplier * dir_bonus * shape_bonus * memory_bonus
    return payout

def compute_yearly_payout(file_path):
    with open(file_path) as f:
        data = json.load(f)

    max_payout = 0
    best_breakdown = None

    for feature in data['features']:
        try:
            geom = shape(feature['geometry'])

            if geom.contains(TARGET_POINT):
                breakdown = {
                    "Payout": MAX_ANNUAL_PAYOUT,
                    "Area Multiplier": round(calculate_area_weight_multiplier(geom), 2),
                    "Directionality Bonus": 1.15,
                    "Shape Complexity": round(compute_perimeter_complexity(geom), 2),
                    "Memory Zone Multiplier": 1.3,
                    "Distance (m)": 0.0,
                    "Direct Hit": True
                }
                return breakdown

            distance = compute_closest_point_distance(geom, TARGET_POINT)
            closest_coord = min(geom.exterior.coords, key=lambda coord:
                haversine(TARGET_POINT.y, TARGET_POINT.x, coord[1], coord[0])
            )

            area_mult = calculate_area_weight_multiplier(geom)
            dir_bonus = compute_directionality_bonus(closest_coord)
            shape_bonus = compute_perimeter_complexity(geom)
            memory_bonus = compute_memory_zone_multiplier(closest_coord)

            payout = payout_formula(distance, area_mult, dir_bonus, shape_bonus, memory_bonus)

            if payout > max_payout:
                max_payout = payout
                best_breakdown = {
                    "Payout": round(min(payout, MAX_ANNUAL_PAYOUT), 2),
                    "Area Multiplier": area_mult,
                    "Directionality Bonus": dir_bonus,
                    "Shape Complexity": shape_bonus,
                    "Memory Zone Multiplier": memory_bonus,
                    "Distance (m)": round(distance, 2),
                    "Direct Hit": False
                }

        except Exception as e:
            print(f"Skipping feature due to error: {e}")
            continue

    return best_breakdown if best_breakdown else {
        "Payout": 0,
        "Area Multiplier": 0,
        "Directionality Bonus": 0,
        "Shape Complexity": 0,
        "Memory Zone Multiplier": 0,
        "Distance (m)": 0,
        "Direct Hit": False
    }

def save_breakdowns_to_json(years, breakdowns, output_json="enhanced_payouts.json"):
    data = []
    for year, breakdown in zip(years, breakdowns):
        entry = {
            "year": year,
            "payout": breakdown["Payout"],
            "area_multiplier": breakdown["Area Multiplier"],
            "directionality_bonus": breakdown["Directionality Bonus"],
            "shape_complexity": breakdown["Shape Complexity"],
            "memory_zone_multiplier": breakdown["Memory Zone Multiplier"],
            "distance_m": breakdown["Distance (m)"],
            "direct_hit": breakdown["Direct Hit"]
        }
        data.append(entry)

    with open(output_json, "w") as f:
        json.dump(data, f, indent=2)

def compute_expected_annual_payout(directory_path, output_csv="enhanced_payouts.csv"):
    payouts = []
    years = []
    breakdowns = []
    geojson_polygons = []

    for filename in sorted(os.listdir(directory_path)):
        if filename.endswith(".geojson"):
            year = filename.split(".")[0].replace("hail_", "").strip()
            path = os.path.join(directory_path, filename)
            result = compute_yearly_payout(path)
            payout = result["Payout"]
            print(f"{year}: HIT = {result['Direct Hit']}, Distance = {result['Distance (m)']}, Payout = ${payout:,.2f}")
            payouts.append(payout)
            years.append(year)
            breakdowns.append(result)

            try:
                with open(path) as f:
                    gj = json.load(f)
                    for feature in gj['features']:
                        geom = shape(feature['geometry'])
                        geojson_polygons.append(geom)
            except:
                pass

    with open(output_csv, mode='w', newline='') as f:
        writer = csv.writer(f)
        headers = ["Year", "Payout", "Area Multiplier", "Directionality Bonus", "Shape Complexity",
                   "Memory Zone Multiplier", "Distance (m)", "Direct Hit"]
        writer.writerow(headers)
        for year, breakdown in zip(years, breakdowns):
            row = [year, breakdown["Payout"], breakdown["Area Multiplier"], breakdown["Directionality Bonus"],
                   breakdown["Shape Complexity"], breakdown["Memory Zone Multiplier"],
                   breakdown["Distance (m)"], breakdown["Direct Hit"]]
            writer.writerow(row)

    save_breakdowns_to_json(years, breakdowns)

    if geojson_polygons:
        union = unary_union(geojson_polygons)
        if union.contains(TARGET_POINT):
            print("Repeated Exposure Zone Detected (Cluster Heat)")

    if len(payouts) >= 3:
        std_dev = stdev(payouts)
        if std_dev >= 3000:
            tier = "High"
        elif std_dev >= 1500:
            tier = "Moderate"
        else:
            tier = "Low"
        print(f"High Payout Volatility Detected: std = ${std_dev:,.2f}")
        print(f"Overall Volatility Tier: {tier}")

    if payouts:
        expected = round(sum(payouts) / len(payouts), 2)
        print(f"\nExpected Annual Payout (2011–2020): ${expected:,.2f}")
        return expected
    else:
        print("No payouts computed.")
        return 0.0

# Run model
compute_expected_annual_payout("data/hail_maps")
