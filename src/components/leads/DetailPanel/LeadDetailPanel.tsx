import React, { useEffect, useCallback } from 'react';
import { Drawer, Box, Grid, CircularProgress, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
import { PanelHeader } from './PanelHeader';
import { PropertyDetailsSection } from './PropertyDetailsSection';
import { EvaluationSection } from './EvaluationSection';
import { MessagingSection } from './MessagingSection';
import { ActionsSection } from './ActionsSection';
import { RentCastArvResult } from '../../../services/leadQueueService';

export interface EvaluationUpdate {
  arv?: number;
  arvNote?: string;
  rehabEstimate?: number;
  rehabNote?: string;
  rentEstimate?: number;
  rentNote?: string;
}

interface LeadDetailPanelProps {
  open: boolean;
  lead: QueueLead | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  onSendMessage?: (message: string) => void;
  onStatusChange?: (status: QueueLead['status']) => void;
  onAction?: (action: string, data?: any) => void;
  onNotesChange?: (notes: string) => void;
  onRetry?: () => void;
  onEvaluationSave?: (leadId: string, updates: EvaluationUpdate) => Promise<void>;
  onRentCastSuccess?: (leadId: string, result: RentCastArvResult) => void;
  onDeletePermanently?: () => Promise<void>;
  deleteLoading?: boolean;
  onFollowUp?: () => void;
}

/**
 * LeadDetailPanel - Slide-out drawer showing comprehensive lead details
 *
 * Features:
 * - 2x2 grid layout: Property | Actions | Evaluation | Messaging
 * - Keyboard navigation (j/k for prev/next, f for follow-up, Esc to close)
 * - Mobile responsive (full-screen on mobile, 800px drawer on desktop)
 * - Loading and error states
 * - PropGuide dark theme styling
 *
 * Usage:
 * ```tsx
 * <LeadDetailPanel
 *   open={panelOpen}
 *   lead={selectedLead}
 *   onClose={() => setPanelOpen(false)}
 *   onNavigatePrev={handlePrev}
 *   onNavigateNext={handleNext}
 *   isFirst={index === 0}
 *   isLast={index === leads.length - 1}
 * />
 * ```
 */
export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  open,
  lead,
  loading = false,
  error = null,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  isFirst = false,
  isLast = false,
  onSendMessage,
  onStatusChange,
  onAction,
  onNotesChange,
  onRetry,
  onEvaluationSave,
  onDeletePermanently,
  deleteLoading = false,
  onFollowUp,
}) => {
  // Keyboard shortcuts for panel navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (e.key !== 'Escape') return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'k':
          e.preventDefault();
          if (!isLast) onNavigateNext?.();
          break;
        case 'j':
          e.preventDefault();
          if (!isFirst) onNavigatePrev?.();
          break;
        case 'l':
          e.preventDefault();
          onFollowUp?.();
          break;
        case 'm':
          // Focus message input
          e.preventDefault();
          document.getElementById('message-input')?.focus();
          break;
        case 'a':
          // Archive lead
          e.preventDefault();
          onAction?.('archive');
          break;
      }
    },
    [open, onClose, onNavigatePrev, onNavigateNext, isFirst, isLast, onFollowUp, onAction]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Loading state component
  const LoadingState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 4,
      }}
    >
      <CircularProgress sx={{ color: '#4ade80', mb: 2 }} />
      <Typography sx={{ color: '#8b949e' }}>Loading lead details...</Typography>
    </Box>
  );

  // Error state component
  const ErrorState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 4,
      }}
    >
      <Typography sx={{ color: '#f87171', mb: 2 }}>
        {error || 'Failed to load lead details'}
      </Typography>
      {onRetry && (
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{
            borderColor: '#30363d',
            color: '#f0f6fc',
            '&:hover': { borderColor: '#4ade80' },
          }}
        >
          Retry
        </Button>
      )}
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: 800 },
          boxSizing: 'border-box',
          bgcolor: '#0d1117',
          borderLeft: '1px solid #30363d',
        },
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0, 0, 0, 0.7)',
        },
      }}
      // Prevent closing on backdrop click for better UX
      // Users can still close with Escape or close button
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
    >
      {/* Panel Header */}
      <PanelHeader
        address={lead?.address}
        city={lead?.city}
        state={lead?.state}
        zipCode={lead?.zipCode}
        onClose={onClose}
        onPrev={onNavigatePrev}
        onNext={onNavigateNext}
        isFirst={isFirst}
        isLast={isLast}
      />

      {/* Content Area */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : lead ? (
        <Box
          sx={{
            p: 2,
            height: 'calc(100% - 80px)',
            overflowY: 'auto',
            bgcolor: '#0d1117',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#30363d', borderRadius: 3 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          }}
        >
          <Grid container spacing={2}>
            {/* Top Left: Property Details */}
            <Grid item xs={12} md={6}>
              <PropertyDetailsSection lead={lead} />
            </Grid>

            {/* Top Right: Actions */}
            <Grid item xs={12} md={6}>
              <ActionsSection
                lead={lead}
                onStatusChange={onStatusChange}
                onAction={onAction}
                onNotesChange={onNotesChange}
                onDeletePermanently={onDeletePermanently}
                deleteLoading={deleteLoading}
              />
            </Grid>

            {/* Bottom Left: Evaluation */}
            <Grid item xs={12} md={6}>
              <EvaluationSection
                lead={lead}
                onEvaluationChange={(data) => {
                  // Call API to save evaluation changes
                  if (onEvaluationSave && lead) {
                    const updates: EvaluationUpdate = {};
                    if (data.arv !== undefined) {
                      updates.arv = data.arv;
                      updates.arvNote = data.arvNote;
                    }
                    if (data.rehab !== undefined) {
                      updates.rehabEstimate = data.rehab;
                      updates.rehabNote = data.rehabNote;
                    }
                    if (data.rent !== undefined) {
                      updates.rentEstimate = data.rent;
                      updates.rentNote = data.rentNote;
                    }
                    onEvaluationSave(lead.id, updates);
                  }
                }}
              />
            </Grid>

            {/* Bottom Right: Messaging */}
            <Grid item xs={12} md={6}>
              <MessagingSection lead={lead} onSendMessage={onSendMessage} />
            </Grid>
          </Grid>

          {/* Keyboard shortcut hint */}
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: '1px solid #21262d',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: '#484f58', fontSize: '0.7rem' }}>
              Keyboard: ← Prev (j) • Next (k) → • Follow-up (l) • Message (m) • Archive (a) • Close (ESC)
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8b949e',
          }}
        >
          <Typography>No lead selected</Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default LeadDetailPanel;
