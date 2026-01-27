import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressFooter } from '../ProgressFooter';
import { TodayProgress } from '../../../../types/queue';

describe('ProgressFooter', () => {
  const defaultProgress: TodayProgress = {
    contacted: { current: 3, total: 12 },
    followUps: { current: 1, total: 3 },
  };

  describe('rendering', () => {
    it('should display "Contacted Today" label', () => {
      render(<ProgressFooter progress={defaultProgress} />);

      expect(screen.getByText('Contacted Today')).toBeInTheDocument();
    });

    it('should display "Follow-Ups Completed" label', () => {
      render(<ProgressFooter progress={defaultProgress} />);

      expect(screen.getByText('Follow-Ups Completed')).toBeInTheDocument();
    });

    it('should display contacted progress', () => {
      render(<ProgressFooter progress={defaultProgress} />);

      expect(screen.getByText('3/12')).toBeInTheDocument();
    });

    it('should display follow-up progress', () => {
      render(<ProgressFooter progress={defaultProgress} />);

      expect(screen.getByText('1/3')).toBeInTheDocument();
    });
  });

  describe('connection status', () => {
    it('should display "Connected" when isConnected is true', () => {
      render(<ProgressFooter progress={defaultProgress} isConnected={true} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should display "Reconnecting..." when isConnected is false', () => {
      render(<ProgressFooter progress={defaultProgress} isConnected={false} />);

      expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    });

    it('should default to connected when isConnected is not provided', () => {
      render(<ProgressFooter progress={defaultProgress} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('progress bar values', () => {
    it('should show progress bars with correct values', () => {
      render(<ProgressFooter progress={defaultProgress} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBe(2);

      // First progress bar: 3/12 = 25%
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '25');

      // Second progress bar: 1/3 ≈ 33.33%
      expect(progressBars[1]).toHaveAttribute(
        'aria-valuenow',
        expect.stringMatching(/33/)
      );
    });
  });

  describe('completion states', () => {
    it('should handle completed contacted goal', () => {
      const completedProgress: TodayProgress = {
        contacted: { current: 12, total: 12 },
        followUps: { current: 1, total: 3 },
      };

      render(<ProgressFooter progress={completedProgress} />);

      expect(screen.getByText('12/12')).toBeInTheDocument();
    });

    it('should handle completed follow-up goal', () => {
      const completedProgress: TodayProgress = {
        contacted: { current: 3, total: 12 },
        followUps: { current: 3, total: 3 },
      };

      render(<ProgressFooter progress={completedProgress} />);

      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('should handle both goals completed', () => {
      const allCompletedProgress: TodayProgress = {
        contacted: { current: 12, total: 12 },
        followUps: { current: 3, total: 3 },
      };

      render(<ProgressFooter progress={allCompletedProgress} />);

      expect(screen.getByText('12/12')).toBeInTheDocument();
      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('should handle exceeded goals', () => {
      const exceededProgress: TodayProgress = {
        contacted: { current: 15, total: 12 },
        followUps: { current: 5, total: 3 },
      };

      render(<ProgressFooter progress={exceededProgress} />);

      expect(screen.getByText('15/12')).toBeInTheDocument();
      expect(screen.getByText('5/3')).toBeInTheDocument();
    });
  });

  describe('zero values', () => {
    it('should handle zero current and total', () => {
      const zeroProgress: TodayProgress = {
        contacted: { current: 0, total: 0 },
        followUps: { current: 0, total: 0 },
      };

      render(<ProgressFooter progress={zeroProgress} />);

      expect(screen.getAllByText('0/0').length).toBe(2);
    });

    it('should handle zero current with non-zero total', () => {
      const zeroCurrentProgress: TodayProgress = {
        contacted: { current: 0, total: 10 },
        followUps: { current: 0, total: 5 },
      };

      render(<ProgressFooter progress={zeroCurrentProgress} />);

      expect(screen.getByText('0/10')).toBeInTheDocument();
      expect(screen.getByText('0/5')).toBeInTheDocument();
    });
  });
});
