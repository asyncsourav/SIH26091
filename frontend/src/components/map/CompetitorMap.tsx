import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { CompetitorPin } from "@/types";

// Leaflet's default marker icons reference image files Vite doesn't resolve
// automatically — point them at the CDN copies instead of bundling assets.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export function CompetitorMap({
  centerLat,
  centerLon,
  pins
}: {
  centerLat: number;
  centerLon: number;
  pins: CompetitorPin[];
}) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border border-ink-700">
      <MapContainer center={[centerLat, centerLon]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={import.meta.env.VITE_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
        <Marker position={[centerLat, centerLon]} icon={defaultIcon}>
          <Popup>Your location</Popup>
        </Marker>
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lon]} icon={defaultIcon}>
            <Popup>
              {pin.name} ({pin.tag})
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
