import React from 'react';
import { Calendar, Users, MapPin, Activity } from 'lucide-react';

interface ClinicalTrialCardProps {
  trial: {
    nctId: string;
    title: string;
    status: string;
    phase: string;
    studyType: string;
    briefSummary: string;
    conditions: string[];
    enrollment: number;
    startDate: string;
    sponsor: string;
    locations: Array<{
      facility?: string;
      city?: string;
      country?: string;
    }>;
  };
  onClick: () => void;
}

const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('recruiting') || statusLower.includes('active')) {
    return '#00C9B7';
  } else if (statusLower.includes('completed')) {
    return '#9CA3AF';
  } else if (statusLower.includes('not yet')) {
    return '#FFB84D';
  }
  return '#777777';
};

const getPhaseColor = (phase: string): string => {
  if (phase.includes('3')) return '#9F7AEA';
  if (phase.includes('2')) return '#00C9B7';
  if (phase.includes('1')) return '#FFB84D';
  return '#E5E7EB';
};

export function ClinicalTrialCard({ trial, onClick }: ClinicalTrialCardProps) {
  const statusColor = getStatusColor(trial.status);
  const phaseColor = getPhaseColor(trial.phase);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[16px] p-5 cursor-pointer transition-all duration-200 hover:shadow-lg"
      style={{
        boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)',
        border: '1px solid #F3F4F6'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3
            className="font-bold text-black mb-2 line-clamp-2 hover:text-[#00C9B7] transition-colors"
            style={{
              fontSize: '15px',
              lineHeight: '22px',
              fontFamily: 'Noto Sans KR, sans-serif'
            }}
          >
            {trial.title}
          </h3>
          <p
            className="text-[#9CA3AF] text-xs mb-2"
            style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
          >
            {trial.nctId}
          </p>
        </div>
      </div>

      {/* Status and Phase Badges */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <span
          className="px-3 py-1 rounded-full text-white text-xs font-medium"
          style={{
            backgroundColor: statusColor,
            fontFamily: 'Noto Sans KR, sans-serif'
          }}
        >
          {trial.status}
        </span>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: phaseColor,
            color: trial.phase === 'N/A' ? '#9CA3AF' : 'white',
            fontFamily: 'Noto Sans KR, sans-serif'
          }}
        >
          {trial.phase}
        </span>
      </div>

      {/* Conditions */}
      {trial.conditions && trial.conditions.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-2 flex-wrap">
            {trial.conditions.slice(0, 3).map((condition, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-md text-xs"
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#00C9B7',
                  fontFamily: 'Noto Sans KR, sans-serif'
                }}
              >
                {condition}
              </span>
            ))}
            {trial.conditions.length > 3 && (
              <span
                className="px-2 py-1 rounded-md text-xs"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#9CA3AF',
                  fontFamily: 'Noto Sans KR, sans-serif'
                }}
              >
                +{trial.conditions.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <p
        className="text-[#272727] line-clamp-2 mb-4"
        style={{
          fontSize: '13px',
          lineHeight: '19px',
          fontFamily: 'Noto Sans KR, sans-serif'
        }}
      >
        {trial.briefSummary}
      </p>

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
        {/* Enrollment */}
        <div className="flex items-center gap-2">
          <Users size={14} color="#9CA3AF" />
          <span className="text-xs text-[#777777]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
            참여자: {trial.enrollment?.toLocaleString() || 'N/A'}
          </span>
        </div>

        {/* Start Date */}
        {trial.startDate && (
          <div className="flex items-center gap-2">
            <Calendar size={14} color="#9CA3AF" />
            <span className="text-xs text-[#777777]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
              {trial.startDate}
            </span>
          </div>
        )}

        {/* Study Type */}
        <div className="flex items-center gap-2">
          <Activity size={14} color="#9CA3AF" />
          <span className="text-xs text-[#777777]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
            {trial.studyType}
          </span>
        </div>

        {/* Location */}
        {trial.locations && trial.locations.length > 0 && (
          <div className="flex items-center gap-2">
            <MapPin size={14} color="#9CA3AF" />
            <span className="text-xs text-[#777777]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
              {trial.locations[0].country || trial.locations[0].city || 'Multiple'}
            </span>
          </div>
        )}
      </div>

      {/* Sponsor */}
      {trial.sponsor && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-[#9CA3AF]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
            주관: {trial.sponsor}
          </p>
        </div>
      )}
    </div>
  );
}
