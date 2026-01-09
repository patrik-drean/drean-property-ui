import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ScoreResultsCard } from '../ScoreResultsCard';

// Mock the AnimatedScoreDisplay component to simplify testing
jest.mock('../AnimatedScoreDisplay', () => ({
  AnimatedScoreDisplay: ({ score }: { score: number }) => (
    <div data-testid="animated-score-display">{score}</div>
  ),
  getScoreColor: (score: number) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#22c55e';
    if (score >= 4) return '#eab308';
    if (score >= 1) return '#ef4444';
    return '#6b7280';
  },
}));

// Mock MUI icons
jest.mock('@mui/icons-material/Lightbulb', () => () => (
  <span data-testid="lightbulb-icon">Lightbulb</span>
));

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('ScoreResultsCard', () => {
  describe('Basic Rendering', () => {
    it('should render with minimum required props', () => {
      renderWithTheme(<ScoreResultsCard score={8.5} />);

      expect(screen.getByTestId('animated-score-display')).toBeInTheDocument();
      expect(screen.getByText('AI LEAD SCORE')).toBeInTheDocument();
    });

    it('should display the score value', () => {
      renderWithTheme(<ScoreResultsCard score={7.5} />);

      expect(screen.getByTestId('animated-score-display')).toHaveTextContent('7.5');
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      const { container } = renderWithTheme(<ScoreResultsCard score={8} isLoading={true} />);

      // Skeleton elements should be present
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show score display when loading', () => {
      renderWithTheme(<ScoreResultsCard score={8} isLoading={true} />);

      expect(screen.queryByTestId('animated-score-display')).not.toBeInTheDocument();
    });
  });

  describe('Grade Display', () => {
    it('should display grade badge when grade is provided', () => {
      renderWithTheme(<ScoreResultsCard score={9} grade="A" />);

      expect(screen.getByText('Grade A')).toBeInTheDocument();
      expect(screen.getByText('Excellent Condition')).toBeInTheDocument();
    });

    it('should display correct label for Grade B', () => {
      renderWithTheme(<ScoreResultsCard score={7} grade="B" />);

      expect(screen.getByText('Grade B')).toBeInTheDocument();
      expect(screen.getByText('Good Condition')).toBeInTheDocument();
    });

    it('should display correct label for Grade C', () => {
      renderWithTheme(<ScoreResultsCard score={5} grade="C" />);

      expect(screen.getByText('Grade C')).toBeInTheDocument();
      expect(screen.getByText('Needs Work')).toBeInTheDocument();
    });

    it('should display correct label for Grade D', () => {
      renderWithTheme(<ScoreResultsCard score={3} grade="D" />);

      expect(screen.getByText('Grade D')).toBeInTheDocument();
      expect(screen.getByText('Major Rehab')).toBeInTheDocument();
    });

    it('should handle lowercase grade input', () => {
      renderWithTheme(<ScoreResultsCard score={9} grade="a" />);

      expect(screen.getByText('Grade A')).toBeInTheDocument();
    });

    it('should not display grade badge when grade is not provided', () => {
      renderWithTheme(<ScoreResultsCard score={8} />);

      expect(screen.queryByText(/Grade/)).not.toBeInTheDocument();
    });
  });

  describe('AI Summary', () => {
    it('should display AI summary when provided', () => {
      const summary = 'Well-maintained property with excellent rental potential';
      renderWithTheme(<ScoreResultsCard score={8} aiSummary={summary} />);

      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      // The component uses &ldquo; and &rdquo; which render as curly quotes
      expect(screen.getByText(/Well-maintained property with excellent rental potential/)).toBeInTheDocument();
      expect(screen.getByTestId('lightbulb-icon')).toBeInTheDocument();
    });

    it('should not display AI summary section when not provided', () => {
      renderWithTheme(<ScoreResultsCard score={8} />);

      expect(screen.queryByText('AI Analysis')).not.toBeInTheDocument();
    });

    it('should handle empty string AI summary', () => {
      renderWithTheme(<ScoreResultsCard score={8} aiSummary="" />);

      // Empty string is falsy, so section should not render
      expect(screen.queryByText('AI Analysis')).not.toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display Zestimate when provided', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ zestimate: 285000 }}
        />
      );

      expect(screen.getByText('Zestimate')).toBeInTheDocument();
      expect(screen.getByText('$285,000')).toBeInTheDocument();
    });

    it('should display ARV when provided', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ arv: 312000 }}
        />
      );

      expect(screen.getByText('ARV')).toBeInTheDocument();
      expect(screen.getByText('$312,000')).toBeInTheDocument();
    });

    it('should display Days Listed when provided', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ daysOnMarket: 14 }}
        />
      );

      expect(screen.getByText('Days Listed')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
    });

    it('should display Rent Estimate with /mo suffix', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ rentZestimate: 2400 }}
        />
      );

      expect(screen.getByText('Rent Est.')).toBeInTheDocument();
      expect(screen.getByText('$2,400/mo')).toBeInTheDocument();
    });

    it('should display ARV Ratio as percentage', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ arvRatio: 0.685 }}
        />
      );

      expect(screen.getByText('ARV Ratio')).toBeInTheDocument();
      expect(screen.getByText('68.5%')).toBeInTheDocument();
    });

    it('should display rehab range when provided', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ rehabRange: '$15-25K' }}
        />
      );

      expect(screen.getByText('Rehab Est.')).toBeInTheDocument();
      expect(screen.getByText('$15-25K')).toBeInTheDocument();
    });

    it('should display rehab estimate when rehabRange not provided', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ rehabEstimate: 20000 }}
        />
      );

      expect(screen.getByText('Rehab Est.')).toBeInTheDocument();
      expect(screen.getByText('$20,000')).toBeInTheDocument();
    });

    it('should display all metadata fields', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8.5}
          grade="A"
          aiSummary="Great deal"
          metadata={{
            zestimate: 285000,
            arv: 312000,
            daysOnMarket: 14,
            rentZestimate: 2400,
            arvRatio: 0.685,
            rehabRange: '$15-25K',
          }}
        />
      );

      expect(screen.getByText('Zestimate')).toBeInTheDocument();
      expect(screen.getByText('ARV')).toBeInTheDocument();
      expect(screen.getByText('Days Listed')).toBeInTheDocument();
      expect(screen.getByText('Rent Est.')).toBeInTheDocument();
      expect(screen.getByText('ARV Ratio')).toBeInTheDocument();
      expect(screen.getByText('Rehab Est.')).toBeInTheDocument();
    });

    it('should not display metadata section when metadata is empty', () => {
      renderWithTheme(<ScoreResultsCard score={8} metadata={{}} />);

      expect(screen.queryByText('Zestimate')).not.toBeInTheDocument();
      expect(screen.queryByText('ARV')).not.toBeInTheDocument();
    });

    it('should not display metadata section when metadata is undefined', () => {
      renderWithTheme(<ScoreResultsCard score={8} />);

      expect(screen.queryByText('Zestimate')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle score of 0', () => {
      renderWithTheme(<ScoreResultsCard score={0} />);

      expect(screen.getByTestId('animated-score-display')).toHaveTextContent('0');
    });

    it('should handle score of 10', () => {
      renderWithTheme(<ScoreResultsCard score={10} />);

      expect(screen.getByTestId('animated-score-display')).toHaveTextContent('10');
    });

    it('should handle very large currency values', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ zestimate: 1500000 }}
        />
      );

      expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    });

    it('should handle 0 days on market', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{ daysOnMarket: 0 }}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle undefined individual metadata fields gracefully', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{
            zestimate: undefined,
            arv: 300000,
          }}
        />
      );

      expect(screen.queryByText('Zestimate')).not.toBeInTheDocument();
      expect(screen.getByText('ARV')).toBeInTheDocument();
    });

    it('should prefer rehabRange over rehabEstimate', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8}
          metadata={{
            rehabRange: '$10-15K',
            rehabEstimate: 20000,
          }}
        />
      );

      expect(screen.getByText('$10-15K')).toBeInTheDocument();
      expect(screen.queryByText('$20,000')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper text structure', () => {
      renderWithTheme(
        <ScoreResultsCard
          score={8.5}
          grade="A"
          aiSummary="Great property"
        />
      );

      // AI Lead Score label should be present
      expect(screen.getByText('AI LEAD SCORE')).toBeInTheDocument();

      // Grade and label should be readable
      expect(screen.getByText('Grade A')).toBeInTheDocument();
      expect(screen.getByText('Excellent Condition')).toBeInTheDocument();
    });
  });
});
