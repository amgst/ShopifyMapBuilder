import { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { generateId } from "@/lib/map-utils";

interface Location {
  lat: number;
  lng: number;
  zoom: number;
  searchQuery?: string;
}

interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}

interface IconElement {
  id: string;
  type: string;
  x: number;
  y: number;
  size: number;
}

interface CompassElement {
  type: string;
  x: number;
  y: number;
  size: number;
}

interface ProductSettings {
  shape: 'rectangle' | 'circle' | 'stick' | 'twig';
  size: string;
  material: string;
  aspectRatio: number;
}

interface Customizations {
  texts: TextElement[];
  icons: IconElement[];
  compass?: CompassElement;
}

interface MapBuilderState {
  location?: Location;
  customizations: Customizations;
  productSettings?: ProductSettings;
}

type MapBuilderAction =
  | { type: 'UPDATE_LOCATION'; payload: Location }
  | { type: 'ADD_TEXT'; payload: Omit<TextElement, 'id'> }
  | { type: 'REMOVE_TEXT'; payload: string }
  | { type: 'UPDATE_TEXT_POSITION'; payload: { id: string; x: number; y: number } }
  | { type: 'UPDATE_TEXT_STYLE'; payload: { id: string; fontSize?: number; fontFamily?: string; color?: string } }
  | { type: 'ADD_ICON'; payload: Omit<IconElement, 'id'> }
  | { type: 'REMOVE_ICON'; payload: string }
  | { type: 'UPDATE_ICON_POSITION'; payload: { id: string; x: number; y: number } }
  | { type: 'UPDATE_ICON_SIZE'; payload: { id: string; size: number } }
  | { type: 'SET_COMPASS'; payload?: CompassElement }
  | { type: 'UPDATE_COMPASS_POSITION'; payload: { x: number; y: number } }
  | { type: 'UPDATE_PRODUCT_SETTINGS'; payload: ProductSettings }
  | { type: 'UPDATE_MAP_ZOOM'; payload: number }
  | { type: 'SET_AUTO_LOCATION_TEXT'; payload: { city: string; country: string; coordinates: string } }
  | { type: 'RESET_STATE' };

const initialState: MapBuilderState = {
  location: {
    lat: 48.8566,
    lng: 2.3522,
    zoom: 12,
    searchQuery: "Paris, France"
  },
  customizations: {
    texts: [],
    icons: [],
  },
  productSettings: {
    shape: 'rectangle',
    size: 'standard',
    material: 'wood',
    aspectRatio: 2.62,
  },
};

