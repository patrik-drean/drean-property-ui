import { styled } from '@mui/material/styles';
import { TableCell, TableRow, IconButton, Box, Typography } from '@mui/material';

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
