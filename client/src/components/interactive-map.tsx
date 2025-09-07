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

export default function InteractiveMap({ className }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const { state, updateLocation } = useMapBuilder();
  const [currentTileSource, setCurrentTileSource] = useState<string>('voyager');

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
          preload: 1,
          tilePixelRatio: window.devicePixelRatio || 1
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
          preload: 1,
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
          preload: 1,
          tilePixelRatio: window.devicePixelRatio || 1
        })
      });
      
      // Option 2: OpenStreetMap (fallback for immediate display)
      const osmFallback = new TileLayer({
        source: new OSM({
          maxZoom: 19,
          crossOrigin: 'anonymous',
          transition: 0,
          preload: 1
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
    map.getLayers().getArray()[0].getSource()?.on('tileloaderror', (event) => {
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

    olMapRef.current = map;

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

  // Function to switch tile sources
  const switchTileSource = (newSource: string) => {
    if (!olMapRef.current) return;
    
    setCurrentTileSource(newSource);
    
    const map = olMapRef.current;
    const layers = map.getLayers();
    const currentTileLayer = layers.item(0);
    
    // Remove current tile layer
    layers.removeAt(0);
    
    // Add new tile layer
    layers.insertAt(0, createHighQualityTileLayer(newSource));
    
    console.log(`Switched to ${newSource} tile source for better quality`);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Quality Switcher */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur rounded-lg shadow-md p-2 space-y-1">
        <div className="text-xs font-semibold text-gray-700 mb-1">Map Quality</div>
        <div className="flex flex-col gap-1">
          <Button
            variant={currentTileSource === 'voyager' ? "default" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => switchTileSource('voyager')}
          >
            Voyager ⭐
          </Button>
          <Button
            variant={currentTileSource === 'esri' ? "default" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => switchTileSource('esri')}
          >
            ESRI HD
          </Button>
          <Button
            variant={currentTileSource === 'positron' ? "default" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => switchTileSource('positron')}
          >
            Clean B&W
          </Button>
          <Button
            variant={currentTileSource === 'stamen' ? "default" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => switchTileSource('stamen')}
          >
            Stamen B&W
          </Button>
          <Button
            variant={currentTileSource === 'osm' ? "default" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => switchTileSource('osm')}
          >
            Basic OSM
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentTileSource === 'voyager' && 'Best overall quality'}
          {currentTileSource === 'esri' && 'Google Maps-like'}
          {currentTileSource === 'positron' && 'Clean for engraving'}
          {currentTileSource === 'stamen' && 'True B&W for engraving'}
          {currentTileSource === 'osm' && 'Basic quality'}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        data-testid="interactive-map"
      />
    </div>
  );
}