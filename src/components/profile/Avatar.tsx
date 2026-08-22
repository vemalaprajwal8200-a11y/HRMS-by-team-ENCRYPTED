'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { uploadProfilePhoto, validateImageFile } from '@/lib/cloudinary';

interface AvatarProps {
  name: string;
  photoUrl?: string;
  /** When provided, the avatar becomes an uploader. */
  onUpload?: (url: string) => void;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  md: { box: 'w-10 h-10', text: 'text-sm', icon: 'w-3.5 h-3.5' },
  lg: { box: 'w-16 h-16', text: 'text-lg', icon: 'w-4 h-4' },
  xl: { box: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-2xl sm:text-3xl', icon: 'w-5 h-5' },
};

/**
 * Profile photo with graceful initials fallback. Pass `onUpload` to enable
 * click-to-upload (Cloudinary unsigned) with a progress overlay; the caller
 * persists the returned URL via PATCH.
 */
export function Avatar({ name, photoUrl, onUpload, size = 'md', className }: AvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brokenUrl, setBrokenUrl] = useState(false);

  const dims = SIZES[size];
  const uploading = progress !== null;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUpload) return;

    setError(null);

    const validation = validateImageFile(file);
    if (!validation.ok) {
      setError(validation.error ?? 'Invalid image.');
      window.setTimeout(() => setError(null), 4000);
      return;
    }

    setProgress(0);
    try {
      const { url } = await uploadProfilePhoto(file, ({ percent }) =>
        setProgress(percent)
      );
      onUpload(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
      window.setTimeout(() => setError(null), 5000);
    } finally {
      setProgress(null);
    }
  };

  const showPhoto = Boolean(photoUrl) && !brokenUrl;

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          dims.box,
          'rounded-full flex items-center justify-center font-bold overflow-hidden',
          showPhoto
            ? 'border border-surface-200 bg-surface-100 shadow-card'
            : 'bg-brand-600 text-white border-2 border-white ring-4 ring-brand-50 shadow-card'
        )}
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={`${name}'s profile photo`}
            onError={() => setBrokenUrl(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={dims.text}>{getInitials(name)}</span>
        )}
      </div>

      {uploading && (
        <div className="absolute inset-0 rounded-full bg-surface-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
          <Loader2 className={cn(dims.icon, 'text-white animate-spin')} />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white bg-surface-900/80 px-1 rounded">
            {progress}%
          </span>
        </div>
      )}

      {onUpload && !uploading && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title="Upload new photo (PNG/JPG, max 5MB)"
            aria-label="Upload profile photo"
            className={cn(
              'absolute bottom-0 right-0 p-1.5 rounded-full bg-brand-600 text-white shadow-card',
              'hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 ring-2 ring-white'
            )}
          >
            <Camera className="w-3 h-3" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {error && (
        <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap z-20 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md shadow-subtle">
          {error}
        </p>
      )}
    </div>
  );
}
