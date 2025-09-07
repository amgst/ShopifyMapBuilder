import { useMapBuilder } from "@/hooks/use-map-builder";
import { useState, useRef } from "react";
import { 
  Home, 
  Heart, 
  Star, 
  MapPin, 
  Network, 
  Mountain, 
  Anchor, 
  Plane,
  Compass,
  Navigation
} from "lucide-react";

// Icon mapping for proper display
const iconComponents = {
  home: Home,
  heart: Heart,
  star: Star,
  pin: MapPin,
  tree: Network,
  mountain: Mountain,
  anchor: Anchor,
  plane: Plane,
};

const compassComponents = {
  classic: Compass,
  modern: Navigation,
  arrow: Navigation,
};

export default function PreviewPanel() {
  const { state, updateTextPosition, updateIconPosition, updateCompassPosition } = useMapBuilder();
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    type: 'text' | 'icon' | 'compass' | null;
    id: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    isDragging: false,
    type: null,
    id: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const previewRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'text' | 'icon' | 'compass',
    id: string,
    currentX: number,
    currentY: number
  ) => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    // Convert pixel movement to percentage
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;
    
    const newX = Math.max(0, Math.min(100, dragState.initialX + deltaXPercent));
    const newY = Math.max(0, Math.min(100, dragState.initialY + deltaYPercent));

    if (dragState.type === 'text' && dragState.id) {
      updateTextPosition(dragState.id, newX, newY);
    } else if (dragState.type === 'icon' && dragState.id) {
      updateIconPosition(dragState.id, newX, newY);
    } else if (dragState.type === 'compass') {
      updateCompassPosition(newX, newY);
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      type: null,
      id: null,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
    });
  };

  return (
    <div className="flex-1 bg-muted/30 p-6 overflow-auto" data-testid="preview-panel">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Live Preview</h2>
          <p className="text-muted-foreground">
            See how your custom engraved map will look on the selected product.
          </p>
        </div>

        {/* Product Preview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="relative">
            {/* Product Base */}
            <div 
              className={`
                w-full relative overflow-hidden
                ${state.productSettings?.material === 'wood' ? 'bg-gradient-to-br from-amber-700 to-amber-900' : 'bg-gradient-to-br from-gray-300 to-gray-500'}
                ${state.productSettings?.shape === 'circle' ? 'rounded-full aspect-square' : 'rounded-lg'}
                ${state.productSettings?.shape === 'rectangle' ? 'aspect-[3/2]' : ''}
                ${state.productSettings?.shape === 'stick' ? 'aspect-[6/5]' : ''}
                ${state.productSettings?.shape === 'twig' ? 'aspect-[3/1]' : ''}
                ${!state.productSettings?.shape && 'aspect-[3/2]'}
              `}
            >
              {/* Map Engraved Area */}
              <div 
                ref={previewRef}
                className={`absolute inset-4 bg-white shadow-inner overflow-hidden ${
                  state.productSettings?.shape === 'circle' ? 'rounded-full' : 'rounded'
                }`}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Map Background */}
                <div className="w-full h-full relative bg-gray-100">
                  {/* Simplified map representation */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
                    {/* River/water simulation */}
                    <div className="absolute top-1/2 left-0 w-full h-8 bg-black transform -rotate-12 opacity-20"></div>
                    <div className="absolute top-1/3 right-0 w-32 h-32 bg-black rounded-full opacity-10"></div>
                  </div>
                  
                  {/* Location indicator */}
                  {state.location && (
                    <div className="absolute top-4 left-4 bg-black text-white px-2 py-1 rounded text-xs font-medium">
                      {state.location.searchQuery || 'Custom Location'}
                    </div>
                  )}
                  
                  {/* Custom texts */}
                  {state.customizations.texts.map((text) => (
                    <div
                      key={text.id}
                      className="absolute text-black font-medium cursor-move hover:bg-black/10 rounded px-1"
                      style={{
                        left: `${text.x}%`,
                        top: `${text.y}%`,
                        fontSize: `${Math.max(8, text.fontSize * 0.5)}px`,
                        fontFamily: text.fontFamily,
                        color: text.color,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'text', text.id, text.x, text.y)}
                      data-testid={`draggable-text-${text.id}`}
                    >
                      {text.content}
                    </div>
                  ))}
                  
                  {/* Icons */}
                  {state.customizations.icons.map((icon) => {
                    const IconComponent = iconComponents[icon.type as keyof typeof iconComponents] || MapPin;
                    return (
                      <div
                        key={icon.id}
                        className="absolute cursor-move hover:bg-black/10 rounded p-1"
                        style={{
                          left: `${icon.x}%`,
                          top: `${icon.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'icon', icon.id, icon.x, icon.y)}
                        data-testid={`draggable-icon-${icon.id}`}
                      >
                        <IconComponent 
                          className="text-black"
                          size={Math.max(12, icon.size * 0.5)}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Compass */}
                  {state.customizations.compass && (() => {
                    const CompassComponent = compassComponents[state.customizations.compass.type as keyof typeof compassComponents] || Compass;
                    return (
                      <div
                        className="absolute cursor-move hover:bg-black/10 rounded-full p-2"
                        style={{
                          left: `${state.customizations.compass.x}%`,
                          top: `${state.customizations.compass.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'compass', 'compass', state.customizations.compass!.x, state.customizations.compass!.y)}
                        data-testid="draggable-compass"
                      >
                        <CompassComponent 
                          className="text-black"
                          size={Math.max(16, state.customizations.compass.size * 0.5)}
                        />
                      </div>
                    );
                  })()}
                  
                  {/* Coordinates */}
                  {state.location && (
                    <div className="absolute bottom-2 left-2 bg-black text-white px-1 py-0.5 rounded text-xs font-mono">
                      {state.location.lat.toFixed(4)}°N / {state.location.lng.toFixed(4)}°E
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Controls */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium mb-2">Material</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {state.productSettings?.material || 'Wood'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium mb-2">Shape</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {state.productSettings?.shape || 'Rectangle'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium mb-2">Finish</h4>
            <p className="text-sm text-muted-foreground">Laser Engraved</p>
          </div>
        </div>

        {/* Alternative Product Views */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Other Product Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="w-full h-32 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full mb-2 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full shadow-inner"></div>
              </div>
              <p className="text-sm font-medium">Ornament</p>
              <p className="text-xs text-muted-foreground">$29.99</p>
            </div>
            
            <div className="text-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="w-full h-32 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg mb-2 flex items-center justify-center">
                <div className="w-16 h-24 bg-white rounded shadow-inner"></div>
              </div>
              <p className="text-sm font-medium">Candle</p>
              <p className="text-xs text-muted-foreground">$39.99</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
