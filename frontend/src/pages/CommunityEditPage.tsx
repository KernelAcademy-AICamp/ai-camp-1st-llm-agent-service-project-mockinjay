import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';

// TODO: API에서 게시글 데이터를 가져오도록 구현 필요
interface PostData {
  category: '자유' | '챌린지' | '설문조사' | '질문' | '정보';
  title: string;
  content: string;
  image?: string;
}

// 빈 게시글 데이터 저장소 (실제로는 API에서 가져옴)
const postDataStore: Record<string, PostData> = {};

export function CommunityEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const postData = postDataStore[id || ''];

  const [category, setCategory] = useState<'자유' | '챌린지' | '설문조사' | '질문' | '정보'>(postData?.category || '자유');
  const [title, setTitle] = useState(postData?.title || '');
  const [content, setContent] = useState(postData?.content || '');
  const [imagePreview, setImagePreview] = useState<string>(postData?.image || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    // Here you would normally send the data to your backend
    console.log({
      id,
      category,
      title,
      content,
      image: imagePreview
    });

    alert('게시글이 수정되었습니다!');
    navigate(`/community/detail/${id}`);
  };

  if (!postData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p>게시글을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-6" style={{ background: 'var(--color-bg-light)' }}>
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/community/detail/${id}`)}
            className="hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ color: 'var(--color-text-primary)' }}>글 수정</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block mb-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {(['자유', '챌린지', '설문조사', '질문', '정보'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="px-4 py-2 rounded-lg font-medium transition-all"
                    style={{
                      background: category === cat ? 'var(--color-primary)' : 'var(--color-bg-input)',
                      color: category === cat ? 'white' : 'var(--color-text-secondary)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block mb-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
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
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {title.length}/100
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block mb-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                className="input-field w-full resize-none"
                rows={10}
                maxLength={2000}
              />
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {content.length}/2000
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block mb-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                이미지 (선택)
              </label>
              
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ borderColor: 'var(--color-line-2)', background: 'var(--color-bg-input)' }}
                >
                  <ImageIcon size={32} color="var(--color-text-tertiary)" />
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    이미지를 선택하거나 드래그하세요
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={20} color="white" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/community/detail/${id}`)}
                className="flex-1 py-3 rounded-xl font-medium hover:opacity-80 transition-opacity"
                style={{ 
                  background: 'var(--color-bg-input)', 
                  color: 'var(--color-text-secondary)' 
                }}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)' }}
              >
                수정하기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
