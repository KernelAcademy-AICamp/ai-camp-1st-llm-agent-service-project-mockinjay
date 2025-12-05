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
        "mt-4 pt-4 border-t border-gray-100",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            참고문헌
          </span>
          {hasMore && !showAll && (
            <span className="text-xs text-gray-400">
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
                  "group inline-flex items-center gap-2 px-3 py-2 rounded-xl",
                  "bg-white border border-gray-100 shadow-sm",
                  "hover:bg-gray-50 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
                  "transition-all duration-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  compact && "px-2 py-1.5",
                )}
                aria-label={`${iconConfig.label}: ${source.title}`}
              >
                {/* Icon */}
                <div className={cn(
                  "p-1 rounded-full bg-gray-50 group-hover:bg-white transition-colors",
                  compact && "p-0.5"
                )}>
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      iconConfig.color,
                      compact && "size-3",
                    )}
                    aria-hidden="true"
                  />
                </div>

                {/* Title */}
                <span
                  className={cn(
                    "text-xs font-medium text-gray-700",
                    "group-hover:text-primary transition-colors",
                    "max-w-[200px] truncate",
                    compact && "text-[11px] max-w-[150px]",
                  )}
                >
                  {source.title}
                </span>

                {/* External Link Icon */}
                <ExternalLink
                  className={cn(
                    "size-3 shrink-0 text-gray-300",
                    "group-hover:text-primary/50",
                    "opacity-0 group-hover:opacity-100 transition-all duration-300",
                  )}
                  aria-hidden="true"
                />

                {/* Source Type Badge (Optional) */}
                {!compact && source.year && (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 text-[10px] px-1.5 py-0 h-5 bg-gray-50 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors border-0"
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
                "inline-flex items-center gap-1 px-3 py-2 rounded-xl",
                "text-xs font-medium text-primary",
                "bg-primary/5 hover:bg-primary/10",
                "border border-transparent hover:border-primary/20",
                "transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                compact && "px-2 py-1.5 text-[11px]",
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
          <div className="mt-3 space-y-2 animate-fade-in">
            {visibleSources.map((source, index) => (
              <div
                key={`detail-${source.id || index}`}
                className="text-xs text-gray-500 pl-3 border-l-2 border-primary/20 py-0.5"
              >
                <span className="font-medium text-gray-700 block mb-0.5">{source.title}</span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {source.author && (
                    <span>{source.author}</span>
                  )}
                  {source.journal && (
                    <span className="italic text-gray-400">
                      {source.author && " • "}
                      {source.journal}
                      {source.year && `, ${source.year}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { SourceCitation };

