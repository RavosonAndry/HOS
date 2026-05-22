import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const TripMap = ({ routeCoords }) => {
  return (
    <MapContainer
      center={[39.82, -98.57]}
      zoom={4}
      className="h-[400px] w-full rounded-lg"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {routeCoords && <Polyline positions={routeCoords} color="blue" />}
    </MapContainer>
  );
};
