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
  Navigation,
  Plus,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InteractiveMap from "@/components/interactive-map";

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
  const { state, updateTextPosition, updateIconPosition, updateIconSize, updateCompassPosition, updateMapZoom } = useMapBuilder();
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    type: 'text' | 'icon' | 'compass' | null;
    id: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialSize?: number;
  }>({
    isDragging: false,
    isResizing: false,
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
      isResizing: false,
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    });
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    iconId: string,
    currentSize: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      isDragging: false,
      isResizing: true,
      type: 'icon',
      id: iconId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: 0,
      initialY: 0,
      initialSize: currentSize,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!dragState.isDragging && !dragState.isResizing) || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    if (dragState.isResizing && dragState.type === 'icon' && dragState.id && dragState.initialSize) {
      // Handle resize
      const resizeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const resizeFactor = deltaX > 0 ? 1 : -1; // Resize direction based on X movement
      const newSize = Math.max(16, Math.min(100, dragState.initialSize + resizeFactor * resizeDistance * 0.2));
      updateIconSize(dragState.id, newSize);
    } else if (dragState.isDragging) {
      // Handle drag
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
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      isResizing: false,
      type: null,
      id: null,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const currentZoom = state.location?.zoom || 12;
    const zoomDelta = e.deltaY > 0 ? -0.5 : 0.5;
    const newZoom = Math.max(1, Math.min(20, currentZoom + zoomDelta));
    updateMapZoom(newZoom);
  };

  const handleZoomIn = () => {
    const currentZoom = state.location?.zoom || 12;
    updateMapZoom(Math.min(20, currentZoom + 1));
  };

  const handleZoomOut = () => {
    const currentZoom = state.location?.zoom || 12;
    updateMapZoom(Math.max(1, currentZoom - 1));
  };

  return (
    <div className="flex-1 bg-muted/30 p-6 overflow-auto" data-testid="preview-panel">
      <div className="max-w-2xl mx-auto">

        {/* Product Preview */}
        <div className="relative flex justify-center mb-6">
          {/* Material Chart with Top and Bottom Bars */}
          <div className="w-[70%] relative">
            {/* Top Material Bar */}
            <div 
              className={`
                w-full h-4 shadow-sm
                ${state.productSettings?.material === 'oak' ? 'bg-gradient-to-br from-amber-700 to-amber-800' : ''}
                ${state.productSettings?.material === 'walnut' ? 'bg-gradient-to-br from-amber-900 to-stone-900' : ''}
                ${state.productSettings?.material === 'bamboo' ? 'bg-gradient-to-br from-yellow-200 to-amber-400' : ''}
                ${state.productSettings?.material === 'aluminum' ? 'bg-gradient-to-br from-slate-300 to-slate-500' : ''}
                ${state.productSettings?.material === 'brass' ? 'bg-gradient-to-br from-yellow-700 to-amber-600' : ''}
                ${!state.productSettings?.material ? 'bg-gradient-to-br from-amber-700 to-amber-800' : ''}
              `}
            />
            
            {/* Product Base */}
            <div 
              className={`
                w-full relative overflow-hidden
                ${state.productSettings?.material === 'oak' ? 'bg-gradient-to-br from-amber-600 to-amber-800' : ''}
                ${state.productSettings?.material === 'walnut' ? 'bg-gradient-to-br from-amber-800 to-stone-900' : ''}
                ${state.productSettings?.material === 'bamboo' ? 'bg-gradient-to-br from-yellow-100 to-amber-300' : ''}
                ${state.productSettings?.material === 'aluminum' ? 'bg-gradient-to-br from-slate-200 to-slate-400' : ''}
                ${state.productSettings?.material === 'brass' ? 'bg-gradient-to-br from-yellow-600 to-amber-700' : ''}
                ${!state.productSettings?.material ? 'bg-gradient-to-br from-amber-600 to-amber-800' : ''}
                ${state.productSettings?.shape === 'circle' ? 'aspect-square' : ''}
                ${state.productSettings?.shape === 'rectangle' ? 'aspect-[2/3]' : ''}
                ${state.productSettings?.shape === 'stick' ? 'aspect-[5/6]' : ''}
                ${state.productSettings?.shape === 'twig' ? 'aspect-[1/3]' : ''}
                ${!state.productSettings?.shape && 'aspect-[2/3]'}
              `}
            >
              {/* Map Engraved Area */}
              <div 
                ref={previewRef}
                data-testid="map-preview-area"
                className={`absolute inset-0 overflow-hidden ${
                  state.productSettings?.shape === 'circle' ? 'rounded-full' : ''
                }`}
                style={{ backgroundColor: '#e6e6e6' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* Interactive Map - Users can click to select locations */}
                <div className="w-full h-full relative">
                  {/* Map with black/white engraving style filter */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      filter: 'grayscale(100%) contrast(150%) brightness(110%)',
                      mixBlendMode: 'multiply'
                    }}
                  >
                    <InteractiveMap className="w-full h-full" />
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
                      className="absolute font-medium cursor-move hover:bg-black/10 rounded px-1"
                      style={{
                        left: `${text.x}%`,
                        top: `${text.y}%`,
                        fontSize: `${Math.max(8, text.fontSize * 0.6)}px`,
                        fontFamily: text.fontFamily,
                        color: '#000000',
                        fontWeight: text.fontFamily.includes('Bold') ? 'bold' : 'normal',
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
                        className="absolute group"
                        style={{
                          left: `${icon.x}%`,
                          top: `${icon.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        data-testid={`draggable-icon-${icon.id}`}
                      >
                        {/* Icon */}
                        <div
                          className="cursor-move hover:bg-black/10 rounded p-1 relative"
                          onMouseDown={(e) => handleMouseDown(e, 'icon', icon.id, icon.x, icon.y)}
                        >
                          <IconComponent 
                            className="text-black"
                            style={{
                              filter: 'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)'
                            }}
                            size={Math.max(12, icon.size * 0.5)}
                          />
                          
                          {/* Resize Handle */}
                          <div
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                            onMouseDown={(e) => handleResizeStart(e, icon.id, icon.size)}
                            title="Drag to resize"
                          />
                        </div>
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
                          style={{
                            filter: 'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)'
                          }}
                          size={Math.max(16, state.customizations.compass.size * 0.5)}
                        />
                      </div>
                    );
                  })()}
                  
                  {/* Zoom Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 bg-white hover:bg-gray-50 shadow-md"
                      onClick={handleZoomIn}
                      title="Zoom in"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 bg-white hover:bg-gray-50 shadow-md"
                      onClick={handleZoomOut}
                      title="Zoom out"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Zoom Level Indicator */}
                  {state.location && (
                    <div className="absolute top-4 left-4 bg-black text-white px-2 py-1 rounded text-xs font-medium">
                      Zoom: {state.location.zoom.toFixed(1)}x
                    </div>
                  )}

                  {/* Coordinates */}
                  {state.location && (
                    <div className="absolute bottom-2 left-2 bg-black text-white px-1 py-0.5 rounded text-xs font-mono">
                      {state.location.lat.toFixed(4)}°N / {state.location.lng.toFixed(4)}°E
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Bottom Material Bar */}
            <div 
              className={`
                w-full h-4 
                ${state.productSettings?.material === 'wood' ? 'bg-gradient-to-br from-amber-800 to-amber-950' : 'bg-gradient-to-br from-gray-400 to-gray-600'}
                shadow-sm
              `}
            />
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

      </div>
    </div>
  );
}
