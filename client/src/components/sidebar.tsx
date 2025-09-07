import { motion } from "framer-motion";
import { 
  MapPin, 
  Type, 
  Shapes, 
  Palette, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

const tabs = [
  { id: "location", icon: MapPin, label: "Location" },
  { id: "text", icon: Type, label: "Text" },
  { id: "icons", icon: Shapes, label: "Icons" },
  { id: "style", icon: Palette, label: "Style" },
  { id: "preview", icon: Eye, label: "Preview" },
];

export default function Sidebar({ activeTab, onTabChange, expanded, onToggleExpanded }: SidebarProps) {
  return (
    <motion.div
      initial={false}
      animate={{ width: expanded ? 280 : 60 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative bg-card border-r border-border flex flex-col"
      data-testid="sidebar"
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Map className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start p-3 text-left transition-colors",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => onTabChange(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <motion.span
                  initial={false}
                  animate={{
                    opacity: expanded ? 1 : 0,
                    x: expanded ? 0 : -10,
                  }}
                  transition={{ duration: 0.2, delay: expanded ? 0.1 : 0 }}
                  className={cn(
                    "ml-3 whitespace-nowrap overflow-hidden",
                    !expanded && "w-0"
                  )}
                >
                  {tab.label}
                </motion.span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full p-2"
          onClick={onToggleExpanded}
          data-testid="toggle-sidebar"
        >
          {expanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}
