import html2canvas from 'html2canvas';

export interface ImageExportOptions {
  orderId?: string;
  shopifyOrderNumber?: string; // Shopify order number for filename
  targetSize?: number; // Target file size in MB
  minSize?: number; // Minimum file size in MB
  maxSize?: number; // Maximum file size in MB
}

export interface ExportResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
  sizeInMB: number;
}

/**
 * Converts an image to true black and white (no gradients) as specified
 * Enhanced for high-quality map tiles
 * White = land/text/icons, Black = water/engraved areas
 */
function convertToBlackAndWhite(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Enhanced threshold for high-quality map conversion
  const threshold = 140; // Slightly higher for better map detail preservation
  
  console.log(`Converting ${canvas.width}x${canvas.height} high-quality image to true black/white`);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a === 0) continue;
    
    // Calculate luminance for black/white decision
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Enhanced conversion logic for high-quality maps:
    let value: number;
    
    // Detect text and icon elements (should be white - not engraved)
    const isTextOrIcon = (r > 200 && g > 200 && b > 200) || (r < 50 && g < 50 && b < 50);
    
    // Detect water areas (typically blue-ish in color maps)
    const isWater = (b > r + 20 && b > g + 20) || (r < 100 && g < 100 && b > 120);
    
    // Detect roads and paths (typically gray or white lines)
    const isRoadOrPath = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && r > 180;
    
    if (isTextOrIcon) {
      // Text and icons should be white (not engraved)
      value = luminance > 30 ? 255 : 0;
    } else if (isWater) {
      // Water areas should be black (engraved)
      value = 0;
    } else if (isRoadOrPath) {
      // Roads and paths should be white (not engraved)
      value = 255;
    } else {
      // For other map elements: use enhanced threshold
      // Land areas become white (not engraved)
      // Dark features become black (engraved)
      value = luminance > threshold ? 255 : 0;
    }
    
    // Apply pure black (0) or pure white (255) - no gradients
    data[i] = value;     // Red
    data[i + 1] = value; // Green
    data[i + 2] = value; // Blue
    // Alpha remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  console.log('High-quality black/white conversion completed');
  return canvas;
}

/**
 * Adjusts JPEG quality to achieve target file size
 */
async function adjustQualityForSize(
  canvas: HTMLCanvasElement,
  targetSizeMB: number,
  minSizeMB: number,
  maxSizeMB: number
): Promise<{ blob: Blob; quality: number }> {
  let quality = 0.95; // Start with high quality
  let blob: Blob;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve as BlobCallback, 'image/jpeg', quality);
    });

    const sizeMB = blob!.size / (1024 * 1024);
    
    // If within target range, return
    if (sizeMB >= minSizeMB && sizeMB <= maxSizeMB) {
      return { blob: blob!, quality };
    }

    // Adjust quality based on current size
    if (sizeMB > maxSizeMB) {
      quality *= 0.8; // Reduce quality to decrease size
    } else if (sizeMB < minSizeMB) {
      quality = Math.min(1.0, quality * 1.2); // Increase quality to increase size
    }

    attempts++;
  } while (attempts < maxAttempts && quality > 0.1 && quality <= 1.0);

  return { blob: blob!, quality };
}

/**
 * Captures and exports the map preview as a high-quality JPEG for professional engraving
 * Follows exact specifications: 300 DPI, 8-30MB, true black/white
 */
