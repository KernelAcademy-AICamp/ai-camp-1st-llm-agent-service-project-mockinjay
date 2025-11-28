/**
 * NewsFeed Component Tests
 *
 * Test coverage:
 * - Component rendering
 * - Navigation behavior
 * - Bookmark functionality
 * - Keyboard accessibility
 * - Responsive design
 * - Custom props
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewsFeed, { type NewsItem } from '../NewsFeed';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ==================== Test Data ====================

const mockNewsItems: NewsItem[] = [
  {
    id: '1',
    title: '신장 건강 테스트 기사',
    source: '테스트 뉴스',
    time: '1시간 전',
    description: '이것은 테스트용 기사 설명입니다.',
    image: 'https://example.com/test-image.jpg',
  },
  {
    id: '2',
    title: '두 번째 테스트 기사',
    source: '헬스 뉴스',
    time: '2시간 전',
    description: '두 번째 테스트 기사의 설명입니다.',
    image: 'https://example.com/test-image-2.jpg',
  },
];

// ==================== Test Helpers ====================

const renderNewsFeed = (props = {}) => {
  return render(
    <BrowserRouter>
      <NewsFeed {...props} />
    </BrowserRouter>
  );
};

// ==================== Tests ====================

describe('NewsFeed Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderNewsFeed();
      expect(screen.getByRole('feed')).toBeInTheDocument();
    });

    it('should render default mock news items when no props provided', () => {
      renderNewsFeed();
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThan(0);
    });

    it('should render custom news items when provided', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
    });

    it('should display news titles correctly', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      expect(screen.getByText('신장 건강 테스트 기사')).toBeInTheDocument();
      expect(screen.getByText('두 번째 테스트 기사')).toBeInTheDocument();
    });

    it('should display news source and time', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      expect(screen.getByText(/테스트 뉴스.*1시간 전/)).toBeInTheDocument();
      expect(screen.getByText(/헬스 뉴스.*2시간 전/)).toBeInTheDocument();
    });

    it('should display news descriptions', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      expect(screen.getByText('이것은 테스트용 기사 설명입니다.')).toBeInTheDocument();
      expect(screen.getByText('두 번째 테스트 기사의 설명입니다.')).toBeInTheDocument();
    });

    it('should render images for each news item', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
    });

    it('should apply custom className when provided', () => {
      const { container } = renderNewsFeed({ className: 'custom-class' });
      const feedElement = container.querySelector('.custom-class');
      expect(feedElement).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to news detail page when card is clicked', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const firstArticle = screen.getAllByRole('article')[0];
      fireEvent.click(firstArticle);
      expect(mockNavigate).toHaveBeenCalledWith('/news/detail/1');
    });

    it('should navigate to correct detail page for different news items', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const articles = screen.getAllByRole('article');

      fireEvent.click(articles[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/news/detail/1');

      fireEvent.click(articles[1]);
      expect(mockNavigate).toHaveBeenCalledWith('/news/detail/2');
    });
  });

  describe('Bookmark Functionality', () => {
    it('should render bookmark buttons for each news item', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const bookmarkButtons = screen.getAllByLabelText(/북마크/);
      expect(bookmarkButtons).toHaveLength(2);
    });

    it('should toggle bookmark state when clicked', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const bookmarkButton = screen.getAllByLabelText('북마크 추가')[0];

      // Initially not bookmarked
      expect(bookmarkButton).toHaveAttribute('aria-pressed', 'false');

      // Click to bookmark
      fireEvent.click(bookmarkButton);
      expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('북마크 제거')).toBeInTheDocument();

      // Click again to unbookmark
      fireEvent.click(bookmarkButton);
      expect(bookmarkButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should not navigate when bookmark button is clicked', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const bookmarkButton = screen.getAllByLabelText('북마크 추가')[0];

      fireEvent.click(bookmarkButton);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should maintain independent bookmark states for different items', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const bookmarkButtons = screen.getAllByLabelText('북마크 추가');

      // Bookmark first item
      fireEvent.click(bookmarkButtons[0]);
      expect(bookmarkButtons[0]).toHaveAttribute('aria-pressed', 'true');
      expect(bookmarkButtons[1]).toHaveAttribute('aria-pressed', 'false');

      // Bookmark second item
      fireEvent.click(bookmarkButtons[1]);
      expect(bookmarkButtons[0]).toHaveAttribute('aria-pressed', 'true');
      expect(bookmarkButtons[1]).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be keyboard navigable with tab', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const articles = screen.getAllByRole('article');

      articles.forEach((article) => {
        expect(article).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should navigate on Enter key press', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const firstArticle = screen.getAllByRole('article')[0];

      fireEvent.keyDown(firstArticle, { key: 'Enter', code: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('/news/detail/1');
    });

    it('should navigate on Space key press', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const firstArticle = screen.getAllByRole('article')[0];

      fireEvent.keyDown(firstArticle, { key: ' ', code: 'Space' });
      expect(mockNavigate).toHaveBeenCalledWith('/news/detail/1');
    });

    it('should not navigate on other key presses', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const firstArticle = screen.getAllByRole('article')[0];

      fireEvent.keyDown(firstArticle, { key: 'a', code: 'KeyA' });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should have proper ARIA labels', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      expect(screen.getByRole('feed')).toHaveAttribute('aria-label', '신장 질환 관련 뉴스');
    });

    it('should have descriptive aria-label for each article', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const firstArticle = screen.getAllByRole('article')[0];
      expect(firstArticle).toHaveAttribute(
        'aria-label',
        '신장 건강 테스트 기사, 테스트 뉴스, 1시간 전'
      );
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct shadow styles', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const article = screen.getAllByRole('article')[0];
      expect(article).toHaveStyle({ boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)' });
    });

    it('should have rounded corners class', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const article = screen.getAllByRole('article')[0];
      expect(article).toHaveClass('rounded-[16px]');
    });

    it('should have hover shadow effect class', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const article = screen.getAllByRole('article')[0];
      expect(article).toHaveClass('hover:shadow-lg');
    });

    it('should have responsive flex direction classes', () => {
      renderNewsFeed({ newsItems: mockNewsItems });
      const article = screen.getAllByRole('article')[0];
      expect(article).toHaveClass('flex-col');
      expect(article).toHaveClass('md:flex-row');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty news items array', () => {
      renderNewsFeed({ newsItems: [] });
      const articles = screen.queryAllByRole('article');
      expect(articles).toHaveLength(0);
    });

    it('should handle news items with missing optional fields gracefully', () => {
      const incompleteItem: NewsItem = {
        id: '999',
        title: 'Test',
        source: 'Source',
        time: 'Now',
        description: 'Desc',
        image: '',
      };

      renderNewsFeed({ newsItems: [incompleteItem] });
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle very long titles with line-clamp', () => {
      const longTitleItem: NewsItem = {
        id: '999',
        title: 'A'.repeat(200),
        source: 'Source',
        time: 'Now',
        description: 'Desc',
        image: 'https://example.com/image.jpg',
      };

      renderNewsFeed({ newsItems: [longTitleItem] });
      const article = screen.getByRole('article');
      const title = article.querySelector('h4');
      expect(title).toHaveClass('line-clamp-2');
    });

    it('should handle very long descriptions with line-clamp', () => {
      const longDescItem: NewsItem = {
        id: '999',
        title: 'Title',
        source: 'Source',
        time: 'Now',
        description: 'B'.repeat(500),
        image: 'https://example.com/image.jpg',
      };

      renderNewsFeed({ newsItems: [longDescItem] });
      const article = screen.getByRole('article');
      const description = article.querySelector('p');
      expect(description).toHaveClass('line-clamp-3');
    });
  });

  describe('Performance', () => {
    it('should render large number of items without crashing', () => {
      const manyItems: NewsItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `Title ${i}`,
        source: 'Source',
        time: 'Now',
        description: `Description ${i}`,
        image: 'https://example.com/image.jpg',
      }));

      renderNewsFeed({ newsItems: manyItems });
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(100);
    });
  });
});
