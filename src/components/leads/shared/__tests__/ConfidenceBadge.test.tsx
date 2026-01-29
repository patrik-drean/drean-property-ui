import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfidenceBadge, percentageToLevel } from '../ConfidenceBadge';

describe('ConfidenceBadge', () => {
  describe('AI source with enum levels', () => {
    it('shows "Low Confidence" with red dot for low level', () => {
      render(<ConfidenceBadge confidence="low" source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('shows "Medium Confidence" with yellow dot for medium level', () => {
      render(<ConfidenceBadge confidence="medium" source="ai" />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('shows "High Confidence" with green dot for high level', () => {
      render(<ConfidenceBadge confidence="high" source="ai" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });
  });

  describe('AI source with percentage (legacy)', () => {
    it('shows "High Confidence" for 85%', () => {
      render(<ConfidenceBadge confidence={85} source="ai" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('shows "High Confidence" for exactly 80%', () => {
      render(<ConfidenceBadge confidence={80} source="ai" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('shows "Medium Confidence" for 65%', () => {
      render(<ConfidenceBadge confidence={65} source="ai" />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('shows "Medium Confidence" for exactly 50%', () => {
      render(<ConfidenceBadge confidence={50} source="ai" />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('shows "Low Confidence" for 35%', () => {
      render(<ConfidenceBadge confidence={35} source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('shows "Low Confidence" for 49%', () => {
      render(<ConfidenceBadge confidence={49} source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('shows "Low Confidence" for undefined confidence', () => {
      render(<ConfidenceBadge source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('shows "Low Confidence" for zero confidence', () => {
      render(<ConfidenceBadge confidence={0} source="ai" />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('shows "High Confidence" for 100%', () => {
      render(<ConfidenceBadge confidence={100} source="ai" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });
  });

  describe('Manual source', () => {
    it('shows blue badge for manual override', () => {
      render(<ConfidenceBadge source="manual" />);
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
    });

    it('ignores confidence when source is manual', () => {
      render(<ConfidenceBadge confidence={85} source="manual" />);
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
      expect(screen.queryByText(/Confidence/)).not.toBeInTheDocument();
    });

    it('ignores enum confidence when source is manual', () => {
      render(<ConfidenceBadge confidence="high" source="manual" />);
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
      expect(screen.queryByText(/Confidence/)).not.toBeInTheDocument();
    });
  });

  describe('RentCast source', () => {
    it('shows purple badge for RentCast verified', () => {
      render(<ConfidenceBadge source="rentcast" />);
      expect(screen.getByText('RentCast Verified')).toBeInTheDocument();
    });

    it('ignores confidence when source is rentcast', () => {
      render(<ConfidenceBadge confidence={90} source="rentcast" />);
      expect(screen.getByText('RentCast Verified')).toBeInTheDocument();
      expect(screen.queryByText(/Confidence/)).not.toBeInTheDocument();
    });

    it('ignores enum confidence when source is rentcast', () => {
      render(<ConfidenceBadge confidence="high" source="rentcast" />);
      expect(screen.getByText('RentCast Verified')).toBeInTheDocument();
      expect(screen.queryByText(/Confidence/)).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('renders without props (defaults to Low Confidence)', () => {
      render(<ConfidenceBadge />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('handles only confidence without source', () => {
      render(<ConfidenceBadge confidence={75} />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('handles enum confidence without source', () => {
      render(<ConfidenceBadge confidence="high" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });
  });

  describe('Badge structure', () => {
    it('renders colored dot indicator', () => {
      const { container } = render(<ConfidenceBadge confidence="high" source="ai" />);
      // Check for the colored dot (8x8 box)
      const dot = container.querySelector('[class*="MuiBox-root"]');
      expect(dot).toBeInTheDocument();
    });

    it('displays as inline flex layout', () => {
      const { container } = render(<ConfidenceBadge source="manual" />);
      // Should have flex layout with gap
      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Note tooltip', () => {
    it('renders without tooltip when no note is provided', () => {
      const { container } = render(<ConfidenceBadge source="manual" />);
      // Should not have tooltip wrapper
      expect(container.querySelector('[class*="MuiTooltip"]')).not.toBeInTheDocument();
    });

    it('wraps badge in tooltip when note is provided', () => {
      render(<ConfidenceBadge source="manual" note="Review needed" />);
      // Badge should still be visible
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
    });

    it('shows help cursor when note is provided', () => {
      const { container } = render(<ConfidenceBadge source="manual" note="Review needed" />);
      // The badge container should have cursor: help
      const badgeBox = container.querySelector('[class*="MuiBox-root"]');
      expect(badgeBox).toBeInTheDocument();
    });
  });
});

describe('percentageToLevel', () => {
  describe('low confidence (<50)', () => {
    it('returns "low" for undefined', () => {
      expect(percentageToLevel(undefined)).toBe('low');
    });

    it('returns "low" for 0', () => {
      expect(percentageToLevel(0)).toBe('low');
    });

    it('returns "low" for values under 50', () => {
      expect(percentageToLevel(49)).toBe('low');
      expect(percentageToLevel(25)).toBe('low');
      expect(percentageToLevel(1)).toBe('low');
    });
  });

  describe('medium confidence (50-79)', () => {
    it('returns "medium" for exactly 50', () => {
      expect(percentageToLevel(50)).toBe('medium');
    });

    it('returns "medium" for values between 50-79', () => {
      expect(percentageToLevel(65)).toBe('medium');
      expect(percentageToLevel(75)).toBe('medium');
      expect(percentageToLevel(79)).toBe('medium');
    });
  });

  describe('high confidence (80+)', () => {
    it('returns "high" for exactly 80', () => {
      expect(percentageToLevel(80)).toBe('high');
    });

    it('returns "high" for values 80+', () => {
      expect(percentageToLevel(85)).toBe('high');
      expect(percentageToLevel(95)).toBe('high');
      expect(percentageToLevel(100)).toBe('high');
    });
  });

  describe('boundary values', () => {
    it('correctly handles boundary at 50 (inclusive for medium)', () => {
      expect(percentageToLevel(49)).toBe('low');
      expect(percentageToLevel(50)).toBe('medium');
    });

    it('correctly handles boundary at 80 (inclusive for high)', () => {
      expect(percentageToLevel(79)).toBe('medium');
      expect(percentageToLevel(80)).toBe('high');
    });
  });
});
