import React, { useState } from 'react';
import { Todo, Property } from '../types/todo';
import { sortTodos } from '../services/mockData';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Select,
  MenuItem,
  Box,
  Tooltip,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface TodoListProps {
  todos: Todo[];
  properties: Property[];
  onEdit: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  onToggleComplete: (todoId: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({
  todos,
  properties,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);

  let filteredTodos = selectedPropertyId
    ? selectedPropertyId === 'general'
      ? todos.filter((todo) => !todo.propertyId)
      : todos.filter((todo) => todo.propertyId === selectedPropertyId)
    : todos;

  if (!showCompleted) {
    filteredTodos = filteredTodos.filter((todo) => !todo.completed);
  }

  const sortedTodos = sortTodos(filteredTodos);

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return 'General';
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || 'Unknown Property';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Filter by Property:</Typography>
        <Select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Todos</MenuItem>
          <MenuItem value="general">General Todos</MenuItem>
          {properties.map((property) => (
            <MenuItem key={property.id} value={property.id}>
              {property.name}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="outlined"
          startIcon={showCompleted ? <VisibilityOffIcon /> : <VisibilityIcon />}
          onClick={() => setShowCompleted((prev) => !prev)}
          sx={{ ml: 'auto' }}
        >
          {showCompleted ? 'Hide Completed' : 'Show Completed'}
        </Button>
      </Stack>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#1976d2' }}>
            <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Title</TableCell>
            <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Description</TableCell>
            <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Due Date</TableCell>
            <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Priority</TableCell>
            <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Property</TableCell>
            <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTodos.map((todo) => (
            <TableRow key={todo.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{todo.title}</TableCell>
              <TableCell>{todo.description}</TableCell>
              <TableCell>{
                (() => {
                  const date = new Date(todo.dueDate);
                  return date.toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                })()
              }</TableCell>
              <TableCell>
                <Chip
                  label={todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                  color={getPriorityColor(todo.priority)}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>{getPropertyName(todo.propertyId)}</TableCell>
              <TableCell align="right">
                <Tooltip title={todo.completed ? 'Mark as Pending' : 'Mark as Completed'}>
                  <IconButton onClick={() => onToggleComplete(todo.id)}>
                    {todo.completed ? <RadioButtonUncheckedIcon color="action" /> : <CheckCircleIcon color="success" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton onClick={() => onEdit(todo)}>
                    <EditIcon color="primary" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => onDelete(todo.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sortedTodos.length === 0 && (
        <Typography variant="body1" sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
          No todos found for this filter.
        </Typography>
      )}
    </Box>
  );
};

export default TodoList; 