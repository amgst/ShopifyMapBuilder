import { useState } from "react";
import { MapBuilderProvider } from "@/hooks/use-map-builder";
import Sidebar from "@/components/sidebar";
import FunctionPanel from "@/components/function-panel";
import PreviewPanel from "@/components/preview-panel";

export default function MapBuilder() {
  const [activeTab, setActiveTab] = useState<string>("location");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <MapBuilderProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
        />
        
        <FunctionPanel 
          activeTab={activeTab}
          sidebarExpanded={sidebarExpanded}
        />
        
        <PreviewPanel />
      </div>
    </MapBuilderProvider>
  );
}
