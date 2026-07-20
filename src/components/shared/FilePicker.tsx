import { useState, useRef } from 'react';
import { getStorageService } from '../../storage/StorageService';
import { compressImage, isAcceptedFile } from '../../utils/imageCompression';
import { generateId } from '../../utils/helpers';

interface FilePickerProps {
  onFileUploaded: (fileId: string, fileName: string) => void;
  onFileRemoved: () => void;
  fileId: string | null;
  fileName: string | null;
}

export default function FilePicker({ onFileUploaded, onFileRemoved, fileId, fileName }: FilePickerProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAcceptedFile(file)) return;

    setUploading(true);
    try {
      const blob = file.type.startsWith('image/') ? await compressImage(file) : file;
      const id = String(generateId());
      const svc = await getStorageService();
      await svc.storeFile(id, blob);
      onFileUploaded(id, file.name);
    } catch (err) {
      // [debug] console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (fileId && fileName) {
    return (
      <div className="flex items-center gap-2 bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2">
        <span className="text-sm text-txt-secondary truncate flex-1">{fileName}</span>
        <button
          type="button"
          onClick={onFileRemoved}
          className="text-txt-secondary/40 hover:text-red-400 text-xs cursor-pointer"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full bg-white/[0.04] border border-dashed border-border-subtle rounded-lg px-3 py-3 text-sm text-txt-secondary hover:text-txt-primary hover:border-brand/30 transition-colors cursor-pointer disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : '+ Attach file (image or PDF)'}
      </button>
    </div>
  );
}
