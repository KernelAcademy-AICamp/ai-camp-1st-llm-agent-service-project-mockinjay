import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { ClinicalTrial } from '../../types/trends';

interface ClinicalTrialCardProps {
  trial: ClinicalTrial;
}

const STATUS_CLASS_MAP: Record<string, string> = {
  recruiting: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'not yet recruiting': 'bg-amber-100 text-amber-800 border border-amber-200',
  'active, not recruiting': 'bg-blue-100 text-blue-800 border border-blue-200',
  completed: 'bg-slate-100 text-slate-700 border border-slate-200',
  terminated: 'bg-red-100 text-red-700 border border-red-200',
  suspended: 'bg-orange-100 text-orange-800 border border-orange-200',
  withdrawn: 'bg-rose-100 text-rose-800 border border-rose-200',
  'enrolling by invitation': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  'unknown status': 'bg-slate-100 text-slate-600 border border-slate-200',
};

const DEFAULT_STATUS_CLASS = 'bg-slate-100 text-slate-600 border border-slate-200';

const getStatusClass = (status?: string): string => {
  if (!status) {
    return DEFAULT_STATUS_CLASS;
  }

  const normalized = status.toLowerCase();
  return STATUS_CLASS_MAP[normalized] ?? DEFAULT_STATUS_CLASS;
};

const cleanList = (values?: string[]): string[] => {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
};

const summarizeLocations = (locations?: string[]): string => {
  const cleaned = cleanList(locations);
  if (!cleaned.length) {
    return 'Locations not yet specified';
  }

  const first = cleaned[0] ?? '';
  const rest = cleaned.slice(1);
  return rest.length ? `${first} + ${rest.length} more` : first;
};

const formatList = (values?: string[]): string => {
  const cleaned = cleanList(values);
  return cleaned.length ? cleaned.join(', ') : 'Not specified';
};

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Date TBD';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const ClinicalTrialCard: FC<ClinicalTrialCardProps> = ({ trial }) => {
  const [expanded, setExpanded] = useState(false);

  const statusClass = useMemo(() => getStatusClass(trial.status), [trial.status]);
  const locationSummary = useMemo(() => summarizeLocations(trial.locations), [trial.locations]);
  const conditionsLabel = useMemo(() => formatList(trial.conditions), [trial.conditions]);
  const startDateLabel = useMemo(() => formatDate(trial.startDate), [trial.startDate]);
  const completionDateLabel = useMemo(() => formatDate(trial.completionDate), [trial.completionDate]);

  const hasValidEnrollment = Number.isFinite(trial.enrollmentCount);
  const enrollmentLabel = hasValidEnrollment
    ? `${trial.enrollmentCount.toLocaleString()} participant${trial.enrollmentCount === 1 ? '' : 's'}`
    : 'Enrollment TBD';

  const hasUrl = Boolean(trial.url?.trim());
  const summaryText = trial.briefSummary?.trim() || 'Summary not provided.';
  const eligibilityText = trial.eligibilityCriteria?.trim() || 'Eligibility criteria not provided.';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">{trial.title || 'Untitled clinical trial'}</h3>
              <p className="text-xs text-slate-500">NCT ID: {trial.nctId || 'Unavailable'}</p>
              {hasUrl && (
                <a
                  href={trial.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  ClinicalTrials.gov listing
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass}`}>
              {trial.status || 'Status TBD'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Phase</p>
              <p className="font-medium text-slate-800">{trial.phase || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Sponsor</p>
              <p className="font-medium text-slate-800">{trial.sponsor || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Enrollment</p>
              <p className="font-medium text-slate-800">{enrollmentLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Conditions</p>
            <p className="font-medium text-slate-800">{conditionsLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Locations</p>
            <p className="font-medium text-slate-800">{locationSummary}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Start date</p>
            <p className="font-medium text-slate-800">{startDateLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Completion date</p>
            <p className="font-medium text-slate-800">{completionDateLabel}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
          >
            <span>{expanded ? 'Hide summary & eligibility' : 'View summary & eligibility'}</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Brief summary</p>
                <p className="mt-1 leading-relaxed">{summaryText}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Eligibility</p>
                <p className="mt-1 whitespace-pre-line leading-relaxed">{eligibilityText}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
