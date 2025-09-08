import { Button } from "@/components/ui/button";
import { Save, ShoppingCart, Download } from "lucide-react";
import { useMapBuilder } from "@/hooks/use-map-builder";
import { exportMapImage, downloadImage } from "@/utils/image-export";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PreviewPanelContent() {
  const { state } = useMapBuilder();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const sizeOptions = [
    { id: "standard", label: '12" × 8" Standard', price: 64.99 },
    { id: "large", label: '16" × 10" Large', price: 89.99 },
    { id: "compact", label: '8" × 6" Compact', price: 49.99 },
  ];

  const currentPrice = (() => {
    const currentSize = state.productSettings?.size || 'standard';
    const sizeInfo = sizeOptions.find(s => s.id === currentSize);
    return sizeInfo?.price || 64.99;
  })();

  const handleSaveDesign = async () => {
    setIsExporting(true);
    try {
      // Get the actual OpenLayers map instance
      const mapInstance = (window as any).olMap;
      
      if (!mapInstance) {
        throw new Error('Map not found. Please make sure the map is loaded.');
      }

      // Generate order ID (in real app, this would come from Shopify)
      const orderId = `Order${Date.now()}`;
      
      // Get map size for export
      const mapSize = mapInstance.getSize() || [800, 600];
      
      const result = await exportMapImage(
        mapInstance, 
        mapSize,
        orderId,
        `Order${orderId}`
      );

      // Download the image
      downloadImage(result.blob, result.filename);

      // Show success message
      toast({
        title: "Design Saved Successfully!",
        description: `Your map has been exported as ${result.filename} (${result.sizeInMB.toFixed(1)}MB)`,
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to save design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full p-6" data-testid="preview-panel-content">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Final Preview</h2>
        <p className="text-muted-foreground text-sm">
          Review your custom engraved map before finalizing your order.
        </p>
      </div>

      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-medium mb-2">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Product:</span>
              <span className="capitalize">
                {sizeOptions.find(s => s.id === (state.productSettings?.size || 'standard'))?.label} {state.productSettings?.material || 'Wood'} {state.productSettings?.shape || 'Rectangle'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span>{state.location?.searchQuery || 'Custom Location'}</span>
            </div>
            <div className="flex justify-between">
              <span>Customizations:</span>
              <span>
                {[
                  state.customizations.texts.length > 0 && 'Text',
                  state.customizations.icons.length > 0 && 'Icons',
                  state.customizations.compass && 'Compass'
                ].filter(Boolean).join(', ') || 'None'}
              </span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t border-border">
              <span>Total:</span>
              <span>${currentPrice}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-lg text-base transition-all duration-200" 
            size="lg"
            onClick={handleSaveDesign}
            disabled={isExporting}
            data-testid="save-design-button"
          >
            {isExporting ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Generating High-Quality Image...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Design (300 DPI)
              </>
            )}
          </Button>
        </div>

        {/* Product Details */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• High-quality engraving at 300 DPI resolution</p>
          <p>• True black and white design (no gradients)</p>
          <p>• JPEG format: 8-30MB for engraving consistency</p>
          <p>• Processing time: 3-5 business days</p>
          <p>• Free shipping on orders over $50</p>
        </div>

        {/* Customization Summary */}
        {(state.customizations.texts.length > 0 || 
          state.customizations.icons.length > 0 || 
          state.customizations.compass) && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium mb-3">Your Customizations</h4>
            
            {state.customizations.texts.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Text Elements:</p>
                {state.customizations.texts.map((text) => (
                  <p key={text.id} className="text-xs text-muted-foreground">
                    "{text.content}" ({text.fontFamily}, {text.fontSize}px)
                  </p>
                ))}
              </div>
            )}
            
            {state.customizations.icons.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Icons:</p>
                <p className="text-xs text-muted-foreground">
                  {state.customizations.icons.map(icon => icon.type).join(', ')}
                </p>
              </div>
            )}
            
            {state.customizations.compass && (
              <div>
                <p className="text-sm font-medium mb-1">Compass:</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {state.customizations.compass.type} style
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
