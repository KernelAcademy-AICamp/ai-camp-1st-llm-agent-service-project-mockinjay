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

  const validateImage = useCallback((file: File): boolean => {
    if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type as typeof FILE_UPLOAD.ALLOWED_IMAGE_TYPES[number])) {
      const message = language === 'ko'
        ? '지원되는 이미지 형식: PNG, JPG, GIF'
        : 'Supported formats: PNG, JPG, GIF';
      setError(message);
      toast.error(message);
      return false;
    }

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

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (validateImage(file)) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }

    e.target.value = '';
  }, [imagePreview, validateImage]);

  const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (validateImage(file)) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  }, [imagePreview, validateImage]);

  const clearImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  }, [imagePreview]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
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
