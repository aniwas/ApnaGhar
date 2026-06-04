export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an image file for permitted types and size restrictions.
 * Allowed formats are constrained to JPG (jpeg), PNG, and WebP.
 * Size limit is capped at 5MB as per AWS S3 payload optimizations.
 */
export function validatePropertyImage(file: File): ImageValidationResult {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSizeBytes = 5 * 1024 * 1024; // 5 megabytes limit

  if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return {
      isValid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Please upload only JPG, PNG, or WebP.`
    };
  }

  if (file.size > maxFileSizeBytes) {
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size too large (${fileSizeInMB}MB). The maximum allowed size per image is 5.00MB.`
    };
  }

  return { isValid: true };
}

/**
 * Simulates a robust multipart upload process to an AWS S3 Bucket, triggering progress callbacks
 * and returning a secure public CDN distribution image fallback.
 */
export function uploadImageToAWS(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Read local file as DataURL initially to preserve the user's specific uploaded image!
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200";
      let currentPercent = 0;

      const interval = setInterval(() => {
        currentPercent += Math.floor(Math.random() * 25) + 15;
        if (currentPercent >= 100) {
          currentPercent = 100;
          onProgress(100);
          clearInterval(interval);
          resolve(dataUrl);
        } else {
          onProgress(currentPercent);
        }
      }, 150);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image bytes before AWS multipart chunking."));
    };

    reader.readAsDataURL(file);
  });
}
