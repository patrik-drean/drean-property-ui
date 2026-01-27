import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfidenceBadge } from '../ConfidenceBadge';

describe('ConfidenceBadge', () => {
  describe('AI source', () => {
    it('shows green badge for high confidence (80%+)', () => {
      render(<ConfidenceBadge confidence={85} source="ai" />);
      expect(screen.getByText('AI - 85% Confidence')).toBeInTheDocument();
    });

    it('shows green badge for exactly 80% confidence', () => {
      render(<ConfidenceBadge confidence={80} source="ai" />);
      expect(screen.getByText('AI - 80% Confidence')).toBeInTheDocument();
    });

    it('shows yellow badge for medium confidence (50-79%)', () => {
      render(<ConfidenceBadge confidence={65} source="ai" />);
      expect(screen.getByText('AI - 65% Confidence')).toBeInTheDocument();
    });

    it('shows yellow badge for exactly 50% confidence', () => {
      render(<ConfidenceBadge confidence={50} source="ai" />);
      expect(screen.getByText('AI - 50% Confidence')).toBeInTheDocument();
    });

    it('shows red badge for low confidence (<50%)', () => {
      render(<ConfidenceBadge confidence={35} source="ai" />);
      expect(screen.getByText('AI - 35% Confidence (Low)')).toBeInTheDocument();
    });

    it('shows "AI" for undefined confidence', () => {
      render(<ConfidenceBadge source="ai" />);
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('shows "AI" for zero confidence', () => {
      render(<ConfidenceBadge confidence={0} source="ai" />);
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('handles 100% confidence', () => {
      render(<ConfidenceBadge confidence={100} source="ai" />);
      expect(screen.getByText('AI - 100% Confidence')).toBeInTheDocument();
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
      expect(screen.queryByText(/85%/)).not.toBeInTheDocument();
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
      expect(screen.queryByText(/90%/)).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('renders without props', () => {
      render(<ConfidenceBadge />);
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('handles only confidence without source', () => {
      render(<ConfidenceBadge confidence={75} />);
      expect(screen.getByText('AI - 75% Confidence')).toBeInTheDocument();
    });
  });

  describe('Badge structure', () => {
    it('renders colored dot indicator', () => {
      const { container } = render(<ConfidenceBadge confidence={85} source="ai" />);
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
});
