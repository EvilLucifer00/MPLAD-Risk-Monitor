/**
 * Client-Side Image Pre-Compression Utility
 * Compresses oversized site inspection photos and estimate images before uploading.
 * Reduces upload payload by 70–90% while keeping blueprint text and numbers crisp.
 */

export async function compressImageFile(file, options = {}) {
  const {
    maxDimension = 1920,
    quality = 0.82,
    maxBytesToTrigger = 1024 * 1024, // 1 MB
  } = options;

  // Only compress raster images; pass through PDFs, SVGs, or already small files
  if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  if (file.size <= maxBytesToTrigger) {
    return file;
  }

  // Gracefully fallback in non-browser or mock environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  try {
    return await new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // Keep original if compression didn't reduce size
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  } catch {
    return file;
  }
}

export async function compressFiles(fileList, options = {}) {
  if (!Array.isArray(fileList)) return [];
  return Promise.all(fileList.map((f) => compressImageFile(f, options)));
}

