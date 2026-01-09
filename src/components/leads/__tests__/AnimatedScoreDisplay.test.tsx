import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  AnimatedScoreDisplay,
  getScoreColor,
  getScoreLabel,
  getScoreTextColor,
} from '../AnimatedScoreDisplay';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('AnimatedScoreDisplay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getScoreColor', () => {
    it('should return emerald color for scores 8-10', () => {
      expect(getScoreColor(8)).toBe('#10b981');
      expect(getScoreColor(9)).toBe('#10b981');
      expect(getScoreColor(10)).toBe('#10b981');
    });

    it('should return yellow color for scores 5-7', () => {
      expect(getScoreColor(5)).toBe('#eab308');
      expect(getScoreColor(6)).toBe('#eab308');
      expect(getScoreColor(7)).toBe('#eab308');
      expect(getScoreColor(7.9)).toBe('#eab308');
    });

    it('should return red color for scores 1-4', () => {
      expect(getScoreColor(1)).toBe('#ef4444');
      expect(getScoreColor(2)).toBe('#ef4444');
      expect(getScoreColor(3)).toBe('#ef4444');
      expect(getScoreColor(4)).toBe('#ef4444');
      expect(getScoreColor(4.9)).toBe('#ef4444');
    });

    it('should return gray color for score 0 or negative', () => {
      expect(getScoreColor(0)).toBe('#6b7280');
      expect(getScoreColor(-1)).toBe('#6b7280');
      expect(getScoreColor(0.5)).toBe('#6b7280');
    });
  });

  describe('getScoreLabel', () => {
    it('should return "Excellent Deal" for scores 8-10', () => {
      expect(getScoreLabel(8)).toBe('Excellent Deal');
      expect(getScoreLabel(9)).toBe('Excellent Deal');
      expect(getScoreLabel(10)).toBe('Excellent Deal');
    });

    it('should return "Average" for scores 5-7', () => {
      expect(getScoreLabel(5)).toBe('Average');
      expect(getScoreLabel(6)).toBe('Average');
      expect(getScoreLabel(7)).toBe('Average');
    });

    it('should return "Below Target" for scores 1-4', () => {
      expect(getScoreLabel(1)).toBe('Below Target');
      expect(getScoreLabel(2)).toBe('Below Target');
      expect(getScoreLabel(3)).toBe('Below Target');
      expect(getScoreLabel(4)).toBe('Below Target');
    });

    it('should return "Not Scored" for score 0', () => {
      expect(getScoreLabel(0)).toBe('Not Scored');
    });
  });

  describe('getScoreTextColor', () => {
    it('should return black for scores 5-7 (yellow background)', () => {
      expect(getScoreTextColor(5)).toBe('#000000');
      expect(getScoreTextColor(6)).toBe('#000000');
      expect(getScoreTextColor(7)).toBe('#000000');
      expect(getScoreTextColor(7.9)).toBe('#000000');
    });

    it('should return white for scores outside 5-7 range', () => {
      expect(getScoreTextColor(0)).toBe('#ffffff');
      expect(getScoreTextColor(4)).toBe('#ffffff');
      expect(getScoreTextColor(8)).toBe('#ffffff');
      expect(getScoreTextColor(10)).toBe('#ffffff');
    });
  });

  describe('Component Rendering', () => {
    it('should render with default props', () => {
      renderWithTheme(<AnimatedScoreDisplay score={8.5} />);

      // Should show the label
      expect(screen.getByText('Excellent Deal')).toBeInTheDocument();
    });

    it('should render without animation when animated=false', () => {
      renderWithTheme(<AnimatedScoreDisplay score={7.5} animated={false} />);

      // Score should be displayed immediately (no animation)
      expect(screen.getByText('7.5')).toBeInTheDocument();
      expect(screen.getByText('Average')).toBeInTheDocument();
    });

    it('should hide label when showLabel=false', () => {
      renderWithTheme(<AnimatedScoreDisplay score={8} showLabel={false} />);

      // Label should not be present
      expect(screen.queryByText('Excellent Deal')).not.toBeInTheDocument();
    });

    it('should render SVG ring when showRing=true', () => {
      const { container } = renderWithTheme(
        <AnimatedScoreDisplay score={8} showRing={true} animated={false} />
      );

      // Should have SVG element for the ring
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelectorAll('circle')).toHaveLength(2); // Background + fill ring
    });

    it('should not render SVG ring when showRing=false', () => {
      const { container } = renderWithTheme(
        <AnimatedScoreDisplay score={8} showRing={false} animated={false} />
      );

      // Should not have SVG element
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should display correct score for different ranges', () => {
      const { rerender } = renderWithTheme(
        <AnimatedScoreDisplay score={9} animated={false} />
      );
      expect(screen.getByText('9.0')).toBeInTheDocument();
      expect(screen.getByText('Excellent Deal')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <AnimatedScoreDisplay score={6.5} animated={false} />
        </ThemeProvider>
      );
      expect(screen.getByText('6.5')).toBeInTheDocument();
      expect(screen.getByText('Average')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <AnimatedScoreDisplay score={4.5} animated={false} />
        </ThemeProvider>
      );
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('Below Target')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <AnimatedScoreDisplay score={2} animated={false} />
        </ThemeProvider>
      );
      expect(screen.getByText('2.0')).toBeInTheDocument();
      expect(screen.getByText('Below Target')).toBeInTheDocument();
    });

    it('should start animation from 0 when animated=true', () => {
      renderWithTheme(<AnimatedScoreDisplay score={8} animated={true} />);

      // Initially should show 0.0 before animation starts
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should handle score updates', () => {
      const { rerender } = renderWithTheme(
        <AnimatedScoreDisplay score={5} animated={false} />
      );
      expect(screen.getByText('5.0')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <AnimatedScoreDisplay score={8} animated={false} />
        </ThemeProvider>
      );
      expect(screen.getByText('8.0')).toBeInTheDocument();
    });
  });

  describe('Size variations', () => {
    it('should render in small size', () => {
      const { container } = renderWithTheme(
        <AnimatedScoreDisplay score={8} size="small" animated={false} />
      );
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render in medium size', () => {
      const { container } = renderWithTheme(
        <AnimatedScoreDisplay score={8} size="medium" animated={false} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render in large size (default)', () => {
      const { container } = renderWithTheme(
        <AnimatedScoreDisplay score={8} size="large" animated={false} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle score of exactly 0', () => {
      renderWithTheme(<AnimatedScoreDisplay score={0} animated={false} />);
      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('Not Scored')).toBeInTheDocument();
    });

    it('should handle score of exactly 10', () => {
      renderWithTheme(<AnimatedScoreDisplay score={10} animated={false} />);
      expect(screen.getByText('10.0')).toBeInTheDocument();
      expect(screen.getByText('Excellent Deal')).toBeInTheDocument();
    });

    it('should handle decimal scores', () => {
      renderWithTheme(<AnimatedScoreDisplay score={7.3} animated={false} />);
      expect(screen.getByText('7.3')).toBeInTheDocument();
    });

    it('should handle boundary scores correctly', () => {
      // Test boundary at 8.0
      const { rerender } = renderWithTheme(
        <AnimatedScoreDisplay score={7.99} animated={false} />
      );
      expect(screen.getByText('Average')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <AnimatedScoreDisplay score={8.0} animated={false} />
        </ThemeProvider>
      );
      expect(screen.getByText('Excellent Deal')).toBeInTheDocument();

      // Test boundary at 5.0
      rerender(
        <ThemeProvider theme={theme}>
          <AnimatedScoreDisplay score={4.99} animated={false} />
        </ThemeProvider>
      );
      expect(screen.getByText('Below Target')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <AnimatedScoreDisplay score={5.0} animated={false} />
        </ThemeProvider>
      );
      expect(screen.getByText('Average')).toBeInTheDocument();
    });
  });
});
