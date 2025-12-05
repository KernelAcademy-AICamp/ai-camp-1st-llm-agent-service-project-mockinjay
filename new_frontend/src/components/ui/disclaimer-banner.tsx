import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";

interface DisclaimerBannerProps {
  className?: string;
  message?: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  position?: "top" | "bottom";
}

function DisclaimerBanner({
  className,
  message = "본 답변은 의학적 진단이 아니며 참고용 정보입니다. 증상이 있는 경우 반드시 의료진과 상담하세요",
  onDismiss,
  dismissible = true,
  position = "bottom",
  ...props
}: DisclaimerBannerProps & React.ComponentProps<"div">) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!isVisible) return null;

  return (
    <div
      data-slot="disclaimer-banner"
      className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-300",
        position === "bottom" ? "bottom-0" : "top-0",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "bg-amber-50 dark:bg-amber-950/50 border-t-2 border-amber-400 dark:border-amber-600",
          "text-amber-900 dark:text-amber-100",
          "px-4 py-3 shadow-lg backdrop-blur-sm",
          "transition-all duration-300",
          isCollapsed && "py-2",
        )}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3">
            {/* Warning Icon */}
            <AlertTriangle
              className={cn(
                "size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5",
                isCollapsed && "size-4",
              )}
              aria-hidden="true"
            />

            {/* Message */}
            <div className="flex-1 min-w-0">
              {!isCollapsed && (
                <p className="text-sm font-medium leading-relaxed">
                  {message}
                </p>
              )}
              {isCollapsed && (
                <button
                  onClick={handleToggleCollapse}
                  className="text-xs font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  aria-label="면책조항 확장"
                >
                  면책조항 보기
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Mobile Collapse Toggle */}
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleCollapse}
                  className="md:hidden size-8 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  aria-label="면책조항 축소"
                >
                  <span className="text-xs">−</span>
                </Button>
              )}

              {/* Dismiss Button */}
              {dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="size-8 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  aria-label="면책조항 닫기"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DisclaimerBanner };
export type { DisclaimerBannerProps };
