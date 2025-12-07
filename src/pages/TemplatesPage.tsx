import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Breadcrumbs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { smsService } from '../services/smsService';
import { SmsTemplate } from '../types/sms';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [formData, setFormData] = useState({ name: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await smsService.getTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenDialog = (template?: SmsTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ name: template.name, body: template.body });
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', body: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: '', body: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.body.trim()) return;

    setSaving(true);
    setError(null);
    try {
      if (editingTemplate) {
        await smsService.updateTemplate(editingTemplate.id, formData);
      } else {
        await smsService.createTemplate(formData);
      }
      handleCloseDialog();
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data || err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await smsService.deleteTemplate(id);
      setDeleteConfirmId(null);
      fetchTemplates();
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  // Extract placeholders for display
  const extractPlaceholders = (body: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = regex.exec(body)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }
    return placeholders;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link to="/messaging" style={{ textDecoration: 'none', color: 'inherit' }}>
            Messaging
          </Link>
          <Typography color="text.primary">Templates</Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton component={Link} to="/messaging" size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">Message Templates</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            New Template
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create reusable message templates with placeholders like {'{{name}}'}, {'{{address}}'},{' '}
        {'{{price}}'}. Placeholders will be automatically filled when you use the template.
      </Typography>

      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f5f5f5',
                    p: 1.5,
                    borderRadius: 1,
                    mb: 2,
                    minHeight: 80,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                  }}
                >
                  {template.body}
                </Typography>
                {template.placeholders.length > 0 && (
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {template.placeholders.map((p) => (
                      <Chip
                        key={p}
                        label={`{{${p}}}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton
                  onClick={() => handleOpenDialog(template)}
                  size="small"
                  title="Edit template"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => setDeleteConfirmId(template.id)}
                  color="error"
                  size="small"
                  title="Delete template"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {templates.length === 0 && (
          <Grid item xs={12}>
            <Box
              textAlign="center"
              py={6}
              px={2}
              sx={{ backgroundColor: '#f9f9f9', borderRadius: 2 }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No templates yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create your first template to speed up your messaging
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Create Template
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
            placeholder="e.g., Initial Outreach"
          />
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Message Body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Hi {{name}}, I noticed your property at {{address}}..."
            helperText="Use {{name}}, {{address}}, {{price}} for placeholders"
          />
          {formData.body && extractPlaceholders(formData.body).length > 0 && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                Detected placeholders:
              </Typography>
              <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                {extractPlaceholders(formData.body).map((p) => (
                  <Chip key={p} label={p} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.name.trim() || !formData.body.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this template? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
