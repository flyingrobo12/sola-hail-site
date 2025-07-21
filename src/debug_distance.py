from spatial_utils import calculate_distance_meters

lat1 = 32.7969
lon1 = -96.7824
lat2 = 32.9
lon2 = -96.8

distance = calculate_distance_meters(lat1, lon1, lat2, lon2)
print(f"Distance: {distance:.2f} meters")
