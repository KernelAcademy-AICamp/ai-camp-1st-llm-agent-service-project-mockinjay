import * as React from "react";
import { Trophy, Star, Zap, Target } from "lucide-react";
import { cn } from "./utils";
import { Progress } from "./progress";
import { Badge } from "./badge";

export interface LevelProgressProps {
  currentLevel: number;
  currentPoints: number;
  pointsToNextLevel: number;
  totalLevelPoints?: number;
  variant?: "circular" | "linear";
  className?: string;
  showAnimation?: boolean;
  size?: "sm" | "md" | "lg";
}

const levelIcons = {
  1: Star,
  2: Target,
  3: Zap,
  4: Trophy,
} as const;

const levelColors = {
  1: "from-gray-400 to-gray-600",
  2: "from-blue-400 to-blue-600",
  3: "from-purple-400 to-purple-600",
  4: "from-amber-400 to-amber-600",
} as const;

function LevelProgress({
  currentLevel,
  currentPoints,
  pointsToNextLevel,
  totalLevelPoints = pointsToNextLevel,
  variant = "linear",
  className,
  showAnimation = true,
  size = "md",
}: LevelProgressProps) {
  const [animatedPoints, setAnimatedPoints] = React.useState(0);
  const progressPercentage = Math.min(
    (currentPoints / totalLevelPoints) * 100,
    100,
  );

  // Animate points counter
  React.useEffect(() => {
    if (!showAnimation) {
      setAnimatedPoints(currentPoints);
      return;
    }

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = currentPoints / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedPoints(currentPoints);
        clearInterval(timer);
      } else {
        setAnimatedPoints(Math.floor(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentPoints, showAnimation]);

  const LevelIcon = levelIcons[currentLevel as keyof typeof levelIcons] || Star;
  const levelColor =
    levelColors[currentLevel as keyof typeof levelColors] || levelColors[1];

  const sizeClasses = {
    sm: {
      badge: "size-12",
      icon: "size-5",
      text: "text-xs",
      progress: "h-1.5",
    },
    md: {
      badge: "size-16",
      icon: "size-6",
      text: "text-sm",
      progress: "h-2",
    },
    lg: {
      badge: "size-20",
      icon: "size-8",
      text: "text-base",
      progress: "h-3",
    },
  };

  const sizes = sizeClasses[size];

  if (variant === "circular") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        {/* Circular Progress */}
        <div className="relative">
          <svg className="size-32 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#levelGradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(progressPercentage / 100) * 352} 352`}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000 ease-out",
                showAnimation && "animate-pulse",
              )}
            />
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="stop-color-primary-400" />
                <stop offset="100%" className="stop-color-primary-600" />
              </linearGradient>
            </defs>
          </svg>

          {/* Level Badge in Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "flex flex-col items-center justify-center",
                "rounded-full",
                "bg-gradient-to-br shadow-lg",
                levelColor,
                sizes.badge,
              )}
            >
              <LevelIcon className={cn("text-white", sizes.icon)} />
              <span className={cn("font-bold text-white", sizes.text)}>
                Lv.{currentLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Points Display */}
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <span
              className={cn(
                "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                "from-primary-500 to-primary-700",
                showAnimation && "transition-all duration-300",
              )}
            >
              {animatedPoints.toLocaleString()}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {" "}
              / {totalLevelPoints.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            다음 레벨까지 {pointsToNextLevel.toLocaleString()}P
          </p>
        </div>
      </div>
    );
  }

  // Linear Variant
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header with Level Badge and Points */}
      <div className="flex items-center justify-between gap-4">
        {/* Level Badge */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              "bg-gradient-to-br shadow-md",
              levelColor,
              sizes.badge,
            )}
          >
            <LevelIcon className={cn("text-white", sizes.icon)} />
          </div>

          <div className="flex flex-col">
            <Badge
              variant="outline"
              className="w-fit text-xs font-semibold border-primary-300 dark:border-primary-700"
            >
              Level {currentLevel}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {getLevelTitle(currentLevel)}
            </span>
          </div>
        </div>

        {/* Points Counter */}
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">보유 포인트</p>
          <p
            className={cn(
              "text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent",
              "from-primary-500 to-primary-700",
              showAnimation && "transition-all duration-300",
            )}
          >
            {animatedPoints.toLocaleString()}P
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={progressPercentage}
          className={cn(
            "bg-gray-200 dark:bg-gray-700",
            sizes.progress,
            showAnimation && "transition-all duration-1000",
          )}
        />

        {/* Progress Text */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {progressPercentage.toFixed(0)}% 달성
          </span>
          <span className="font-medium text-primary-600 dark:text-primary-400">
            다음 레벨까지 {pointsToNextLevel.toLocaleString()}P
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to get level title
function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: "신규 회원",
    2: "활동 회원",
    3: "우수 회원",
    4: "명예 회원",
    5: "마스터 회원",
  };
  return titles[level] || "회원";
}

export { LevelProgress };
