/**
 * ClinicalTrialCard Usage Example
 *
 * This file demonstrates how to use the ClinicalTrialCard component
 * in various scenarios.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ClinicalTrialCard from './ClinicalTrialCard';
import type { ClinicalTrial } from '../../types/trends';

// ==================== Example 1: Basic Usage ====================

export function BasicExample() {
  const navigate = useNavigate();

  const trial: ClinicalTrial = {
    nctId: 'NCT12345678',
    title: 'A Phase 3 Study of Novel Treatment for Chronic Kidney Disease',
    status: 'Recruiting',
    phase: 'Phase 3',
    conditions: ['Chronic Kidney Disease', 'Diabetes Mellitus Type 2'],
    interventions: ['Drug: Experimental Compound A', 'Drug: Placebo'],
    startDate: '2024-01-15',
    completionDate: '2026-12-31',
    sponsor: 'University Medical Center',
    briefSummary: 'This study evaluates the efficacy and safety of an experimental treatment.',
  };

  return (
    <ClinicalTrialCard
      trial={trial}
      onClick={() => navigate(`/trends/clinical-trial/${trial.nctId}`)}
    />
  );
}

// ==================== Example 2: With API Integration ====================

export function ClinicalTrialsTab() {
  const navigate = useNavigate();
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchClinicalTrials(currentPage);
  }, [currentPage]);

  const fetchClinicalTrials = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/clinical-trials/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: 'kidney',
          page: page,
          page_size: 10,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch clinical trials');

      const data = await response.json();
      setTrials(data.trials);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching clinical trials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrialClick = (nctId: string) => {
    navigate(`/trends/clinical-trial/${nctId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin mb-4" size={48} color="#00C9B7" />
        <p className="text-gray-500">임상시험 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div
        className="rounded-[16px] p-4 mb-6"
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F9FAFB 100%)',
          border: '1px solid #E0F2FE',
        }}
      >
        <p className="text-gray-700 text-sm leading-relaxed">
          신장 질환 관련 임상시험 정보를 ClinicalTrials.gov에서 제공받고 있습니다.
          각 임상시험을 클릭하면 AI가 요약한 정보를 확인할 수 있습니다.
        </p>
      </div>

      {/* Clinical Trials List */}
      <div className="grid grid-cols-1 gap-4">
        {trials.map((trial) => (
          <ClinicalTrialCard
            key={trial.nctId}
            trial={trial}
            onClick={() => handleTrialClick(trial.nctId)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: currentPage === 1 ? '#F3F4F6' : '#00C9B7',
              color: currentPage === 1 ? '#9CA3AF' : 'white',
            }}
          >
            이전
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-10 h-10 rounded-lg transition-colors"
                  style={{
                    backgroundColor: currentPage === pageNum ? '#00C9B7' : '#F3F4F6',
                    color: currentPage === pageNum ? 'white' : '#272727',
                    fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#00C9B7',
              color: currentPage === totalPages ? '#9CA3AF' : 'white',
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== Example 3: Grid Layout ====================

export function ClinicalTrialsGrid() {
  const navigate = useNavigate();
  const [trials] = useState<ClinicalTrial[]>([]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {trials.map((trial) => (
        <ClinicalTrialCard
          key={trial.nctId}
          trial={trial}
          onClick={() => navigate(`/trends/clinical-trial/${trial.nctId}`)}
        />
      ))}
    </div>
  );
}

// ==================== Example 4: With Custom Click Handler ====================

export function ClinicalTrialsWithModal() {
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [trials] = useState<ClinicalTrial[]>([
    // ... trial data
  ]);

  const handleTrialClick = (trial: ClinicalTrial) => {
    setSelectedTrial(trial);
    // Open modal or perform other action
  };

  return (
    <div className="space-y-4">
      {trials.map((trial) => (
        <ClinicalTrialCard
          key={trial.nctId}
          trial={trial}
          onClick={() => handleTrialClick(trial)}
        />
      ))}

      {/* Modal would go here */}
      {selectedTrial && (
        <div className="modal">
          {/* Modal content */}
        </div>
      )}
    </div>
  );
}
