import React, { useState, useEffect } from 'react';
import { Todo, Priority, Property } from '../types/todo';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  Stack,
  Box,
} from '@mui/material';

interface TodoFormProps {
  todo?: Todo;
  properties: Property[];
  onSubmit: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

// Helper function to format a date string for datetime-local input
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Convert ISO string to local datetime format YYYY-MM-DDThh:mm
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  } catch (err) {
    console.error('Invalid date format:', err);
    return '';
  }
};

const TodoForm: React.FC<TodoFormProps> = ({ todo, properties, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>(todo?.priority || 'medium');
  const [propertyId, setPropertyId] = useState<string | undefined>(todo?.propertyId);

  // Set initial dueDate when todo changes
  useEffect(() => {
    if (todo?.dueDate) {
      setDueDate(formatDateForInput(todo.dueDate));
    } else {
      // Default to tomorrow at 9am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setDueDate(formatDateForInput(tomorrow.toISOString()));
    }
  }, [todo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format the date as an ISO string for the API
    const formattedDueDate = dueDate ? new Date(dueDate).toISOString() : new Date().toISOString();
    
    onSubmit({
      title,
      description,
      dueDate: formattedDueDate,
      completed: todo?.completed || false,
      priority,
      propertyId,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Stack spacing={3}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="outlined"
          fullWidth
          required
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
          fullWidth
          multiline
          minRows={3}
        />
        <TextField
          label="Due Date"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          variant="outlined"
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
        />
        <FormControl fullWidth>
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            variant="outlined"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="property-label">Property</InputLabel>
          <Select
            labelId="property-label"
            label="Property"
            value={propertyId || ''}
            onChange={(e) => setPropertyId(e.target.value || undefined)}
            variant="outlined"
          >
            <MenuItem value="">General Todo</MenuItem>
            {properties.map((property) => (
              <MenuItem key={property.id} value={property.id}>
                {property.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
          <Button
            type="button"
            onClick={onCancel}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
          >
            {todo ? 'Update' : 'Create'} Todo
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default TodoForm; 