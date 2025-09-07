import { useState } from "react";
import { Search, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapBuilder } from "@/hooks/use-map-builder";
import InteractiveMap from "./interactive-map";

const popularPlaces = [
  { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
];

export default function LocationPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const { state, updateLocation } = useMapBuilder();

  const handleLocationSelect = (place: typeof popularPlaces[0]) => {
    updateLocation({
      lat: place.lat,
      lng: place.lng,
      zoom: 12,
      searchQuery: place.name,
    });
    setSearchQuery(place.name);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement geocoding search
    console.log("Searching for:", searchQuery);
  };

  return (
    <div className="h-full p-6" data-testid="location-panel">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Location</h2>
        <p className="text-muted-foreground text-sm">
          You can search, drag/drop and zoom on the map to get the exact position you want on your engraved map.
        </p>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">SEARCH FOR A PLACE</h3>
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for a location, street or landmark"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="location-search"
            />
          </div>
        </form>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Navigation className="h-4 w-4 mr-2" />
          Use your current position
        </Button>
      </div>

      {/* Popular Places */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">OTHER POPULAR PLACES</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These are some of the most popular places among customers and staff, and worth checking out if you want your map to look great.
        </p>
        
        <div className="space-y-2">
          {popularPlaces.map((place) => (
            <Button
              key={place.name}
              variant="ghost"
              className="w-full justify-start p-3 h-auto"
              onClick={() => handleLocationSelect(place)}
              data-testid={`location-${place.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              <MapPin className="h-4 w-4 mr-3 flex-shrink-0" />
              <div className="font-medium">{place.name}</div>
            </Button>
          ))}
        </div>
      </div>


      {/* Current Location Display */}
      {state.location && (
        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium mb-2">Current Selection</h4>
          <p className="text-sm text-muted-foreground">
            {state.location.searchQuery || `${state.location.lat.toFixed(4)}, ${state.location.lng.toFixed(4)}`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Zoom: {state.location.zoom}x
          </p>
        </div>
      )}
    </div>
  );
}
