import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  Voicemail as VoicemailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { VoiceCall, formatCallDuration, getCallStatusDisplay, getCallStatusColor } from '../../types/voice';
import { voiceService } from '../../services/voiceService';
import { formatDistanceToNow } from 'date-fns';

interface CallHistoryPanelProps {
  leadId?: string;
  limit?: number;
  showVoicemailsOnly?: boolean;
}

export const CallHistoryPanel: React.FC<CallHistoryPanelProps> = ({
  leadId,
  limit = 10,
  showVoicemailsOnly = false,
}) => {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: VoiceCall[];
        if (showVoicemailsOnly) {
          data = await voiceService.getVoicemails();
        } else if (leadId) {
          data = await voiceService.getCallsForLead(leadId);
        } else {
          data = await voiceService.getCallHistory(limit);
        }
        setCalls(data);
      } catch (err: any) {
        console.error('Failed to fetch calls:', err);
        setError(err.response?.data?.message || 'Failed to load call history');
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [leadId, limit, showVoicemailsOnly]);

  const toggleExpanded = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  const getStatusChipColor = (status: VoiceCall['status']) => {
    const colorMap = {
      success: 'success' as const,
      primary: 'primary' as const,
      warning: 'warning' as const,
      danger: 'error' as const,
      default: 'default' as const,
    };
    return colorMap[getCallStatusColor(status)];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  if (calls.length === 0) {
    return (
      <Box p={2}>
        <Typography color="textSecondary" variant="body2">
          No call history yet.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {calls.map((call) => (
        <React.Fragment key={call.id}>
          <ListItem
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              cursor: call.voicemailTranscription ? 'pointer' : 'default',
            }}
            onClick={() => call.voicemailTranscription && toggleExpanded(call.id)}
          >
            <ListItemIcon>
              {call.direction === 'outbound' ? (
                <CallMadeIcon color="primary" />
              ) : (
                <CallReceivedIcon color="success" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    {call.direction === 'outbound' ? call.toNumber : call.fromNumber}
                  </Typography>
                  {call.voicemailUrl && (
                    <Tooltip title="Has voicemail">
                      <VoicemailIcon fontSize="small" color="info" />
                    </Tooltip>
                  )}
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="textSecondary">
                    {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                  </Typography>
                  {call.durationSeconds && call.durationSeconds > 0 && (
                    <Typography variant="caption" color="textSecondary">
                      · {formatCallDuration(call.durationSeconds)}
                    </Typography>
                  )}
                </Box>
              }
            />
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={getCallStatusDisplay(call.status)}
                size="small"
                color={getStatusChipColor(call.status)}
                variant="outlined"
              />
              {call.voicemailUrl && (
                <Tooltip title="Play voicemail">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(call.voicemailUrl, '_blank');
                    }}
                  >
                    <PlayIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {call.voicemailTranscription && (
                <IconButton size="small">
                  {expandedCallId === call.id ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
              )}
            </Box>
          </ListItem>
          {call.voicemailTranscription && (
            <Collapse in={expandedCallId === call.id}>
              <Box sx={{ p: 2, pl: 7, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                  Voicemail Transcription:
                </Typography>
                <Typography variant="body2">
                  {call.voicemailTranscription}
                </Typography>
              </Box>
            </Collapse>
          )}
        </React.Fragment>
      ))}
    </List>
  );
};
