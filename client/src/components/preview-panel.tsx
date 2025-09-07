import { useMapBuilder } from "@/hooks/use-map-builder";

export default function PreviewPanel() {
  const { state } = useMapBuilder();

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
            <div className={`
              w-full aspect-[2.62/1] relative rounded-lg overflow-hidden
              ${state.productSettings?.material === 'wood' ? 'bg-gradient-to-br from-amber-700 to-amber-900' : 'bg-gradient-to-br from-gray-300 to-gray-500'}
            `}>
              {/* Map Engraved Area */}
              <div className="absolute inset-4 bg-white rounded shadow-inner overflow-hidden">
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
                      className="absolute text-black font-medium"
                      style={{
                        left: `${text.x}%`,
                        top: `${text.y}%`,
                        fontSize: `${Math.max(8, text.fontSize * 0.5)}px`,
                        fontFamily: text.fontFamily,
                        color: text.color,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {text.content}
                    </div>
                  ))}
                  
                  {/* Icons */}
                  {state.customizations.icons.map((icon) => (
                    <div
                      key={icon.id}
                      className="absolute w-4 h-4 bg-black rounded-sm"
                      style={{
                        left: `${icon.x}%`,
                        top: `${icon.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
                  
                  {/* Compass */}
                  {state.customizations.compass && (
                    <div
                      className="absolute w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs"
                      style={{
                        left: `${state.customizations.compass.x}%`,
                        top: `${state.customizations.compass.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      N
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
