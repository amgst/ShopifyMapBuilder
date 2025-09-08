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
      // Find the OpenLayers map instance
      const mapDiv = mapElement.querySelector('.ol-viewport') || mapElement;
      
      if (!mapDiv) {
        reject(new Error('OpenLayers map not found. Please make sure the map is loaded.'));
        return;
      }

      console.log(`Starting high-quality map export at ${pixelRatio}x resolution for 300 DPI output`);

      // Use the OpenLayers rendercomplete event for proper export
      const mapInstance = (mapDiv as any).__ol_map__ || (window as any).olMap;
      
      if (!mapInstance) {
        reject(new Error('OpenLayers map instance not found.'));
        return;
      }

      // Wait for all tiles to load, then export
      mapInstance.once('rendercomplete', function () {
        try {
          console.log('Map render complete, starting canvas export...');
          
          // Get the map size
          const size = mapInstance.getSize();
          if (!size) {
            reject(new Error('Could not get map size.'));
            return;
          }

          // Create high-resolution canvas
          const exportCanvas = document.createElement('canvas');
          exportCanvas.width = size[0] * pixelRatio;
          exportCanvas.height = size[1] * pixelRatio;
          
          console.log(`Export canvas: ${exportCanvas.width}x${exportCanvas.height} pixels`);

          const exportContext = exportCanvas.getContext('2d');
          if (!exportContext) {
            reject(new Error('Could not create canvas context.'));
            return;
          }

          // Scale the context for high DPI
          exportContext.scale(pixelRatio, pixelRatio);
          
          // Set white background for engraving
          exportContext.fillStyle = '#ffffff';
          exportContext.fillRect(0, 0, size[0], size[1]);

          // Find all canvas elements in the map and combine them
          const canvases = mapDiv.querySelectorAll('.ol-layer canvas, canvas.ol-layer');
          
          console.log(`Found ${canvases.length} map canvas layers to combine`);

          Array.prototype.forEach.call(canvases, function (canvas: HTMLCanvasElement) {
            if (canvas.width > 0) {
              const opacity = (canvas.parentNode as HTMLElement)?.style.opacity || canvas.style.opacity;
              exportContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
              
              let matrix;
              const transform = canvas.style.transform;
              
              if (transform) {
                // Get the transform parameters from the style's transform matrix
                const matches = transform.match(/^matrix\(([^\(]*)\)$/);
                if (matches) {
                  matrix = matches[1].split(',').map(Number);
                }
              }
              
              if (!matrix) {
                matrix = [
                  parseFloat(canvas.style.width) / canvas.width || 1,
                  0,
                  0,
                  parseFloat(canvas.style.height) / canvas.height || 1,
                  0,
                  0,
                ];
              }

              // Apply the transform to the export map context
              exportContext.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
              
              // Handle background color if present
              const backgroundColor = (canvas.parentNode as HTMLElement)?.style.backgroundColor;
              if (backgroundColor) {
                exportContext.fillStyle = backgroundColor;
                exportContext.fillRect(0, 0, canvas.width, canvas.height);
              }
              
              // Draw the canvas
              exportContext.drawImage(canvas, 0, 0);
            }
          });

          // Reset context transformations
          exportContext.globalAlpha = 1;
          exportContext.setTransform(1, 0, 0, 1, 0, 0);

          // Now add text and icon overlays from the DOM
          const textElements = mapElement.querySelectorAll('[data-testid*="draggable-text"]');
          const iconElements = mapElement.querySelectorAll('[data-testid*="draggable-icon"], [data-testid*="draggable-compass"]');
          
          console.log(`Adding ${textElements.length} text elements and ${iconElements.length} icons to export`);

          // Add text elements
          textElements.forEach((textEl: HTMLElement) => {
            const rect = textEl.getBoundingClientRect();
            const mapRect = mapElement.getBoundingClientRect();
            
            const x = (rect.left - mapRect.left) * pixelRatio;
            const y = (rect.top - mapRect.top + rect.height / 2) * pixelRatio;
            
            exportContext.fillStyle = '#000000';
            exportContext.font = `bold ${14 * pixelRatio}px Arial`;
            exportContext.textAlign = 'center';
            exportContext.fillText(textEl.textContent || '', x, y);
          });

          console.log('Converting to black and white for engraving...');

          // Convert to black and white
          const bwCanvas = convertToBlackAndWhite(exportCanvas);

          // Create data URL first (this method is more reliable)
          const dataUrl = bwCanvas.toDataURL('image/jpeg', 0.95);
          
          // Convert data URL to blob
          fetch(dataUrl)
            .then(response => response.blob())
            .then(blob => {
              const sizeInMB = blob.size / (1024 * 1024);
              
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
            })
            .catch(error => {
              console.error('Error converting canvas to blob:', error);
              reject(new Error('Failed to convert canvas to image blob.'));
            });

        } catch (error) {
          console.error('Error during canvas export:', error);
          reject(new Error('Failed to export map canvas.'));
        }
      });

      // Trigger the render
      console.log('Triggering map render for export...');
      mapInstance.renderSync();

    } catch (error) {
      console.error('Error setting up map export:', error);
      reject(new Error('Failed to set up map export.'));
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