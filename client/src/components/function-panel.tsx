import { motion } from "framer-motion";
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
      className="bg-card border-r border-border overflow-auto"
      data-testid="function-panel"
    >
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {renderPanel()}
      </motion.div>
    </motion.div>
  );
}
