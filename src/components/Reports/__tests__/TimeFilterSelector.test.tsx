import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TimeFilterSelector } from '../TimeFilterSelector';
import { TimeFilterPreset } from '../../../types/salesFunnel';

// Mock the responsive layout hook
jest.mock('../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('TimeFilterSelector', () => {
  const mockOnPresetChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all 6 preset buttons', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 60 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 365 Days')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    it('should render buttons with correct aria-labels', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      expect(screen.getByLabelText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByLabelText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByLabelText('All Time')).toBeInTheDocument();
    });

    it('should mark selected preset button as selected', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="last30" onPresetChange={mockOnPresetChange} />
      );

      const last30Button = screen.getByText('Last 30 Days').closest('button');
      expect(last30Button).toHaveClass('Mui-selected');
    });
  });

  describe('Interactions', () => {
    it('should call onPresetChange when button is clicked', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      fireEvent.click(screen.getByText('Last 30 Days'));

      expect(mockOnPresetChange).toHaveBeenCalledTimes(1);
      expect(mockOnPresetChange).toHaveBeenCalledWith('last30');
    });

    it('should call onPresetChange with correct value for Last 7 Days', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      fireEvent.click(screen.getByText('Last 7 Days'));
      expect(mockOnPresetChange).toHaveBeenCalledWith('last7');
    });

    it('should call onPresetChange with correct value for Last 60 Days', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      fireEvent.click(screen.getByText('Last 60 Days'));
      expect(mockOnPresetChange).toHaveBeenCalledWith('last60');
    });

    it('should call onPresetChange with correct value for Last 365 Days', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      fireEvent.click(screen.getByText('Last 365 Days'));
      expect(mockOnPresetChange).toHaveBeenCalledWith('last365');
    });

    it('should not call onPresetChange when already-selected button is clicked', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="last30" onPresetChange={mockOnPresetChange} />
      );

      fireEvent.click(screen.getByText('Last 30 Days'));

      // ToggleButtonGroup doesn't call onChange when clicking already-selected button
      expect(mockOnPresetChange).not.toHaveBeenCalled();
    });

    it('should support keyboard navigation', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      const button = screen.getByText('Last 7 Days').closest('button');
      button?.focus();

      expect(document.activeElement).toBe(button);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for the button group', () => {
      const { container } = renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      const buttonGroup = container.querySelector('[aria-label="time filter"]');
      expect(buttonGroup).toBeInTheDocument();
    });

    it('should have all buttons keyboard accessible', () => {
      renderWithTheme(
        <TimeFilterSelector selectedPreset="allTime" onPresetChange={mockOnPresetChange} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);

      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('disabled');
      });
    });
  });

});
