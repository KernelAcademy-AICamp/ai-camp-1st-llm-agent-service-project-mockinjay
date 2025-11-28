import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileHeader } from '../components/MobileHeader';

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
    // TODO: Backend API에서 데이터 로드
    const loadRecord = async () => {
      try {
        // const response = await api.get(`/api/health-records/${id}`);
        // setFormData(response.data);
      } catch (error) {
        console.error('Failed to load health record:', error);
      }
    };
    if (id) {
      loadRecord();
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Backend API 연동
    console.log('Update record:', id, formData);
    navigate('/mypage/test-results');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="검진 기록 수정" />
      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">병원명</label>
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">크레아티닌</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.creatinine}
                  onChange={(e) => setFormData({ ...formData, creatinine: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">eGFR</label>
                <input
                  type="number"
                  value={formData.gfr}
                  onChange={(e) => setFormData({ ...formData, gfr: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/mypage/test-results')}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 p-3 bg-[#00C8B4] text-white rounded-lg"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

