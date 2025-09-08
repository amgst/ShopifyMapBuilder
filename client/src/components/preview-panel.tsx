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
  Minus,
  ShoppingCart,
  Loader2,
  Box,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useShopify } from "@/hooks/use-shopify";
import { useShopifyPricing, getPriceWithFallback } from "@/hooks/use-shopify-pricing";
import { CustomMapData, ShopifyConfig } from "@/lib/shopify";
import { findShopifyProducts } from "@/lib/shopify-debug";
import { testShopifyConnection } from "@/lib/shopify";
import InteractiveMap from "@/components/interactive-map";
import ThreeDPreview from "@/components/3d-preview";

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

// Size options (prices now fetched from Shopify)
const sizeOptions = [
  { id: "standard", label: '12" × 8" Standard', description: "Perfect for detailed maps" },
  { id: "large", label: '16" × 10" Large', description: "Premium size option" },
  { id: "compact", label: '8" × 6" Compact', description: "Great for smaller spaces" },
];

// Shopify configuration
const shopifyConfig: ShopifyConfig = {
  storeName: 'vgpcreatives',
  storefrontAccessToken: '172c37b6b7a7759406ad719a4f149d42',
  productVariantId: 'gid://shopify/ProductVariant/41068385009711'
};

export default function PreviewPanel() {
  const { state, updateTextPosition, updateIconPosition, updateIconSize, updateCompassPosition, updateMapZoom } = useMapBuilder();
  const { toast } = useToast();
  const { isLoading, addToCart } = useShopify();
  
  // Fetch actual Shopify product price
  const { price: shopifyPrice, currency, loading: priceLoading, error: priceError } = useShopifyPricing(shopifyConfig);
  const [show3D, setShow3D] = useState(false);
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

  // Capture all design data for Shopify
  const captureMapData = (): CustomMapData => {
    const currentSize = state.productSettings?.size || 'standard';
    const sizeInfo = sizeOptions.find(s => s.id === currentSize);
    
    // Extract location data from texts or use defaults
    const cityText = state.customizations.texts.find(t => t.id === 'auto-city');
    const countryText = state.customizations.texts.find(t => t.id === 'auto-country');
    const coordinatesText = state.customizations.texts.find(t => t.id === 'auto-coordinates');
    
    // Safe extraction of country text (remove decorative lines)
    let countryValue = 'Unknown Country';
    if (countryText?.content) {
      countryValue = countryText.content
        .replace(/[—–-]/g, '') // Remove em-dash, en-dash, and regular dash
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/\s+/g, ' '); // Normalize spaces
      if (countryValue === '') countryValue = 'Unknown Country';
    }
    
    const currentLat = state.location?.lat || 48.8566;
    const currentLng = state.location?.lng || 2.3522;
    
    return {
      location: {
        lat: currentLat,
        lng: currentLng,
        zoom: state.location?.zoom || 12,
        searchQuery: state.location?.searchQuery || 'Paris, France',
        city: cityText?.content || 'Unknown City',
        country: countryValue,
        coordinates: coordinatesText?.content || `${currentLat.toFixed(3)}°N / ${currentLng.toFixed(3)}°E`
      },
      productSettings: {
        shape: state.productSettings?.shape || 'rectangle',
        size: currentSize,
        material: state.productSettings?.material || 'oak',
        aspectRatio: state.productSettings?.aspectRatio || 2.62
      },
      customizations: {
        texts: state.customizations.texts || [],
        icons: state.customizations.icons || [],
        compass: state.customizations.compass
      },
      price: (() => {
        const currentSize = state.productSettings?.size || 'standard';
        return getPriceWithFallback(shopifyPrice, currentSize);
      })()
    };
  };

  // Test Shopify connection
  const handleTestConnection = async () => {
    try {
      const result = await testShopifyConnection(shopifyConfig);
      
      if (result.success) {
        toast({
          title: "Connection Successful!",
          description: `Found product: ${result.variant?.product?.title} - ${result.variant?.title}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Error",
        description: "Failed to test connection.",
        variant: "destructive",
      });
    }
  };

  // Debug function to find products and auto-update variant ID
  const handleFindProducts = async () => {
    try {
      const products = await findShopifyProducts(shopifyConfig);
      if (products && products.length > 0) {
        console.log('Available products in your store:', products);
        
        // Auto-update with first available variant
        const firstProduct = products[0];
        if (firstProduct.variants && firstProduct.variants.length > 0) {
          const variantId = firstProduct.variants[0].id;
          console.log('🎯 WILL USE THIS VARIANT ID:', variantId);
          
          // Update the config automatically
          shopifyConfig.productVariantId = variantId;
          
          toast({
            title: "Product Found!",
            description: `Updated to use: ${firstProduct.title}. Try "Add to Cart" now!`,
          });
        } else {
          toast({
            title: "No Variants",
            description: "The first product has no variants available.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Could not fetch products from your store.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error finding products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products.",
        variant: "destructive",
      });
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      console.log('Adding to cart...');
      const mapData = captureMapData();
      console.log('Map data captured:', mapData);
      console.log('Shopify config:', shopifyConfig);
      
      const result = await addToCart(shopifyConfig, mapData);
      console.log('Add to cart result:', result);
      
      if (result.success) {
        // Redirect directly to checkout without extra notes
        if (result.checkoutUrl) {
          window.open(result.checkoutUrl, '_blank');
        }
      } else {
        console.error('Add to cart failed:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to add item to cart. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Add to cart exception:', error);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
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
                {show3D ? (
                  /* 3D Preview */
                  <div className="w-full h-full flex items-center justify-center">
                    <ThreeDPreview 
                      mapData={{
                        shape: state.productSettings?.shape || 'rectangle',
                        width: state.productSettings?.shape === 'circle' ? 300 : 
                               state.productSettings?.shape === 'stick' ? 400 : 
                               state.productSettings?.shape === 'twig' ? 600 : 400,
                        height: state.productSettings?.shape === 'circle' ? 300 : 
                                state.productSettings?.shape === 'stick' ? 200 : 
                                state.productSettings?.shape === 'twig' ? 150 : 300,
                        imageUrl: undefined // We'll add texture loading later
                      }}
                      visible={true}
                    />
                  </div>
                ) : (
                  /* 2D Interactive Map */
                  <div className="w-full h-full relative">
                    {/* Map - Clear view for testing */}
                    <div className="absolute inset-0 overflow-hidden">
                      <InteractiveMap className="w-full h-full" />
                    </div>
                  
                    {/* Custom texts - only in 2D mode */}
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
                    
                    {/* Icons - only in 2D mode */}
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
                    
                    {/* Compass - only in 2D mode */}
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
                  </div>
                )}
                
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

                {/* 3D/2D Toggle */}
                <div className="absolute top-4 left-4 flex gap-1">
                  <Button
                    size="sm"
                    variant={!show3D ? "default" : "outline"}
                    className="px-3 h-8 bg-white hover:bg-gray-50 shadow-md text-xs"
                    onClick={() => setShow3D(false)}
                    title="2D View"
                  >
                    <Map className="h-3 w-3 mr-1" />
                    2D
                  </Button>
                  <Button
                    size="sm"
                    variant={show3D ? "default" : "outline"}
                    className="px-3 h-8 bg-white hover:bg-gray-50 shadow-md text-xs"
                    onClick={() => setShow3D(true)}
                    title="3D View"
                  >
                    <Box className="h-3 w-3 mr-1" />
                    3D
                  </Button>
              </div>
            </div>
            
            {/* Bottom Material Bar */}
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
          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
