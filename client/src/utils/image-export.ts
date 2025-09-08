import { Map } from 'ol';

export interface ExportResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
  sizeInMB: number;
}

/**
 * Official OpenLayers export method for maps with tiles
 */
export function exportMapCanvas(
  mapInstance: Map, 
  size: [number, number], 
  orderId: string = `Order${Date.now()}`,
  shopifyOrderNumber?: string
): Promise<ExportResult> {
  const pixelRatio = 3; // 3x for 300 DPI output
  
  console.log(`Starting high-quality map export at ${pixelRatio}x resolution for 300 DPI output`);

  return new Promise((resolve, reject) => {
    try {
      // Use the official OpenLayers export pattern
      mapInstance.once('rendercomplete', function () {
        console.log('Map render complete, starting canvas export...');
        
        try {
          // Create canvas using OpenLayers official export method
          const mapCanvas = document.createElement('canvas');
          const mapSize = mapInstance.getSize();
          if (!mapSize) {
            reject(new Error('Could not get map size'));
            return;
          }
          
          mapCanvas.width = mapSize[0];
          mapCanvas.height = mapSize[1];
          const mapContext = mapCanvas.getContext('2d');
          
          if (!mapContext) {
            reject(new Error('Could not create map canvas context.'));
            return;
          }

          console.log(`Map canvas created: ${mapCanvas.width}x${mapCanvas.height}`);

          // Official OpenLayers canvas export approach
          Array.prototype.forEach.call(
            mapInstance.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
            function (canvas: HTMLCanvasElement) {
              if (canvas.width > 0) {
                const opacity = (canvas.parentNode as HTMLElement)?.style.opacity || canvas.style.opacity;
                mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
                
                let matrix: number[];
                const transform = canvas.style.transform;
                if (transform) {
                  // Get the transform parameters from the style's transform matrix
                  const matches = transform.match(/^matrix\(([^\(]*)\)$/);
                  if (matches) {
                    matrix = matches[1].split(',').map(Number);
                  } else {
                    matrix = [1, 0, 0, 1, 0, 0];
                  }
                } else {
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
                mapContext.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
                
                const backgroundColor = (canvas.parentNode as HTMLElement)?.style.backgroundColor;
                if (backgroundColor) {
                  mapContext.fillStyle = backgroundColor;
                  mapContext.fillRect(0, 0, canvas.width, canvas.height);
                }
                mapContext.drawImage(canvas, 0, 0);
                console.log(`Drew canvas: ${canvas.width}x${canvas.height} with opacity ${opacity || 1}`);
              }
            }
          );
          
          mapContext.globalAlpha = 1;
          mapContext.setTransform(1, 0, 0, 1, 0, 0);

          // Now create high-resolution version
          const exportCanvas = document.createElement('canvas');
          exportCanvas.width = mapSize[0] * pixelRatio;
          exportCanvas.height = mapSize[1] * pixelRatio;
          
          const exportContext = exportCanvas.getContext('2d');
          if (!exportContext) {
            reject(new Error('Could not create high-res canvas context.'));
            return;
          }

          // Scale and draw the composite map
          exportContext.drawImage(mapCanvas, 0, 0, mapCanvas.width, mapCanvas.height, 0, 0, mapSize[0] * pixelRatio, mapSize[1] * pixelRatio);
          console.log(`Scaled map canvas from ${mapCanvas.width}x${mapCanvas.height} to ${mapSize[0] * pixelRatio}x${mapSize[1] * pixelRatio}`);

          // Add text and icon overlays from the DOM
          const mapElement = mapInstance.getTargetElement();
          if (mapElement) {
            const textElements = mapElement.querySelectorAll('[data-testid*="draggable-text"]');
            const iconElements = mapElement.querySelectorAll('[data-testid*="draggable-icon"], [data-testid*="draggable-compass"]');
            
            console.log(`Adding ${textElements.length} text elements and ${iconElements.length} icons to export`);

            // Add text elements with proper scaling
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
          }

          console.log('Converting to black and white for engraving...');

          // Convert to black and white
          const bwCanvas = convertToBlackAndWhite(exportCanvas);

          // Create data URL with higher quality
          console.log('Creating JPEG data URL...');
          const dataUrl = bwCanvas.toDataURL('image/jpeg', 0.95);
          
          // Check if we have valid image data
          if (dataUrl === 'data:,' || dataUrl.length < 1000) {
            reject(new Error('No valid image data captured. Canvas may be empty or tainted by CORS.'));
            return;
          }
          
          console.log(`Data URL length: ${dataUrl.length} characters`);

          // Convert data URL to blob
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
      });

      // Trigger the render using official OpenLayers method
      console.log('Triggering map render for export...');
      mapInstance.renderSync();

    } catch (error) {
      console.error('Error setting up map export:', error);
      reject(new Error(`Failed to set up map export: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Convert a canvas to true black and white for engraving
 */
function convertToBlackAndWhite(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  console.log(`Converting ${sourceCanvas.width}x${sourceCanvas.height} image to true black/white for engraving`);
  
  const bwCanvas = document.createElement('canvas');
  bwCanvas.width = sourceCanvas.width;
  bwCanvas.height = sourceCanvas.height;
  
  const bwContext = bwCanvas.getContext('2d');
  if (!bwContext) {
    console.error('Could not create black/white canvas context');
    return sourceCanvas;
  }
  
  // Draw the source canvas onto the black/white canvas
  bwContext.drawImage(sourceCanvas, 0, 0);
  
  // Get image data and convert to black/white
  const imageData = bwContext.getImageData(0, 0, bwCanvas.width, bwCanvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance (perceived brightness)
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    // Convert to pure black or white based on threshold
    const threshold = 128; // Adjust this value to change the black/white balance
    const bwValue = luminance > threshold ? 255 : 0;
    
    data[i] = bwValue;     // Red
    data[i + 1] = bwValue; // Green
    data[i + 2] = bwValue; // Blue
    // Alpha (data[i + 3]) remains unchanged
  }
  
  // Put the modified image data back
  bwContext.putImageData(imageData, 0, 0);
  
  console.log('Black/white conversion completed');
  return bwCanvas;
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

/**
 * Legacy export name for compatibility
 * @deprecated Use exportMapCanvas instead
 */
export const exportMapImage = exportMapCanvas;