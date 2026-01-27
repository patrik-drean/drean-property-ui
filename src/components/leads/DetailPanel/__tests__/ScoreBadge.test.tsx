import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreBadge } from '../ScoreBadge';

describe('ScoreBadge', () => {
  describe('rendering', () => {
    it('should display the score value', () => {
      render(<ScoreBadge score={8.5} />);

      expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('should display with one decimal place', () => {
      render(<ScoreBadge score={7} />);

      expect(screen.getByText('7.0')).toBeInTheDocument();
    });
  });

  describe('score labels', () => {
    it('should display EXCELLENT DEAL for score >= 9', () => {
      render(<ScoreBadge score={9.5} />);

      expect(screen.getByText('EXCELLENT DEAL')).toBeInTheDocument();
    });

    it('should display GOOD DEAL for score >= 7', () => {
      render(<ScoreBadge score={7.5} />);

      expect(screen.getByText('GOOD DEAL')).toBeInTheDocument();
    });

    it('should display FAIR DEAL for score >= 5', () => {
      render(<ScoreBadge score={5.5} />);

      expect(screen.getByText('FAIR DEAL')).toBeInTheDocument();
    });

    it('should display POOR DEAL for score < 5', () => {
      render(<ScoreBadge score={3.5} />);

      expect(screen.getByText('POOR DEAL')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('should render small size', () => {
      const { container } = render(<ScoreBadge score={8} size="small" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('should render medium size (default)', () => {
      const { container } = render(<ScoreBadge score={8} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '72');
      expect(svg).toHaveAttribute('height', '72');
    });

    it('should render large size', () => {
      const { container } = render(<ScoreBadge score={8} size="large" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '96');
      expect(svg).toHaveAttribute('height', '96');
    });
  });

  describe('showLabel prop', () => {
    it('should show label by default', () => {
      render(<ScoreBadge score={9} />);

      expect(screen.getByText('EXCELLENT DEAL')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<ScoreBadge score={9} showLabel={false} />);

      expect(screen.queryByText('EXCELLENT DEAL')).not.toBeInTheDocument();
    });
  });

  describe('SVG ring', () => {
    it('should have background circle', () => {
      const { container } = render(<ScoreBadge score={8} />);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2); // Background + progress
    });

    it('should have progress circle', () => {
      const { container } = render(<ScoreBadge score={8} />);

      const circles = container.querySelectorAll('circle');
      const progressCircle = circles[1];

      // Progress circle should have stroke-dasharray
      expect(progressCircle).toHaveAttribute('stroke-dasharray');
    });
  });

  describe('edge cases', () => {
    it('should handle score of 0', () => {
      render(<ScoreBadge score={0} />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('POOR DEAL')).toBeInTheDocument();
    });

    it('should handle score of 10', () => {
      render(<ScoreBadge score={10} />);

      expect(screen.getByText('10.0')).toBeInTheDocument();
      expect(screen.getByText('EXCELLENT DEAL')).toBeInTheDocument();
    });

    it('should handle boundary score of exactly 9', () => {
      render(<ScoreBadge score={9} />);

      expect(screen.getByText('EXCELLENT DEAL')).toBeInTheDocument();
    });

    it('should handle boundary score of exactly 7', () => {
      render(<ScoreBadge score={7} />);

      expect(screen.getByText('GOOD DEAL')).toBeInTheDocument();
    });

    it('should handle boundary score of exactly 5', () => {
      render(<ScoreBadge score={5} />);

      expect(screen.getByText('FAIR DEAL')).toBeInTheDocument();
    });
  });
});