function mapBuilderReducer(state: MapBuilderState, action: MapBuilderAction): MapBuilderState {
  switch (action.type) {
    case 'UPDATE_LOCATION':
      return {
        ...state,
        location: action.payload,
      };

    case 'ADD_TEXT':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          texts: [
            ...state.customizations.texts,
            { ...action.payload, id: generateId() },
          ],
        },
      };

    case 'REMOVE_TEXT':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          texts: state.customizations.texts.filter(text => text.id !== action.payload),
        },
      };

    case 'ADD_ICON':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          icons: [
            ...state.customizations.icons,
            { ...action.payload, id: generateId() },
          ],
        },
      };

    case 'REMOVE_ICON':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          icons: state.customizations.icons.filter(icon => icon.id !== action.payload),
        },
      };

    case 'UPDATE_TEXT_POSITION':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          texts: state.customizations.texts.map(text =>
            text.id === action.payload.id
              ? { ...text, x: action.payload.x, y: action.payload.y }
              : text
          ),
        },
      };

    case 'UPDATE_TEXT_STYLE':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          texts: state.customizations.texts.map(text =>
            text.id === action.payload.id
              ? { 
                  ...text, 
                  ...(action.payload.fontSize !== undefined && { fontSize: action.payload.fontSize }),
                  ...(action.payload.fontFamily !== undefined && { fontFamily: action.payload.fontFamily }),
                  ...(action.payload.color !== undefined && { color: action.payload.color }),
                }
              : text
          ),
        },
      };

    case 'UPDATE_ICON_POSITION':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          icons: state.customizations.icons.map(icon =>
            icon.id === action.payload.id
              ? { ...icon, x: action.payload.x, y: action.payload.y }
              : icon
          ),
        },
      };

    case 'UPDATE_ICON_SIZE':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          icons: state.customizations.icons.map(icon =>
            icon.id === action.payload.id
              ? { ...icon, size: Math.max(16, Math.min(100, action.payload.size)) }
              : icon
          ),
        },
      };

    case 'UPDATE_COMPASS_POSITION':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          compass: state.customizations.compass
            ? { ...state.customizations.compass, x: action.payload.x, y: action.payload.y }
            : undefined,
        },
      };

    case 'SET_COMPASS':
      return {
        ...state,
        customizations: {
          ...state.customizations,
          compass: action.payload,
        },
      };

    case 'UPDATE_PRODUCT_SETTINGS':
      return {
        ...state,
        productSettings: action.payload,
      };

    case 'UPDATE_MAP_ZOOM':
      return {
        ...state,
        location: state.location
          ? { ...state.location, zoom: Math.max(1, Math.min(20, action.payload)) }
          : undefined,
      };

    case 'SET_AUTO_LOCATION_TEXT':
      // Remove existing location texts and add new ones
      const filteredTexts = state.customizations.texts.filter(text => 
        !text.content.includes('°N') && 
        !text.content.includes('°E') &&
        text.id !== 'auto-city' &&
        text.id !== 'auto-country' &&
        text.id !== 'auto-coordinates'
      );
      
      const newLocationTexts: TextElement[] = [];
      
      // Add city text
      if (action.payload.city) {
        newLocationTexts.push({
          id: 'auto-city',
          content: action.payload.city,
          x: 50,
          y: 70,
          fontSize: 36,
          fontFamily: 'Inter Bold',
          color: 'black'
        });
      }
      
      // Add country text with decorative lines
      if (action.payload.country) {
        newLocationTexts.push({
          id: 'auto-country',
          content: `——— ${action.payload.country} ———`,
          x: 50,
          y: 78,
          fontSize: 24,
          fontFamily: 'Inter Bold',
          color: 'black'
        });
      }
      
      // Add coordinates text
      if (action.payload.coordinates) {
        newLocationTexts.push({
          id: 'auto-coordinates',
          content: action.payload.coordinates,
          x: 50,
          y: 85,
          fontSize: 14,
          fontFamily: 'Inter Regular',
          color: 'black'
        });
      }
      
      return {
        ...state,
        customizations: {
          ...state.customizations,
          texts: [...filteredTexts, ...newLocationTexts],
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

interface MapBuilderContextType {
  state: MapBuilderState;
  updateLocation: (location: Location) => void;
  addText: (text: Omit<TextElement, 'id'>) => void;
  removeText: (id: string) => void;
  updateTextPosition: (id: string, x: number, y: number) => void;
  updateTextStyle: (id: string, fontSize?: number, fontFamily?: string, color?: string) => void;
  addIcon: (icon: Omit<IconElement, 'id'>) => void;
  removeIcon: (id: string) => void;
  updateIconPosition: (id: string, x: number, y: number) => void;
  updateIconSize: (id: string, size: number) => void;
  setCompass: (compass?: CompassElement) => void;
  updateCompassPosition: (x: number, y: number) => void;
  updateProductSettings: (settings: ProductSettings) => void;
  updateMapZoom: (zoom: number) => void;
  setAutoLocationText: (locationData: { city: string; country: string; coordinates: string }) => void;
  resetState: () => void;
}

const MapBuilderContext = createContext<MapBuilderContextType | undefined>(undefined);

export function MapBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mapBuilderReducer, initialState);

  const setAutoLocationText = (locationData: { city: string; country: string; coordinates: string }) => {
    dispatch({ type: 'SET_AUTO_LOCATION_TEXT', payload: locationData });
  };

  // Fetch location data for initial location on mount
  useEffect(() => {
    if (state.location) {
      const fetchInitialLocationData = async () => {
        try {
          const response = await fetch(`/api/reverse-geocode?lat=${state.location!.lat}&lng=${state.location!.lng}`);
          if (response.ok) {
            const locationData = await response.json();
            console.log('Initial location data received:', locationData);
            setAutoLocationText({
              city: locationData.city,
              country: locationData.country,
              coordinates: locationData.coordinates
            });
          }
        } catch (error) {
          console.error('Failed to fetch initial location details:', error);
        }
      };
      
      fetchInitialLocationData();
    }
  }, []); // Empty dependency array means this runs once on mount

  const updateLocation = async (location: Location) => {
    dispatch({ type: 'UPDATE_LOCATION', payload: location });
    
    // Automatically fetch and set location text
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${location.lat}&lng=${location.lng}`);
      if (response.ok) {
        const locationData = await response.json();
        console.log('Location data received:', locationData);
        setAutoLocationText({
          city: locationData.city,
          country: locationData.country,
          coordinates: locationData.coordinates
        });
      }
    } catch (error) {
      console.error('Failed to fetch location details:', error);
    }
  };

  const addText = (text: Omit<TextElement, 'id'>) => {
    dispatch({ type: 'ADD_TEXT', payload: text });
  };

  const removeText = (id: string) => {
    dispatch({ type: 'REMOVE_TEXT', payload: id });
  };

  const addIcon = (icon: Omit<IconElement, 'id'>) => {
    dispatch({ type: 'ADD_ICON', payload: icon });
  };

  const removeIcon = (id: string) => {
    dispatch({ type: 'REMOVE_ICON', payload: id });
  };

  const updateTextPosition = (id: string, x: number, y: number) => {
    dispatch({ type: 'UPDATE_TEXT_POSITION', payload: { id, x, y } });
  };

  const updateTextStyle = (id: string, fontSize?: number, fontFamily?: string, color?: string) => {
    dispatch({ type: 'UPDATE_TEXT_STYLE', payload: { id, fontSize, fontFamily, color } });
  };

  const updateIconPosition = (id: string, x: number, y: number) => {
    dispatch({ type: 'UPDATE_ICON_POSITION', payload: { id, x, y } });
  };

  const updateIconSize = (id: string, size: number) => {
    dispatch({ type: 'UPDATE_ICON_SIZE', payload: { id, size } });
  };

  const setCompass = (compass?: CompassElement) => {
    dispatch({ type: 'SET_COMPASS', payload: compass });
  };

  const updateCompassPosition = (x: number, y: number) => {
    dispatch({ type: 'UPDATE_COMPASS_POSITION', payload: { x, y } });
  };

  const updateProductSettings = (settings: ProductSettings) => {
    dispatch({ type: 'UPDATE_PRODUCT_SETTINGS', payload: settings });
  };

  const updateMapZoom = (zoom: number) => {
    dispatch({ type: 'UPDATE_MAP_ZOOM', payload: zoom });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value: MapBuilderContextType = {
    state,
    updateLocation,
    addText,
    removeText,
    updateTextPosition,
    updateTextStyle,
    addIcon,
    removeIcon,
    updateIconPosition,
    updateIconSize,
    setCompass,
    updateCompassPosition,
    updateProductSettings,
    updateMapZoom,
    setAutoLocationText,
    resetState,
  };

  return (
    <MapBuilderContext.Provider value={value}>
      {children}
    </MapBuilderContext.Provider>
  );
}

export function useMapBuilder() {
  const context = useContext(MapBuilderContext);
  if (context === undefined) {
    throw new Error('useMapBuilder must be used within a MapBuilderProvider');
  }
  return context;
}
