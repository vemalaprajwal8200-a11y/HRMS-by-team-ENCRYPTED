/**
 * Cloudinary unsigned client-side upload.
 *
 * Setup (one time, ~2 min):
 *   1. Cloudinary Dashboard → Settings → Upload → Add upload preset.
 *   2. Name it e.g. "dayflow_avatars", set Signing Mode = Unsigned.
 *   3. Put the preset name + your cloud name in .env.local:
 *        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=dayflow_avatars
 *
 * The browser POSTs the file directly to Cloudinary; no server proxy needed.
 * The returned secure_url is what gets stored in profiles.photo_url via PATCH.
 */

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  return Boolean(
    cloudName &&
      preset &&
      !cloudName.includes('your-cloud-name') &&
      !preset.includes('your-preset')
  );
}

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Only image files (PNG, JPG, WEBP, GIF) are allowed.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Image is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: 'The selected file is empty.' };
  }
  return { ok: true };
}

export interface UploadProgress {
  /** 0–100 */
  percent: number;
}

/**
 * Upload an image to Cloudinary with progress reporting. Uses XHR because
 * fetch() cannot surface upload progress events.
 */
export function uploadProfilePhoto(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.ok) {
      reject(new Error(validation.error));
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!isCloudinaryConfigured()) {
      reject(
        new Error(
          'Photo upload is not configured. Ask the team admin to set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.'
        )
      );
      return;
    }

    const formData = new FormData();
    // Tag uploads so they are easy to clean up / audit in the Cloudinary dashboard.
    formData.append('folder', 'dayflow/avatars');
    formData.append('upload_preset', preset!);
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        });
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
          resolve({ url: response.secure_url as string });
        } else {
          reject(
            new Error(response?.error?.message || `Upload failed (${xhr.status}).`)
          );
        }
      } catch {
        reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Please try again.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));

    xhr.send(formData);
  });
}
