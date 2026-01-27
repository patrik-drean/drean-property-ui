import React from 'react';
import { render, screen } from '@testing-library/react';
import { GradeBadge } from '../GradeBadge';

describe('GradeBadge', () => {
  describe('rendering', () => {
    it('should display the grade letter', () => {
      render(<GradeBadge grade="B" />);

      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should uppercase the grade', () => {
      render(<GradeBadge grade="b" />);

      expect(screen.getByText('B')).toBeInTheDocument();
    });
  });

  describe('grade labels', () => {
    it('should display Excellent for grade A', () => {
      render(<GradeBadge grade="A" />);

      expect(screen.getByText(/Excellent-grade neighborhood/i)).toBeInTheDocument();
    });

    it('should display Good for grade B', () => {
      render(<GradeBadge grade="B" />);

      expect(screen.getByText(/Good-grade neighborhood/i)).toBeInTheDocument();
    });

    it('should display Average for grade C', () => {
      render(<GradeBadge grade="C" />);

      expect(screen.getByText(/Average-grade neighborhood/i)).toBeInTheDocument();
    });

    it('should display Below Avg for grade D', () => {
      render(<GradeBadge grade="D" />);

      expect(screen.getByText(/Below Avg-grade neighborhood/i)).toBeInTheDocument();
    });

    it('should display Poor for grade F', () => {
      render(<GradeBadge grade="F" />);

      expect(screen.getByText(/Poor-grade neighborhood/i)).toBeInTheDocument();
    });

    it('should display Unknown for invalid grade', () => {
      render(<GradeBadge grade="X" />);

      expect(screen.getByText(/Unknown-grade neighborhood/i)).toBeInTheDocument();
    });
  });

  describe('showLabel prop', () => {
    it('should show label by default', () => {
      render(<GradeBadge grade="A" />);

      expect(screen.getByText(/Excellent-grade neighborhood/i)).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<GradeBadge grade="A" showLabel={false} />);

      expect(screen.queryByText(/Excellent-grade neighborhood/i)).not.toBeInTheDocument();
    });

    it('should still show grade letter when label is hidden', () => {
      render(<GradeBadge grade="A" showLabel={false} />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty grade', () => {
      render(<GradeBadge grade="" />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle lowercase grades', () => {
      render(<GradeBadge grade="a" />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText(/Excellent-grade neighborhood/i)).toBeInTheDocument();
    });
  });
});
