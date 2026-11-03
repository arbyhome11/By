/**
 * Client-side image compression utility
 * Resizes images down to a maximum width/height of ~1600px, preserves aspect ratio,
 * and outputs a compressed JPEG or WebP blob and data URL.
 */

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export async function compressImage(
  file: File | Blob,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2D rendering context'));
          return;
        }

        // Draw image onto canvas with smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Blob
        const outputMime = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            const dataUrl = canvas.toDataURL(outputMime, quality);
            resolve({
              blob,
              dataUrl,
              width,
              height,
              originalSize,
              compressedSize: blob.size,
            });
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image into element'));
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
