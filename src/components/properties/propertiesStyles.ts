import { styled } from '@mui/material/styles';
import { TableCell, TableRow } from '@mui/material';

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '6px 8px',
  fontSize: '0.8125rem',
  whiteSpace: 'nowrap',
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    height: '38px'
  },
  '&.metric': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
  }
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: '#f1f5f9',
    cursor: 'pointer'
  },
  height: '46px'
}));
