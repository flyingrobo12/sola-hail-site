from shapely.geometry import shape, Point, Polygon, MultiPolygon
from shapely.ops import unary_union, transform
import pyproj
import math

def extract_polygons_from_geojson(geojson_data):
    """Returns a list of Shapely geometry objects (Polygon or MultiPolygon)."""
    polygons = []
    for feature in geojson_data.get("features", []):
        geom = shape(feature["geometry"])
        polygons.append(geom)
    return polygons

def calculate_distance_meters(lat1, lon1, lat2, lon2):
    """
    Returns the Haversine distance in meters between two lat/lon points.
    """
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2) ** 2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def distance_to_closest_polygon(target_point, polygons):
    """
    Returns the shortest geodesic distance (in meters) from the target_point
    to any polygon or multipolygon.
    """
    min_distance = float("inf")
    lat1, lon1 = target_point.y, target_point.x

    for poly in polygons:
        if isinstance(poly, Polygon):
            nearest = poly.exterior.interpolate(poly.exterior.project(target_point))
            lat2, lon2 = nearest.y, nearest.x
            distance = calculate_distance_meters(lat1, lon1, lat2, lon2)
            min_distance = min(min_distance, distance)

        elif isinstance(poly, MultiPolygon):
            for subpoly in poly.geoms:
                nearest = subpoly.exterior.interpolate(subpoly.exterior.project(target_point))
                lat2, lon2 = nearest.y, nearest.x
                distance = calculate_distance_meters(lat1, lon1, lat2, lon2)
                min_distance = min(min_distance, distance)

    return round(min_distance, 2)


def calculate_total_area_km2(polygons):
    """
    Projects polygons to UTM Zone 14N (EPSG:32614, Dallas TX area) and returns total area in m².
    """
    try:
        merged = unary_union(polygons)
        project = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32614", always_xy=True).transform
        projected = transform(project, merged)
        return round(projected.area / 1_000_000, 4)  # Return in km²
    except Exception as e:
        print(f"⚠️ Area calculation failed: {e}")
        return 0.0


def extract_features(polygons, target_point):
    """
    Returns:
        - hit (bool): whether the point is inside any polygon
        - distance (float): meters to closest polygon (0.0 if hit)
        - num_polygons (int): number of polygon features
        - total_area_km2 (float): total area of polygons in square kilometers
    """
    num_polygons = len(polygons)
    hit = any(poly.contains(target_point) for poly in polygons)

    if hit:
        distance = 0.0
    else:
        distance = distance_to_closest_polygon(target_point, polygons)

    total_area_km2 = calculate_total_area_km2(polygons)

    return hit, distance, num_polygons, total_area_km2
