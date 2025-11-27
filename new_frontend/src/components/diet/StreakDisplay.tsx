/**
 * StreakDisplay Component
 * Track logging streaks with calendar heatmap and achievements
 */

import { useMemo, memo } from 'react';
import { Flame, Trophy, Calendar as CalendarIcon, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { StreakData, CalendarDay, Achievement } from '../../types/diet';

interface StreakDisplayProps {
  streakData: StreakData;
  calendarDays: CalendarDay[];
  achievements?: Achievement[];
  language?: 'en' | 'ko';
}

/**
 * Get heatmap color based on compliance score
 */
function getHeatmapColor(logged: boolean, mealsLogged: number): string {
  if (!logged) return 'bg-muted';
  if (mealsLogged >= 3) return 'bg-green-600 dark:bg-green-500';
  if (mealsLogged >= 2) return 'bg-green-500 dark:bg-green-400';
  return 'bg-green-400 dark:bg-green-300';
}

/**
 * Calendar Heatmap Component
 */
const CalendarHeatmap = memo<{
  days: CalendarDay[];
  language: 'en' | 'ko';
}>(({ days, language }) => {
  const weeksData = useMemo(() => {
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === days.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return weeks;
  }, [days]);

  const weekDays = language === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-2">
      {/* Week day labels */}
      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground text-center mb-1">
        {weekDays.map((day, i) => (
          <div key={i}>{day}</div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1">
        {weeksData.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  aspect-square rounded-sm
                  ${getHeatmapColor(day.logged, day.mealsLogged)}
                  transition-colors
                  hover:ring-2 hover:ring-primary hover:ring-offset-1
                  cursor-pointer
                `}
                title={`${day.date}: ${day.mealsLogged} ${language === 'ko' ? '끼' : 'meals'}`}
                role="gridcell"
                aria-label={`${day.date}: ${day.logged ? `${day.mealsLogged} meals logged` : 'No meals logged'}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
        <span>{language === 'ko' ? '적음' : 'Less'}</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-muted" />
          <div className="w-4 h-4 rounded-sm bg-green-400 dark:bg-green-300" />
          <div className="w-4 h-4 rounded-sm bg-green-500 dark:bg-green-400" />
          <div className="w-4 h-4 rounded-sm bg-green-600 dark:bg-green-500" />
        </div>
        <span>{language === 'ko' ? '많음' : 'More'}</span>
      </div>
    </div>
  );
});

CalendarHeatmap.displayName = 'CalendarHeatmap';

/**
 * Achievement Badge Component
 */
const AchievementBadge = memo<{
  achievement: Achievement;
  language: 'en' | 'ko';
}>(({ achievement, language }) => {
  const isUnlocked = !!achievement.unlockedAt;
  const hasProgress = achievement.progress !== undefined && achievement.maxProgress !== undefined;

  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all
        ${isUnlocked
          ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
          : 'bg-muted/50 border-muted-foreground/10 opacity-60'
        }
      `}
      role="article"
      aria-label={`Achievement: ${achievement.title}`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-3xl ${isUnlocked ? 'grayscale-0' : 'grayscale'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">
            {achievement.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {achievement.description}
          </p>
          {hasProgress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {language === 'ko' ? '진행도' : 'Progress'}
                </span>
                <span className="font-medium">
                  {achievement.progress} / {achievement.maxProgress}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(achievement.progress! / achievement.maxProgress!) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-primary mt-2">
              {language === 'ko' ? '달성: ' : 'Unlocked: '}
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

AchievementBadge.displayName = 'AchievementBadge';

/**
 * Motivational Messages
 */
const motivationalMessages = {
  en: [
    'Keep up the great work!',
    'You\'re doing amazing!',
    'Every day counts!',
    'Stay consistent!',
    'You\'re on fire!',
  ],
  ko: [
    '잘하고 있어요!',
    '훌륭해요!',
    '매일 기록하는 습관이 중요해요!',
    '꾸준히 하세요!',
    '대단해요!',
  ],
};

/**
 * Streak Display Component
 * Features: current streak, calendar heatmap, achievement badges, motivational messages
 */
export const StreakDisplay = memo<StreakDisplayProps>(({
  streakData,
  calendarDays,
  achievements = [],
  language = 'en',
}) => {
  const t = useMemo(() => ({
    title: language === 'ko' ? '연속 기록' : 'Logging Streak',
    currentStreak: language === 'ko' ? '현재 연속 기록' : 'Current Streak',
    longestStreak: language === 'ko' ? '최고 기록' : 'Longest Streak',
    totalDays: language === 'ko' ? '총 기록일' : 'Total Days',
    days: language === 'ko' ? '일' : 'days',
    calendar: language === 'ko' ? '최근 30일 활동' : 'Last 30 Days Activity',
    achievements: language === 'ko' ? '성취 배지' : 'Achievements',
    noAchievements: language === 'ko' ? '아직 달성한 배지가 없습니다' : 'No achievements yet',
  }), [language]);

  const motivationalMessage = useMemo(() => {
    const messages = motivationalMessages[language];
    if (streakData.currentStreak === 0) {
      return language === 'ko' ? '오늘부터 시작해보세요!' : 'Start your journey today!';
    }
    if (streakData.currentStreak >= 30) {
      return language === 'ko' ? '놀라운 습관 형성!' : 'Incredible habit building!';
    }
    if (streakData.currentStreak >= 7) {
      return language === 'ko' ? '1주일 달성! 계속 이어가세요!' : 'One week strong! Keep going!';
    }
    return messages[Math.floor(Math.random() * messages.length)];
  }, [streakData.currentStreak, language]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Streak Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {streakData.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t.currentStreak}
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {streakData.longestStreak}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t.longestStreak}
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-center mb-2">
              <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {streakData.totalDays}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t.totalDays}
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <p className="text-center font-medium text-primary">
            {motivationalMessage}
          </p>
        </div>

        {/* Calendar Heatmap */}
        <div>
          <h4 className="font-semibold text-sm mb-3">{t.calendar}</h4>
          <CalendarHeatmap days={calendarDays} language={language} />
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              {t.achievements}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  language={language}
                />
              ))}
            </div>
          </div>
        )}

        {achievements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t.noAchievements}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StreakDisplay.displayName = 'StreakDisplay';
