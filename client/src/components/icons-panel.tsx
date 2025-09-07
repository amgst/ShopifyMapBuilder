import { useState } from "react";
import { Compass, Navigation, Home, Heart, Star, MapPin, Network, Mountain, Anchor, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapBuilder } from "@/hooks/use-map-builder";
import { cn } from "@/lib/utils";

const compassTypes = [
  { id: "classic", icon: Compass, label: "Classic" },
  { id: "modern", icon: Navigation, label: "Modern" },
  { id: "arrow", icon: Navigation, label: "Arrow" },
];

const mapIcons = [
  { id: "home", icon: Home, label: "Home" },
  { id: "heart", icon: Heart, label: "Heart" },
  { id: "star", icon: Star, label: "Star" },
  { id: "pin", icon: MapPin, label: "Pin" },
  { id: "tree", icon: Network, label: "Network" },
  { id: "mountain", icon: Mountain, label: "Mountain" },
  { id: "anchor", icon: Anchor, label: "Anchor" },
  { id: "plane", icon: Plane, label: "Plane" },
];

export default function IconsPanel() {
  const [selectedCompass, setSelectedCompass] = useState<string | null>(null);
  const { state, addIcon, setCompass, removeIcon } = useMapBuilder();

  const handleCompassSelect = (compassType: string) => {
    setSelectedCompass(compassType);
    setCompass({
      type: compassType,
      x: 80, // Default position (bottom right)
      y: 80,
      size: 48,
    });
  };

  const handleIconAdd = (iconType: string) => {
    addIcon({
      type: iconType,
      x: 50, // Default center position
      y: 50,
      size: 32,
    });
  };

  return (
    <div className="h-full p-6" data-testid="icons-panel">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Icons & Compass</h2>
        <p className="text-muted-foreground text-sm">
          Add compass and custom icons to enhance your engraved map design.
        </p>
      </div>

      <div className="space-y-6">
        {/* Compass Section */}
        <div>
          <h3 className="font-medium mb-3">Compass</h3>
          <div className="grid grid-cols-3 gap-3">
            {compassTypes.map((compass) => {
              const Icon = compass.icon;
              const isSelected = selectedCompass === compass.id;
              
              return (
                <Button
                  key={compass.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "p-4 h-auto flex flex-col items-center space-y-2",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleCompassSelect(compass.id)}
                  data-testid={`compass-${compass.id}`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{compass.label}</span>
                </Button>
              );
            })}
          </div>
          {state.customizations.compass && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Compass added:</strong> {state.customizations.compass.type}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompass(undefined)}
                className="mt-2"
                data-testid="remove-compass"
              >
                Remove Compass
              </Button>
            </div>
          )}
        </div>

        {/* Map Icons Section */}
        <div>
          <h3 className="font-medium mb-3">Map Icons</h3>
          <div className="grid grid-cols-4 gap-3">
            {mapIcons.map((iconData) => {
              const Icon = iconData.icon;
              
              return (
                <Button
                  key={iconData.id}
                  variant="outline"
                  className="p-3 h-auto flex flex-col items-center space-y-1"
                  onClick={() => handleIconAdd(iconData.id)}
                  data-testid={`icon-${iconData.id}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{iconData.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Added Icons */}
        {state.customizations.icons.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Added Icons</h3>
            <div className="space-y-2">
              {state.customizations.icons.map((icon) => {
                const IconData = mapIcons.find(i => i.id === icon.type);
                const Icon = IconData?.icon || MapPin;
                
                return (
                  <div
                    key={icon.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                    data-testid={`icon-item-${icon.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm capitalize">{icon.type}</p>
                        <p className="text-xs text-muted-foreground">
                          Size: {icon.size}px • Position: {icon.x}, {icon.y}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIcon(icon.id)}
                      data-testid={`remove-icon-${icon.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
