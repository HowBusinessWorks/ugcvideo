import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { uploadImageForVideo } from 'wasp/client/operations';
import axios from 'axios';

interface ImageUploadComponentProps {
  onImageUploaded: (imageUrl: string) => void;
  disabled?: boolean;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE_MB = 5;

export function ImageUploadComponent({ onImageUploaded, disabled }: ImageUploadComponentProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      return 'Please upload a JPEG or PNG image file.';
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Image size must be less than ${MAX_FILE_SIZE_MB}MB.`;
    }

    return null;
  };

  const getFileUploadFormData = (file: File, s3UploadFields: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(s3UploadFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file);
    return formData;
  };

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    // Create preview URL using base64 (avoids CSP blob URL issues)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setPreviewUrl(result);
      }
    };
    reader.readAsDataURL(file);

    try {
      // Get upload URL and public image URL from our backend
      console.log('Requesting upload URL for file:', file.name, file.type);
      // Normalize file type to ensure it matches our enum
      const normalizedFileType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
      
      const uploadResponse = await uploadImageForVideo({
        fileName: file.name,
        fileType: normalizedFileType as 'image/jpeg' | 'image/png',
      });
      
      console.log('Upload response:', uploadResponse);
      const { s3UploadUrl, s3UploadFields, publicImageUrl } = uploadResponse;

      // Upload to S3
      const formData = getFileUploadFormData(file, s3UploadFields);
      console.log('Uploading to S3:', s3UploadUrl);
      
      const response = await axios.post(s3UploadUrl, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percentage);
          }
        },
      });

      console.log('S3 upload response status:', response.status);
      if (response.status === 204) {
        console.log('Upload successful, calling onImageUploaded with:', publicImageUrl);
        onImageUploaded(publicImageUrl);
        setIsUploading(false);
      }
    } catch (uploadError: any) {
      console.error('Upload failed - full error:', uploadError);
      console.error('Error message:', uploadError.message);
      console.error('Error response:', uploadError.response?.data);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      if (uploadError.response?.status === 403) {
        errorMessage = 'Upload permission denied. Please check your authentication.';
      } else if (uploadError.response?.status === 400) {
        errorMessage = 'Invalid file format. Please use JPEG or PNG images.';
      } else if (uploadError.message) {
        errorMessage = `Upload failed: ${uploadError.message}`;
      }
      
      setError(errorMessage);
      setIsUploading(false);
      setUploadedFile(null);
      setPreviewUrl(null);
    }
  }, [onImageUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <Label>Reference Image</Label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : uploadedFile
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="p-6 text-center">
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading image...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : uploadedFile && previewUrl ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-40 rounded-lg object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-medium text-green-600">
                Image uploaded successfully!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <div>
                <p className="text-sm font-medium">
                  Drop an image here, or <span className="text-primary">click to browse</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports JPEG and PNG files up to {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}