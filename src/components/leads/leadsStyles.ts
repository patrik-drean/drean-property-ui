import { styled, keyframes } from '@mui/material/styles';
import { TableCell, TableRow, IconButton, Box, Typography, Button, Alert } from '@mui/material';

// ========== Score Button Animations ==========

// Pulse glow animation for the Score Property button
export const scorePulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
`;

// Loading dots animation
export const loadingDots = keyframes`
  0%, 20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60%, 100% {
    content: '...';
  }
`;

// ========== Score Button Styled Components ==========

export const ScorePropertyButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'hasUrl' && prop !== 'isScoring',
})<{ hasUrl?: boolean; isScoring?: boolean }>(
  ({ theme, hasUrl, isScoring }) => ({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5, 3),
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.95rem',
    textTransform: 'none',
    transition: 'all 0.3s ease',
    ...(hasUrl && !isScoring && {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#ffffff',
      border: 'none',
      animation: `${scorePulse} 2s infinite`,
      '&:hover': {
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
      },
    }),
    ...(!hasUrl && {
      borderColor: 'rgba(255, 255, 255, 0.4)',
      color: 'rgba(255, 255, 255, 0.6)',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: 'rgba(255, 255, 255, 0.9)',
      },
      '&.Mui-disabled': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
        color: 'rgba(255, 255, 255, 0.5)',
      },
    }),
    ...(isScoring && {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#ffffff',
      animation: 'none',
      opacity: 0.9,
    }),
  })
);

// ========== Error Card ==========

export const ScoreErrorCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export const ScoreErrorAlert = styled(Alert)(({ theme }) => ({
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  borderRadius: '12px',
  '& .MuiAlert-icon': {
    color: '#f59e0b',
  },
}));

// ========== Loading State ==========

export const LoadingStepsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(16, 185, 129, 0.05)',
  border: '1px solid rgba(16, 185, 129, 0.2)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export const LoadingStep = styled(Box)<{ active?: boolean }>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.75, 0),
  color: active ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
  transition: 'color 0.3s ease',
  '& svg': {
    fontSize: '1.25rem',
  },
}));

// ========== Form Section Styling ==========

export const CollapsibleSection = styled(Box)<{ expanded?: boolean }>(({ theme, expanded }) => ({
  overflow: 'hidden',
  transition: 'max-height 0.3s ease, opacity 0.3s ease',
  maxHeight: expanded ? '2000px' : '0',
  opacity: expanded ? 1 : 0,
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 0),
  cursor: 'pointer',
  userSelect: 'none',
  '&:hover': {
    '& .MuiTypography-root': {
      color: '#10b981',
    },
  },
}));

// ========== Existing Table Styles ==========

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 16px',
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  borderLeft: '6px solid transparent',
  backgroundColor: '#ffffff !important',
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: '#f8f9fa !important',
  }
}));

// Action button styling
export const ActionIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(25, 118, 210, 0.08)',
  '&:hover': {
    backgroundColor: 'rgba(25, 118, 210, 0.15)'
  }
}));

export const DeleteIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(211, 47, 47, 0.08)',
  '&:hover': {
    backgroundColor: 'rgba(211, 47, 47, 0.15)'
  }
}));

// Add a new styled component for the converted badge
export const ConvertedBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  borderRadius: '4px',
  padding: '2px 6px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  marginLeft: '8px',
}));

// Styled component for uncontacted leads
export const NotContactedText = styled(Typography)(({ theme }) => ({
  color: theme.palette.warning.main,
  fontWeight: 'bold',
}));
