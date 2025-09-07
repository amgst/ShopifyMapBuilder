import { useState } from "react";
import { Plus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useMapBuilder } from "@/hooks/use-map-builder";

const fontOptions = [
  "Inter Regular",
  "Inter Medium", 
  "Inter Bold",
  "Playfair Display",
  "Source Sans Pro",
];

export default function TextPanel() {
  const [newText, setNewText] = useState("");
  const [selectedFont, setSelectedFont] = useState(fontOptions[0]);
  const [fontSize, setFontSize] = useState([24]);
  const [textColor, setTextColor] = useState("black");
  
  const { state, addText, removeText, updateTextStyle } = useMapBuilder();
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const handleAddText = () => {
    if (newText.trim()) {
      addText({
        content: newText,
        x: 50, // Default position
        y: 50,
        fontSize: fontSize[0],
        fontFamily: selectedFont,
        color: textColor,
      });
      setNewText("");
    }
  };

  const handleSelectText = (textId: string) => {
    const text = state.customizations.texts.find(t => t.id === textId);
    if (text) {
      setSelectedTextId(textId);
      setSelectedFont(text.fontFamily);
      setFontSize([text.fontSize]);
      setTextColor(text.color);
    }
  };

  const handleApplyStyles = () => {
    if (selectedTextId) {
      updateTextStyle(selectedTextId, fontSize[0], selectedFont, textColor);
    }
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    if (selectedTextId) {
      updateTextStyle(selectedTextId, undefined, font, undefined);
    }
  };

  const handleSizeChange = (size: number[]) => {
    setFontSize(size);
    if (selectedTextId) {
      updateTextStyle(selectedTextId, size[0], undefined, undefined);
    }
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    if (selectedTextId) {
      updateTextStyle(selectedTextId, undefined, undefined, color);
    }
  };

  return (
    <div className="h-full p-6" data-testid="text-panel">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Text Customization</h2>
        <p className="text-muted-foreground text-sm">
          Add custom text to your engraved map with professional typography options.
        </p>
      </div>

      <div className="space-y-6">
        {/* Add New Text */}
        <div>
          <label className="block font-medium mb-2">Add Text</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter your custom text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="flex-1"
              data-testid="text-input"
            />
            <Button 
              onClick={handleAddText}
              disabled={!newText.trim()}
              data-testid="add-text-button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Style */}
        <div>
          <label className="block font-medium mb-2">Font Style</label>
          <Select value={selectedFont} onValueChange={handleFontChange}>
            <SelectTrigger data-testid="font-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block font-medium mb-2">Font Size</label>
          <Slider
            value={fontSize}
            onValueChange={handleSizeChange}
            min={12}
            max={80}
            step={2}
            className="w-full"
            data-testid="font-size-slider"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>12px</span>
            <span className="font-medium">{fontSize[0]}px</span>
            <span>80px</span>
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block font-medium mb-2">Text Color</label>
          <div className="flex space-x-3">
            <Button
              variant={textColor === "black" ? "default" : "outline"}
              className="w-12 h-12 p-0 bg-black hover:bg-black/80"
              onClick={() => handleColorChange("black")}
              data-testid="color-black"
            />
            <Button
              variant={textColor === "white" ? "default" : "outline"}
              className="w-12 h-12 p-0 bg-white border-2 hover:bg-gray-50"
              onClick={() => handleColorChange("white")}
              data-testid="color-white"
            />
          </div>
        </div>

        {/* Add Button */}
        <Button 
          className="w-full" 
          onClick={handleAddText}
          disabled={!newText.trim()}
          data-testid="add-text-main-button"
        >
          Add Text to Map
        </Button>

        {/* Existing Texts */}
        {state.customizations.texts.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Added Texts {selectedTextId && <span className="text-sm text-muted-foreground">(Click to edit styles)</span>}</h3>
            <div className="space-y-2">
              {state.customizations.texts.map((text) => (
                <div
                  key={text.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTextId === text.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectText(text.id)}
                  data-testid={`text-item-${text.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{text.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {text.fontFamily} • {text.fontSize}px • {text.color}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {selectedTextId === text.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTextId(null);
                        }}
                        data-testid={`deselect-text-${text.id}`}
                      >
                        Deselect
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeText(text.id);
                        if (selectedTextId === text.id) {
                          setSelectedTextId(null);
                        }
                      }}
                      data-testid={`remove-text-${text.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedTextId && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-primary mb-2">
                  Editing: {state.customizations.texts.find(t => t.id === selectedTextId)?.content}
                </p>
                <p className="text-xs text-muted-foreground">
                  Change the font, size, or color above and see the updates in real-time in the preview.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
