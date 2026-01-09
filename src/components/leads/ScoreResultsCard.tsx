import React from 'react';
import { Box, Typography, Skeleton, Chip, Divider } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { AnimatedScoreDisplay, getScoreColor } from './AnimatedScoreDisplay';

// Slide-in animation
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Grade color mapping
const getGradeColor = (grade: string): string => {
  switch (grade?.toUpperCase()) {
    case 'A':
      return '#10b981'; // Emerald - Excellent condition
    case 'B':
      return '#3b82f6'; // Blue - Good condition
    case 'C':
      return '#f59e0b'; // Amber - Needs work
    case 'D':
      return '#ef4444'; // Red - Major rehab
    default:
      return '#6b7280'; // Gray
  }
};

const getGradeLabel = (grade: string): string => {
  switch (grade?.toUpperCase()) {
    case 'A':
      return 'Excellent Condition';
    case 'B':
      return 'Good Condition';
    case 'C':
      return 'Needs Work';
    case 'D':
      return 'Major Rehab';
    default:
      return 'Unknown';
  }
};

// Styled components
const ResultsCardContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#12141a',
  border: '2px solid rgba(16, 185, 129, 0.3)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  animation: `${slideIn} 0.4s ease-out`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
  },
}));

const ScoreHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

const ScoreInfo = styled(Box)({
  flex: 1,
});

const AIInsightsBox = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const MetadataGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
}));

const MetadataItem = styled(Box)({
  textAlign: 'center',
});

const GradeBadge = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'gradeColor',
})<{ gradeColor: string }>(({ gradeColor }) => ({
  backgroundColor: gradeColor,
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '0.75rem',
  height: '24px',
}));

// Loading skeleton
const LoadingSkeleton: React.FC = () => (
  <ResultsCardContainer>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Skeleton variant="circular" width={100} height={100} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Skeleton variant="text" width="40%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      </Box>
    </Box>
    <Skeleton variant="rectangular" height={80} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} variant="rectangular" height={50} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
      ))}
    </Box>
  </ResultsCardContainer>
);

// Format currency helper
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage helper
const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return '--';
  return `${(value * 100).toFixed(1)}%`;
};

interface ScoreResultsCardProps {
  score: number;
  grade?: string;
  aiSummary?: string;
  metadata?: {
    zestimate?: number;
    rentZestimate?: number;
    arv?: number;
    arvRatio?: number;
    daysOnMarket?: number;
    rehabRange?: string;
    rehabEstimate?: number;
  };
  isLoading?: boolean;
}

export const ScoreResultsCard: React.FC<ScoreResultsCardProps> = ({
  score,
  grade,
  aiSummary,
  metadata,
  isLoading = false,
}) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const scoreColor = getScoreColor(score);

  return (
    <ResultsCardContainer>
      <ScoreHeader>
        <AnimatedScoreDisplay score={score} size="large" showRing showLabel animated />
        <ScoreInfo>
          <Typography
            variant="overline"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
            }}
          >
            AI LEAD SCORE
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {grade && (
              <GradeBadge
                label={`Grade ${grade.toUpperCase()}`}
                gradeColor={getGradeColor(grade)}
                size="small"
              />
            )}
            {grade && (
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}
              >
                {getGradeLabel(grade)}
              </Typography>
            )}
          </Box>
        </ScoreInfo>
      </ScoreHeader>

      {aiSummary && (
        <AIInsightsBox>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LightbulbIcon sx={{ color: '#eab308', fontSize: '1.25rem' }} />
            <Typography
              variant="subtitle2"
              sx={{ color: '#ffffff', fontWeight: 600 }}
            >
              Analysis
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            &ldquo;{aiSummary}&rdquo;
          </Typography>
        </AIInsightsBox>
      )}

      {metadata && Object.keys(metadata).length > 0 && (
        <>
          <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <MetadataGrid>
            {metadata.zestimate !== undefined && (
              <MetadataItem>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}
                >
                  Zestimate
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#ffffff', fontWeight: 600 }}
                >
                  {formatCurrency(metadata.zestimate)}
                </Typography>
              </MetadataItem>
            )}
            {metadata.arv !== undefined && (
              <MetadataItem>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}
                >
                  ARV
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#ffffff', fontWeight: 600 }}
                >
                  {formatCurrency(metadata.arv)}
                </Typography>
              </MetadataItem>
            )}
            {metadata.daysOnMarket !== undefined && (
              <MetadataItem>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}
                >
                  Days Listed
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#ffffff', fontWeight: 600 }}
                >
                  {metadata.daysOnMarket}
                </Typography>
              </MetadataItem>
            )}
            {metadata.rentZestimate !== undefined && (
              <MetadataItem>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}
                >
                  Rent Est.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#ffffff', fontWeight: 600 }}
                >
                  {formatCurrency(metadata.rentZestimate)}/mo
                </Typography>
              </MetadataItem>
            )}
            {metadata.arvRatio !== undefined && (
              <MetadataItem>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}
                >
                  ARV Ratio
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: scoreColor, fontWeight: 600 }}
                >
                  {formatPercentage(metadata.arvRatio)}
                </Typography>
              </MetadataItem>
            )}
            {(metadata.rehabRange || metadata.rehabEstimate !== undefined) && (
              <MetadataItem>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}
                >
                  Rehab Est.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#ffffff', fontWeight: 600 }}
                >
                  {metadata.rehabRange || formatCurrency(metadata.rehabEstimate)}
                </Typography>
              </MetadataItem>
            )}
          </MetadataGrid>
        </>
      )}
    </ResultsCardContainer>
  );
};

export default ScoreResultsCard;
