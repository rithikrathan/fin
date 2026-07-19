import imageCompression from 'browser-image-compression';

const MAX_SIZE_MB = 5;
const MAX_WIDTH = 1920;
const QUALITY = 0.8;

export async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH,
    useWebWorker: true,
    initialQuality: QUALITY,
  };

  return imageCompression(file, options);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

export function isAcceptedFile(file: File): boolean {
  return isImageFile(file) || isPdfFile(file);
}
