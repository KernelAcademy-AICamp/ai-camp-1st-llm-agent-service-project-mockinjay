/**
 * useImageUpload Hook
 * Manages image file upload with validation and memory cleanup
 */

import { useState, useCallback, useEffect } from 'react';
import { FILE_UPLOAD } from '../config/constants';
import { toast } from 'sonner';

export interface UseImageUploadReturn {
  selectedImage: File | null;
  imagePreview: string | null;
  isValidImage: boolean;
  error: string | null;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  clearImage: () => void;
  resetError: () => void;
}

export function useImageUpload(language: 'en' | 'ko' = 'ko'): UseImageUploadReturn {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate image file
   */
  const validateImage = useCallback((file: File): boolean => {
    // Check file type
    if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      const message = language === 'ko'
        ? '지원되는 이미지 형식: PNG, JPG, GIF'
        : 'Supported formats: PNG, JPG, GIF';
      setError(message);
      toast.error(message);
      return false;
    }

    // Check file size
    if (file.size > FILE_UPLOAD.MAX_FILE_SIZE) {
      const message = language === 'ko'
        ? `파일 크기는 ${FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다`
        : `File size must be less than ${FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`;
      setError(message);
      toast.error(message);
      return false;
    }

    return true;
  }, [language]);

  /**
   * Handle image file selection
   */
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (validateImage(file)) {
      // Clean up previous preview URL to prevent memory leak
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }

    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [imagePreview, validateImage]);

  /**
   * Handle drag and drop
   */
  const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (validateImage(file)) {
      // Clean up previous preview URL
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  }, [imagePreview, validateImage]);

  /**
   * Clear selected image and preview
   */
  const clearImage = useCallback(() => {
    // Clean up object URL to prevent memory leak
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  }, [imagePreview]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clean up object URL when component unmounts
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return {
    selectedImage,
    imagePreview,
    isValidImage: selectedImage !== null && error === null,
    error,
    handleImageSelect,
    handleImageDrop,
    clearImage,
    resetError,
  };
}
