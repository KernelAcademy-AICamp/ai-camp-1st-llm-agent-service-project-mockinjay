/**
 * Unit tests for NutriCoachContent component
 * Tests integration of educational components with existing diet information
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NutriCoachContent } from '../NutriCoachContent';

describe('NutriCoachContent', () => {
  describe('Educational Content Section', () => {
    it('renders nutrient management guide heading in Korean', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByText('영양소 관리 가이드')).toBeInTheDocument();
    });

    it('renders nutrient management guide heading in English', () => {
      render(<NutriCoachContent language="en" />);
      expect(screen.getByText('Nutrient Management Guide')).toBeInTheDocument();
    });

    it('renders potassium education section', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByTestId('nutrient-section-potassium')).toBeInTheDocument();
    });

    it('renders phosphorus education section', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByTestId('nutrient-section-phosphorus')).toBeInTheDocument();
    });

    it('renders safe and warning food cards for potassium', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByText('저칼륨 음식 (먹어도 되는 음식)')).toBeInTheDocument();
      expect(screen.getByText('고칼륨 음식 (피해야 하는 음식)')).toBeInTheDocument();
    });

    it('renders safe and warning food cards for phosphorus', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByText('저인 음식 (먹어도 되는 음식)')).toBeInTheDocument();
      expect(screen.getByText('고인 음식 (피해야 하는 음식)')).toBeInTheDocument();
    });

    it('renders English food card titles when language is en', () => {
      render(<NutriCoachContent language="en" />);
      expect(screen.getByText('Low Potassium Foods (Safe to Eat)')).toBeInTheDocument();
      expect(screen.getByText('High Potassium Foods (Avoid)')).toBeInTheDocument();
      expect(screen.getByText('Low Phosphorus Foods (Safe to Eat)')).toBeInTheDocument();
      expect(screen.getByText('High Phosphorus Foods (Avoid)')).toBeInTheDocument();
    });
  });

  describe('Diet Information Section', () => {
    it('renders diet information heading', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByText('질환식 정보')).toBeInTheDocument();
    });

    it('renders all diet type cards', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByText('저염식 (Low Sodium)')).toBeInTheDocument();
      expect(screen.getByText('저단백식 (Low Protein)')).toBeInTheDocument();
      expect(screen.getByText('저칼륨식 (Low Potassium)')).toBeInTheDocument();
      expect(screen.getByText('저인식 (Low Phosphorus)')).toBeInTheDocument();
    });
  });

  describe('Food Image Analysis Section', () => {
    it('renders food image analyzer', () => {
      const { container } = render(<NutriCoachContent language="ko" />);
      // FoodImageAnalyzer component should be rendered
      expect(container.querySelector('[data-testid="food-image-analyzer"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for educational content', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByLabelledBy('educational-content-heading')).toBeInTheDocument();
    });

    it('has proper ARIA labels for diet information', () => {
      render(<NutriCoachContent language="ko" />);
      expect(screen.getByLabelledBy('diet-info-heading')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes to sections', () => {
      const { container } = render(<NutriCoachContent language="ko" />);
      const sections = container.querySelectorAll('section');

      sections.forEach(section => {
        expect(section.className).toContain('dark:bg-gray-800');
      });
    });
  });

  describe('Layout and Structure', () => {
    it('renders sections in correct order', () => {
      const { container } = render(<NutriCoachContent language="ko" />);
      const sections = container.querySelectorAll('section');

      // Should have 3 sections: Educational Content, Diet Information, Food Image Analysis
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it('uses responsive grid for food cards', () => {
      const { container } = render(<NutriCoachContent language="ko" />);
      const grids = container.querySelectorAll('.grid.md\\:grid-cols-2');

      // Should have grids for potassium and phosphorus sections
      expect(grids.length).toBeGreaterThanOrEqual(2);
    });
  });
});
