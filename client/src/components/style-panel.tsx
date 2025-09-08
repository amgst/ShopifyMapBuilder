import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMapBuilder } from "@/hooks/use-map-builder";
import { useShopifyPricing, getPriceWithFallback } from "@/hooks/use-shopify-pricing";
import { ShopifyConfig } from "@/lib/shopify";
import { cn } from "@/lib/utils";

const productShapes = [
  { id: "rectangle", label: "Rectangle", aspectRatio: 1.5, description: "Standard rectangular maps" },
  { id: "stick", label: "Stick", aspectRatio: 1.2, description: "Small rectangles" },
  { id: "twig", label: "Twig", aspectRatio: 3, description: "Thin, long rectangles" },
  { id: "circle", label: "Circle", aspectRatio: 1, description: "Perfect for ornaments,\ncandles & decorative pieces" },
] as const;

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

const materialOptions = [
  { 
    id: "oak", 
    label: "Natural Oak", 
    description: "Rich grain texture with warm honey tones",
    texture: "wood-grain",
    finish: "Natural matte finish"
  },
  { 
    id: "walnut", 
    label: "Dark Walnut", 
    description: "Deep chocolate brown with elegant grain",
    texture: "wood-grain-dark",
    finish: "Satin protective coating"
  },
  { 
    id: "bamboo", 
    label: "Eco Bamboo", 
    description: "Sustainable light wood with linear grain",
    texture: "bamboo",
    finish: "Natural eco-friendly finish"
  },
  { 
    id: "aluminum", 
    label: "Brushed Aluminum", 
    description: "Lightweight with subtle metallic sheen",
    texture: "brushed-metal",
    finish: "Anodized coating"
  },
  { 
    id: "brass", 
    label: "Antique Brass", 
    description: "Vintage golden finish with character",
    texture: "antique-metal",
    finish: "Aged patina effect"
  },
];

