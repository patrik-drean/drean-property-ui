import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Collapse,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Alert,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
import {
  leadQueueService,
  LeadDebugResponse,
  EvaluationHistoryItem,
  LeadActivityItem,
} from '../../../services/leadQueueService';
import { EvaluationHistorySection } from './EvaluationHistorySection';
import { ArvAnalysisSection } from './ArvAnalysisSection';

interface DebugSectionProps {
  lead: QueueLead;
  onRerunEvaluation?: (tier: 'quick' | 'full') => void;
}

/**
 * DebugSection - Developer-focused panel for evaluation transparency
 *
 * Shows:
 * - Lead metadata (IDs, timestamps, costs)
 * - Raw evaluation data with collapsible JSON viewers
 * - Activity log timeline
 * - AI reasoning from latest evaluation
 * - Evaluation history table
 */
export const DebugSection: React.FC<DebugSectionProps> = ({
  lead,
  onRerunEvaluation,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<LeadDebugResponse | null>(null);
  const [rescanLoading, setRescanLoading] = useState<'quick' | 'full' | null>(null);

  // Expanded state for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    arvAnalysis: false,
    evaluation: false,
    activity: false,
    aiReasoning: false,
    evaluationHistory: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchDebugData = useCallback(async () => {
    if (!lead?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await leadQueueService.getDebugData(lead.id);
      setDebugData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load debug data');
    } finally {
      setLoading(false);
    }
  }, [lead?.id]);

  useEffect(() => {
    fetchDebugData();
  }, [fetchDebugData]);

  const handleRescan = useCallback(async (tier: 'quick' | 'full') => {
    if (!onRerunEvaluation || rescanLoading) return;
    setRescanLoading(tier);
    try {
      await onRerunEvaluation(tier);
      // Refresh debug data after rescan completes
      await fetchDebugData();
    } finally {
      setRescanLoading(null);
    }
  }, [onRerunEvaluation, rescanLoading, fetchDebugData]);

  const copyToClipboard = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const formatCost = (cost?: number) => {
    if (cost === undefined || cost === null) return 'N/A';
    return `$${cost.toFixed(4)}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <CircularProgress size={24} sx={{ color: '#4ade80' }} />
        <Typography sx={{ ml: 2, color: '#8b949e' }}>Loading debug data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button size="small" onClick={fetchDebugData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!debugData) return null;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with refresh button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          Debug Panel
        </Typography>
        <Tooltip title="Refresh debug data">
          <IconButton size="small" onClick={fetchDebugData} sx={{ color: '#8b949e' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Lead Metadata Section */}
      <CollapsibleSection
        title="LEAD METADATA"
        expanded={expandedSections.metadata}
        onToggle={() => toggleSection('metadata')}
        onCopy={() => copyToClipboard(debugData.lead)}
      >
        <MetadataGrid>
          <MetadataItem label="ID" value={debugData.lead.id} mono />
          <MetadataItem label="Created" value={formatDate(debugData.lead.createdAt)} />
          <MetadataItem label="Last Evaluated" value={formatDate(debugData.metadata.lastEvaluatedAt)} />
          <MetadataItem label="Evaluation Tier" value={debugData.metadata.evaluationTier || 'N/A'} />
          <MetadataItem label="Total Eval Cost" value={formatCost(debugData.metadata.totalCost)} />
          <MetadataItem label="Duration" value={debugData.metadata.durationMs ? `${debugData.metadata.durationMs}ms` : 'N/A'} />
          <MetadataItem label="Correlation ID" value={debugData.metadata.correlationId || 'N/A'} mono />
        </MetadataGrid>
      </CollapsibleSection>

      {/* TASK-129: ARV Analysis Section */}
      <CollapsibleSection
        title="ARV ANALYSIS"
        expanded={expandedSections.arvAnalysis}
        onToggle={() => toggleSection('arvAnalysis')}
        onCopy={() => copyToClipboard(debugData.evaluationData.arvEstimate)}
        badge={debugData.evaluationData.arvEstimate ? 'Has Data' : 'No Data'}
      >
        <ArvAnalysisSection
          arvEstimate={debugData.evaluationData.arvEstimate as any}
          zestimate={(debugData.evaluationData.arvEstimate as any)?.benchmarkZestimate}
        />
      </CollapsibleSection>

      {/* Evaluation Data Section */}
      <CollapsibleSection
        title="EVALUATION DATA"
        expanded={expandedSections.evaluation}
        onToggle={() => toggleSection('evaluation')}
        onCopy={() => copyToClipboard(debugData.evaluationData)}
      >
        <JsonViewer label="ArvEstimate" data={debugData.evaluationData.arvEstimate} />
        <JsonViewer label="RehabEstimate" data={debugData.evaluationData.rehabEstimate} />
        <JsonViewer label="RentEstimate" data={debugData.evaluationData.rentEstimate} />
        <JsonViewer label="NeighborhoodGrade" data={debugData.evaluationData.neighborhoodGrade} />
        <JsonViewer label="Score" data={debugData.evaluationData.score} />
        <JsonViewer label="EvaluationNotes" data={debugData.evaluationData.evaluationNotes} />
      </CollapsibleSection>

      {/* Activity Log Section */}
      <CollapsibleSection
        title="ACTIVITY LOG"
        expanded={expandedSections.activity}
        onToggle={() => toggleSection('activity')}
        badge={`${debugData.recentActivity.length} events`}
      >
        <ActivityLog activities={debugData.recentActivity} />
      </CollapsibleSection>

      {/* AI Reasoning Section */}
      {debugData.latestEvaluation && (
        <CollapsibleSection
          title="AI REASONING (Latest Evaluation)"
          expanded={expandedSections.aiReasoning}
          onToggle={() => toggleSection('aiReasoning')}
          onCopy={() => copyToClipboard(debugData.latestEvaluation)}
        >
          <AiReasoningView evaluation={debugData.latestEvaluation} />
        </CollapsibleSection>
      )}

      {/* Evaluation History Section */}
      <CollapsibleSection
        title="EVALUATION HISTORY"
        expanded={expandedSections.evaluationHistory}
        onToggle={() => toggleSection('evaluationHistory')}
      >
        <EvaluationHistorySection leadId={lead.id} />
      </CollapsibleSection>

      {/* Re-run Actions */}
      {onRerunEvaluation && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: '1px solid #21262d',
            borderRadius: 1,
            bgcolor: '#0d1117',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: '#8b949e', fontWeight: 600, mb: 1.5, letterSpacing: '0.05em' }}
          >
            RE-RUN EVALUATION
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={rescanLoading === 'quick' ? <CircularProgress size={16} sx={{ color: '#4ade80' }} /> : <RefreshIcon />}
              onClick={() => handleRescan('quick')}
              disabled={rescanLoading !== null}
              sx={{
                borderColor: '#30363d',
                color: '#4ade80',
                '&:hover': { borderColor: '#4ade80', bgcolor: 'rgba(74, 222, 128, 0.1)' },
                '&.Mui-disabled': { borderColor: '#21262d', color: '#4ade80', opacity: 0.6 },
              }}
            >
              {rescanLoading === 'quick' ? 'Rescanning...' : 'Quick (~$0.05)'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={rescanLoading === 'full' ? <CircularProgress size={16} sx={{ color: '#a78bfa' }} /> : <RefreshIcon />}
              onClick={() => handleRescan('full')}
              disabled={rescanLoading !== null}
              sx={{
                borderColor: '#30363d',
                color: '#a78bfa',
                '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(167, 139, 250, 0.1)' },
                '&.Mui-disabled': { borderColor: '#21262d', color: '#a78bfa', opacity: 0.6 },
              }}
            >
              {rescanLoading === 'full' ? 'Rescanning...' : 'Full (~$1.00)'}
            </Button>
          </Box>
          <Typography variant="caption" sx={{ color: '#6e7681', display: 'block', mt: 1 }}>
            Quick uses AI-only evaluation. Full includes RentCast data for more accurate ARV/comps.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Sub-components

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  onCopy?: () => void;
  badge?: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  expanded,
  onToggle,
  onCopy,
  badge,
  children,
}) => (
  <Box
    sx={{
      mb: 2,
      border: '1px solid #21262d',
      borderRadius: 1,
      bgcolor: '#0d1117',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        cursor: 'pointer',
        '&:hover': { bgcolor: '#161b22' },
      }}
      onClick={onToggle}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {expanded ? (
          <CollapseIcon sx={{ color: '#8b949e', fontSize: 18 }} />
        ) : (
          <ExpandIcon sx={{ color: '#8b949e', fontSize: 18 }} />
        )}
        <Typography
          variant="subtitle2"
          sx={{ color: '#8b949e', fontWeight: 600, letterSpacing: '0.05em' }}
        >
          {title}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              height: 20,
              bgcolor: '#21262d',
              color: '#8b949e',
              fontSize: '0.7rem',
            }}
          />
        )}
      </Box>
      {onCopy && (
        <Tooltip title="Copy JSON">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            sx={{ color: '#8b949e' }}
          >
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
    <Collapse in={expanded}>
      <Box sx={{ p: 2, borderTop: '1px solid #21262d' }}>{children}</Box>
    </Collapse>
  </Box>
);

const MetadataGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 1.5,
    }}
  >
    {children}
  </Box>
);

interface MetadataItemProps {
  label: string;
  value: string;
  mono?: boolean;
}

const MetadataItem: React.FC<MetadataItemProps> = ({ label, value, mono }) => (
  <Box>
    <Typography variant="caption" sx={{ color: '#6e7681', fontSize: '0.7rem' }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: '#f0f6fc',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontSize: mono ? '0.75rem' : '0.875rem',
        wordBreak: 'break-all',
      }}
    >
      {value}
    </Typography>
  </Box>
);

interface JsonViewerProps {
  label: string;
  data: unknown;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ label, data }) => {
  const [expanded, setExpanded] = useState(false);

  if (data === undefined || data === null) {
    return (
      <Box sx={{ py: 0.5 }}>
        <Typography variant="body2" sx={{ color: '#6e7681' }}>
          {label}: <em>null</em>
        </Typography>
      </Box>
    );
  }

  const isSimple = typeof data !== 'object';
  const jsonStr = JSON.stringify(data, null, 2);

  return (
    <Box sx={{ py: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: isSimple ? 'default' : 'pointer',
          '&:hover': isSimple ? {} : { bgcolor: '#161b22' },
          borderRadius: 0.5,
          p: 0.5,
          ml: -0.5,
        }}
        onClick={() => !isSimple && setExpanded(!expanded)}
      >
        {!isSimple && (
          expanded ? (
            <CollapseIcon sx={{ color: '#8b949e', fontSize: 16, mr: 0.5 }} />
          ) : (
            <ExpandIcon sx={{ color: '#8b949e', fontSize: 16, mr: 0.5 }} />
          )
        )}
        <Typography variant="body2" sx={{ color: '#79c0ff' }}>
          {label}
        </Typography>
        {isSimple && (
          <Typography variant="body2" sx={{ color: '#8b949e', ml: 1 }}>
            {String(data)}
          </Typography>
        )}
      </Box>
      {!isSimple && (
        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 0.5,
              p: 1,
              bgcolor: '#161b22',
              borderRadius: 0.5,
              overflow: 'auto',
              maxHeight: 300,
            }}
          >
            <pre
              style={{
                margin: 0,
                color: '#8b949e',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              {jsonStr}
            </pre>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

interface ActivityLogProps {
  activities: LeadActivityItem[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: '#6e7681', fontStyle: 'italic' }}>
        No activity recorded yet
      </Typography>
    );
  }

  return (
    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
      {activities.map((activity) => (
        <Box
          key={activity.id}
          sx={{
            display: 'flex',
            gap: 2,
            py: 1,
            borderBottom: '1px solid #21262d',
            '&:last-child': { borderBottom: 'none' },
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#6e7681', minWidth: 120, fontSize: '0.7rem' }}
          >
            {new Date(activity.occurredAt).toLocaleString()}
          </Typography>
          <Chip
            label={activity.eventType}
            size="small"
            sx={{
              height: 20,
              bgcolor: getEventTypeColor(activity.eventType),
              color: '#fff',
              fontSize: '0.65rem',
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: '#8b949e', flex: 1, fontSize: '0.75rem' }}
          >
            {formatEventData(activity.eventType, activity.eventData)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const getEventTypeColor = (eventType: string): string => {
  if (eventType.includes('created')) return '#238636';
  if (eventType.includes('completed')) return '#1f6feb';
  if (eventType.includes('failed')) return '#f85149';
  if (eventType.includes('updated') || eventType.includes('changed')) return '#a371f7';
  if (eventType.includes('override')) return '#e3b341';
  return '#30363d';
};

const formatEventData = (eventType: string, data: Record<string, unknown>): string => {
  if (eventType.includes('updated') && 'oldValue' in data && 'newValue' in data) {
    const oldVal = typeof data.oldValue === 'number'
      ? `$${data.oldValue.toLocaleString()}`
      : String(data.oldValue);
    const newVal = typeof data.newValue === 'number'
      ? `$${data.newValue.toLocaleString()}`
      : String(data.newValue);
    return `${oldVal} → ${newVal}`;
  }
  if (eventType === 'evaluation_completed') {
    return `tier=${data.tier}, cost=${formatEventCost(data.cost as number | undefined)}`;
  }
  if (eventType === 'evaluation_failed') {
    return `error: ${data.error}`;
  }
  // Default: show key summary
  const keys = Object.keys(data).slice(0, 3);
  return keys.map((k) => `${k}=${JSON.stringify(data[k])}`).join(', ');
};

const formatEventCost = (cost?: number): string => {
  if (cost === undefined) return 'N/A';
  return `$${cost.toFixed(4)}`;
};

interface AiReasoningViewProps {
  evaluation: EvaluationHistoryItem;
}

const AiReasoningView: React.FC<AiReasoningViewProps> = ({ evaluation }) => {
  const snapshots = [
    { label: 'ARV Analysis', snapshot: evaluation.arvSnapshot },
    { label: 'Rehab Analysis', snapshot: evaluation.rehabSnapshot },
    { label: 'Rent Analysis', snapshot: evaluation.rentSnapshot },
    { label: 'Neighborhood Analysis', snapshot: evaluation.neighborhoodSnapshot },
    { label: 'Summary Analysis', snapshot: evaluation.summarySnapshot },
  ].filter((s) => s.snapshot);

  if (snapshots.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: '#6e7681', fontStyle: 'italic' }}>
        No AI reasoning data available
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#6e7681', mb: 1, display: 'block' }}>
        Evaluated at {new Date(evaluation.evaluatedAt).toLocaleString()} |
        Tier: {evaluation.tier} |
        Cost: {formatEventCost(evaluation.totalCost)} |
        Duration: {evaluation.durationMs ? `${evaluation.durationMs}ms` : 'N/A'}
      </Typography>
      {snapshots.map(({ label, snapshot }) => (
        <SnapshotViewer key={label} label={label} snapshot={snapshot!} />
      ))}
    </Box>
  );
};

interface SnapshotViewerProps {
  label: string;
  snapshot: {
    prompt?: string;
    rawResponse?: string;
    parsedResult?: unknown;
    cost?: number;
    durationMs?: number;
    error?: string;
  };
}

const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ label, snapshot }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        marginBottom: 8,
        border: '1px solid #21262d',
        borderRadius: 4,
        backgroundColor: '#0d1117',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: '#161b22' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {expanded ? (
            <CollapseIcon sx={{ color: '#8b949e', fontSize: 16 }} />
          ) : (
            <ExpandIcon sx={{ color: '#8b949e', fontSize: 16 }} />
          )}
          <Typography variant="body2" sx={{ color: '#79c0ff' }}>
            {label}
          </Typography>
          {snapshot.error && (
            <Chip
              label="Error"
              size="small"
              sx={{ height: 18, bgcolor: '#f85149', color: '#fff', fontSize: '0.65rem' }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: '#6e7681' }}>
          {snapshot.cost !== undefined && `$${snapshot.cost.toFixed(4)}`}
          {snapshot.durationMs !== undefined && ` | ${snapshot.durationMs}ms`}
        </Typography>
      </Box>
      {expanded ? (
        <Box sx={{ p: 1.5, borderTop: '1px solid #21262d' }}>
          <>
          {snapshot.prompt && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#6e7681', fontWeight: 600 }}>
                Prompt:
              </Typography>
              <Box
                sx={{
                  mt: 0.5,
                  p: 1,
                  bgcolor: '#161b22',
                  borderRadius: 0.5,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    color: '#8b949e',
                    fontSize: '0.7rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {snapshot.prompt}
                </pre>
              </Box>
            </Box>
          )}
          {snapshot.rawResponse && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#6e7681', fontWeight: 600 }}>
                Response:
              </Typography>
              <Box
                sx={{
                  mt: 0.5,
                  p: 1,
                  bgcolor: '#161b22',
                  borderRadius: 0.5,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    color: '#8b949e',
                    fontSize: '0.7rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {snapshot.rawResponse}
                </pre>
              </Box>
            </Box>
          )}
          {snapshot.parsedResult && (
            <Box>
              <Typography variant="caption" sx={{ color: '#6e7681', fontWeight: 600 }}>
                Parsed Result:
              </Typography>
              <Box
                sx={{
                  mt: 0.5,
                  p: 1,
                  bgcolor: '#161b22',
                  borderRadius: 0.5,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    color: '#4ade80',
                    fontSize: '0.7rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(snapshot.parsedResult, null, 2)}
                </pre>
              </Box>
            </Box>
          )}
          {snapshot.error && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#f85149', fontWeight: 600 }}>
                Error: {snapshot.error}
              </Typography>
            </Box>
          )}
          </>
        </Box>
      ) : null}
    </div>
  );
};

export default DebugSection;
