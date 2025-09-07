import { useEffect, useRef, useState } from "react";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import 'ol/ol.css';
import { useMapBuilder } from "@/hooks/use-map-builder";
import { Button } from "@/components/ui/button";

interface HighQualityMapProps {
  className?: string;
}

// High-quality map tile sources optimized for engraving
const MAP_SOURCES = {
  'stamen-toner': {
    name: 'Stamen Toner (B&W)',
    description: 'Black & white, perfect for engraving',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png',
    maxZoom: 20,
    attributions: '© Stadia Maps, © Stamen Design, © OpenMapTiles, © OpenStreetMap contributors',
    recommended: true
  },
  'cartodb-positron': {
    name: 'CartoDB Positron',
    description: 'Clean minimal style',
    url: 'https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    maxZoom: 20,
    attributions: '© OpenStreetMap contributors, © CartoDB',
    recommended: false
  },
  'esri-world': {
    name: 'ESRI World Imagery',
    description: 'High-resolution satellite imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attributions: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    recommended: false
  },
  'stamen-terrain': {
    name: 'Stamen Terrain',
    description: 'Detailed terrain with clear features',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
    maxZoom: 18,
    attributions: '© Stadia Maps, © Stamen Design, © OpenMapTiles, © OpenStreetMap contributors',
    recommended: false
  }
} as const;

export default function HighQualityMap({ className }: HighQualityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const { state, updateLocation } = useMapBuilder();
  const [currentMapSource, setCurrentMapSource] = useState<keyof typeof MAP_SOURCES>('stamen-toner');

  // Create tile layer based on selected source
  const createTileLayer = (sourceKey: keyof typeof MAP_SOURCES) => {
    const source = MAP_SOURCES[sourceKey];
    return new TileLayer({
      source: new XYZ({
        url: source.url,
        maxZoom: source.maxZoom,
        attributions: source.attributions,
        // Enhanced settings for high-quality rendering
        tilePixelRatio: window.devicePixelRatio || 1,
        crossOrigin: 'anonymous',
      })
    });
  };

  useEffect(() => {
    if (!mapRef.current || olMapRef.current) return;

    // Create marker layer with high-quality icon
    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#000000" stroke="#ffffff" stroke-width="1"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scale: 1.5,
        }),
      }),
    });
    markerLayerRef.current = markerLayer;

    // Initialize the map with enhanced settings for high-quality output
    const map = new Map({
      target: mapRef.current,
      layers: [
        createTileLayer(currentMapSource),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([state.location?.lng || 2.3522, state.location?.lat || 48.8566]),
        zoom: state.location?.zoom || 12,
        maxZoom: 20,
        minZoom: 3,
        // Enhanced for print quality
        constrainResolution: false, // Allow fractional zoom for smoother scaling
      }),
      // Enhanced rendering settings
      pixelRatio: Math.max(window.devicePixelRatio || 1, 2), // Force high DPI rendering
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

    olMapRef.current = map;

    return () => {
      if (olMapRef.current) {
        olMapRef.current.setTarget(undefined);
        olMapRef.current = null;
      }
    };
  }, [updateLocation, currentMapSource]);

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

  // Handle map source change
  const handleMapSourceChange = (sourceKey: keyof typeof MAP_SOURCES) => {
    if (!olMapRef.current) return;
    
    setCurrentMapSource(sourceKey);
    
    // Update the tile layer
    const map = olMapRef.current;
    const layers = map.getLayers();
    const tileLayer = layers.item(0); // First layer is the tile layer
    
    if (tileLayer) {
      layers.removeAt(0);
      layers.insertAt(0, createTileLayer(sourceKey));
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Style Selector */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-2 space-y-1">
        <div className="text-xs font-semibold text-gray-700 mb-2">Map Style</div>
        {Object.entries(MAP_SOURCES).map(([key, source]) => (
          <Button
            key={key}
            variant={currentMapSource === key ? "default" : "outline"}
            size="sm"
            className="w-full text-xs"
            onClick={() => handleMapSourceChange(key as keyof typeof MAP_SOURCES)}
          >
            {source.name}
            {source.recommended && <span className="ml-1 text-xs">⭐</span>}
          </Button>
        ))}
        <div className="text-xs text-gray-500 mt-2">
          {MAP_SOURCES[currentMapSource].description}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        data-testid="high-quality-map"
      />
    </div>
  );
}