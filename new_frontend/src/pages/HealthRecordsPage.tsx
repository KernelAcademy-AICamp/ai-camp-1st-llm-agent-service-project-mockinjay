import { useState } from 'react';
import { Plus } from 'lucide-react';
import { MobileHeader } from '../components/layout/MobileHeader';

// Mock Data
const initialRecords = [
  {
    id: 1,
    date: '2025-02-20',
    hospital: '서울대학병원',
    creatinine: 1.2,
    gfr: 65,
    memo: '수치가 조금 좋아졌다.'
  },
  {
    id: 2,
    date: '2025-01-15',
    hospital: '신촌세브란스',
    creatinine: 1.4,
    gfr: 58,
    memo: ''
  }
];

export default function HealthRecordsPage() {
  const [records, setRecords] = useState(initialRecords);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: '',
    hospital: '',
    creatinine: '',
    gfr: '',
    systolic: '',
    diastolic: '',
    hemoglobin: '',
    potassium: '',
    phosphorus: '',
    calcium: '',
    memo: ''
  });

  const iconStyle = { strokeWidth: 2 };

  const handleEdit = (record: typeof initialRecords[0]) => {
    setFormData({
      date: record.date,
      hospital: record.hospital,
      creatinine: record.creatinine.toString(),
      gfr: record.gfr.toString(),
      systolic: '',
      diastolic: '',
      hemoglobin: '',
      potassium: '',
      phosphorus: '',
      calcium: '',
      memo: record.memo
    });
    setEditingId(record.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord = {
      id: editingId || Date.now(),
      date: formData.date,
      hospital: formData.hospital,
      creatinine: parseFloat(formData.creatinine),
      gfr: parseFloat(formData.gfr),
      memo: formData.memo
    };

    if (editingId) {
      setRecords(records.map(r => r.id === editingId ? newRecord : r));
    } else {
      setRecords([newRecord, ...records]);
    }

    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
       date: '', hospital: '', creatinine: '', gfr: '', systolic: '', diastolic: '', hemoglobin: '', potassium: '', phosphorus: '', calcium: '', memo: ''
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="병원 검진 기록" />

      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        {!isFormOpen ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-bold text-[#1F2937]">검진 기록</h2>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                     date: '', hospital: '', creatinine: '', gfr: '', systolic: '', diastolic: '', hemoglobin: '', potassium: '', phosphorus: '', calcium: '', memo: ''
                  });
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-1 text-[#00C9B7] font-medium"
              >
                <Plus size={20} style={iconStyle} />
                <span>기록 추가</span>
              </button>
            </div>

            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-5 rounded-xl border border-[#E0E0E0] bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#1F2937] mb-1">{record.date}</h3>
                      <p className="text-sm text-[#666666]">{record.hospital}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-xs px-2 py-1 border border-[#E0E0E0] rounded text-[#666666]"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-xs px-2 py-1 border border-[#E0E0E0] rounded text-[#EF4444]"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">크레아티닌</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.creatinine}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">eGFR</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.gfr}</div>
                    </div>
                  </div>

                  {record.memo && (
                    <div className="text-sm text-[#666666] bg-[#F9FAFB] p-3 rounded-lg">
                      {record.memo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
             <div>
               <h2 className="text-[18px] font-bold text-[#1F2937] mb-6">
                 {editingId ? '기록 수정' : '새 기록 추가'}
               </h2>

               <div className="space-y-4">
                 {/* Date */}
                 <div>
                   <label className="block text-sm font-medium text-[#1F2937] mb-2">검진 날짜</label>
                   <div className="relative">
                     <input
                       type="date"
                       required
                       value={formData.date}
                       onChange={(e) => setFormData({...formData, date: e.target.value})}
                       className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7] bg-white"
                     />
                   </div>
                 </div>

                 {/* Hospital */}
                 <div>
                   <label className="block text-sm font-medium text-[#1F2937] mb-2">병원명</label>
                   <input
                     type="text"
                     placeholder="병원 이름을 입력하세요"
                     value={formData.hospital}
                     onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                     className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
                   />
                 </div>

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
                 </div>

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
               </div>
             </div>

             <div className="flex gap-3 pt-4">
               <button
                 type="button"
                 onClick={() => setIsFormOpen(false)}
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
        )}
      </div>
    </div>
  );
}
