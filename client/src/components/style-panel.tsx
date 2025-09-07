import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMapBuilder } from "@/hooks/use-map-builder";
import { cn } from "@/lib/utils";

const productShapes = [
  { id: "rectangle", label: "Rectangle", aspectRatio: 1.5, description: "Standard rectangular maps" },
  { id: "stick", label: "Stick", aspectRatio: 1.2, description: "Small rectangles" },
  { id: "twig", label: "Twig", aspectRatio: 3, description: "Thin, long rectangles" },
  { id: "circle", label: "Circle", aspectRatio: 1, description: "For ornaments and candles" },
] as const;

const sizeOptions = [
  { id: "standard", label: '12" × 8" Standard', description: "Perfect for detailed maps", price: 64.99 },
  { id: "large", label: '16" × 10" Large', description: "Premium size option", price: 89.99 },
  { id: "compact", label: '8" × 6" Compact', description: "Great for smaller spaces", price: 49.99 },
];

const materialOptions = [
  { id: "wood", label: "Premium Wood", description: "Natural wood finish" },
  { id: "metal", label: "Brushed Metal", description: "Modern metal finish" },
];

export default function StylePanel() {
  const { state, updateProductSettings } = useMapBuilder();
  const [selectedShape, setSelectedShape] = useState<string>(state.productSettings?.shape || "rectangle");
  const [selectedSize, setSelectedSize] = useState<string>("standard");
  const [selectedMaterial, setSelectedMaterial] = useState<string>(state.productSettings?.material || "wood");

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
                    "p-4 h-auto flex flex-col items-center space-y-2 min-h-[120px]",
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
                  <div className="text-center w-full">
                    <span className="text-sm font-medium block">{shape.label}</span>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight break-words">{shape.description}</p>
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
                    <div className="font-medium">${size.price}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Material */}
        <div>
          <h3 className="font-medium mb-3">Material</h3>
          <div className="space-y-2">
            {materialOptions.map((material) => {
              const isSelected = selectedMaterial === material.id;
              
              return (
                <Button
                  key={material.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "w-full p-3 text-left h-auto",
                    isSelected && "bg-primary/10 border-primary"
                  )}
                  onClick={() => handleMaterialChange(material.id)}
                  data-testid={`material-${material.id}`}
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "w-6 h-6 rounded mr-3",
                      material.id === "wood" && "bg-gradient-to-br from-amber-700 to-amber-900",
                      material.id === "metal" && "bg-gradient-to-br from-gray-300 to-gray-500"
                    )} />
                    <div>
                      <div className="font-medium">{material.label}</div>
                      <div className="text-sm text-muted-foreground">{material.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium mb-2">Current Selection</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Shape:</strong> {productShapes.find(s => s.id === selectedShape)?.label}</p>
            <p><strong>Size:</strong> {sizeOptions.find(s => s.id === selectedSize)?.label}</p>
            <p><strong>Material:</strong> {materialOptions.find(m => m.id === selectedMaterial)?.label}</p>
            <p className="pt-2 border-t border-border font-medium">
              <strong>Price:</strong> ${sizeOptions.find(s => s.id === selectedSize)?.price}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
