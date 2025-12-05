import * as React from "react";
import {
  Bell,
  MessageSquare,
  Heart,
  Award,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { cn } from "./utils";
import { Switch } from "./switch";
import { Label } from "./label";
import { Separator } from "./separator";

export type NotificationType =
  | "all"
  | "comment"
  | "like"
  | "achievement"
  | "message"
  | "reminder"
  | "trending"
  | "community"
  | "education"
  | "system";

export interface NotificationSetting {
  id: string;
  type: NotificationType;
  label: string;
  description: string;
  enabled: boolean;
  category?: "activity" | "content" | "system";
}

interface NotificationToggleProps {
  setting: NotificationSetting;
  onChange: (id: string, enabled: boolean) => void;
  className?: string;
  compact?: boolean;
}

interface NotificationToggleGroupProps {
  settings: NotificationSetting[];
  onChange: (id: string, enabled: boolean) => void;
  className?: string;
  groupByCategory?: boolean;
  showCategoryHeaders?: boolean;
}

const notificationIcons: Record<NotificationType, React.ElementType> = {
  all: Bell,
  comment: MessageSquare,
  like: Heart,
  achievement: Award,
  message: Mail,
  reminder: Calendar,
  trending: TrendingUp,
  community: Users,
  education: BookOpen,
  system: AlertCircle,
};

const categoryLabels = {
  activity: "활동 알림",
  content: "콘텐츠 알림",
  system: "시스템 알림",
} as const;

function NotificationToggle({
  setting,
  onChange,
  className,
  compact = false,
}: NotificationToggleProps) {
  const Icon = notificationIcons[setting.type] || Bell;

  const handleToggle = (checked: boolean) => {
    onChange(setting.id, checked);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "transition-colors duration-200",
        compact && "p-3 gap-3",
        className,
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center size-10 rounded-full shrink-0",
          "bg-primary-50 dark:bg-primary-950/30",
          compact && "size-8",
        )}
      >
        <Icon
          className={cn(
            "size-5 text-primary-600 dark:text-primary-400",
            compact && "size-4",
          )}
          aria-hidden="true"
        />
      </div>

      {/* Label and Description */}
      <div className="flex-1 min-w-0 space-y-1">
        <Label
          htmlFor={`notification-${setting.id}`}
          className={cn(
            "text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer",
            compact && "text-xs",
          )}
        >
          {setting.label}
        </Label>
        {!compact && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {setting.description}
          </p>
        )}
      </div>

      {/* Switch */}
      <Switch
        id={`notification-${setting.id}`}
        checked={setting.enabled}
        onCheckedChange={handleToggle}
        aria-label={`${setting.label} 알림 ${setting.enabled ? "비활성화" : "활성화"}`}
      />
    </div>
  );
}

function NotificationToggleGroup({
  settings,
  onChange,
  className,
  groupByCategory = true,
  showCategoryHeaders = true,
}: NotificationToggleGroupProps) {
  // Group settings by category
  const groupedSettings = React.useMemo(() => {
    if (!groupByCategory) {
      return { all: settings };
    }

    const groups: Record<string, NotificationSetting[]> = {
      activity: [],
      content: [],
      system: [],
    };

    settings.forEach((setting) => {
      const category = setting.category || "system";
      if (groups[category]) {
        groups[category].push(setting);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [settings, groupByCategory]);

  const handleToggleAll = (enabled: boolean) => {
    settings.forEach((setting) => {
      onChange(setting.id, enabled);
    });
  };

  const allEnabled = settings.every((s) => s.enabled);
  const someEnabled = settings.some((s) => s.enabled);

  if (settings.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Bell className="size-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          알림 설정이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="size-5 text-gray-600 dark:text-gray-400" />
          <div>
            <Label
              htmlFor="notification-all"
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              모든 알림
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {allEnabled
                ? "모든 알림이 활성화되어 있습니다"
                : someEnabled
                  ? "일부 알림이 활성화되어 있습니다"
                  : "모든 알림이 비활성화되어 있습니다"}
            </p>
          </div>
        </div>
        <Switch
          id="notification-all"
          checked={allEnabled}
          onCheckedChange={handleToggleAll}
          aria-label="모든 알림 토글"
        />
      </div>

      <Separator />

      {/* Grouped Settings */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div key={category} className="space-y-2">
            {/* Category Header */}
            {showCategoryHeaders && groupByCategory && (
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4">
                {categoryLabels[category as keyof typeof categoryLabels] ||
                  category}
              </h3>
            )}

            {/* Settings in Category */}
            <div className="space-y-1">
              {categorySettings.map((setting) => (
                <NotificationToggle
                  key={setting.id}
                  setting={setting}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { NotificationToggle, NotificationToggleGroup };
export type { NotificationToggleProps, NotificationToggleGroupProps };
