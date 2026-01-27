import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';
import { TodayProgress } from '../../../../types/queue';

describe('PageHeader', () => {
  const defaultProgress: TodayProgress = {
    contacted: { current: 3, total: 12 },
    followUps: { current: 1, total: 3 },
  };

  describe('rendering', () => {
    it('should display "Your Daily Queue" title', () => {
      render(<PageHeader todayProgress={defaultProgress} />);

      expect(screen.getByText('Your Daily Queue')).toBeInTheDocument();
    });

    it('should display subtitle text', () => {
      render(<PageHeader todayProgress={defaultProgress} />);

      expect(screen.getByText('Focus on high-priority leads first')).toBeInTheDocument();
    });

    it('should have heading role for title', () => {
      render(<PageHeader todayProgress={defaultProgress} />);

      expect(screen.getByRole('heading', { name: 'Your Daily Queue' })).toBeInTheDocument();
    });
  });

  describe('progress chip', () => {
    it('should display combined progress (current/total)', () => {
      render(<PageHeader todayProgress={defaultProgress} />);

      // Total current: 3 + 1 = 4
      // Total target: 12 + 3 = 15
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
      expect(screen.getByText('15 today')).toBeInTheDocument();
    });

    it('should show correct count when all zeros', () => {
      const zeroProgress: TodayProgress = {
        contacted: { current: 0, total: 0 },
        followUps: { current: 0, total: 0 },
      };

      render(<PageHeader todayProgress={zeroProgress} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0 today')).toBeInTheDocument();
    });

    it('should display correct progress when goal is met', () => {
      const completedProgress: TodayProgress = {
        contacted: { current: 12, total: 12 },
        followUps: { current: 3, total: 3 },
      };

      render(<PageHeader todayProgress={completedProgress} />);

      // Total current: 12 + 3 = 15
      // Total target: 12 + 3 = 15
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('15 today')).toBeInTheDocument();
    });

    it('should display progress when goal is exceeded', () => {
      const exceededProgress: TodayProgress = {
        contacted: { current: 15, total: 12 },
        followUps: { current: 5, total: 3 },
      };

      render(<PageHeader todayProgress={exceededProgress} />);

      // Total current: 15 + 5 = 20
      // Total target: 12 + 3 = 15
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('15 today')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle large numbers', () => {
      const largeProgress: TodayProgress = {
        contacted: { current: 100, total: 200 },
        followUps: { current: 50, total: 100 },
      };

      render(<PageHeader todayProgress={largeProgress} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('300 today')).toBeInTheDocument();
    });

    it('should handle partial completion', () => {
      const partialProgress: TodayProgress = {
        contacted: { current: 6, total: 12 },
        followUps: { current: 2, total: 3 },
      };

      render(<PageHeader todayProgress={partialProgress} />);

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('15 today')).toBeInTheDocument();
    });
  });
});
