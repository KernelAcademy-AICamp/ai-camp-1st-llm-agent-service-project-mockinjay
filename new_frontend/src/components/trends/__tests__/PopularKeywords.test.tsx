/**
 * PopularKeywords Component Tests
 * Validates rendering, interaction, and accessibility
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PopularKeywords from '../PopularKeywords';

const mockKeywords = [
  { text: '당뇨병성 신증', count: 1245, rank: 1 },
  { text: '25년 복지 수당 신청', count: 1087, rank: 2 },
  { text: '저칼륨 식단', count: 924, rank: 3 },
  { text: '투석 관리', count: 856, rank: 4 },
];

describe('PopularKeywords', () => {
  describe('Rendering', () => {
    test('renders component with default keywords', () => {
      render(<PopularKeywords />);

      expect(screen.getByText('📈 인기 키워드')).toBeInTheDocument();
      expect(screen.getByText('당뇨병성 신증')).toBeInTheDocument();
      expect(screen.getByText('25년 복지 수당 신청')).toBeInTheDocument();
      expect(screen.getByText('저칼륨 식단')).toBeInTheDocument();
      expect(screen.getByText('투석 관리')).toBeInTheDocument();
    });

    test('renders component with custom keywords', () => {
      const customKeywords = [
        { text: '신장 이식', count: 500, rank: 1 },
        { text: 'CKD 단계', count: 300, rank: 2 },
      ];

      render(<PopularKeywords keywords={customKeywords} />);

      expect(screen.getByText('신장 이식')).toBeInTheDocument();
      expect(screen.getByText('CKD 단계')).toBeInTheDocument();
      expect(screen.queryByText('당뇨병성 신증')).not.toBeInTheDocument();
    });

    test('displays rank badges correctly', () => {
      const { container } = render(<PopularKeywords keywords={mockKeywords} />);

      const badges = container.querySelectorAll('.rounded-full.bg-\\[\\#EFF6FF\\]');
      expect(badges).toHaveLength(4);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    test('displays formatted counts correctly', () => {
      render(<PopularKeywords keywords={mockKeywords} />);

      expect(screen.getByText('1,245')).toBeInTheDocument();
      expect(screen.getByText('1,087')).toBeInTheDocument();
      expect(screen.getByText('924')).toBeInTheDocument();
      expect(screen.getByText('856')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    test('calls onKeywordClick when keyword is clicked', () => {
      const handleClick = jest.fn();
      render(<PopularKeywords onKeywordClick={handleClick} />);

      const firstKeyword = screen.getByText('당뇨병성 신증');
      fireEvent.click(firstKeyword.closest('div[role="button"]')!);

      expect(handleClick).toHaveBeenCalledWith('당뇨병성 신증');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles multiple keyword clicks', () => {
      const handleClick = jest.fn();
      render(<PopularKeywords onKeywordClick={handleClick} />);

      const firstKeyword = screen.getByText('당뇨병성 신증').closest('div[role="button"]')!;
      const secondKeyword = screen.getByText('저칼륨 식단').closest('div[role="button"]')!;

      fireEvent.click(firstKeyword);
      fireEvent.click(secondKeyword);

      expect(handleClick).toHaveBeenCalledTimes(2);
      expect(handleClick).toHaveBeenNthCalledWith(1, '당뇨병성 신증');
      expect(handleClick).toHaveBeenNthCalledWith(2, '저칼륨 식단');
    });

    test('does not show cursor pointer when onKeywordClick is not provided', () => {
      const { container } = render(<PopularKeywords />);

      const keywordCards = container.querySelectorAll('.p-4.rounded-lg');
      keywordCards.forEach(card => {
        expect(card).not.toHaveClass('cursor-pointer');
      });
    });

    test('shows cursor pointer when onKeywordClick is provided', () => {
      const { container } = render(<PopularKeywords onKeywordClick={() => {}} />);

      const keywordCards = container.querySelectorAll('.p-4.rounded-lg');
      keywordCards.forEach(card => {
        expect(card).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    test('handles Enter key press', () => {
      const handleClick = jest.fn();
      render(<PopularKeywords onKeywordClick={handleClick} />);

      const firstKeyword = screen.getByText('당뇨병성 신증').closest('div[role="button"]')!;
      fireEvent.keyDown(firstKeyword, { key: 'Enter', code: 'Enter' });

      expect(handleClick).toHaveBeenCalledWith('당뇨병성 신증');
    });

    test('handles Space key press', () => {
      const handleClick = jest.fn();
      render(<PopularKeywords onKeywordClick={handleClick} />);

      const firstKeyword = screen.getByText('당뇨병성 신증').closest('div[role="button"]')!;
      fireEvent.keyDown(firstKeyword, { key: ' ', code: 'Space' });

      expect(handleClick).toHaveBeenCalledWith('당뇨병성 신증');
    });

    test('does not trigger on other keys', () => {
      const handleClick = jest.fn();
      render(<PopularKeywords onKeywordClick={handleClick} />);

      const firstKeyword = screen.getByText('당뇨병성 신증').closest('div[role="button"]')!;
      fireEvent.keyDown(firstKeyword, { key: 'Tab', code: 'Tab' });

      expect(handleClick).not.toHaveBeenCalled();
    });

    test('has correct tabIndex when clickable', () => {
      render(<PopularKeywords onKeywordClick={() => {}} />);

      const firstKeyword = screen.getByText('당뇨병성 신증').closest('div[role="button"]')!;
      expect(firstKeyword).toHaveAttribute('tabIndex', '0');
    });

    test('does not have tabIndex when not clickable', () => {
      render(<PopularKeywords />);

      const firstKeyword = screen.getByText('당뇨병성 신증').closest('div[role="article"]')!;
      expect(firstKeyword).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<PopularKeywords keywords={mockKeywords} />);

      expect(screen.getByLabelText(/키워드: 당뇨병성 신증/)).toBeInTheDocument();
      expect(screen.getByLabelText(/검색 횟수: 1,245/)).toBeInTheDocument();
      expect(screen.getByLabelText(/순위: 1/)).toBeInTheDocument();
    });

    test('uses correct role when clickable', () => {
      render(<PopularKeywords onKeywordClick={() => {}} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('uses correct role when not clickable', () => {
      render(<PopularKeywords />);

      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(4);
    });
  });

  describe('Responsive Layout', () => {
    test('applies grid classes correctly', () => {
      const { container } = render(<PopularKeywords />);

      const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct rank badge styles', () => {
      const { container } = render(<PopularKeywords />);

      const rankBadges = container.querySelectorAll('.bg-\\[\\#EFF6FF\\]');
      rankBadges.forEach(badge => {
        expect(badge).toHaveClass('rounded-full');
        expect(badge).toHaveClass('text-[#00C8B4]');
        expect(badge).toHaveClass('font-bold');
      });
    });

    test('applies hover effects to cards', () => {
      const { container } = render(<PopularKeywords onKeywordClick={() => {}} />);

      const cards = container.querySelectorAll('.hover\\:shadow-md');
      expect(cards).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty keywords array', () => {
      render(<PopularKeywords keywords={[]} />);

      expect(screen.getByText('📈 인기 키워드')).toBeInTheDocument();
      expect(screen.queryByText('당뇨병성 신증')).not.toBeInTheDocument();
    });

    test('handles very large count numbers', () => {
      const largeCountKeywords = [
        { text: '인기 키워드', count: 1234567, rank: 1 },
      ];

      render(<PopularKeywords keywords={largeCountKeywords} />);

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    test('handles keywords with special characters', () => {
      const specialKeywords = [
        { text: '(특수) 문자-테스트_123', count: 100, rank: 1 },
      ];

      render(<PopularKeywords keywords={specialKeywords} />);

      expect(screen.getByText('(특수) 문자-테스트_123')).toBeInTheDocument();
    });
  });
});
