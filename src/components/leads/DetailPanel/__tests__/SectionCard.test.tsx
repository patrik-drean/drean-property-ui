import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionCard } from '../SectionCard';

describe('SectionCard', () => {
  describe('rendering', () => {
    it('should display the title', () => {
      render(
        <SectionCard title="PROPERTY DETAILS">
          <div>Content</div>
        </SectionCard>
      );

      expect(screen.getByText('PROPERTY DETAILS')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <SectionCard title="Test Section">
          <span data-testid="child-content">Child Content</span>
        </SectionCard>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <SectionCard title="Test Section">
          <span data-testid="child-1">First</span>
          <span data-testid="child-2">Second</span>
        </SectionCard>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have proper container styling', () => {
      const { container } = render(
        <SectionCard title="Test">
          <div>Content</div>
        </SectionCard>
      );

      const card = container.firstChild;
      expect(card).toBeInTheDocument();
    });

    it('should have title with proper styling', () => {
      render(
        <SectionCard title="TITLE">
          <div>Content</div>
        </SectionCard>
      );

      const title = screen.getByText('TITLE');
      expect(title.tagName).toBe('H6'); // Typography subtitle2 renders as h6
    });
  });

  describe('edge cases', () => {
    it('should handle empty title', () => {
      render(
        <SectionCard title="">
          <div>Content</div>
        </SectionCard>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle no children', () => {
      const { container } = render(<SectionCard title="Test">{null}</SectionCard>);

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
