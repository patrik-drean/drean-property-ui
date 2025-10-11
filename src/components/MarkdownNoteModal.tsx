import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Typography,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  initialContent: string;
  title?: string;
}

export const MarkdownNoteModal: React.FC<MarkdownNoteModalProps> = ({
  open,
  onClose,
  onSave,
  initialContent,
  title = 'Notes',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Reset content when modal opens
  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setIsEditing(false);
    }
  }, [open, initialContent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleCancel = () => {
    setContent(initialContent);
    setIsEditing(false);
  };

  const handleClose = () => {
    if (isEditing) {
      // Confirm if there are unsaved changes
      if (content !== initialContent) {
        if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
          return;
        }
      }
    }
    setContent(initialContent);
    setIsEditing(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100%' : '600px',
          maxHeight: isMobile ? '100%' : '80vh',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <Box>
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopy} size="small">
                <Icons.ContentCopy />
              </IconButton>
            </Tooltip>
            {!isEditing ? (
              <Tooltip title="Edit">
                <IconButton onClick={() => setIsEditing(true)} size="small">
                  <Icons.Edit />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="View">
                <IconButton onClick={() => setIsEditing(false)} size="small" disabled={isSaving}>
                  <Icons.Visibility />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {isEditing ? (
          <TextField
            fullWidth
            multiline
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes in markdown...

Examples:
# Heading
## Subheading
- Bullet point
1. Numbered list
**bold** and *italic*
[Link text](url)"
            sx={{
              '& textarea': {
                fontFamily: '"Monaco", "Courier New", monospace',
                fontSize: '14px',
                lineHeight: 1.6,
              },
            }}
            minRows={20}
          />
        ) : (
          <Box
            sx={{
              minHeight: '400px',
              '& h1': {
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(1),
                fontSize: '2rem',
                fontWeight: 600,
              },
              '& h2': {
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(1),
                fontSize: '1.5rem',
                fontWeight: 600,
              },
              '& h3': {
                marginTop: theme.spacing(1.5),
                marginBottom: theme.spacing(0.5),
                fontSize: '1.25rem',
                fontWeight: 600,
              },
              '& p': {
                marginBottom: theme.spacing(1),
                lineHeight: 1.6,
              },
              '& ul, & ol': {
                marginBottom: theme.spacing(1),
                paddingLeft: theme.spacing(3),
                lineHeight: 1.6,
              },
              '& li': {
                marginBottom: theme.spacing(0.5),
              },
              '& code': {
                backgroundColor: theme.palette.grey[100],
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9em',
              },
              '& pre': {
                backgroundColor: theme.palette.grey[100],
                padding: theme.spacing(2),
                borderRadius: '4px',
                overflow: 'auto',
                marginBottom: theme.spacing(1),
              },
              '& pre code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
              '& a': {
                color: theme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& blockquote': {
                borderLeft: `4px solid ${theme.palette.grey[300]}`,
                paddingLeft: theme.spacing(2),
                marginLeft: 0,
                marginBottom: theme.spacing(1),
                color: theme.palette.text.secondary,
              },
            }}
          >
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="400px"
              >
                <Icons.Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" mb={1}>
                  No notes yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click Edit to add your property notes
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {isEditing ? (
          <>
            <Button onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
