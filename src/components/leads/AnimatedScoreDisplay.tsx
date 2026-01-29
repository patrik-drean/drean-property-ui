import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { getScoreColor, getScoreLabel } from '../../types/queue';

// Re-export for backward compatibility with components that import from here
export { getScoreColor, getScoreLabel };

// Text color helper - unique to this component for contrast on colored backgrounds
export const getScoreTextColor = (score: number): string => {
  // Yellow and light green need dark text for readability
  if (score >= 5 && score < 9) return '#000000';
  return '#ffffff';
};

// Styled components
const ScoreContainer = styled(Box)<{ size: 'small' | 'medium' | 'large' }>(({ size }) => {
  const dimensions = {
    small: { width: 60, height: 60, fontSize: '1.25rem' },
    medium: { width: 80, height: 80, fontSize: '1.5rem' },
    large: { width: 100, height: 100, fontSize: '2rem' },
  };

  return {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dimensions[size].width,
    height: dimensions[size].height,
  };
});

const ScoreRingSvg = styled('svg')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  transform: 'rotate(-90deg)',
});

const ScoreValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'scoreColor' && prop !== 'textColor',
})<{ scoreColor: string; textColor: string }>(({ scoreColor }) => ({
  fontSize: 'inherit',
  fontWeight: 700,
  color: scoreColor,
  zIndex: 1,
  fontFamily: '"DM Sans", system-ui, sans-serif',
  textShadow: `0 0 20px ${scoreColor}40`,
}));

const ScoreLabelText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginTop: theme.spacing(0.5),
}));

interface AnimatedScoreDisplayProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showRing?: boolean;
  showLabel?: boolean;
  animated?: boolean;
}

export const AnimatedScoreDisplay: React.FC<AnimatedScoreDisplayProps> = ({
  score,
  size = 'large',
  showRing = true,
  showLabel = true,
  animated = true,
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    // Reset display score when score changes
    setDisplayScore(0);

    const duration = 1200; // 1.2 seconds
    const startTime = performance.now();
    const targetScore = score;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(targetScore * eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation after a brief delay for visual effect
    const timeoutId = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, animated]);

  const scoreColor = getScoreColor(score);
  const textColor = getScoreTextColor(score);
  const label = getScoreLabel(score);

  // Calculate ring properties
  const ringRadius = 45;
  const circumference = 2 * Math.PI * ringRadius; // ~283
  const fillPercentage = (displayScore / 10) * 100;
  const strokeDashoffset = circumference - (circumference * fillPercentage) / 100;

  const sizeMap = {
    small: { fontSize: '1.25rem', labelSize: '0.65rem' },
    medium: { fontSize: '1.5rem', labelSize: '0.7rem' },
    large: { fontSize: '2rem', labelSize: '0.75rem' },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ScoreContainer size={size}>
        {showRing && (
          <ScoreRingSvg viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            {/* Animated fill ring */}
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: animated ? 'stroke-dashoffset 0.1s ease-out' : 'none',
                filter: `drop-shadow(0 0 8px ${scoreColor}60)`,
              }}
            />
          </ScoreRingSvg>
        )}
        <ScoreValue
          scoreColor={scoreColor}
          textColor={textColor}
          sx={{ fontSize: sizeMap[size].fontSize }}
        >
          {displayScore.toFixed(1)}
        </ScoreValue>
      </ScoreContainer>
      {showLabel && (
        <ScoreLabelText sx={{ color: scoreColor, fontSize: sizeMap[size].labelSize }}>
          {label}
        </ScoreLabelText>
      )}
    </Box>
  );
};

export default AnimatedScoreDisplay;
