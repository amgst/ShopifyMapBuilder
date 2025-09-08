export interface ImageExportOptions {
  orderId?: string;
  shopifyOrderNumber?: string; // Shopify order number for filename
  targetSize?: number; // Target file size in MB
  minSize?: number; // Minimum file size in MB
  maxSize?: number; // Maximum file size in MB
  pixelRatio?: number; // For high-DPI export (default: 3 for 300 DPI)
}

export interface ExportResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
  sizeInMB: number;
}

/**
 * Converts an image to true black and white (no gradients) as specified
 * White = land/text/icons, Black = water/engraved areas
 */
function convertToBlackAndWhite(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Enhanced threshold for high-quality map conversion
  const threshold = 140;
  
  console.log(`Converting ${canvas.width}x${canvas.height} image to true black/white for engraving`);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a === 0) continue;
    
    // Calculate luminance for black/white decision
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Enhanced conversion logic for maps:
    let value: number;
    
    // Detect water areas (typically blue-ish in color maps)
    const isWater = (b > r + 20 && b > g + 20) || (r < 100 && g < 100 && b > 120);
    
    // Detect text and icon elements (should be white - not engraved)
    const isTextOrIcon = (r < 50 && g < 50 && b < 50) || (r > 200 && g > 200 && b > 200);
    
    if (isWater) {
      // Water areas should be black (engraved)
      value = 0;
    } else if (isTextOrIcon) {
      // Text and icons should be black on white background
      value = luminance < 128 ? 0 : 255;
    } else {
      // For other map elements: use threshold
      // Land areas become white (not engraved)
      value = luminance > threshold ? 255 : 0;
    }
    
    // Apply pure black (0) or pure white (255) - no gradients
    data[i] = value;     // Red
    data[i + 1] = value; // Green
    data[i + 2] = value; // Blue
    // Alpha remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  console.log('Black/white conversion completed');
  return canvas;
}

/**
 * Exports the OpenLayers map using the official OpenLayers approach
 * Based on: https://openlayers.org/en/latest/examples/export-map.html
 */
