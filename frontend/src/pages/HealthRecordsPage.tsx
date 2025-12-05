import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, X, ChevronDown } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function HealthRecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/health-records/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to fetch health records', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/mypage/test-results/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/health-records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setRecords(records.filter(r => r.id !== id));
        alert('삭제되었습니다.');
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete record', error);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="병원 검진 기록" />

      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Trend Chart */}
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-[#1F2937] mb-4">나의 신장 건강 그래프</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[...records].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="creatinine"
                    stroke="#00C8B4"
                    strokeWidth={3}
                    name="크레아티닌"
                    dot={{ fill: '#00C8B4', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gfr"
                    stroke="#9F7AEA"
                    strokeWidth={3}
                    name="eGFR"
                    dot={{ fill: '#9F7AEA', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="potassium"
                    stroke="#FFB84D"
                    strokeWidth={3}
                    name="칼륨"
                    dot={{ fill: '#FFB84D', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="phosphorus"
                    stroke="#EF4444"
                    strokeWidth={3}
                    name="인"
                    dot={{ fill: '#EF4444', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hemoglobin"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="헤모글로빈"
                    dot={{ fill: '#3B82F6', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-[#1F2937]">검진 기록</h2>
          </div>

          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="p-5 rounded-xl border border-[#E0E0E0] bg-white"
                style={{ boxShadow: 'none' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1F2937] mb-1">{record.date}</h3>
                    <p className="text-sm text-[#666666]">{record.hospital}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(record.id)}
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
                  {record.potassium && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">칼륨(K)</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.potassium}</div>
                    </div>
                  )}
                  {record.phosphorus && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">인(Phosphorus)</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.phosphorus}</div>
                    </div>
                  )}
                  {record.hemoglobin && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">헤모글로빈(Hb)</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.hemoglobin}</div>
                    </div>
                  )}
                  {record.albumin && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">알부민(Albumin)</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.albumin}</div>
                    </div>
                  )}
                  {record.pth && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">PTH(부갑상선호르몬)</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.pth}</div>
                    </div>
                  )}
                  {record.hco3 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-[#999999] mb-1">중탄산염(HCO3)</div>
                      <div className="text-[16px] font-bold text-[#1F2937]">{record.hco3}</div>
                    </div>
                  )}
                </div>

                {record.memo && (
                  <div className="text-sm text-[#666666] bg-[#F9FAFB] p-3 rounded-lg">
                    {record.memo}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* FAB Button */}
          <button
            onClick={() => navigate('/mypage/test-results/add')}
            className="fixed bottom-24 lg:bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-50"
            style={{ background: 'linear-gradient(135deg, rgb(0, 200, 180) 0%, rgb(159, 122, 234) 100%)' }}
          >
            <Plus size={28} color="white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
