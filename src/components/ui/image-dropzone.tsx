import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
  onClearImage?: () => void;
  disabled?: boolean;
  maxSizeMB?: number;
  label?: string;
  aspectRatio?: string;
}

export function ImageDropzone({
  onImageSelect,
  currentImageUrl,
  onClearImage,
  disabled = false,
  maxSizeMB = 5,
  label = 'Drop image here or click to browse',
  aspectRatio = '3/4',
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return 'Only JPEG and PNG images are allowed';
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Image must be less than ${maxSizeMB}MB`;
    }

    return null;
  }, [maxSizeMB]);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onImageSelect(file);
  }, [validateFile, onImageSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };
    input.click();
  }, [disabled, handleFile]);

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors cursor-pointer overflow-hidden',
          isDragging && !disabled && 'border-primary bg-primary/5',
          !isDragging && !disabled && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          !currentImageUrl && 'p-8'
        )}
        style={{ aspectRatio: currentImageUrl ? aspectRatio : 'auto' }}
      >
        {currentImageUrl ? (
          <div className="relative w-full h-full group">
            <img
              src={currentImageUrl}
              alt="Uploaded"
              className="w-full h-full object-cover rounded-lg"
            />
            {!disabled && onClearImage && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearImage();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 rounded-full p-2 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            {isDragging ? (
              <>
                <Upload className="w-10 h-10 text-primary" />
                <p className="text-sm font-medium text-primary">Drop image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-gray-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-500">JPEG or PNG, max {maxSizeMB}MB</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