export async function exportMapImage(
  mapElement: HTMLElement,
  options: ImageExportOptions = {}
): Promise<ExportResult> {
  const {
    orderId = `Order${Date.now()}`,
    shopifyOrderNumber,
    targetSize = 15,
    minSize = 8,
    maxSize = 30,
    pixelRatio = 3 // 3x for 300 DPI quality
  } = options;

  return new Promise((resolve, reject) => {
    try {
      console.log(`Starting high-quality map export at ${pixelRatio}x resolution for 300 DPI output`);

      // Find the OpenLayers map instance more reliably
      const mapInstance = (mapElement as any).__ol_map__ || (window as any).olMap;
      
      if (!mapInstance) {
        reject(new Error('OpenLayers map instance not found. Please make sure the map is loaded.'));
        return;
      }

      // Wait for all tiles to load, then export
      const exportMap = function () {
        try {
          console.log('Map render complete, starting canvas export...');
          
          // Get the map size
          const size = mapInstance.getSize();
          if (!size) {
            reject(new Error('Could not get map size.'));
            return;
          }

          // Create the composite canvas using official OpenLayers method
          const mapCanvas = document.createElement('canvas');
          mapCanvas.width = size[0];
          mapCanvas.height = size[1];
          const mapContext = mapCanvas.getContext('2d');
          
          if (!mapContext) {
            reject(new Error('Could not create canvas context.'));
            return;
          }

          // Set white background
          mapContext.fillStyle = '#ffffff';
          mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

          // Get all map canvas layers using the official OpenLayers approach
          // Try multiple selectors to find the viewport
          let mapViewport = mapElement.querySelector('.ol-viewport') as HTMLElement;
          
          if (!mapViewport) {
            // Fallback: look for the map container itself
            mapViewport = mapElement;
          }
          
          const canvases = mapViewport.querySelectorAll('.ol-layer canvas, canvas.ol-layer, canvas');
          
          console.log(`Found ${canvases.length} map canvas layers to combine`);

          // Composite all canvas layers (official OpenLayers export method)
          let canvasCount = 0;
          Array.prototype.forEach.call(canvases, function (canvas: HTMLCanvasElement) {
            if (canvas.width > 0 && canvas.height > 0) {
              try {
                canvasCount++;
                const opacity = (canvas.parentNode as HTMLElement)?.style.opacity || canvas.style.opacity;
                mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
                
                // Simplified approach - just draw directly without complex transforms
                mapContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, mapCanvas.width, mapCanvas.height);
                
                console.log(`Drew canvas ${canvasCount}: ${canvas.width}x${canvas.height}`);
              } catch (canvasError) {
                console.error('Error drawing canvas:', canvasError);
              }
            }
          });
          
          console.log(`Successfully drew ${canvasCount} canvas layers`);
          
          if (canvasCount === 0) {
            reject(new Error('No valid canvas layers found to export.'));
            return;
          }

          // Reset context transformations
          mapContext.globalAlpha = 1;
          mapContext.setTransform(1, 0, 0, 1, 0, 0);

          // Now create high-resolution version
          const exportCanvas = document.createElement('canvas');
          exportCanvas.width = size[0] * pixelRatio;
          exportCanvas.height = size[1] * pixelRatio;
          
          const exportContext = exportCanvas.getContext('2d');
          if (!exportContext) {
            reject(new Error('Could not create high-res canvas context.'));
            return;
          }

          // Scale and draw the composite map
          exportContext.scale(pixelRatio, pixelRatio);
          exportContext.drawImage(mapCanvas, 0, 0);

          // Add text and icon overlays from the DOM
          const textElements = mapElement.querySelectorAll('[data-testid*="draggable-text"]');
          const iconElements = mapElement.querySelectorAll('[data-testid*="draggable-icon"], [data-testid*="draggable-compass"]');
          
          console.log(`Adding ${textElements.length} text elements and ${iconElements.length} icons to export`);

          // Reset scale for text rendering
          exportContext.setTransform(1, 0, 0, 1, 0, 0);

          // Add text elements
          textElements.forEach((textEl: Element) => {
            const htmlEl = textEl as HTMLElement;
            const rect = htmlEl.getBoundingClientRect();
            const mapRect = mapElement.getBoundingClientRect();
            
            const x = (rect.left - mapRect.left) * pixelRatio;
            const y = (rect.top - mapRect.top + rect.height / 2) * pixelRatio;
            
            exportContext.fillStyle = '#000000';
            exportContext.font = `bold ${14 * pixelRatio}px Arial`;
            exportContext.textAlign = 'center';
            exportContext.fillText(htmlEl.textContent || '', x, y);
          });

          console.log('Converting to black and white for engraving...');

          // Convert to black and white
          const bwCanvas = convertToBlackAndWhite(exportCanvas);

          // Create data URL with higher quality
          console.log('Creating JPEG data URL...');
          const dataUrl = bwCanvas.toDataURL('image/jpeg', 0.85);
          
          // Check if we have valid image data
          if (dataUrl === 'data:,' || dataUrl.length < 100) {
            reject(new Error('No image data captured. Canvas is empty.'));
            return;
          }
          
          console.log(`Data URL length: ${dataUrl.length} characters`);
          
          // Convert data URL to blob manually
          console.log('Converting data URL to blob...');
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
          
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const uint8Array = new Uint8Array(arrayBuffer);
          
          for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
          }
          
          const blob = new Blob([arrayBuffer], { type: mimeString });
          const sizeInMB = blob.size / (1024 * 1024);
          
          console.log(`Blob created: ${blob.size} bytes (${sizeInMB.toFixed(1)}MB)`);
          
          // Generate filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          let filename: string;
          
          if (shopifyOrderNumber) {
            filename = `${shopifyOrderNumber}_Map.jpeg`;
          } else {
            filename = `${orderId}_Map_${timestamp}.jpeg`;
          }

          console.log(`Export complete: ${filename} (${sizeInMB.toFixed(1)}MB, ${bwCanvas.width}x${bwCanvas.height}px)`);

          resolve({
            blob,
            dataUrl,
            filename,
            sizeInMB
          });

        } catch (error) {
          console.error('Error during canvas export:', error);
          reject(new Error(`Failed to export map canvas: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      // Check if tiles are already loaded
      let tilesLoading = 0;
      let tilesLoaded = 0;
      let allTilesLoaded = false;

      const checkTileStatus = () => {
        console.log(`Tile status: ${tilesLoaded}/${tilesLoading} loaded`);
        if (tilesLoaded >= tilesLoading && tilesLoading > 0) {
          allTilesLoaded = true;
          console.log('All tiles loaded, proceeding with export...');
          setTimeout(exportMap, 100); // Small delay to ensure rendering is complete
        }
      };

      // Listen for tile loading events
      mapInstance.getLayers().forEach((layer: any) => {
        if (layer.getSource && typeof layer.getSource === 'function') {
          const source = layer.getSource();
          if (source && source.on) {
            source.on('tileloadstart', () => {
              tilesLoading++;
            });
            source.on('tileloadend', () => {
              tilesLoaded++;
              checkTileStatus();
            });
            source.on('tileloaderror', () => {
              tilesLoaded++;
              checkTileStatus();
            });
          }
        }
      });

      // Trigger the render and set a fallback timeout
      console.log('Triggering map render for export...');
      mapInstance.renderSync();
      
      // Fallback: if no tiles are detected as loading after 1 second, proceed anyway
      setTimeout(() => {
        if (!allTilesLoaded) {
          console.log('Timeout reached, proceeding with export regardless of tile status...');
          exportMap();
        }
      }, 1000);

    } catch (error) {
      console.error('Error setting up map export:', error);
      reject(new Error(`Failed to set up map export: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Downloads the exported image file
 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}