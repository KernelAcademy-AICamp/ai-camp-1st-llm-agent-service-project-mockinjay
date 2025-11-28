import { Bookmark } from 'lucide-react';

interface ClinicalTrial {
  nctId: string;
  title?: string;
  briefTitle?: string;
  status?: string;
  phase?: string;
  conditions?: string[];
  locations?: string[];
  [key: string]: any;
}

interface ClinicalTrialCardProps {
  trial: ClinicalTrial;
  onClick: () => void;
}

const STATUS_CLASSES: Record<string, string> = {
  recruiting: 'bg-green-100 text-green-800 border border-green-200',
  completed: 'bg-gray-100 text-gray-700 border border-gray-200',
  active: 'bg-blue-100 text-blue-700 border border-blue-200',
  terminated: 'bg-red-100 text-red-700 border border-red-200',
};

function getStatusBadgeClass(status?: string): string {
  if (!status) {
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  const normalized = status.toLowerCase();
  return STATUS_CLASSES[normalized] ?? 'bg-gray-100 text-gray-700 border border-gray-200';
}

export function ClinicalTrialCard({ trial, onClick }: ClinicalTrialCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[16px] p-5 cursor-pointer transition-shadow hover:shadow-lg border border-gray-200"
      style={{ boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-[#1F2937] text-[15px] flex-1 line-clamp-2">
          {trial.briefTitle || trial.title || '임상시험 제목 없음'}
        </h3>
        <Bookmark size={20} color="#CCCCCC" strokeWidth={1.4} />
      </div>

      {trial.status && (
        <div className="mb-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadgeClass(trial.status)}`}>
            {trial.status}
          </span>
        </div>
      )}

      {trial.phase && (
        <p className="text-sm text-gray-600 mb-2">
          단계: {trial.phase}
        </p>
      )}

      {trial.conditions && trial.conditions.length > 0 && (
        <p className="text-xs text-gray-500">
          대상 질환: {trial.conditions.join(', ')}
        </p>
      )}
    </div>
  );
}