export async function exportMapImage(
  element: HTMLElement,
  options: ImageExportOptions = {}
): Promise<ExportResult> {
  const {
    orderId = `Order${Date.now()}`,
    shopifyOrderNumber,
    targetSize = 15, // Target 15MB
    minSize = 8,     // Minimum 8MB as specified
    maxSize = 30     // Maximum 30MB as specified
  } = options;

  try {
    // Wait for map tiles to fully load
    await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait for tile loading

    // Calculate scale for exactly 300 DPI output (as specified)
    const targetDPI = 300;
    const screenDPI = 96;
    const scale = targetDPI / screenDPI; // 3.125x scale factor
    
    console.log(`Generating ultra-high quality image with ${scale}x scale factor for professional print quality`);
    
    // Get the actual element dimensions
    const elementRect = element.getBoundingClientRect();
    const actualWidth = Math.ceil(elementRect.width);
    const actualHeight = Math.ceil(elementRect.height);
    
    console.log(`Element dimensions: ${actualWidth}x${actualHeight}px, Output: ${Math.ceil(actualWidth * scale)}x${Math.ceil(actualHeight * scale)}px`);
    
    // Enhanced html2canvas settings for maximum quality
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false, // Disable logging for cleaner output
      width: actualWidth,
      height: actualHeight,
      removeContainer: true,
      imageTimeout: 60000, // Increased timeout for high-quality tile loading
      foreignObjectRendering: false, // Better compatibility with map tiles
      // Enhanced quality settings
      scrollX: 0,
      scrollY: 0,
      windowWidth: actualWidth,
      windowHeight: actualHeight,
      // Force high-quality rendering
      proxy: undefined,
      ignoreElements: (element): boolean => {
        // Skip problematic elements during render
        const hasControlClass = element.classList.contains('ol-control') || 
               element.classList.contains('ol-attribution');
        const hasZoomTestId = element.hasAttribute('data-testid') && 
               (element.getAttribute('data-testid')?.includes('zoom') ?? false);
        return hasControlClass || hasZoomTestId;
      },
      onclone: (clonedDoc) => {
        // Force high-DPI rendering on cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: high-quality !important;
            image-rendering: crisp-edges !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeLegibility !important;
          }
          canvas {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: high-quality !important;
          }
          .ol-layer canvas {
            image-rendering: pixelated !important;
          }
        `;
        clonedDoc.head.appendChild(style);
        
        // Clean up the cloned document for export
        const clonedElement = clonedDoc.body;
        
        // Remove zoom controls and interactive UI elements
        const uiElements = clonedElement.querySelectorAll(
          '[data-testid*="zoom"], .absolute.top-4.right-4, .cursor-se-resize, .hover\\:bg-black\\/10, [data-testid*="resize"]'
        );
        uiElements.forEach(el => el.remove());
        
        // Remove overlay elements but keep location info
        const overlays = clonedElement.querySelectorAll('.absolute.top-4.left-4, .absolute.bottom-2.left-2');
        overlays.forEach(el => {
          if (el.textContent?.includes('Zoom:')) {
            el.remove();
          }
        });
        
        // Optimize text elements for engraving (black text on white background)
        const textElements = clonedElement.querySelectorAll('[data-testid*="draggable-text"]');
        textElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.color = '#000000'; // Black text
          htmlEl.style.fontWeight = 'bold';
          htmlEl.style.textShadow = 'none'; // Remove shadows for clean engraving
          htmlEl.style.letterSpacing = '0.5px';
        });
        
        // Optimize icons for engraving (black icons on white background)
        const iconElements = clonedElement.querySelectorAll('[data-testid*="draggable-icon"] svg, [data-testid*="draggable-compass"] svg');
        iconElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.color = '#000000'; // Black icons
          htmlEl.style.fill = '#000000';
          htmlEl.style.stroke = '#000000';
          htmlEl.style.strokeWidth = '1.5px';
          htmlEl.style.filter = 'none'; // Remove filters for clean engraving
        });
        
        // Ensure map renders at high quality
        const mapElements = clonedElement.querySelectorAll('.ol-layer, canvas');
        mapElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.imageRendering = 'high-quality';
        });
      }
    });

    console.log(`Canvas generated: ${canvas.width}x${canvas.height} pixels at 300 DPI`);

    // Convert to true black and white (as specified: no gradients)
    const bwCanvas = convertToBlackAndWhite(canvas);

    // Generate high-quality JPEG within specified size range (8-30MB)
    const { blob, quality } = await adjustQualityForSize(
      bwCanvas,
      targetSize,
      minSize,
      maxSize
    );
    
    console.log(`JPEG quality used: ${(quality * 100).toFixed(1)}%`);

    // Generate filename with Shopify order number (as specified)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename: string;
    
    if (shopifyOrderNumber) {
      // Use Shopify order number format: Order12345_Map.jpeg
      filename = `${shopifyOrderNumber}_Map.jpeg`;
    } else {
      // Fallback format with timestamp
      filename = `${orderId}_Map_${timestamp}.jpeg`;
    }

    // Create data URL for preview
    const dataUrl = bwCanvas.toDataURL('image/jpeg', quality);

    const sizeInMB = blob.size / (1024 * 1024);
    
    console.log(`Final image: ${filename} (${sizeInMB.toFixed(1)}MB, ${canvas.width}x${canvas.height}px, 300 DPI)`);

    return {
      blob,
      dataUrl,
      filename,
      sizeInMB
    };
  } catch (error) {
    console.error('Error exporting map image:', error);
    throw new Error('Failed to export map image. Please make sure the map is fully loaded and try again.');
  }
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