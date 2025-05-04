import React, { useState } from 'react';
import { Todo, Priority } from '../types/todo';
import { mockProperties } from '../services/mockData';
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
  onSubmit: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ todo, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [dueDate, setDueDate] = useState(todo?.dueDate || '');
  const [priority, setPriority] = useState<Priority>(todo?.priority || 'medium');
  const [propertyId, setPropertyId] = useState<string | undefined>(todo?.propertyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      dueDate,
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
            {mockProperties.map((property) => (
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