import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, Card, CardContent, TextField, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, IconButton, Tooltip, Link as MuiLink, Divider, Snackbar, Alert } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, Note, Link as PropertyLink, CreateNote, CreateLink } from '../types/property';
import { getProperty } from '../services/api';
import { getNotesByPropertyId, createNote, getLinksByPropertyId, createLink } from '../services/api';

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<PropertyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newLink, setNewLink] = useState({ url: '', title: '', moreDetails: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getProperty(id),
      getNotesByPropertyId(id),
      getLinksByPropertyId(id)
    ]).then(([property, notes, links]) => {
      setProperty(property);
      setNotes(notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLinks(links);
    }).catch(() => {
      setSnackbar({ open: true, message: 'Failed to load property details', severity: 'error' });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAddNote = async () => {
    if (!property || !newNote.trim()) return;
    const note: CreateNote = {
      content: newNote,
      createdBy: 'User', // TODO: Replace with actual user/initials
      propertyId: property.id
    };
    try {
      const saved = await createNote(note);
      setNotes([saved, ...notes]);
      setNewNote('');
      setNoteDialogOpen(false);
      setSnackbar({ open: true, message: 'Note added', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to add note', severity: 'error' });
    }
  };

  const handleAddLink = async () => {
    if (!property || !newLink.url.trim() || !newLink.title.trim()) return;
    const link: CreateLink = {
      ...newLink,
      propertyId: property.id
    };
    try {
      const saved = await createLink(link);
      setLinks([saved, ...links]);
      setNewLink({ url: '', title: '', moreDetails: '' });
      setLinkDialogOpen(false);
      setSnackbar({ open: true, message: 'Link added', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to add link', severity: 'error' });
    }
  };

  if (loading) return <Box p={4}><Typography>Loading...</Typography></Box>;
  if (!property) return <Box p={4}><Typography>Property not found.</Typography></Box>;

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Property Details</Typography>
        <Button variant="contained" color="primary" startIcon={<Icons.Edit />}>Edit Property</Button>
      </Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <MuiLink href={property.zillowLink} target="_blank" rel="noopener noreferrer" variant="h6" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none' }}>{property.address}</MuiLink>
          <Chip label={property.status} color="success" size="small" />
          <Typography variant="body2" color="text.secondary">Score: {property.score}/10</Typography>
        </Box>
        <Box display="flex" gap={4} flexWrap="wrap" mb={2}>
          <Box><Typography variant="caption">Offer Price</Typography><Typography variant="h6">${property.offerPrice.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">Rehab Cost</Typography><Typography variant="h6">${property.rehabCosts.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">Monthly Rent</Typography><Typography variant="h6">${property.potentialRent.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">ARV</Typography><Typography variant="h6">${property.arv.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">Sq Ft</Typography><Typography variant="h6">{property.squareFootage ? property.squareFootage.toLocaleString() : 'N/A'}</Typography></Box>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={1}>Last Updated: {/* TODO: Add last updated date if available */}</Typography>
        <Card sx={{ background: '#fffbe6', mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Property Notes</Typography>
            <Typography variant="body2">{property.notes || 'No notes.'}</Typography>
          </CardContent>
        </Card>
      </Paper>
      <Box display="flex" gap={3} flexWrap="wrap">
        <Box flex={2} minWidth={340}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1">Communication Notes</Typography>
              <Button size="small" variant="outlined" onClick={() => setNoteDialogOpen(true)}>Add Note</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List>
              {notes.map(note => (
                <ListItem key={note.id} alignItems="flex-start" sx={{ mb: 1, background: '#f6fafd', borderRadius: 1 }}>
                  <ListItemText
                    primary={<Box display="flex" alignItems="center" gap={1}><Chip label={note.createdBy.split(' ').map(n => n[0]).join('').toUpperCase()} size="small" /> <Typography variant="body2">{note.content}</Typography></Box>}
                    secondary={<Typography variant="caption" color="text.secondary">{new Date(note.createdAt).toLocaleString()}</Typography>}
                  />
                </ListItem>
              ))}
              {notes.length === 0 && <Typography variant="body2" color="text.secondary">No notes yet.</Typography>}
            </List>
          </Paper>
        </Box>
        <Box flex={1} minWidth={280}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1">Important Links</Typography>
              <Button size="small" variant="outlined" onClick={() => setLinkDialogOpen(true)}>Add Link</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List>
              {links.map(link => (
                <ListItem key={link.id} alignItems="flex-start" sx={{ mb: 1 }}>
                  <ListItemText
                    primary={<MuiLink href={link.url} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 500 }}>{link.title}</MuiLink>}
                    secondary={<Typography variant="caption" color="text.secondary">{link.moreDetails}</Typography>}
                  />
                </ListItem>
              ))}
              {links.length === 0 && <Typography variant="body2" color="text.secondary">No links yet.</Typography>}
            </List>
          </Paper>
        </Box>
      </Box>
      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            label="Note"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <DialogTitle>Add Link</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={newLink.title}
            onChange={e => setNewLink({ ...newLink, title: e.target.value })}
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="URL"
            value={newLink.url}
            onChange={e => setNewLink({ ...newLink, url: e.target.value })}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="More Details"
            value={newLink.moreDetails}
            onChange={e => setNewLink({ ...newLink, moreDetails: e.target.value })}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLink} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropertyDetailsPage; 