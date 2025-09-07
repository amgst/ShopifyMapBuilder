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
 */
function convertToBlackAndWhite(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to true black and white with threshold
  const threshold = 128; // Luminance threshold
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply threshold: white for land/text/icons, black for water/engraved areas
    const value = luminance > threshold ? 255 : 0;
    
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
    orderId = 'CustomMap',
    targetSize = 15, // Target 15MB
    minSize = 8,     // Minimum 8MB
    maxSize = 30     // Maximum 30MB
  } = options;

  try {
    // Capture the element at high resolution for 300 DPI
    const scale = 4; // Scale factor for high resolution
    
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
      onclone: (clonedDoc) => {
        // Remove any interactive elements that shouldn't be in the final image
        const clonedElement = clonedDoc.querySelector('[data-html2canvas-ignore]');
        if (clonedElement) {
          clonedElement.remove();
        }
        
        // Remove zoom controls and other UI elements
        const zoomControls = clonedDoc.querySelectorAll('.absolute.top-4.right-4');
        zoomControls.forEach(el => el.remove());
        
        // Remove hover effects and resize handles
        const resizeHandles = clonedDoc.querySelectorAll('.cursor-se-resize');
        resizeHandles.forEach(el => el.remove());
        
        // Remove any hover states
        const hoverElements = clonedDoc.querySelectorAll('.hover\\:bg-black\\/10');
        hoverElements.forEach(el => {
          el.classList.remove('hover:bg-black/10');
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
    const filename = `Order${orderId}_Map_${timestamp}.jpeg`;

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
    throw new Error('Failed to export map image. Please try again.');
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