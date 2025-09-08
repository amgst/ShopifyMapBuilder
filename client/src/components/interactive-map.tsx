import { useEffect, useRef, useState } from "react";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
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

interface InteractiveMapProps {
  className?: string;
}

// High-quality tile sources for professional printing
const createHighQualityTileLayer = (sourceType: string = 'voyager') => {
  // Option 1: CartoDB Voyager (High-quality, no token required)
  const cartoDBVoyager = new TileLayer({
    source: new XYZ({
      url: 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      maxZoom: 20,
      attributions: '© OpenStreetMap contributors, © CartoDB',
      crossOrigin: 'anonymous',
      // Enhanced tile loading for better quality
      transition: 0,
      tilePixelRatio: window.devicePixelRatio || 1,
      // Enable canvas export
      tileLoadFunction: function(tile: any, src: string) {
        const img = tile.getImage() as HTMLImageElement;
        img.crossOrigin = 'anonymous';
        img.src = src;
      }
    })
  });
  
  // Option 2: ESRI World Street Map (Google Maps-like quality)
  const esriStreetMap = new TileLayer({
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      attributions: '© Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, © OpenStreetMap contributors, and the GIS User Community',
      crossOrigin: 'anonymous',
      transition: 0,
      tilePixelRatio: window.devicePixelRatio || 1
    })
  });
  
  // Option 3: CartoDB Positron (Clean for engraving)
  const cartoDBPositron = new TileLayer({
    source: new XYZ({
      url: 'https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      maxZoom: 20,
      attributions: '© OpenStreetMap contributors, © CartoDB',
      crossOrigin: 'anonymous',
      transition: 0,
      tilePixelRatio: window.devicePixelRatio || 1,
      // Enable canvas export
      tileLoadFunction: function(tile: any, src: string) {
        const img = tile.getImage() as HTMLImageElement;
        img.crossOrigin = 'anonymous';
        img.src = src;
      }
    })
  });
  
  // Option 2: OpenStreetMap (fallback for immediate display)
  const osmFallback = new TileLayer({
    source: new OSM({
      maxZoom: 19,
      crossOrigin: 'anonymous',
      transition: 0,
      // Enable canvas export
      tileLoadFunction: function(tile: any, src: string) {
        const img = tile.getImage() as HTMLImageElement;
        img.crossOrigin = 'anonymous';
        img.src = src;
      }
    })
  });
  
  // Option 2b: Stamen Toner (black and white, perfect for engraving) - fallback
  const stamenToner = new TileLayer({
    source: new XYZ({
      url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png',
      maxZoom: 20,
      attributions: '© Stadia Maps, © Stamen Design, © OpenMapTiles, © OpenStreetMap contributors',
      crossOrigin: 'anonymous'
    })
  });
  
  // Return the selected tile source for testing different qualities
  switch (sourceType) {
    case 'esri':
      return esriStreetMap;
    case 'positron':
      return cartoDBPositron;
    case 'osm':
      return osmFallback;
    case 'stamen':
      return stamenToner;
    case 'voyager':
    default:
      return cartoDBVoyager;
  }
};

export default function InteractiveMap({ className }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const { state, updateLocation } = useMapBuilder();
  const [currentTileSource] = useState<string>('positron'); // Use Clean B&W as the best for engraving

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


    // Initialize the map with high-quality tiles
    console.log('Initializing OpenLayers map...');
    const map = new Map({
      target: mapRef.current,
      layers: [
        createHighQualityTileLayer(currentTileSource),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([state.location?.lng || 2.3522, state.location?.lat || 48.8566]),
        zoom: state.location?.zoom || 12,
        maxZoom: 20, // Higher max zoom for better detail
        minZoom: 3,
      }),
      // Enhanced rendering for high-quality output
      pixelRatio: window.devicePixelRatio || 1,
    });

    // Debug: Log when map is ready
    map.once('postrender', () => {
      console.log('Map rendered successfully!');
    });

    // Debug: Log any tile loading errors
    const firstLayer = map.getLayers().getArray()[0] as any;
    firstLayer.getSource()?.on('tileloaderror', (event: any) => {
      console.warn('Tile loading error:', event);
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

    // Note: Removed automatic view change handlers to prevent infinite update loops
    // The map will only update location when users explicitly click on it

    // Store map reference for external access and export functionality
    olMapRef.current = map;
    
    // Make map instance accessible to export function
    (window as any).olMap = map;
    (mapRef.current as any).__ol_map__ = map;

    return () => {
      if (olMapRef.current) {
        olMapRef.current.setTarget(undefined);
        olMapRef.current = null;
      }
    };
  }, [updateLocation]);

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

  // Automatically use the best tile source for engraving (no user selection needed)

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        data-testid="interactive-map"
      />
    </div>
  );
}