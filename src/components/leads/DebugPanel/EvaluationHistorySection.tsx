import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Chip,
  CircularProgress,
  Button,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import {
  leadQueueService,
  EvaluationHistoryItem,
  ProviderSnapshot,
} from '../../../services/leadQueueService';

interface EvaluationHistorySectionProps {
  leadId: string;
}

/**
 * EvaluationHistorySection - Table showing past evaluations with expandable details
 *
 * Displays evaluation history with:
 * - Date, tier, trigger source, ARV, Rehab, cost
 * - Expandable rows showing full snapshot details
 * - Pagination for loading more history
 */
export const EvaluationHistorySection: React.FC<EvaluationHistorySectionProps> = ({
  leadId,
}) => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [history, setHistory] = useState<EvaluationHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchHistory = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await leadQueueService.getEvaluationHistory(leadId, 10, offset);
      if (append) {
        setHistory((prev) => [...prev, ...response.items]);
      } else {
        setHistory(response.items);
      }
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to load evaluation history:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (cost?: number) => {
    if (cost === undefined || cost === null) return '-';
    return `$${cost.toFixed(2)}`;
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `$${value.toLocaleString()}`;
  };

  const getTierColor = (tier: string) => {
    return tier.toLowerCase() === 'full' ? '#a78bfa' : '#4ade80';
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger.toLowerCase()) {
      case 'manual':
        return '#60a5fa';
      case 'ingestion':
        return '#34d399';
      case 'consolidation':
        return '#fbbf24';
      default:
        return '#8b949e';
    }
  };

  // Extract ARV value from snapshot
  const getArvFromSnapshot = (item: EvaluationHistoryItem): number | undefined => {
    const parsed = item.arvSnapshot?.parsedResult;
    if (parsed && typeof parsed === 'object' && 'arv' in parsed) {
      return (parsed as { arv: number }).arv;
    }
    return undefined;
  };

  // Extract Rehab value from snapshot
  const getRehabFromSnapshot = (item: EvaluationHistoryItem): number | undefined => {
    const parsed = item.rehabSnapshot?.parsedResult;
    if (parsed && typeof parsed === 'object' && 'midEstimate' in parsed) {
      return (parsed as { midEstimate: number }).midEstimate;
    }
    return undefined;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} sx={{ color: '#4ade80' }} />
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: '#6e7681', fontStyle: 'italic', p: 2 }}>
        No evaluation history available
      </Typography>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#21262d' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#8b949e', fontWeight: 600, width: 40 }} />
              <TableCell sx={{ color: '#8b949e', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ color: '#8b949e', fontWeight: 600 }}>Tier</TableCell>
              <TableCell sx={{ color: '#8b949e', fontWeight: 600 }}>Trigger</TableCell>
              <TableCell sx={{ color: '#8b949e', fontWeight: 600, textAlign: 'right' }}>ARV</TableCell>
              <TableCell sx={{ color: '#8b949e', fontWeight: 600, textAlign: 'right' }}>Rehab</TableCell>
              <TableCell sx={{ color: '#8b949e', fontWeight: 600, textAlign: 'right' }}>Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((item) => {
              const isExpanded = expandedRows.has(item.id);
              const arv = getArvFromSnapshot(item);
              const rehab = getRehabFromSnapshot(item);

              return (
                <React.Fragment key={item.id}>
                  <TableRow
                    hover
                    onClick={() => toggleRow(item.id)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#161b22' },
                    }}
                  >
                    <TableCell sx={{ color: '#8b949e', p: 0.5 }}>
                      <IconButton size="small" sx={{ color: '#8b949e' }}>
                        {isExpanded ? (
                          <CollapseIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <ExpandIcon sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ color: '#c9d1d9', fontSize: '0.8rem' }}>
                      {formatDate(item.evaluatedAt)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.tier}
                        size="small"
                        sx={{
                          height: 20,
                          bgcolor: getTierColor(item.tier),
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.triggerSource}
                        size="small"
                        sx={{
                          height: 20,
                          bgcolor: getTriggerColor(item.triggerSource),
                          color: '#fff',
                          fontSize: '0.65rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#4ade80', textAlign: 'right', fontSize: '0.8rem' }}>
                      {formatCurrency(arv)}
                    </TableCell>
                    <TableCell sx={{ color: '#f87171', textAlign: 'right', fontSize: '0.8rem' }}>
                      {formatCurrency(rehab)}
                    </TableCell>
                    <TableCell sx={{ color: '#8b949e', textAlign: 'right', fontSize: '0.8rem' }}>
                      {formatCost(item.totalCost)}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row with Snapshot Details */}
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, borderBottom: isExpanded ? '1px solid #21262d' : 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: '#0d1117' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#6e7681' }}>
                              Correlation ID: {item.correlationId || 'N/A'} | Duration: {item.durationMs ? `${item.durationMs}ms` : 'N/A'}
                            </Typography>
                            <Tooltip title="Copy full evaluation">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item);
                                }}
                                sx={{ color: '#8b949e' }}
                              >
                                <CopyIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          {/* Provider Snapshots */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                            {item.arvSnapshot && (
                              <SnapshotCard label="ARV" snapshot={item.arvSnapshot} />
                            )}
                            {item.rehabSnapshot && (
                              <SnapshotCard label="Rehab" snapshot={item.rehabSnapshot} />
                            )}
                            {item.rentSnapshot && (
                              <SnapshotCard label="Rent" snapshot={item.rentSnapshot} />
                            )}
                            {item.neighborhoodSnapshot && (
                              <SnapshotCard label="Neighborhood" snapshot={item.neighborhoodSnapshot} />
                            )}
                            {item.summarySnapshot && (
                              <SnapshotCard label="Summary" snapshot={item.summarySnapshot} />
                            )}
                          </Box>

                          {/* Errors */}
                          {item.errors && item.errors.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" sx={{ color: '#f85149', fontWeight: 600 }}>
                                Errors:
                              </Typography>
                              {item.errors.map((err, i) => (
                                <Typography key={i} variant="caption" sx={{ color: '#f85149', display: 'block' }}>
                                  {err.provider}: {err.error}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Load More Button */}
      {history.length < total && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => fetchHistory(history.length, true)}
            disabled={loadingMore}
            sx={{
              color: '#8b949e',
              '&:hover': { color: '#c9d1d9', bgcolor: 'rgba(139, 148, 158, 0.1)' },
            }}
          >
            {loadingMore ? (
              <CircularProgress size={16} sx={{ color: '#8b949e', mr: 1 }} />
            ) : null}
            Load More ({history.length} of {total})
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Snapshot Card Component
interface SnapshotCardProps {
  label: string;
  snapshot: ProviderSnapshot;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({ label, snapshot }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        border: '1px solid #21262d',
        borderRadius: 1,
        bgcolor: '#161b22',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: '#1c2128' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {expanded ? (
            <CollapseIcon sx={{ color: '#8b949e', fontSize: 14 }} />
          ) : (
            <ExpandIcon sx={{ color: '#8b949e', fontSize: 14 }} />
          )}
          <Typography variant="caption" sx={{ color: '#79c0ff', fontWeight: 600 }}>
            {label}
          </Typography>
          {snapshot.error && (
            <Chip
              label="Error"
              size="small"
              sx={{ height: 16, bgcolor: '#f85149', color: '#fff', fontSize: '0.6rem' }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: '#6e7681' }}>
          {snapshot.cost !== undefined && `$${snapshot.cost.toFixed(4)}`}
          {snapshot.durationMs !== undefined && ` | ${snapshot.durationMs}ms`}
        </Typography>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 1.5, borderTop: '1px solid #21262d' }}>
          <>
            {snapshot.prompt && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#6e7681', fontWeight: 600, display: 'block' }}>
                  Prompt:
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    p: 1,
                    bgcolor: '#0d1117',
                    borderRadius: 0.5,
                    maxHeight: 100,
                    overflow: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, color: '#8b949e', fontSize: '0.65rem', whiteSpace: 'pre-wrap' }}>
                    {snapshot.prompt.substring(0, 500)}
                    {snapshot.prompt.length > 500 && '...'}
                  </pre>
                </Box>
              </Box>
            )}

            {snapshot.rawResponse && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#6e7681', fontWeight: 600, display: 'block' }}>
                  Response:
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    p: 1,
                    bgcolor: '#0d1117',
                    borderRadius: 0.5,
                    maxHeight: 100,
                    overflow: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, color: '#8b949e', fontSize: '0.65rem', whiteSpace: 'pre-wrap' }}>
                    {snapshot.rawResponse.substring(0, 500)}
                    {snapshot.rawResponse.length > 500 && '...'}
                  </pre>
                </Box>
              </Box>
            )}

            {snapshot.parsedResult && (
              <Box>
                <Typography variant="caption" sx={{ color: '#6e7681', fontWeight: 600, display: 'block' }}>
                  Parsed:
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    p: 1,
                    bgcolor: '#0d1117',
                    borderRadius: 0.5,
                    maxHeight: 100,
                    overflow: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, color: '#4ade80', fontSize: '0.65rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(snapshot.parsedResult, null, 2)}
                  </pre>
                </Box>
              </Box>
            )}

            {snapshot.error && (
              <Typography variant="caption" sx={{ color: '#f85149', display: 'block', mt: 1 }}>
                Error: {snapshot.error}
              </Typography>
            )}
          </>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EvaluationHistorySection;
