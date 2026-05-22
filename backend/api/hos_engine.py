import math
from datetime import datetime, timedelta

import requests

# --- CONFIGURATION DES RÈGLES HOS (PDF FMCSA) ---
DRIVING_LIMIT = 11.0        # Max heures de conduite par fenêtre
WINDOW_LIMIT = 14.0         # Fenêtre de travail max (consecutive)
BREAK_THRESHOLD = 8.0       # Pause obligatoire après 8h de conduite
BREAK_DURATION = 0.5        # 30 minutes de pause
REST_DURATION = 10.0        # 10h de repos pour reset les compteurs
CYCLE_LIMIT = 70.0          # Cycle de 70h sur 8 jours
FUEL_THRESHOLD = 1000.0     # Plein d'essence tous les 1000 miles
FUEL_DURATION = 0.5         # 30 min pour l'essence
AVG_SPEED = 55              # Vitesse moyenne en mph

def get_coords(location_name):
    """Obtient les coordonnées via l'API Nominatim (Gratuit)"""
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={location_name}&format=json&limit=1"
        headers = {'User-Agent': 'SpotterHOSApp/1.0'}
        response = requests.get(url, headers=headers).json()
        if response:
            return [float(response[0]['lat']), float(response[0]['lon'])]
    except Exception:
        pass
    return [39.82, -98.57] # Centre des USA par défaut

