import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Link,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { StageLead } from '../../types/salesFunnel';

interface StageLeadsModalProps {
  open: boolean;
  onClose: () => void;
  stageName: string;
  leads: StageLead[];
  onNavigateToLead?: (leadId: string) => void;
}

type SortField = 'address' | 'listingPrice' | 'score' | 'daysInStage' | 'stageEnteredAt';
type SortDirection = 'asc' | 'desc';

export const StageLeadsModal: React.FC<StageLeadsModalProps> = ({
  open,
  onClose,
  stageName,
  leads,
  onNavigateToLead,
}) => {
  const [sortField, setSortField] = useState<SortField>('stageEnteredAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'address':
        comparison = a.address.localeCompare(b.address);
        break;
      case 'listingPrice':
        comparison = a.listingPrice - b.listingPrice;
        break;
      case 'score':
        comparison = (a.score ?? 0) - (b.score ?? 0);
        break;
      case 'daysInStage':
        comparison = (a.daysInStage ?? 0) - (b.daysInStage ?? 0);
        break;
      case 'stageEnteredAt':
        const aDate = a.stageEnteredAt ? new Date(a.stageEnteredAt).getTime() : 0;
        const bDate = b.stageEnteredAt ? new Date(b.stageEnteredAt).getTime() : 0;
        comparison = aDate - bDate;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleExportCsv = () => {
    const headers = ['Address', 'Listing Price', 'Score', 'Status', 'Stage Entered', 'Days in Stage'];
    const rows = sortedLeads.map(lead => [
      `"${lead.address.replace(/"/g, '""')}"`,
      lead.listingPrice,
      lead.score ?? '',
      lead.status,
      lead.stageEnteredAt ? new Date(lead.stageEnteredAt).toISOString().split('T')[0] : '',
      lead.daysInStage ?? '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stageName.toLowerCase().replace(/\s+/g, '-')}-leads.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { maxHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">{stageName} Stage</Typography>
            <Chip label={`${leads.length} leads`} size="small" color="primary" />
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Export to CSV">
              <IconButton onClick={handleExportCsv} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {leads.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No leads in this stage.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'address'}
                      direction={sortField === 'address' ? sortDirection : 'asc'}
                      onClick={() => handleSort('address')}
                    >
                      Address
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'listingPrice'}
                      direction={sortField === 'listingPrice' ? sortDirection : 'asc'}
                      onClick={() => handleSort('listingPrice')}
                    >
                      Price
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'score'}
                      direction={sortField === 'score' ? sortDirection : 'asc'}
                      onClick={() => handleSort('score')}
                    >
                      Score
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'stageEnteredAt'}
                      direction={sortField === 'stageEnteredAt' ? sortDirection : 'asc'}
                      onClick={() => handleSort('stageEnteredAt')}
                    >
                      Entered Stage
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'daysInStage'}
                      direction={sortField === 'daysInStage' ? sortDirection : 'asc'}
                      onClick={() => handleSort('daysInStage')}
                    >
                      Days in Stage
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    hover
                    sx={{ cursor: onNavigateToLead ? 'pointer' : 'default' }}
                    onClick={() => onNavigateToLead?.(lead.id)}
                  >
                    <TableCell>
                      {onNavigateToLead ? (
                        <Link component="button" sx={{ textAlign: 'left' }}>
                          {lead.address}
                        </Link>
                      ) : (
                        lead.address
                      )}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(lead.listingPrice)}</TableCell>
                    <TableCell align="right">
                      {lead.score !== null ? (
                        <Chip
                          label={lead.score}
                          size="small"
                          color={lead.score >= 7 ? 'success' : lead.score >= 5 ? 'warning' : 'default'}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{lead.status}</TableCell>
                    <TableCell>{formatDate(lead.stageEnteredAt)}</TableCell>
                    <TableCell align="right">
                      {lead.daysInStage !== null ? (
                        <Typography
                          component="span"
                          color={lead.daysInStage > 30 ? 'warning.main' : 'text.primary'}
                        >
                          {lead.daysInStage}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
