import React, { useState, useEffect } from 'react';
import { Todo, Property } from '../types/todo';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import TodoService from '../services/TodoService';
import PropertyService from '../services/PropertyService';
import { 
  Container, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography, 
  Box,
  CircularProgress,
  Alert,
  Snackbar 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const TodosPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch todos and properties on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [todosData, propertiesData] = await Promise.all([
          TodoService.getAllTodos(),
          PropertyService.getAllProperties(),
        ]);
        setTodos(todosData);
        setProperties(propertiesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddTodo = async (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTodo = await TodoService.createTodo(todoData);
      setTodos([...todos, newTodo]);
      setShowForm(false);
      setSnackbar({ open: true, message: 'Todo created successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error creating todo:', err);
      setSnackbar({ open: true, message: 'Failed to create todo', severity: 'error' });
    }
  };

  const handleEditTodo = async (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTodo) return;
    
    try {
      const updatedTodo = await TodoService.updateTodo(editingTodo.id, {
        ...todoData,
        id: editingTodo.id,
      });
      
      setTodos(todos.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo));
      setEditingTodo(null);
      setShowForm(false);
      setSnackbar({ open: true, message: 'Todo updated successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error updating todo:', err);
      setSnackbar({ open: true, message: 'Failed to update todo', severity: 'error' });
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await TodoService.deleteTodo(todoId);
      setTodos(todos.filter(todo => todo.id !== todoId));
      setSnackbar({ open: true, message: 'Todo deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error deleting todo:', err);
      setSnackbar({ open: true, message: 'Failed to delete todo', severity: 'error' });
    }
  };

  const handleToggleComplete = async (todoId: string) => {
    const todoToUpdate = todos.find(todo => todo.id === todoId);
    if (!todoToUpdate) return;

    try {
      const updatedTodo = await TodoService.toggleTodoCompletion(todoId, todoToUpdate);
      setTodos(todos.map(todo => todo.id === todoId ? updatedTodo : todo));
    } catch (err) {
      console.error('Error toggling todo completion:', err);
      setSnackbar({ open: true, message: 'Failed to update todo status', severity: 'error' });
    }
  };

  const handleSubmit = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTodo) {
      handleEditTodo(todoData);
    } else {
      handleAddTodo(todoData);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#1976d2', color: '#fff', px: 3, py: 2, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
          <Typography variant="h4" fontWeight={700}>Todos</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingTodo(null); setShowForm(true); }}
            sx={{ bgcolor: '#1976d2', color: '#fff', boxShadow: 1, '&:hover': { bgcolor: '#115293' } }}
            disabled={loading}
          >
            Add Todo
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 0 }}>
            <TodoList
              todos={todos}
              properties={properties}
              onEdit={(todo) => { setEditingTodo(todo); setShowForm(true); }}
              onDelete={handleDeleteTodo}
              onToggleComplete={handleToggleComplete}
            />
          </Box>
        )}
      </Paper>

      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingTodo(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTodo ? 'Edit Todo' : 'Add New Todo'}</DialogTitle>
        <DialogContent>
          <TodoForm
            todo={editingTodo || undefined}
            properties={properties}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingTodo(null); }}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TodosPage; 