import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Correction pour les icônes par défaut de Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Petit composant pour recentrer la carte quand les données arrivent
function RecenterMap({ coords }) {
  const map = useMap();
  if (coords && coords.length > 0) {
    map.fitBounds(coords);
  }
  return null;
}

const MapDisplay = ({ route, events }) => {
  const getMarkerColor = (status) => {
    if (status.includes("Pickup")) return "green";
    if (status.includes("Dropoff")) return "red";
    if (status === "SLEEPER") return "blue";
    if (status === "ON_DUTY" && status.includes("Fuel")) return "orange";
    return "gray";
  };

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      <MapContainer
        center={[39.82, -98.57]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {route && (
          <Polyline
            positions={route}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* On peut itérer sur les events pour placer des marqueurs sur les arrêts critiques */}
        {events &&
          events
            .filter((e) => e.status !== "DRIVING")
            .map((event, idx) => (
              // Note: En situation réelle, chaque event aurait ses propres coords GPS du backend
              <Marker key={idx} position={route[idx % route.length]}>
                <Popup>
                  <div className="font-sans">
                    <p className="font-bold text-blue-600">{event.status}</p>
                    <p className="text-sm">{event.label}</p>
                    <p className="text-xs text-gray-500">
                      Durée: {event.duration}h
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

        <RecenterMap coords={route} />
      </MapContainer>
    </div>
  );
};

export default MapDisplay;
