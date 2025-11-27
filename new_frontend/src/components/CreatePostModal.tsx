import React, { useState } from 'react';
import { X, ImageIcon } from 'lucide-react';
import { uploadImage } from '../services/communityApi';
import type { PostType } from '../services/communityApi';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; postType: PostType; imageUrls: string[] }) => Promise<void>;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('BOARD');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert('이미지는 최대 5개까지 업로드 가능합니다.');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images first
      // Upload images first
      const imageUrls: string[] = [];
      if (images.length > 0) {
        setIsUploading(true);
        try {
          const uploadPromises = images.map(image => uploadImage(image));
          const results = await Promise.all(uploadPromises);
          results.forEach(result => imageUrls.push(result.url));
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }
        setIsUploading(false);
      }

      // Submit post (with or without images)
      await onSubmit({ title, content, postType, imageUrls });

      // Reset form
      setTitle('');
      setContent('');
      setPostType('BOARD');
      setImages([]);
      setImagePreviews([]);
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const postTypeLabels: Record<PostType, string> = {
    BOARD: '자유',
    CHALLENGE: '챌린지',
    SURVEY: '설문조사',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-careplus-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-careplus-text-primary">게시글 작성</h2>
          <button
            onClick={onClose}
            className="text-careplus-text-muted hover:text-careplus-text-primary"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-careplus-text-primary mb-2">
              카테고리
            </label>
            <div className="flex gap-2">
              {(['BOARD', 'CHALLENGE', 'SURVEY'] as PostType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      postType === type
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-careplus-text-secondary hover:bg-gray-200'
                    }
                  `}
                >
                  {postTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-careplus-text-primary mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="input-field w-full"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-careplus-text-primary mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="input-field w-full min-h-[200px] resize-y"
              maxLength={2000}
            />
            <div className="text-xs text-careplus-text-muted mt-1 text-right">
              {content.length}/2000
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-careplus-text-primary mb-2">
              이미지 ({images.length}/5)
            </label>
            <div className="space-y-3">
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 5 && (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-careplus-border rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <ImageIcon size={20} className="text-careplus-text-muted" />
                  <span className="text-sm text-careplus-text-secondary">
                    이미지 선택 (최대 5개)
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || !title.trim() || !content.trim()}
            className="btn-primary w-full"
          >
            {isUploading ? '이미지 업로드 중...' : isSubmitting ? '작성 중...' : '게시글 작성'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
