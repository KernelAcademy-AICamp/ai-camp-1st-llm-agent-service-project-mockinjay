import React, { useState, useRef } from 'react';
import { uploadImage } from '../api/community.ts';

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // bytes
  maxTotalSize?: number; // bytes
}

interface UploadedImage {
  url: string;
  preview: string;
  file: File;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxTotalSize = 50 * 1024 * 1024, // 50MB
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type (only images)
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return false;
    }

    // Check file size
    if (file.size > maxFileSize) {
      setError(`파일 크기는 10MB 이하여야 합니다. (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return false;
    }

    return true;
  };

  const getTotalSize = (images: UploadedImage[], newFile: File): number => {
    const currentSize = images.reduce((sum, img) => sum + img.file.size, 0);
    return currentSize + newFile.size;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    if (files.length === 0) return;

    // Check max files
    if (uploadedImages.length + files.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 이미지만 업로드 가능합니다.`);
      return;
    }

    // Validate and upload files
    for (const file of files) {
      if (!validateFile(file)) {
        continue; // Skip invalid file, continue to next
      }

      if (getTotalSize(uploadedImages, file) > maxTotalSize) {
        setError('전체 파일 크기가 50MB를 초과합니다.');
        break; // Stop uploading if total size exceeds
      }

      // Upload file
      try {
        setUploading(true);
        const response = await uploadImage(file);

        // Create preview
        const preview = URL.createObjectURL(file);

        setUploadedImages((prev) => {
          const updated = [...prev, { url: response.url, preview, file }];
          onImagesChange(updated.map((img) => img.url));
          return updated;
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || '이미지 업로드 중 오류가 발생했습니다.';
        setError(errorMsg);
        console.error('Error uploading image:', err);
        break; // Stop uploading if one file fails
      } finally {
        setUploading(false);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      onImagesChange(updated.map((img) => img.url));
      return updated;
    });
    setError(null);
  };

  return (
    <div className="w-full">
      {/* File Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이미지 업로드 (최대 {maxFiles}개, 파일당 10MB, 총 50MB)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || uploadedImages.length >= maxFiles}
            className="hidden"
            aria-label="이미지 파일 선택"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || uploadedImages.length >= maxFiles}
            className="mx-auto flex items-center space-x-2 text-teal-500 hover:text-teal-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="font-medium">
              {uploading ? '업로드 중...' : '이미지 선택 또는 드래그'}
            </span>
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {uploadedImages.length}/{maxFiles}개 업로드됨
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {uploadedImages.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">업로드된 이미지</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.preview}
                  alt={`업로드 이미지 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`이미지 ${index + 1} 삭제`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
