import html2canvas from 'html2canvas';

export interface ImageExportOptions {
  orderId?: string;
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
 * Converts an image to true black and white (no gradients)
 * White = land/text/icons, Black = water/engraved areas
 */
function convertToBlackAndWhite(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Enhanced threshold logic for better map conversion
  const threshold = 140; // Slightly higher threshold for cleaner separation
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a === 0) continue;
    
    // Calculate weighted luminance (optimized for map colors)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Enhanced conversion logic for map elements:
    // - Text and icons should be white (not engraved)
    // - Water areas should be black (engraved)
    // - Land should be white (not engraved)
    let value: number;
    
    // Check if this is likely a text/icon element (high contrast)
    const isHighContrast = (r > 200 && g > 200 && b > 200) || (r < 50 && g < 50 && b < 50);
    
    if (isHighContrast) {
      // For high contrast elements (text/icons), ensure they become white
      value = luminance > 50 ? 255 : 0;
    } else {
      // For map elements, use standard threshold
      value = luminance > threshold ? 255 : 0;
    }
    
    data[i] = value;     // Red
    data[i + 1] = value; // Green
    data[i + 2] = value; // Blue
    // Alpha remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
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
 * Captures and exports the map preview as a high-quality black and white image
 */
export async function exportMapImage(
  element: HTMLElement,
  options: ImageExportOptions = {}
): Promise<ExportResult> {
  const {
    orderId = `Order${Date.now()}`,
    targetSize = 15, // Target 15MB
    minSize = 8,     // Minimum 8MB
    maxSize = 30     // Maximum 30MB
  } = options;

  try {
    // Wait for any pending renders
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate scale for 300 DPI output
    // Standard screen DPI is ~96, so scale factor for 300 DPI is ~3.125
    const targetDPI = 300;
    const screenDPI = 96;
    const scale = targetDPI / screenDPI;
    
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
      removeContainer: true,
      onclone: (clonedDoc) => {
        // Clean up the cloned document for export
        const clonedElement = clonedDoc.body;
        
        // Remove zoom controls
        const zoomControls = clonedElement.querySelectorAll('[data-testid*="zoom"], .absolute.top-4.right-4');
        zoomControls.forEach(el => el.remove());
        
        // Remove resize handles and interactive elements
        const interactiveElements = clonedElement.querySelectorAll('.cursor-se-resize, .hover\\:bg-black\\/10, [data-testid*="resize"]');
        interactiveElements.forEach(el => el.remove());
        
        // Remove any overlay UI elements
        const overlays = clonedElement.querySelectorAll('.absolute.top-4.left-4, .absolute.bottom-2.left-2');
        overlays.forEach(el => {
          // Keep location info but remove zoom level indicators
          if (el.textContent?.includes('Zoom:')) {
            el.remove();
          }
        });
        
        // Ensure high contrast for text elements
        const textElements = clonedElement.querySelectorAll('[data-testid*="draggable-text"]');
        textElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.color = '#000000';
          htmlEl.style.textShadow = '2px 2px 4px #ffffff, -2px -2px 4px #ffffff, 2px -2px 4px #ffffff, -2px 2px 4px #ffffff';
          htmlEl.style.fontWeight = 'bold';
        });
        
        // Ensure high contrast for icons
        const iconElements = clonedElement.querySelectorAll('[data-testid*="draggable-icon"] svg, [data-testid*="draggable-compass"] svg');
        iconElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.color = '#000000';
          htmlEl.style.filter = 'drop-shadow(2px 2px 4px #ffffff) drop-shadow(-2px -2px 4px #ffffff) drop-shadow(2px -2px 4px #ffffff) drop-shadow(-2px 2px 4px #ffffff)';
        });
      }
    });

    // Convert to true black and white
    const bwCanvas = convertToBlackAndWhite(canvas);

    // Adjust quality to achieve target file size
    const { blob, quality } = await adjustQualityForSize(
      bwCanvas,
      targetSize,
      minSize,
      maxSize
    );

    // Generate filename with order ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${orderId}_Map_${timestamp}.jpeg`;

    // Create data URL for preview
    const dataUrl = bwCanvas.toDataURL('image/jpeg', quality);

    const sizeInMB = blob.size / (1024 * 1024);

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