def calculate_distance(c1, c2):
    """Calcul de distance Haversine (en miles) entre deux points GPS"""
    lat1, lon1 = math.radians(c1[0]), math.radians(c1[1])
    lat2, lon2 = math.radians(c2[0]), math.radians(c2[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return c * 3956 # Rayon de la terre en miles

def get_route_data(coords_list):
    """
    Appelle l'API OSRM pour obtenir le tracé routier et la distance réelle.
    coords_list: [[lat1, lon1], [lat2, lon2], ...]
    """
    # OSRM utilise le format lon,lat;lon,lat
    formatted_coords = ";".join([f"{c[1]},{c[0]}" for c in coords_list])
    url = f"http://router.project-osrm.org/route/v1/driving/{formatted_coords}?overview=full&geometries=geojson"
    
    try:
        response = requests.get(url).json()
        if response['code'] == 'Ok':
            route = response['routes'][0]
            # Coordonnées pour Leaflet (format [lat, lon])
            geometry = [[p[1], p[0]] for p in route['geometry']['coordinates']]
            # Distance en mètres convertie en miles
            distance_miles = route['distance'] * 0.000621371
            return geometry, distance_miles
    except:
        pass
    return None, None

def calculate_hos_trip(currentLocation, pickupLocation, dropoffLocation, currentCycleUsed):
    # 1. Géocodage
    coords_start = get_coords(currentLocation)
    coords_pickup = get_coords(pickupLocation)
    coords_dropoff = get_coords(dropoffLocation)

    # 2. Obtenir le tracé routier réel et les distances précises
    # Segment 1 : Départ -> Pickup
    route_to_pickup, dist_to_pickup = get_route_data([coords_start, coords_pickup])
    # Segment 2 : Pickup -> Dropoff
    route_to_dropoff, dist_to_dropoff = get_route_data([coords_pickup, coords_dropoff])

    # Si OSRM échoue, on revient au calcul Haversine par défaut
    if not dist_to_pickup:
        dist_to_pickup = calculate_distance(coords_start, coords_pickup)
        route_to_pickup = [coords_start, coords_pickup]
    if not dist_to_dropoff:
        dist_to_dropoff = calculate_distance(coords_pickup, coords_dropoff)
        route_to_dropoff = [coords_pickup, coords_dropoff]

    total_miles = dist_to_pickup + dist_to_dropoff
    full_route_geometry = route_to_pickup + route_to_dropoff

    events = []
    # On commence aujourd'hui à 08:00 AM
    current_time = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)
    
    # État du chauffeur
    state = {
        'drive_today': 0.0,
        'window_start': current_time,
        'drive_since_break': 0.0,
        'miles_since_fuel': 0.0,
        'cycle_remaining': CYCLE_LIMIT - float(currentCycleUsed)
    }

    def add_event(status, duration_hrs, label):
        nonlocal current_time
        end_time = current_time + timedelta(hours=duration_hrs)
        events.append({
            'status': status,
            'start_time': current_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration': round(duration_hrs, 2),
            'label': label
        })
        current_time = end_time

    # --- ÉTAPE 1 : ALLER AU PICKUP ---
    drive_hrs = dist_to_pickup / AVG_SPEED
    add_event('DRIVING', drive_hrs, f"Route vers Pickup: {currentLocation}")
    state['drive_today'] += drive_hrs
    state['drive_since_break'] += drive_hrs
    state['cycle_remaining'] -= drive_hrs

    # --- ÉTAPE 2 : CHARGEMENT (ASSUMPTION: 1H) ---
    add_event('ON_DUTY', 1.0, f"Chargement à {pickupLocation}")
    state['cycle_remaining'] -= 1.0

    # --- ÉTAPE 3 : TRAJET VERS DESTINATION ---
    remaining_dist = dist_to_dropoff
    
    while remaining_dist > 0:
        # Check repos 10h (Limite conduite 11h ou fenêtre 14h)
        time_in_window = (current_time - state['window_start']).total_seconds() / 3600
        
        if state['drive_today'] >= DRIVING_LIMIT or time_in_window >= WINDOW_LIMIT:
            add_event('SLEEPER', REST_DURATION, "Repos obligatoire 10h")
            state['drive_today'] = 0.0
            state['drive_since_break'] = 0.0
            state['window_start'] = current_time
            continue

        # Check pause 30min (8h de conduite)
        if state['drive_since_break'] >= BREAK_THRESHOLD:
            add_event('OFF_DUTY', BREAK_DURATION, "Pause obligatoire 30min")
            state['drive_since_break'] = 0.0
            continue

        # Check Fueling (1000 miles)
        if state['miles_since_fuel'] >= FUEL_THRESHOLD:
            add_event('ON_DUTY', FUEL_DURATION, "Plein d'essence")
            state['miles_since_fuel'] = 0.0
            state['cycle_remaining'] -= FUEL_DURATION
            continue

        # Check Cycle 70h
        if state['cycle_remaining'] <= 0.5: # Marge de sécurité
            add_event('OFF_DUTY', 34.0, "Reset du Cycle (34h)")
            state['cycle_remaining'] = 70.0
            continue

        # Calculer le segment de conduite suivant
        segment_drive_hrs = min(
            DRIVING_LIMIT - state['drive_today'],
            WINDOW_LIMIT - time_in_window,
            BREAK_THRESHOLD - state['drive_since_break'],
            state['cycle_remaining'],
            remaining_dist / AVG_SPEED
        )

        if segment_drive_hrs <= 0: # Éviter boucle infinie
            state['drive_today'] = DRIVING_LIMIT
            continue

        add_event('DRIVING', segment_drive_hrs, "En route vers destination")
        
        miles_covered = segment_drive_hrs * AVG_SPEED
        remaining_dist -= miles_covered
        state['miles_since_fuel'] += miles_covered
        state['drive_today'] += segment_drive_hrs
        state['drive_since_break'] += segment_drive_hrs
        state['cycle_remaining'] -= segment_drive_hrs

    # --- ÉTAPE 4 : DÉCHARGEMENT (ASSUMPTION: 1H) ---
    add_event('ON_DUTY', 1.0, f"Déchargement à {dropoffLocation}")

    return {
        "summary": {
            "total_miles": round(total_miles, 2),
            "total_days": len(set(e['start_time'].split('T')[0] for e in events)),
            "arrival_time": current_time.isoformat()
        },
        "events": events,
        "route": full_route_geometry
    }
