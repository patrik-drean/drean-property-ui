import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfidenceBadge, percentageToLevel } from '../ConfidenceBadge';

describe('ConfidenceBadge', () => {
  describe('AI source with enum levels', () => {
    it('shows "Low Confidence" for low level', () => {
      render(<ConfidenceBadge confidence="low" source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('shows "Medium Confidence" for medium level', () => {
      render(<ConfidenceBadge confidence="medium" source="ai" />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('shows "High Confidence" for high level', () => {
      render(<ConfidenceBadge confidence="high" source="ai" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });
  });

  describe('AI source with percentage (legacy)', () => {
    it('should display High Confidence for >= 80%', () => {
      render(<ConfidenceBadge confidence={85} source="ai" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should display Medium Confidence for 50-79%', () => {
      render(<ConfidenceBadge confidence={65} source="ai" />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('should display Low Confidence for < 50%', () => {
      render(<ConfidenceBadge confidence={35} source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });
  });

  describe('source types', () => {
    it('should display Manual Override for manual source', () => {
      render(<ConfidenceBadge source="manual" />);
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
    });

    it('should display RentCast Verified for rentcast source', () => {
      render(<ConfidenceBadge source="rentcast" />);
      expect(screen.getByText('RentCast Verified')).toBeInTheDocument();
    });

    it('ignores confidence when source is manual', () => {
      render(<ConfidenceBadge confidence={85} source="manual" />);
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
      expect(screen.queryByText(/Confidence/)).not.toBeInTheDocument();
    });

    it('ignores confidence when source is rentcast', () => {
      render(<ConfidenceBadge confidence={85} source="rentcast" />);
      expect(screen.getByText('RentCast Verified')).toBeInTheDocument();
      expect(screen.queryByText(/Confidence/)).not.toBeInTheDocument();
    });
  });

  describe('indicator dot', () => {
    it('should render the indicator dot', () => {
      const { container } = render(<ConfidenceBadge confidence="high" source="ai" />);
      // Find the dot element (small box with border-radius)
      const dot = container.querySelector('[class*="MuiBox-root"]');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should display Low Confidence when no confidence or source', () => {
      render(<ConfidenceBadge />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('should display Low Confidence when confidence is undefined', () => {
      render(<ConfidenceBadge confidence={undefined} source={undefined} />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('should handle boundary confidence of exactly 80 as High', () => {
      render(<ConfidenceBadge confidence={80} source="ai" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should handle boundary confidence of exactly 50 as Medium', () => {
      render(<ConfidenceBadge confidence={50} source="ai" />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('should handle boundary confidence of 49 as Low', () => {
      render(<ConfidenceBadge confidence={49} source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });
  });
});

describe('percentageToLevel', () => {
  it('returns "low" for undefined', () => {
    expect(percentageToLevel(undefined)).toBe('low');
  });

  it('returns "low" for 0', () => {
    expect(percentageToLevel(0)).toBe('low');
  });

  it('returns "low" for values under 50', () => {
    expect(percentageToLevel(49)).toBe('low');
  });

  it('returns "medium" for exactly 50', () => {
    expect(percentageToLevel(50)).toBe('medium');
  });

  it('returns "medium" for values between 50-79', () => {
    expect(percentageToLevel(65)).toBe('medium');
    expect(percentageToLevel(79)).toBe('medium');
  });

  it('returns "high" for exactly 80', () => {
    expect(percentageToLevel(80)).toBe('high');
  });

  it('returns "high" for values 80+', () => {
    expect(percentageToLevel(85)).toBe('high');
    expect(percentageToLevel(100)).toBe('high');
  });
});
