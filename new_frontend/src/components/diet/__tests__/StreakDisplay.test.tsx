/**
 * StreakDisplay Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakDisplay } from '../StreakDisplay';
import type { StreakData, CalendarDay, Achievement } from '../../../types/diet';

describe('StreakDisplay', () => {
  const mockStreakData: StreakData = {
    currentStreak: 7,
    longestStreak: 14,
    totalDays: 45,
    lastLoggedDate: '2024-01-15',
  };

  const mockCalendarDays: CalendarDay[] = Array.from({ length: 30 }, (_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    logged: i % 2 === 0,
    mealsLogged: i % 2 === 0 ? 3 : 0,
    complianceScore: i % 2 === 0 ? 90 : 0,
  }));

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Week',
      description: 'Logged meals for 7 consecutive days',
      icon: '🎉',
      unlockedAt: '2024-01-07',
    },
    {
      id: '2',
      title: 'Perfect Month',
      description: 'Complete all meals for 30 days',
      icon: '🏆',
      progress: 15,
      maxProgress: 30,
    },
  ];

  beforeEach(() => {
    // Reset any state if needed
  });

  it('renders streak statistics', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
      />
    );

    expect(screen.getByText('7')).toBeInTheDocument(); // Current streak
    expect(screen.getByText('14')).toBeInTheDocument(); // Longest streak
    expect(screen.getByText('45')).toBeInTheDocument(); // Total days
  });

  it('displays Korean labels when language is ko', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        language="ko"
      />
    );

    expect(screen.getByText(/연속 기록/)).toBeInTheDocument();
    expect(screen.getByText(/현재 연속 기록/)).toBeInTheDocument();
    expect(screen.getByText(/최고 기록/)).toBeInTheDocument();
    expect(screen.getByText(/총 기록일/)).toBeInTheDocument();
  });

  it('renders calendar heatmap', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
      />
    );

    expect(screen.getByText(/last 30 days activity/i)).toBeInTheDocument();

    // Should have grid cells for each day
    const gridCells = document.querySelectorAll('[role="gridcell"]');
    expect(gridCells.length).toBe(30);
  });

  it('displays week day labels', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
      />
    );

    // English labels
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('displays Korean week day labels when language is ko', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        language="ko"
      />
    );

    expect(screen.getByText('일')).toBeInTheDocument();
    expect(screen.getByText('월')).toBeInTheDocument();
    expect(screen.getByText('화')).toBeInTheDocument();
    expect(screen.getByText('수')).toBeInTheDocument();
    expect(screen.getByText('목')).toBeInTheDocument();
    expect(screen.getByText('금')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
  });

  it('shows motivational message based on streak', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
      />
    );

    // Should show a motivational message for 7-day streak
    const message = screen.getByText(/one week strong|keep going|amazing/i);
    expect(message).toBeInTheDocument();
  });

  it('shows special message for zero streak', () => {
    const zeroStreak: StreakData = {
      ...mockStreakData,
      currentStreak: 0,
    };

    render(
      <StreakDisplay
        streakData={zeroStreak}
        calendarDays={mockCalendarDays}
      />
    );

    expect(screen.getByText(/start your journey today/i)).toBeInTheDocument();
  });

  it('shows special message for 30+ day streak', () => {
    const longStreak: StreakData = {
      ...mockStreakData,
      currentStreak: 35,
    };

    render(
      <StreakDisplay
        streakData={longStreak}
        calendarDays={mockCalendarDays}
      />
    );

    expect(screen.getByText(/incredible habit building/i)).toBeInTheDocument();
  });

  it('displays achievements when provided', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        achievements={mockAchievements}
      />
    );

    expect(screen.getByText('First Week')).toBeInTheDocument();
    expect(screen.getByText('Perfect Month')).toBeInTheDocument();
  });

  it('shows unlocked achievement with date', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        achievements={mockAchievements}
      />
    );

    expect(screen.getByText(/unlocked:/i)).toBeInTheDocument();
  });

  it('shows achievement progress bar for incomplete achievements', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        achievements={mockAchievements}
      />
    );

    expect(screen.getByText(/progress/i)).toBeInTheDocument();
    expect(screen.getByText('15 / 30')).toBeInTheDocument();
  });

  it('displays no achievements message when list is empty', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        achievements={[]}
      />
    );

    expect(screen.getByText(/no achievements yet/i)).toBeInTheDocument();
  });

  it('displays achievement icons', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        achievements={mockAchievements}
      />
    );

    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('applies grayscale filter to locked achievements', () => {
    const { container } = render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        achievements={mockAchievements}
      />
    );

    // Locked achievement (Perfect Month) should have grayscale class
    const lockedAchievement = container.querySelector('.grayscale');
    expect(lockedAchievement).toBeInTheDocument();
  });

  it('renders heatmap legend', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
      />
    );

    expect(screen.getByText(/less/i)).toBeInTheDocument();
    expect(screen.getByText(/more/i)).toBeInTheDocument();
  });

  it('applies correct heatmap colors based on meals logged', () => {
    const { container } = render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
      />
    );

    // Should have cells with different bg colors based on meals logged
    const greenCells = container.querySelectorAll('[class*="bg-green"]');
    expect(greenCells.length).toBeGreaterThan(0);
  });

  it('provides accessible labels for calendar cells', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
      />
    );

    const gridCells = document.querySelectorAll('[role="gridcell"]');
    gridCells.forEach(cell => {
      expect(cell).toHaveAttribute('aria-label');
    });
  });

  it('provides accessible labels for achievements', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={mockCalendarDays}
        achievements={mockAchievements}
      />
    );

    const articles = screen.getAllByRole('article');
    articles.forEach(article => {
      expect(article).toHaveAttribute('aria-label');
    });
  });

  it('handles empty calendar days array', () => {
    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={[]}
      />
    );

    // Should render without errors
    expect(screen.getByText(/last 30 days activity/i)).toBeInTheDocument();
  });

  it('handles partial week in calendar', () => {
    const partialWeekDays: CalendarDay[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      logged: true,
      mealsLogged: 2,
    }));

    render(
      <StreakDisplay
        streakData={mockStreakData}
        calendarDays={partialWeekDays}
      />
    );

    const gridCells = document.querySelectorAll('[role="gridcell"]');
    expect(gridCells.length).toBe(10);
  });
});
