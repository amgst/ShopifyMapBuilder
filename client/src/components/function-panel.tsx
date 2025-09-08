import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useMapBuilder } from "@/hooks/use-map-builder";
import { useShopify } from "@/hooks/use-shopify";
import { useToast } from "@/hooks/use-toast";
import { useShopifyPricing, getPriceWithFallback } from "@/hooks/use-shopify-pricing";
import { CustomMapData, ShopifyConfig } from "@/lib/shopify";
import LocationPanel from "./location-panel";
import TextPanel from "./text-panel";
import IconsPanel from "./icons-panel";
import StylePanel from "./style-panel";
import PreviewPanelContent from "./preview-panel-content";

interface FunctionPanelProps {
  activeTab: string;
  sidebarExpanded: boolean;
}

export default function FunctionPanel({ activeTab, sidebarExpanded }: FunctionPanelProps) {
  const { state } = useMapBuilder();
  const { toast } = useToast();
  const { isLoading, addToCart } = useShopify();
  
  // Shopify configuration
  const shopifyConfig: ShopifyConfig = {
    storeName: 'vgpcreatives',
    storefrontAccessToken: '172c37b6b7a7759406ad719a4f149d42',
    productVariantId: 'gid://shopify/ProductVariant/41068385009711'
  };
  
  // Fetch actual Shopify product price
  const { price: shopifyPrice, currency, loading: priceLoading, error: priceError } = useShopifyPricing(shopifyConfig);
  
  const sizeOptions = [
    { id: "standard", label: '12" × 8" Standard' },
    { id: "large", label: '16" × 10" Large' },
    { id: "compact", label: '8" × 6" Compact' },
  ];

  const currentPrice = (() => {
    const currentSize = state.productSettings?.size || 'standard';
    return getPriceWithFallback(shopifyPrice, currentSize);
  })();

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
      price: currentPrice
    };
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      console.log('Adding to cart from function panel...');
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

  const renderPanel = () => {
    switch (activeTab) {
      case "location":
        return <LocationPanel />;
      case "text":
        return <TextPanel />;
      case "icons":
        return <IconsPanel />;
      case "style":
        return <StylePanel />;
      case "preview":
        return (
          <PreviewPanelContent 
            currentPrice={currentPrice}
            currency={currency}
            priceLoading={priceLoading}
          />
        );
      default:
        return <LocationPanel />;
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: 350 }}
      transition={{ duration: 0.3 }}
      className="bg-card border-r border-border flex flex-col"
      data-testid="function-panel"
    >
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-auto"
      >
        {renderPanel()}
      </motion.div>
      
      {/* Persistent Add to Cart Button */}
      <div className="p-4 border-t border-border bg-card">
        <Button 
          onClick={handleAddToCart}
          disabled={isLoading}
          className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-lg text-base transition-all duration-200 shadow-lg hover:shadow-xl" 
          size="lg"
          data-testid="add-to-cart-button-function-panel"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Adding to Cart...
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5 mr-3" />
              Add to Cart & Checkout • ${currentPrice.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
