import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfidenceBadge } from '../ConfidenceBadge';

describe('ConfidenceBadge', () => {
  describe('AI confidence levels', () => {
    it('should display High confidence for >= 80%', () => {
      render(<ConfidenceBadge confidence={85} source="ai" />);

      expect(screen.getByText('AI - High Confidence')).toBeInTheDocument();
    });

    it('should display Medium confidence for 50-79%', () => {
      render(<ConfidenceBadge confidence={65} source="ai" />);

      expect(screen.getByText('AI - Medium Confidence')).toBeInTheDocument();
    });

    it('should display Low confidence for < 50%', () => {
      render(<ConfidenceBadge confidence={35} source="ai" />);

      expect(screen.getByText('AI - Low Confidence')).toBeInTheDocument();
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
  });

  describe('indicator dot', () => {
    it('should render the indicator dot', () => {
      const { container } = render(<ConfidenceBadge confidence={85} source="ai" />);

      // Find the dot element (small box with border-radius)
      const dot = container.querySelector('[class*="MuiBox-root"]');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should display Unknown when no confidence or source', () => {
      render(<ConfidenceBadge />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display Unknown when confidence is undefined', () => {
      render(<ConfidenceBadge confidence={undefined} source={undefined} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should handle boundary confidence of exactly 80 as High', () => {
      render(<ConfidenceBadge confidence={80} source="ai" />);

      expect(screen.getByText('AI - High Confidence')).toBeInTheDocument();
    });

    it('should handle boundary confidence of exactly 50 as Medium', () => {
      render(<ConfidenceBadge confidence={50} source="ai" />);

      expect(screen.getByText('AI - Medium Confidence')).toBeInTheDocument();
    });
  });
});
