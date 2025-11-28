import React, { useEffect, useState } from 'react';
import { X, Calendar, Users, MapPin, Activity, Building, Sparkles, Loader2 } from 'lucide-react';

interface ClinicalTrialDetailModalProps {
  nctId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TrialDetail {
  nctId: string;
  title: string;
  officialTitle: string;
  status: string;
  phase: string;
  studyType: string;
  briefSummary: string;
  detailedDescription: string;
  conditions: string[];
  enrollment: number;
  startDate: string;
  completionDate: string;
  lastUpdateDate: string;
  sponsor: string;
  locations: Array<{
    facility?: string;
    city?: string;
    state?: string;
    country?: string;
  }>;
  eligibilityCriteria: string;
  sex: string;
  minimumAge: string;
  maximumAge: string;
}

export function ClinicalTrialDetailModal({ nctId, isOpen, onClose }: ClinicalTrialDetailModalProps) {
  const [trialData, setTrialData] = useState<TrialDetail | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && nctId) {
      fetchTrialDetail();
    }
  }, [isOpen, nctId]);

  const fetchTrialDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/clinical-trials/detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nct_id: nctId,
          language: 'ko'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial details');
      }

      const data = await response.json();
      setTrialData(data.trial);
      setAiSummary(data.aiSummary);
    } catch (err) {
      console.error('Error fetching trial detail:', err);
      setError('임상시험 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0px 8px 32px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-[24px]">
          <h2
            className="font-bold text-black"
            style={{ fontSize: '18px', fontFamily: 'Noto Sans KR, sans-serif' }}
          >
            임상시험 상세정보
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} color="#272727" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin mb-4" size={48} color="#00C9B7" />
              <p className="text-[#9CA3AF]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                임상시험 정보를 불러오는 중...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                {error}
              </p>
            </div>
          ) : trialData ? (
            <div className="space-y-6">
              {/* AI Summary Section */}
              {aiSummary && (
                <div
                  className="rounded-[16px] p-5"
                  style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #F9FAFB 100%)',
                    border: '1px solid #E0F2FE'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={20} color="#00C9B7" />
                    <h3
                      className="font-bold text-[#1F2937]"
                      style={{ fontSize: '15px', fontFamily: 'Noto Sans KR, sans-serif' }}
                    >
                      AI 요약
                    </h3>
                  </div>
                  <div
                    className="text-[#272727] whitespace-pre-line"
                    style={{ fontSize: '14px', lineHeight: '22px', fontFamily: 'Noto Sans KR, sans-serif' }}
                  >
                    {aiSummary}
                  </div>
                </div>
              )}

              {/* NCT ID and Status */}
              <div>
                <p className="text-[#9CA3AF] text-sm mb-2" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                  {trialData.nctId}
                </p>
                <h3
                  className="font-bold text-black mb-3"
                  style={{ fontSize: '17px', lineHeight: '26px', fontFamily: 'Noto Sans KR, sans-serif' }}
                >
                  {trialData.title}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{
                      backgroundColor: '#00C9B7',
                      fontFamily: 'Noto Sans KR, sans-serif'
                    }}
                  >
                    {trialData.status}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{
                      backgroundColor: '#9F7AEA',
                      fontFamily: 'Noto Sans KR, sans-serif'
                    }}
                  >
                    {trialData.phase}
                  </span>
                </div>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  icon={<Users size={18} color="#00C9B7" />}
                  label="참여자 수"
                  value={`${trialData.enrollment?.toLocaleString() || 'N/A'} 명`}
                />
                <InfoCard
                  icon={<Activity size={18} color="#00C9B7" />}
                  label="연구 유형"
                  value={trialData.studyType}
                />
                <InfoCard
                  icon={<Calendar size={18} color="#00C9B7" />}
                  label="시작일"
                  value={trialData.startDate || 'N/A'}
                />
                <InfoCard
                  icon={<Calendar size={18} color="#00C9B7" />}
                  label="완료 예정일"
                  value={trialData.completionDate || 'N/A'}
                />
                <InfoCard
                  icon={<Building size={18} color="#00C9B7" />}
                  label="주관 기관"
                  value={trialData.sponsor}
                />
                <InfoCard
                  icon={<MapPin size={18} color="#00C9B7" />}
                  label="진행 지역"
                  value={trialData.locations?.[0]?.country || 'Multiple'}
                />
              </div>

              {/* Conditions */}
              {trialData.conditions && trialData.conditions.length > 0 && (
                <Section title="대상 질환">
                  <div className="flex gap-2 flex-wrap">
                    {trialData.conditions.map((condition, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: '#EFF6FF',
                          color: '#00C9B7',
                          fontFamily: 'Noto Sans KR, sans-serif'
                        }}
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Brief Summary */}
              <Section title="연구 개요">
                <p
                  className="text-[#272727]"
                  style={{ fontSize: '14px', lineHeight: '22px', fontFamily: 'Noto Sans KR, sans-serif' }}
                >
                  {trialData.briefSummary}
                </p>
              </Section>

              {/* Detailed Description */}
              {trialData.detailedDescription && (
                <Section title="상세 설명">
                  <p
                    className="text-[#272727] whitespace-pre-line"
                    style={{ fontSize: '14px', lineHeight: '22px', fontFamily: 'Noto Sans KR, sans-serif' }}
                  >
                    {trialData.detailedDescription}
                  </p>
                </Section>
              )}

              {/* Eligibility */}
              <Section title="참여 자격">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-[#9CA3AF] text-sm mb-1">성별</p>
                      <p className="text-[#272727] font-medium">{trialData.sex || 'N/A'}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#9CA3AF] text-sm mb-1">연령</p>
                      <p className="text-[#272727] font-medium">
                        {trialData.minimumAge || 'N/A'} - {trialData.maximumAge || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {trialData.eligibilityCriteria && (
                    <div>
                      <p className="text-[#9CA3AF] text-sm mb-2">상세 기준</p>
                      <p
                        className="text-[#272727] whitespace-pre-line"
                        style={{ fontSize: '13px', lineHeight: '20px', fontFamily: 'Noto Sans KR, sans-serif' }}
                      >
                        {trialData.eligibilityCriteria}
                      </p>
                    </div>
                  )}
                </div>
              </Section>

              {/* Locations */}
              {trialData.locations && trialData.locations.length > 0 && (
                <Section title="연구 진행 기관">
                  <div className="space-y-2">
                    {trialData.locations.slice(0, 5).map((location, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-gray-50"
                      >
                        <p className="text-[#272727] font-medium text-sm">
                          {location.facility || 'N/A'}
                        </p>
                        <p className="text-[#9CA3AF] text-xs mt-1">
                          {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    ))}
                    {trialData.locations.length > 5 && (
                      <p className="text-[#9CA3AF] text-sm text-center pt-2">
                        외 {trialData.locations.length - 5}개 기관
                      </p>
                    )}
                  </div>
                </Section>
              )}

              {/* Last Update */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-[#9CA3AF] text-xs" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                  최종 업데이트: {trialData.lastUpdateDate || 'N/A'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[#9CA3AF] text-xs" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
          {label}
        </p>
      </div>
      <p
        className="text-[#272727] font-medium"
        style={{ fontSize: '14px', fontFamily: 'Noto Sans KR, sans-serif' }}
      >
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        className="font-bold text-[#1F2937] mb-3"
        style={{ fontSize: '15px', fontFamily: 'Noto Sans KR, sans-serif' }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}
