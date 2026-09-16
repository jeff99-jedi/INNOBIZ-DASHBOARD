/**
 * Utility to convert image URLs (SVG, PNG, JPG, relative URLs, etc.) into a self-contained
 * Base64 PNG data URL or Base64 data string.
 * This guarantees that downloaded Word (.doc) files and printed documents display the company logo
 * and official seal offline without relying on external network requests or relative local paths.
 */

export async function convertImageUrlToBase64Png(
  url: string,
  maxWidth = 320,
  maxHeight = 160
): Promise<string> {
  if (!url) return '';

  // If already a raster base64 data URL (PNG/JPEG/GIF), return as is
  if (url.startsWith('data:image/png') || url.startsWith('data:image/jpeg') || url.startsWith('data:image/webp')) {
    return url;
  }

  // Resolve absolute URL for relative paths
  const absoluteUrl =
    url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')
      ? url
      : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;

  // Try Canvas rendering first (Rasterizes SVG into crisp standard PNG)
  try {
    const pngDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 4000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width || 200;
          let height = img.naturalHeight || img.height || 100;

          // Maintain aspect ratio within bounding box
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          // Optional: clear canvas with transparent background
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (e) => {
        clearTimeout(timeout);
        reject(e);
      };

      img.src = absoluteUrl;
    });

    if (pngDataUrl && pngDataUrl.length > 50) {
      return pngDataUrl;
    }
  } catch (canvasErr) {
    // If canvas fails (e.g. tainted or SVG parsing), attempt fetch -> blob -> Base64
    console.warn('Canvas rasterization failed, falling back to blob fetch:', canvasErr);
  }

  // Fallback: Fetch as Blob and convert to Base64 data URL
  try {
    const response = await fetch(absoluteUrl);
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64) return base64;
    }
  } catch (fetchErr) {
    console.warn('Blob fetch failed, falling back to absolute URL:', fetchErr);
  }

  return absoluteUrl;
}
