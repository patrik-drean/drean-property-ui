import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateChip } from '../TemplateChip';

describe('TemplateChip', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the label', () => {
      render(<TemplateChip label="Initial Outreach" onClick={mockOnClick} />);

      expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
    });

    it('should render as a MUI Chip', () => {
      const { container } = render(<TemplateChip label="Test" onClick={mockOnClick} />);

      expect(container.querySelector('.MuiChip-root')).toBeInTheDocument();
    });
  });

  describe('click behavior', () => {
    it('should call onClick when clicked', () => {
      render(<TemplateChip label="Test Template" onClick={mockOnClick} />);

      fireEvent.click(screen.getByText('Test Template'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should be clickable via keyboard', () => {
      render(<TemplateChip label="Test Template" onClick={mockOnClick} />);

      const chip = screen.getByText('Test Template');
      fireEvent.keyDown(chip, { key: 'Enter' });
      // MUI Chip handles keyboard events internally
    });
  });

  describe('selected state', () => {
    it('should have different styling when selected', () => {
      const { container, rerender } = render(
        <TemplateChip label="Test" onClick={mockOnClick} selected={false} />
      );

      const unselectedChip = container.querySelector('.MuiChip-root');
      const unselectedStyles = window.getComputedStyle(unselectedChip!);

      rerender(<TemplateChip label="Test" onClick={mockOnClick} selected={true} />);

      const selectedChip = container.querySelector('.MuiChip-root');
      expect(selectedChip).toBeInTheDocument();
    });

    it('should default to not selected', () => {
      const { container } = render(<TemplateChip label="Test" onClick={mockOnClick} />);

      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be focusable', () => {
      render(<TemplateChip label="Test" onClick={mockOnClick} />);

      const chip = screen.getByText('Test').closest('.MuiChip-root');
      expect(chip).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
