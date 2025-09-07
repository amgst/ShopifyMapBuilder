import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useMapBuilder } from "@/hooks/use-map-builder";
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
  
  const sizeOptions = [
    { id: "standard", label: '12" × 8" Standard', price: 64.99 },
    { id: "large", label: '16" × 10" Large', price: 89.99 },
    { id: "compact", label: '8" × 6" Compact', price: 49.99 },
  ];

  const currentSize = sizeOptions.find(s => s.id === state.productSettings?.size) || sizeOptions[0];

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
        return <PreviewPanelContent />;
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
          className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-lg text-base transition-all duration-200 shadow-lg hover:shadow-xl" 
          size="lg"
          data-testid="add-to-cart-button"
        >
          <ShoppingCart className="h-5 w-5 mr-3" />
          Add to Cart • ${currentSize.price}
        </Button>
      </div>
    </motion.div>
  );
}
