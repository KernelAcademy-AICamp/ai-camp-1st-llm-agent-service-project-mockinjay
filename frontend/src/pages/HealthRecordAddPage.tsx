import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';

export function HealthRecordAddPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: '',
    hospital: '',
    creatinine: '',
    gfr: '',
    potassium: '',
    phosphorus: '',
    hemoglobin: '',
    albumin: '',
    pth: '',
    hco3: '',
    memo: ''
  });

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        // TODO: OCR API 연동
        handleOCRAnalysis(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOCRAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    // TODO: Backend OCR API 호출
    // const result = await fetch('/api/ocr/analyze', { ... });

    // Mock data for now
    setTimeout(() => {
      setFormData({
        ...formData,
        creatinine: '1.2',
        gfr: '65',
        potassium: '4.2',
        phosphorus: '3.8',
        hemoglobin: '12.5',
        albumin: '4.0',
        pth: '45',
        hco3: '24'
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      // Prepare data - convert empty strings to null for optional fields
      const payload = {
        date: formData.date,
        hospital: formData.hospital || '미입력',
        creatinine: parseFloat(formData.creatinine) || 0,
        gfr: parseFloat(formData.gfr) || 0,
        potassium: formData.potassium ? parseFloat(formData.potassium) : null,
        phosphorus: formData.phosphorus ? parseFloat(formData.phosphorus) : null,
        hemoglobin: formData.hemoglobin ? parseFloat(formData.hemoglobin) : null,
        albumin: formData.albumin ? parseFloat(formData.albumin) : null,
        pth: formData.pth ? parseFloat(formData.pth) : null,
        hco3: formData.hco3 ? parseFloat(formData.hco3) : null,
        memo: formData.memo || null
      };

      const response = await fetch('/api/health-records/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('저장되었습니다.');
        navigate('/mypage/test-results');
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.detail || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Failed to save health record', error);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="새 기록 추가" />

      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-2">
              검진 결과 이미지 업로드
            </label>
            <div className="border-2 border-dashed border-[#E0E0E0] rounded-xl p-8 text-center">
              {!uploadedImage ? (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={48} className="text-[#00C9B7]" />
                    <p className="text-sm text-[#666666]">
                      검진 결과지 사진을 업로드하세요
                    </p>
                    <p className="text-xs text-[#999999]">
                      AI가 자동으로 수치를 분석합니다
                    </p>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                  >
                    <X size={16} color="white" />
                  </button>
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <p className="text-white font-medium">AI 분석 중...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-2">검진 날짜</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7] bg-white"
            />
          </div>

          {/* Hospital */}
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-2">병원명</label>
            <input
              type="text"
              placeholder="병원 이름을 입력하세요"
              value={formData.hospital}
              onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
              className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
            />
          </div>

          {/* Health Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">크레아티닌</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.creatinine}
                onChange={(e) => setFormData({ ...formData, creatinine: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">eGFR</label>
              <input
                type="number"
                placeholder="0"
                value={formData.gfr}
                onChange={(e) => setFormData({ ...formData, gfr: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">칼륨(K) <span className="text-[#999999] text-xs">(선택)</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.potassium}
                onChange={(e) => setFormData({ ...formData, potassium: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">인(Phosphorus) <span className="text-[#999999] text-xs">(선택)</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.phosphorus}
                onChange={(e) => setFormData({ ...formData, phosphorus: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">헤모글로빈(Hb) <span className="text-[#999999] text-xs">(선택)</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.hemoglobin}
                onChange={(e) => setFormData({ ...formData, hemoglobin: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">알부민(Albumin) <span className="text-[#999999] text-xs">(선택)</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.albumin}
                onChange={(e) => setFormData({ ...formData, albumin: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">PTH(부갑상선호르몬) <span className="text-[#999999] text-xs">(선택)</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.pth}
                onChange={(e) => setFormData({ ...formData, pth: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">중탄산염(HCO3) <span className="text-[#999999] text-xs">(선택)</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.hco3}
                onChange={(e) => setFormData({ ...formData, hco3: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">메모</label>
            <textarea
              rows={3}
              placeholder="특이사항을 입력하세요"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7] resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/mypage/test-results')}
              className="flex-1 h-[52px] rounded-xl border border-[#E0E0E0] bg-white text-[#666666] font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 h-[52px] rounded-xl bg-[#00C9B7] text-white font-medium hover:bg-[#00B3A3]"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