export default function StylePanel() {
  const { state, updateProductSettings } = useMapBuilder();
  const [selectedShape, setSelectedShape] = useState(state.productSettings?.shape || "rectangle");
  const [selectedSize, setSelectedSize] = useState(state.productSettings?.size || "standard");
  const [selectedMaterial, setSelectedMaterial] = useState(state.productSettings?.material || "oak");
  
  // Fetch actual Shopify product price
  const { price: shopifyPrice, currency, loading: priceLoading } = useShopifyPricing(shopifyConfig);

  const handleShapeChange = (shapeId: string) => {
    setSelectedShape(shapeId);
    const shape = productShapes.find(s => s.id === shapeId);
    if (shape) {
      updateProductSettings({
        shape: shape.id as any,
        size: selectedSize,
        material: selectedMaterial,
        aspectRatio: shape.aspectRatio,
      });
    }
  };

  const handleSizeChange = (sizeId: string) => {
    setSelectedSize(sizeId);
    updateProductSettings({
      shape: selectedShape as any,
      size: sizeId,
      material: selectedMaterial,
      aspectRatio: productShapes.find(s => s.id === selectedShape)?.aspectRatio || 2.62,
    });
  };

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterial(materialId);
    updateProductSettings({
      shape: selectedShape as any,
      size: selectedSize,
      material: materialId,
      aspectRatio: productShapes.find(s => s.id === selectedShape)?.aspectRatio || 2.62,
    });
  };

  return (
    <div className="h-full p-6" data-testid="style-panel">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Product Style</h2>
        <p className="text-muted-foreground text-sm">
          Choose your product shape, size, and engraving style options.
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Shape */}
        <div>
          <h3 className="font-medium mb-3">Product Shape</h3>
          <div className="grid grid-cols-2 gap-3">
            {productShapes.map((shape) => {
              const isSelected = selectedShape === shape.id;
              
              return (
                <Button
                  key={shape.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "p-3 h-auto flex flex-col items-center space-y-2 min-h-[110px] max-w-full",
                    isSelected && "bg-primary text-primary-foreground border-primary"
                  )}
                  onClick={() => handleShapeChange(shape.id)}
                  data-testid={`shape-${shape.id}`}
                >
                  <div className={cn(
                    "bg-foreground/20 mb-2",
                    shape.id === "rectangle" && "w-16 h-11 rounded",
                    shape.id === "stick" && "w-12 h-10 rounded",
                    shape.id === "twig" && "w-20 h-7 rounded",
                    shape.id === "circle" && "w-10 h-10 rounded-full",
                  )} />
                  <div className="text-center w-full px-1">
                    <span className="text-sm font-medium block">{shape.label}</span>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight break-words overflow-hidden">{shape.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Size Options */}
        <div>
          <h3 className="font-medium mb-3">Size Options</h3>
          <div className="space-y-2">
            {sizeOptions.map((size) => {
              const isSelected = selectedSize === size.id;
              
              return (
                <Button
                  key={size.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "w-full p-3 text-left h-auto",
                    isSelected && "bg-primary/10 border-primary"
                  )}
                  onClick={() => handleSizeChange(size.id)}
                  data-testid={`size-${size.id}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <div className="font-medium">{size.label}</div>
                      <div className="text-sm text-muted-foreground">{size.description}</div>
                    </div>
                    <div className="font-medium">
                      {priceLoading ? (
                        <span className="text-gray-500">Loading...</span>
                      ) : (
                        `${currency === 'USD' ? '$' : currency + ' '}${getPriceWithFallback(shopifyPrice, size.id).toFixed(2)}`
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Material */}
        <div>
          <h3 className="font-medium mb-3">Material & Finish</h3>
          <div className="grid grid-cols-1 gap-3">
            {materialOptions.map((material) => {
              const isSelected = selectedMaterial === material.id;
              
              return (
                <Button
                  key={material.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "w-full p-4 text-left h-auto group hover:bg-accent/50 transition-all duration-200",
                    isSelected && "bg-primary/10 border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => handleMaterialChange(material.id)}
                  data-testid={`material-${material.id}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Material Sample */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-lg border-2 border-border/20 relative overflow-hidden",
                        "group-hover:scale-105 transition-transform duration-200"
                      )}>
                        {/* Base material color/texture */}
                        <div className={cn(
                          "absolute inset-0",
                          // Wood materials
                          material.id === "oak" && "bg-gradient-to-br from-amber-200 via-amber-300 to-amber-600",
                          material.id === "walnut" && "bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900",
                          material.id === "bamboo" && "bg-gradient-to-br from-yellow-100 via-yellow-200 to-amber-300",
                          // Metal materials
                          material.id === "aluminum" && "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400",
                          material.id === "brass" && "bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-700"
                        )} />
                        
                        {/* Texture overlay */}
                        <div className={cn(
                          "absolute inset-0 opacity-40",
                          // Wood grain patterns
                          (material.id === "oak" || material.id === "walnut" || material.id === "bamboo") && 
                          "bg-gradient-to-r from-transparent via-black/10 to-transparent",
                          // Metal brush patterns
                          material.id === "aluminum" && 
                          "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                          // Antique patina
                          material.id === "brass" && "bg-gradient-to-br from-black/10 via-transparent to-black/20"
                        )} />
                        
                        {/* Shine/reflection effect */}
                        <div className={cn(
                          "absolute top-1 left-1 right-1 h-3 rounded-t-lg opacity-30",
                          material.id === "aluminum" && "bg-gradient-to-r from-transparent via-white/60 to-transparent",
                          material.id === "brass" && "bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent"
                        )} />
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    {/* Material Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={cn(
                          "font-semibold text-sm",
                          isSelected ? "text-black" : ""
                        )}>{material.label}</h4>
                        {material.id === "bamboo" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Eco-Friendly
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs mb-2 leading-relaxed",
                        isSelected ? "text-black/70" : "text-muted-foreground"
                      )}>
                        {material.description}
                      </p>
                      <div className={cn(
                        "flex items-center text-xs",
                        isSelected ? "text-black/70" : "text-muted-foreground"
                      )}>
                        <div className={cn(
                          "w-1 h-1 rounded-full mr-2",
                          isSelected ? "bg-black/70" : "bg-muted-foreground"
                        )} />
                        {material.finish}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="bg-gradient-to-br from-muted/50 to-muted rounded-xl p-5 border border-border/50">
          <h4 className="font-semibold mb-3 flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
            Your Selection
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Shape:</span>
              <span className="font-medium">{productShapes.find(s => s.id === selectedShape)?.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{sizeOptions.find(s => s.id === selectedSize)?.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Material:</span>
              <span className="font-medium">{materialOptions.find(m => m.id === selectedMaterial)?.label}</span>
            </div>
            <div className="pt-3 border-t border-border/30">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base">Total Price:</span>
                <span className="font-bold text-lg text-primary">
                  ${sizeOptions.find(s => s.id === selectedSize)?.price}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
