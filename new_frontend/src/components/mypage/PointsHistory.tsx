import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  FileText,
  Award,
  Users,
  BookOpen,
  Gift,
  Calendar,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";

export interface PointTransaction {
  id: string;
  type: "earn" | "spend";
  amount: number;
  activity:
    | "quiz"
    | "post"
    | "comment"
    | "attendance"
    | "survey"
    | "referral"
    | "reward"
    | "purchase"
    | "other";
  description: string;
  date: string | Date;
  balance?: number;
}

interface PointsHistoryProps {
  transactions: PointTransaction[];
  className?: string;
  maxHeight?: string;
  showBalance?: boolean;
  groupByDate?: boolean;
}

const activityConfig = {
  quiz: {
    icon: Award,
    label: "퀴즈 완료",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  post: {
    icon: FileText,
    label: "게시글 작성",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  comment: {
    icon: MessageSquare,
    label: "댓글 작성",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  attendance: {
    icon: Calendar,
    label: "출석 체크",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  survey: {
    icon: BookOpen,
    label: "설문조사",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  referral: {
    icon: Users,
    label: "친구 초대",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
  },
  reward: {
    icon: Gift,
    label: "보상",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  purchase: {
    icon: TrendingDown,
    label: "포인트 사용",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  other: {
    icon: TrendingUp,
    label: "기타",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
} as const;

function PointsHistory({
  transactions,
  className,
  maxHeight = "500px",
  showBalance = true,
  groupByDate = true,
}: PointsHistoryProps) {
  // Group transactions by date if enabled
  const groupedTransactions = React.useMemo(() => {
    if (!groupByDate) return { all: transactions };

    const groups: Record<string, PointTransaction[]> = {};
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dateKey = date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return groups;
  }, [transactions, groupByDate]);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "오늘";
    if (diffInDays === 1) return "어제";
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return d.toLocaleDateString("ko-KR");
  };

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <TrendingUp className="size-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              포인트 내역이 없습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>포인트 내역</span>
          <Badge variant="outline" className="font-normal">
            총 {transactions.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([dateKey, items]) => (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                {groupByDate && (
                  <div className="sticky top-0 bg-card z-10 pb-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {dateKey}
                    </h4>
                  </div>
                )}

                {/* Transactions */}
                <div className="space-y-2">
                  {items.map((transaction) => {
                    const config = activityConfig[transaction.activity];
                    const Icon = config.icon;
                    const isEarned = transaction.type === "earn";

                    return (
                      <div
                        key={transaction.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                          "transition-colors duration-200",
                          "group",
                        )}
                      >
                        {/* Activity Icon */}
                        <div
                          className={cn(
                            "flex items-center justify-center size-10 rounded-full shrink-0",
                            config.bgColor,
                          )}
                        >
                          <Icon className={cn("size-5", config.color)} />
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {transaction.description}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 shrink-0",
                                config.color,
                              )}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {groupByDate
                              ? formatDate(transaction.date)
                              : formatRelativeDate(transaction.date)}
                          </p>
                        </div>

                        {/* Amount and Balance */}
                        <div className="text-right shrink-0">
                          <p
                            className={cn(
                              "text-sm font-bold",
                              isEarned
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            {isEarned ? "+" : "-"}
                            {transaction.amount.toLocaleString()}P
                          </p>
                          {showBalance && transaction.balance !== undefined && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              잔액 {transaction.balance.toLocaleString()}P
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export { PointsHistory };
