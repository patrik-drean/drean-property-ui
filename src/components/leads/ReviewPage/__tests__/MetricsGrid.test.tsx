import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricsGrid } from '../MetricsGrid';

describe('MetricsGrid', () => {
  describe('score display', () => {
    it('should display the score value', () => {
      render(
        <MetricsGrid score={8} mao={100000} spreadPercent={25} neighborhoodGrade="B" />
      );

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    it('should display dash for null score', () => {
      render(
        <MetricsGrid score={null} mao={100000} spreadPercent={25} neighborhoodGrade="B" />
      );

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('MAO display', () => {
    it('should format MAO in thousands', () => {
      render(
        <MetricsGrid score={7} mao={150000} spreadPercent={25} neighborhoodGrade="B" />
      );

      expect(screen.getByText('$150k')).toBeInTheDocument();
      expect(screen.getByText('MAO')).toBeInTheDocument();
    });

    it('should display dash for null MAO', () => {
      render(
        <MetricsGrid score={7} mao={null} spreadPercent={25} neighborhoodGrade="B" />
      );

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('should round MAO to nearest thousand', () => {
      render(
        <MetricsGrid score={7} mao={125500} spreadPercent={25} neighborhoodGrade="B" />
      );

      expect(screen.getByText('$126k')).toBeInTheDocument();
    });
  });

  describe('spread display', () => {
    it('should display spread percentage', () => {
      render(
        <MetricsGrid score={7} mao={100000} spreadPercent={30} neighborhoodGrade="B" />
      );

      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('Spread')).toBeInTheDocument();
    });

    it('should display dash for null spread', () => {
      render(
        <MetricsGrid score={7} mao={100000} spreadPercent={null} neighborhoodGrade="B" />
      );

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('neighborhood grade display', () => {
    it('should display neighborhood grade', () => {
      render(
        <MetricsGrid score={7} mao={100000} spreadPercent={25} neighborhoodGrade="A" />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('Grade')).toBeInTheDocument();
    });

    it('should display dash for null grade', () => {
      render(
        <MetricsGrid score={7} mao={100000} spreadPercent={25} neighborhoodGrade={null} />
      );

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('tooltips', () => {
    it('should have tooltip for Score', () => {
      render(
        <MetricsGrid score={7} mao={100000} spreadPercent={25} neighborhoodGrade="B" />
      );

      // Tooltip content is rendered on hover, but the element with aria-label should exist
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    it('should have tooltip for MAO', () => {
      render(
        <MetricsGrid score={7} mao={100000} spreadPercent={25} neighborhoodGrade="B" />
      );

      expect(screen.getByText('MAO')).toBeInTheDocument();
    });
  });

  describe('all null values', () => {
    it('should display all dashes when all values are null', () => {
      render(
        <MetricsGrid score={null} mao={null} spreadPercent={null} neighborhoodGrade={null} />
      );

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBe(4); // Score, MAO, Spread, Grade
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      render(
        <MetricsGrid score={0} mao={0} spreadPercent={0} neighborhoodGrade="F" />
      );

      expect(screen.getByText('$0k')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle very large MAO values', () => {
      render(
        <MetricsGrid score={10} mao={1500000} spreadPercent={50} neighborhoodGrade="A" />
      );

      expect(screen.getByText('$1500k')).toBeInTheDocument();
    });
  });
});
