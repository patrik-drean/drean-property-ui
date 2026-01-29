import { styled } from '@mui/material/styles';
import { TableCell, TableRow } from '@mui/material';

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '6px 8px',
  fontSize: '0.8125rem',
  whiteSpace: 'nowrap',
  color: '#f0f6fc',
  borderBottom: '1px solid #30363d',
  '&.header': {
    backgroundColor: '#161b22',
    color: '#8b949e',
    fontWeight: 600,
    height: '38px',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  '&.metric': {
    backgroundColor: '#21262d',
    color: '#f0f6fc',
  }
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: '#0d1117',
  '&:nth-of-type(odd)': {
    backgroundColor: '#161b22',
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: '#21262d !important',
    cursor: 'pointer'
  },
  height: '46px'
}));
