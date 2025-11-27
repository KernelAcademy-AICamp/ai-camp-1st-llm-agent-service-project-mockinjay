import * as React from "react";
import { ExternalLink, BookOpen, Building2, Hospital } from "lucide-react";
import { cn } from "../ui/utils";
import { Badge } from "../ui/badge";

export interface Source {
  id: string;
  title: string;
  url: string;
  type: "pubmed" | "kdca" | "ksn" | "mfds" | "guideline" | "other";
  author?: string;
  year?: string;
  journal?: string;
}

interface SourceCitationProps {
  sources: Source[];
  className?: string;
  compact?: boolean;
  maxVisible?: number;
}

const sourceIcons = {
  pubmed: { icon: BookOpen, label: "PubMed", color: "text-blue-600 dark:text-blue-400" },
  kdca: { icon: Building2, label: "질병관리청", color: "text-green-600 dark:text-green-400" },
  ksn: { icon: Hospital, label: "대한신장학회", color: "text-purple-600 dark:text-purple-400" },
  mfds: { icon: Building2, label: "식품의약품안전처", color: "text-orange-600 dark:text-orange-400" },
  guideline: { icon: BookOpen, label: "진료지침", color: "text-teal-600 dark:text-teal-400" },
  other: { icon: ExternalLink, label: "참고자료", color: "text-gray-600 dark:text-gray-400" },
} as const;

function SourceCitation({
  sources,
  className,
  compact = false,
  maxVisible = 3,
}: SourceCitationProps) {
  const [showAll, setShowAll] = React.useState(false);

  if (!sources || sources.length === 0) return null;

  const visibleSources = showAll ? sources : sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;

  return (
    <div
      className={cn(
        "mt-3 pt-3 border-t border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            참고문헌
          </span>
          {hasMore && !showAll && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              (총 {sources.length}개)
            </span>
          )}
        </div>

        {/* Sources List */}
        <div className="flex flex-wrap gap-2">
          {visibleSources.map((source, index) => {
            const iconConfig = sourceIcons[source.type];
            const Icon = iconConfig.icon;

            return (
              <a
                key={source.id || index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                  "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "hover:border-gray-300 dark:hover:border-gray-600",
                  "transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  compact && "px-2 py-1",
                )}
                aria-label={`${iconConfig.label}: ${source.title}`}
              >
                {/* Icon */}
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    iconConfig.color,
                    compact && "size-3",
                  )}
                  aria-hidden="true"
                />

                {/* Title */}
                <span
                  className={cn(
                    "text-xs font-medium text-gray-700 dark:text-gray-300",
                    "group-hover:text-gray-900 dark:group-hover:text-gray-100",
                    "max-w-[200px] truncate",
                    compact && "text-[11px] max-w-[150px]",
                  )}
                >
                  {source.title}
                </span>

                {/* External Link Icon */}
                <ExternalLink
                  className={cn(
                    "size-3 shrink-0 text-gray-400 dark:text-gray-500",
                    "group-hover:text-gray-600 dark:group-hover:text-gray-400",
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                  )}
                  aria-hidden="true"
                />

                {/* Source Type Badge (Optional) */}
                {!compact && source.year && (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 text-[10px] px-1 py-0"
                  >
                    {source.year}
                  </Badge>
                )}
              </a>
            );
          })}

          {/* Show More/Less Toggle */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
                "text-xs font-medium text-primary-600 dark:text-primary-400",
                "hover:bg-primary-50 dark:hover:bg-primary-950/30",
                "border border-dashed border-primary-300 dark:border-primary-700",
                "transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                compact && "px-2 py-1 text-[11px]",
              )}
              aria-label={showAll ? "참고문헌 접기" : "참고문헌 더보기"}
            >
              {showAll ? (
                <>
                  <span>접기</span>
                  <span className="text-[10px]">↑</span>
                </>
              ) : (
                <>
                  <span>+{sources.length - maxVisible}개 더보기</span>
                  <span className="text-[10px]">↓</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Full Citation Details (when not compact) */}
        {!compact && showAll && (
          <div className="mt-2 space-y-1.5">
            {visibleSources.map((source, index) => (
              <div
                key={`detail-${source.id || index}`}
                className="text-xs text-gray-600 dark:text-gray-400 pl-2 border-l-2 border-gray-200 dark:border-gray-700"
              >
                <span className="font-medium">{source.title}</span>
                {source.author && (
                  <span className="text-gray-500 dark:text-gray-500">
                    {" "}
                    - {source.author}
                  </span>
                )}
                {source.journal && (
                  <span className="text-gray-500 dark:text-gray-500 italic">
                    {" "}
                    ({source.journal}
                    {source.year && `, ${source.year}`})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { SourceCitation };
