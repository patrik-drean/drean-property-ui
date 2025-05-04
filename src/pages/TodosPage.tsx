import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Todo } from '../types/todo';
import { mockTodos, mockProperties } from '../services/mockData';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import { Container, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const TodosPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(mockTodos);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAddTodo = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTodo: Todo = {
      ...todoData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTodos([...todos, newTodo]);
    setShowForm(false);
  };

  const handleEditTodo = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTodo) return;
    const updatedTodo: Todo = {
      ...todoData,
      id: editingTodo.id,
      createdAt: editingTodo.createdAt,
      updatedAt: new Date().toISOString(),
    };
    setTodos(todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)));
    setEditingTodo(null);
    setShowForm(false);
  };

  const handleDeleteTodo = (todoId: string) => {
    setTodos(todos.filter((todo) => todo.id !== todoId));
  };

  const handleToggleComplete = (todoId: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === todoId
          ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
          : todo
      )
    );
  };

  const handleSubmit = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTodo) {
      handleEditTodo(todoData);
    } else {
      handleAddTodo(todoData);
    }
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
          >
            Add Todo
          </Button>
        </Box>
        <Box sx={{ p: 0 }}>
          <TodoList
            todos={todos}
            properties={mockProperties}
            onEdit={(todo) => { setEditingTodo(todo); setShowForm(true); }}
            onDelete={handleDeleteTodo}
            onToggleComplete={handleToggleComplete}
          />
        </Box>
      </Paper>
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingTodo(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTodo ? 'Edit Todo' : 'Add New Todo'}</DialogTitle>
        <DialogContent>
          <TodoForm
            todo={editingTodo || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingTodo(null); }}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default TodosPage; 