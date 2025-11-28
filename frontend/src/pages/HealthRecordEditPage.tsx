import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileHeader } from '../components/MobileHeader';

// Mock data - 실제로는 API에서 가져와야 함
const mockRecords = [
  {
    id: 1,
    date: '2025-02-20',
    hospital: '서울대학병원',
    creatinine: 1.2,
    gfr: 65,
    potassium: 4.2,
    phosphorus: 3.8,
    hemoglobin: 12.5,
    albumin: 4.0,
    pth: 45,
    hco3: 24,
    memo: '수치가 조금 좋아졌다.'
  },
  {
    id: 2,
    date: '2025-01-15',
    hospital: '신촌세브란스',
    creatinine: 1.4,
    gfr: 58,
    potassium: 4.5,
    phosphorus: 4.1,
    hemoglobin: 11.8,
    albumin: 3.9,
    pth: 52,
    hco3: 22,
    memo: ''
  }
];

export function HealthRecordEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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

  useEffect(() => {
    // TODO: API에서 데이터 가져오기
    const record = mockRecords.find(r => r.id === Number(id));
    if (record) {
      setFormData({
        date: record.date,
        hospital: record.hospital,
        creatinine: record.creatinine.toString(),
        gfr: record.gfr.toString(),
        potassium: record.potassium?.toString() || '',
        phosphorus: record.phosphorus?.toString() || '',
        hemoglobin: record.hemoglobin?.toString() || '',
        albumin: record.albumin?.toString() || '',
        pth: record.pth?.toString() || '',
        hco3: record.hco3?.toString() || '',
        memo: record.memo
      });
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Backend API 연동
    // await fetch(`/api/health-records/${id}`, { method: 'PUT', body: formData });

    navigate('/mypage/test-results');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="기록 수정" />

      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-2">검진 날짜</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
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
              onChange={(e) => setFormData({...formData, hospital: e.target.value})}
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
                onChange={(e) => setFormData({...formData, creatinine: e.target.value})}
                className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">eGFR</label>
              <input
                type="number"
                placeholder="0"
                value={formData.gfr}
                onChange={(e) => setFormData({...formData, gfr: e.target.value})}
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
                onChange={(e) => setFormData({...formData, potassium: e.target.value})}
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
                onChange={(e) => setFormData({...formData, phosphorus: e.target.value})}
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
                onChange={(e) => setFormData({...formData, hemoglobin: e.target.value})}
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
                onChange={(e) => setFormData({...formData, albumin: e.target.value})}
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
                onChange={(e) => setFormData({...formData, pth: e.target.value})}
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
                onChange={(e) => setFormData({...formData, hco3: e.target.value})}
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
              onChange={(e) => setFormData({...formData, memo: e.target.value})}
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
