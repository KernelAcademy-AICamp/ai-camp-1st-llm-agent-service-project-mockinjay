import { X } from 'lucide-react';

interface ClinicalTrialDetailModalProps {
  nctId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClinicalTrialDetailModal({ nctId, isOpen, onClose }: ClinicalTrialDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F2937]">임상시험 상세 정보</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} color="#6B7280" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4">NCT ID: {nctId}</p>
          <p className="text-gray-500">
            임상시험 상세 정보를 불러오는 중...
          </p>
          {/* TODO: Backend API에서 상세 정보 로드 */}
        </div>
      </div>
    </div>
  );
}

