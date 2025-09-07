import { useEffect, useRef } from "react";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import 'ol/ol.css';
import { useMapBuilder } from "@/hooks/use-map-builder";

interface InteractiveMapProps {
  className?: string;
}

export default function InteractiveMap({ className }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const { state, updateLocation } = useMapBuilder();

  useEffect(() => {
    if (!mapRef.current || olMapRef.current) return;

    // Create marker layer
    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ff0000"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scale: 1.2,
        }),
      }),
    });
    markerLayerRef.current = markerLayer;

    // Initialize the map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([state.location?.lng || 2.3522, state.location?.lat || 48.8566]),
        zoom: state.location?.zoom || 12,
      }),
    });

    // Add initial marker
    if (state.location) {
      const marker = new Feature({
        geometry: new Point(fromLonLat([state.location.lng, state.location.lat])),
      });
      markerSource.addFeature(marker);
    }

    // Handle map click events
    map.on('click', (event) => {
      const coordinate = event.coordinate;
      const [lng, lat] = toLonLat(coordinate);
      
      updateLocation({
        lat,
        lng,
        zoom: map.getView().getZoom() || 12,
        searchQuery: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });

      // Update marker position
      markerSource.clear();
      const marker = new Feature({
        geometry: new Point(coordinate),
      });
      markerSource.addFeature(marker);
    });

    // Handle zoom and pan events
    map.getView().on('change:resolution', () => {
      if (state.location) {
        updateLocation({
          ...state.location,
          zoom: map.getView().getZoom() || 12,
        });
      }
    });

    map.getView().on('change:center', () => {
      const center = map.getView().getCenter();
      if (center && state.location) {
        const [lng, lat] = toLonLat(center);
        updateLocation({
          ...state.location,
          lat,
          lng,
          zoom: map.getView().getZoom() || 12,
        });
      }
    });

    olMapRef.current = map;

    return () => {
      if (olMapRef.current) {
        olMapRef.current.setTarget(undefined);
        olMapRef.current = null;
      }
    };
  }, []);

  // Update map when location changes from external source
  useEffect(() => {
    if (!olMapRef.current || !state.location || !markerLayerRef.current) return;

    const map = olMapRef.current;
    const view = map.getView();
    const currentCenter = view.getCenter();
    const targetCenter = fromLonLat([state.location.lng, state.location.lat]);
    
    // Only update if the location has actually changed significantly
    if (!currentCenter || 
        Math.abs(currentCenter[0] - targetCenter[0]) > 100 ||
        Math.abs(currentCenter[1] - targetCenter[1]) > 100 ||
        Math.abs((view.getZoom() || 12) - state.location.zoom) > 0.1) {
      
      view.animate({
        center: targetCenter,
        zoom: state.location.zoom,
        duration: 500,
      });
      
      // Update marker
      const markerSource = markerLayerRef.current.getSource();
      if (markerSource) {
        markerSource.clear();
        const marker = new Feature({
          geometry: new Point(targetCenter),
        });
        markerSource.addFeature(marker);
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