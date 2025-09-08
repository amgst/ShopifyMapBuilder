import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useMapBuilder } from '@/hooks/use-map-builder';
import { Download, Image, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HighResMapOptions {
  width: number;
  height: number;
  style: string;
  format: 'png' | 'jpg' | 'webp';
  retina: boolean;
  dpi: number;
}

const MAP_STYLES = {
  'streets-v12': 'Streets (Google-like)',
  'outdoors-v12': 'Outdoors & Terrain',
  'light-v11': 'Light & Clean',
  'dark-v11': 'Dark Theme',
  'satellite-v9': 'Satellite Imagery',
  'navigation-day-v1': 'Navigation',
  'monochrome': 'Black & White'
};

const PRESET_SIZES = {
  'web-hd': { width: 1920, height: 1080, label: 'Web HD (1920×1080)' },
  'print-letter': { width: 2550, height: 3300, label: 'Letter Print (8.5×11")' },
  'print-a4': { width: 2480, height: 3508, label: 'A4 Print (210×297mm)' },
  'poster-small': { width: 3600, height: 2400, label: 'Small Poster (12×8")' },
  'poster-large': { width: 4800, height: 3200, label: 'Large Poster (16×10.7")' },
  'custom': { width: 1280, height: 1280, label: 'Custom Size' }
};

export default function HighResMapGenerator() {
  const { state } = useMapBuilder();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESET_SIZES>('poster-small');
  const [options, setOptions] = useState<HighResMapOptions>({
    width: 3600,
    height: 2400,
    style: 'streets-v12',
    format: 'png',
    retina: true,
    dpi: 300
  });

  const updatePreset = (preset: keyof typeof PRESET_SIZES) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const size = PRESET_SIZES[preset];
      setOptions(prev => ({
        ...prev,
        width: size.width,
        height: size.height
      }));
    }
  };

  const generateHighResMap = async (type: 'download' | 'poster') => {
    if (!state.location) {
      toast({
        title: "No Location Selected",
        description: "Please select a location on the map first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const endpoint = type === 'poster' ? '/api/generate-poster-map' : '/api/generate-high-res-map';
      
      const requestBody = {
        lat: state.location.lat,
        lng: state.location.lng,
        zoom: state.location.zoom,
        width: options.width,
        height: options.height,
        style: options.style,
        format: options.format,
        retina: options.retina,
        ...(type === 'poster' && { dpi: options.dpi })
      };

      console.log('Requesting high-res map:', requestBody);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Get the image blob
      const blob = await response.blob();
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const location = state.location.searchQuery?.replace(/[^a-zA-Z0-9]/g, '_') || 'map';
      const filename = `${location}_${options.width}x${options.height}_${timestamp}.${options.format}`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "High-Resolution Map Generated!",
        description: `Downloaded ${filename} (${sizeMB}MB)`
      });

    } catch (error) {
      console.error('Error generating high-res map:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate map",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithBoundingBox = async () => {
    if (!state.location) {
      toast({
        title: "No Location Selected",
        description: "Please select a location on the map first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Calculate bounding box from current location and zoom
      const zoomFactor = Math.pow(2, 15 - state.location.zoom);
      const latDelta = 0.01 * zoomFactor;
      const lngDelta = 0.01 * zoomFactor;

      const bbox = {
        north: state.location.lat + latDelta,
        south: state.location.lat - latDelta,
        east: state.location.lng + lngDelta,
        west: state.location.lng - lngDelta
      };

      const response = await fetch('/api/generate-map-bbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bbox,
          width: options.width,
          height: options.height,
          style: options.style,
          format: options.format,
          retina: options.retina
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `bbox_map_${options.width}x${options.height}_${timestamp}.${options.format}`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Bounding Box Map Generated!",
        description: `Downloaded ${filename} (${sizeMB}MB)`
      });

    } catch (error) {
      console.error('Error generating bbox map:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate bounding box map",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Professional High-Resolution Maps
        </CardTitle>
        <CardDescription>
          Generate poster-quality maps up to 1280×1280 pixels using Mapbox Static Images API.
          Perfect for printing, presentations, and professional use.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Location Display */}
        {state.location && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Current Location</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {state.location.searchQuery || 'Custom Location'}
            </p>
            <p className="text-xs text-muted-foreground">
              {state.location.lat.toFixed(4)}°N, {state.location.lng.toFixed(4)}°E • Zoom: {state.location.zoom}
            </p>
          </div>
        )}

        {/* Preset Sizes */}
        <div className="space-y-2">
          <Label>Size Presets</Label>
          <Select value={selectedPreset} onValueChange={updatePreset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRESET_SIZES).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Dimensions */}
        {selectedPreset === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width (px)</Label>
              <Input
                type="number"
                min="100"
                max="1280"
                value={options.width}
                onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 1280 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Height (px)</Label>
              <Input
                type="number"
                min="100"
                max="1280"
                value={options.height}
                onChange={(e) => setOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 1280 }))}
              />
            </div>
          </div>
        )}

        {/* Map Style */}
        <div className="space-y-2">
          <Label>Map Style</Label>
          <Select value={options.style} onValueChange={(value) => setOptions(prev => ({ ...prev, style: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MAP_STYLES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Format and Quality Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={options.format} onValueChange={(value: 'png' | 'jpg' | 'webp') => setOptions(prev => ({ ...prev, format: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
                <SelectItem value="jpg">JPEG (Smaller)</SelectItem>
                <SelectItem value="webp">WebP (Modern)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Print DPI</Label>
            <Select value={options.dpi.toString()} onValueChange={(value) => setOptions(prev => ({ ...prev, dpi: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="150">150 DPI (Draft)</SelectItem>
                <SelectItem value="300">300 DPI (Standard)</SelectItem>
                <SelectItem value="600">600 DPI (High Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Retina Option */}
        <div className="flex items-center space-x-2">
          <Switch
            id="retina"
            checked={options.retina}
            onCheckedChange={(checked) => setOptions(prev => ({ ...prev, retina: checked }))}
          />
          <Label htmlFor="retina">Retina Quality (2x pixels)</Label>
        </div>

        {/* Image Preview Info */}
        <div className="bg-blue-50 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2">Output Specifications:</h4>
          <div className="space-y-1 text-muted-foreground">
            <p>• Dimensions: {options.width} × {options.height} pixels{options.retina ? ' (@2x)' : ''}</p>
            <p>• Print Size: {(options.width / options.dpi).toFixed(1)}" × {(options.height / options.dpi).toFixed(1)}" at {options.dpi} DPI</p>
            <p>• Format: {options.format.toUpperCase()}</p>
            <p>• Source: Mapbox Static Images API</p>
            <p>• Quality: Professional grade</p>
          </div>
        </div>

        {/* Generate Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => generateHighResMap('download')} 
            disabled={isGenerating || !state.location}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating High-Res Map...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate & Download Map
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => generateHighResMap('poster')} 
            disabled={isGenerating || !state.location}
            variant="outline"
            className="w-full"
          >
            <Image className="h-4 w-4 mr-2" />
            Generate Poster Quality
          </Button>
          
          <Button 
            onClick={generateWithBoundingBox} 
            disabled={isGenerating || !state.location}
            variant="outline"
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Generate with Auto-Bounds
          </Button>
        </div>

        {!state.location && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <p className="font-medium">No Location Selected</p>
            <p>Please select a location on the map to enable high-resolution generation.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
