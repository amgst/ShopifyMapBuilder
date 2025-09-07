import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapBuilder } from "@/hooks/use-map-builder";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface InteractiveMapProps {
  className?: string;
}

export default function InteractiveMap({ className }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const { state, updateLocation } = useMapBuilder();

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [state.location?.lat || 48.8566, state.location?.lng || 2.3522],
      zoom: state.location?.zoom || 12,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add initial marker
    if (state.location) {
      const marker = L.marker([state.location.lat, state.location.lng]).addTo(map);
      markerRef.current = marker;
    }

    // Handle map events
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      updateLocation({
        lat,
        lng,
        zoom: map.getZoom(),
        searchQuery: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });

      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
    });

    map.on("zoomend", () => {
      if (state.location) {
        updateLocation({
          ...state.location,
          zoom: map.getZoom(),
        });
      }
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      if (state.location) {
        updateLocation({
          ...state.location,
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
        });
      }
    });

    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map when location changes from external source
  useEffect(() => {
    if (!leafletMapRef.current || !state.location) return;

    const map = leafletMapRef.current;
    const currentCenter = map.getCenter();
    
    // Only update if the location has actually changed significantly
    if (
      Math.abs(currentCenter.lat - state.location.lat) > 0.001 ||
      Math.abs(currentCenter.lng - state.location.lng) > 0.001 ||
      Math.abs(map.getZoom() - state.location.zoom) > 0.1
    ) {
      map.setView([state.location.lat, state.location.lng], state.location.zoom);
      
      // Update marker
      if (markerRef.current) {
        markerRef.current.setLatLng([state.location.lat, state.location.lng]);
      } else {
        markerRef.current = L.marker([state.location.lat, state.location.lng]).addTo(map);
      }
    }
  }, [state.location]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className}`}
      data-testid="interactive-map"
    />
  );
}