import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Menu,
  ListItemIcon,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { TodoistSection, TodoistTask, CreateTodoistTask, TodoistCollaborator } from '../types/todoist';
import todoistApi from '../services/todoistApi';
import { updateProperty } from '../services/api';
import { Property } from '../types/property';

interface TasksSectionProps {
  property: Property;
  onPropertyUpdate: (property: Property) => void;
  onSnackbar: (message: string, severity: 'success' | 'error') => void;
}

const TasksSection: React.FC<TasksSectionProps> = ({ property, onPropertyUpdate, onSnackbar }) => {
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [sections, setSections] = useState<TodoistSection[]>([]);
  const [collaborators, setCollaborators] = useState<TodoistCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectionLinkDialogOpen, setSectionLinkDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TodoistTask | null>(null);
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
  
  const [newTask, setNewTask] = useState<Partial<CreateTodoistTask>>({
    content: '',
    description: '',
    priority: 1,
  });

  const isConfigured = todoistApi.isConfigured();
  const linkedSectionId = property.todoMetaData?.todoistSectionId;
  const linkedSection = sections.find(s => s.id === linkedSectionId);

  // Priority colors matching Todoist
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return '#d1453b'; // P1 - Red
      case 3: return '#eb8909'; // P2 - Orange  
      case 2: return '#246fe0'; // P3 - Blue
      case 1: return '#666666'; // P4 - Gray
      default: return '#666666';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return 'P1';
      case 3: return 'P2';
      case 2: return 'P3';
      case 1: return 'P4';
      default: return 'P4';
    }
  };

  const formatDueDate = (due: TodoistTask['due']) => {
    if (!due) return null;
    const date = new Date(due.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDueDateColor = (due: TodoistTask['due']) => {
    if (!due) return '#666666';
    const date = new Date(due.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) return '#d1453b'; // Overdue - red
    if (date.getTime() === today.getTime()) return '#eb8909'; // Today - orange
    return '#666666'; // Future - gray
  };

  const loadSections = useCallback(async () => {
    try {
      const sectionsData = await todoistApi.getSections();
      setSections(sectionsData);
    } catch (error) {
      onSnackbar('Failed to load Todoist sections', 'error');
    }
  }, [onSnackbar]);

  const loadCollaborators = async () => {
    try {
      const collaboratorsData = await todoistApi.getCollaborators();
      setCollaborators(collaboratorsData);
    } catch (error) {
      console.warn('Failed to load collaborators:', error);
    }
  };

  const loadTasks = useCallback(async () => {
    if (!linkedSectionId) return;
    
    setLoading(true);
    try {
      const tasksData = await todoistApi.getTasks(linkedSectionId);
      setTasks(tasksData);
    } catch (error) {
      onSnackbar('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [linkedSectionId, onSnackbar]);

  useEffect(() => {
    if (isConfigured) {
      loadSections();
      loadCollaborators();
      if (linkedSectionId) {
        loadTasks();
      }
    }
  }, [linkedSectionId, isConfigured, loadSections, loadTasks]);

  const handleLinkSection = async (sectionId: string) => {
    try {
      const updatedProperty = await updateProperty(property.id, {
        ...property,
        todoMetaData: {
          ...property.todoMetaData,
          todoistSectionId: sectionId,
        },
      });
      onPropertyUpdate(updatedProperty);
      setSectionLinkDialogOpen(false);
      onSnackbar('Section linked successfully', 'success');
    } catch (error) {
      onSnackbar('Failed to link section', 'error');
    }
  };

  const handleUnlinkSection = async () => {
    try {
      const updatedProperty = await updateProperty(property.id, {
        ...property,
        todoMetaData: {
          ...property.todoMetaData,
          todoistSectionId: null,
        },
      });
      onPropertyUpdate(updatedProperty);
      setTasks([]);
      onSnackbar('Section unlinked successfully', 'success');
    } catch (error) {
      onSnackbar('Failed to unlink section', 'error');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.content?.trim() || !linkedSectionId) return;

    try {
      const taskData: CreateTodoistTask = {
        content: newTask.content,
        description: newTask.description || '',
        project_id: todoistApi.getProjectId(),
        section_id: linkedSectionId,
        priority: newTask.priority || 1,
        ...(newTask.due_string && { due_string: newTask.due_string }),
        ...(newTask.assignee_id && { assignee_id: newTask.assignee_id }),
      };

      const createdTask = await todoistApi.createTask(taskData);
      setTasks([...tasks, createdTask].sort((a, b) => a.order - b.order));
      setNewTask({ content: '', description: '', priority: 1 });
      setTaskDialogOpen(false);
      onSnackbar('Task created successfully', 'success');
    } catch (error) {
      onSnackbar('Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !newTask.content?.trim()) return;

    try {
      const updates = {
        content: newTask.content,
        description: newTask.description || '',
        priority: newTask.priority || 1,
        ...(newTask.due_string && { due_string: newTask.due_string }),
        ...(newTask.assignee_id && { assignee_id: newTask.assignee_id }),
      };

      const updatedTask = await todoistApi.updateTask(editingTask.id, updates);
      setTasks(tasks.map(task => task.id === editingTask.id ? updatedTask : task));
      setEditingTask(null);
      setNewTask({ content: '', description: '', priority: 1 });
      setTaskDialogOpen(false);
      onSnackbar('Task updated successfully', 'success');
    } catch (error) {
      onSnackbar('Failed to update task', 'error');
    }
  };

  const handleCompleteTask = async (task: TodoistTask) => {
    try {
      if (task.is_completed) {
        await todoistApi.reopenTask(task.id);
      } else {
        await todoistApi.completeTask(task.id);
      }
      await loadTasks(); // Reload to get updated status
      onSnackbar(`Task ${task.is_completed ? 'reopened' : 'completed'}`, 'success');
    } catch (error) {
      onSnackbar('Failed to update task status', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await todoistApi.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      setTaskMenuAnchor(null);
      onSnackbar('Task deleted successfully', 'success');
    } catch (error) {
      onSnackbar('Failed to delete task', 'error');
    }
  };

  const openEditDialog = (task: TodoistTask) => {
    setEditingTask(task);
    setNewTask({
      content: task.content,
      description: task.description,
      priority: task.priority,
      assignee_id: task.assignee_id || undefined,
      due_string: task.due?.string || undefined,
    });
    setTaskDialogOpen(true);
    setTaskMenuAnchor(null);
  };

  const openCreateDialog = () => {
    setEditingTask(null);
    setNewTask({ content: '', description: '', priority: 1 });
    setTaskDialogOpen(true);
  };

  if (!isConfigured) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Tasks</Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="warning">
          Todoist integration is not configured. Please set REACT_APP_TODOIST_API_KEY and REACT_APP_TODOIST_PROJECT_ID environment variables.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1">Tasks</Typography>
        {linkedSection ? (
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={linkedSection.name} 
              size="small" 
              onDelete={handleUnlinkSection}
              sx={{ backgroundColor: '#e3f2fd' }}
            />
            <Button size="small" variant="outlined" onClick={openCreateDialog}>
              Add Task
            </Button>
          </Box>
        ) : (
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => setSectionLinkDialogOpen(true)}
          >
            Link Section
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 1 }} />

      {linkedSection ? (
        <List>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading tasks...</Typography>
          ) : tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No tasks in this section.</Typography>
          ) : (
            tasks.map(task => (
              <ListItem key={task.id} sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Checkbox
                    checked={task.is_completed}
                    onChange={() => handleCompleteTask(task)}
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textDecoration: task.is_completed ? 'line-through' : 'none',
                          color: task.is_completed ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {task.content}
                      </Typography>
                      {task.priority > 1 && (
                        <Chip
                          label={getPriorityLabel(task.priority)}
                          size="small"
                          sx={{
                            backgroundColor: getPriorityColor(task.priority),
                            color: 'white',
                            height: 16,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      )}
                      {task.due && (
                        <Chip
                          label={formatDueDate(task.due)}
                          size="small"
                          sx={{
                            color: getDueDateColor(task.due),
                            backgroundColor: 'transparent',
                            border: `1px solid ${getDueDateColor(task.due)}`,
                            height: 16,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={task.description && (
                    <Typography variant="caption" color="text.secondary">
                      {task.description}
                    </Typography>
                  )}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setSelectedTask(task);
                    setTaskMenuAnchor(e.currentTarget);
                  }}
                >
                  <Icons.MoreVert fontSize="small" />
                </IconButton>
              </ListItem>
            ))
          )}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Link this property to a Todoist section to manage tasks.
        </Typography>
      )}

      {/* Section Link Dialog */}
      <Dialog open={sectionLinkDialogOpen} onClose={() => setSectionLinkDialogOpen(false)}>
        <DialogTitle>Link Todoist Section</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a section from your Todoist project to link with this property:
          </Typography>
          <List>
            {sections.map(section => (
              <ListItem 
                key={section.id} 
                button 
                onClick={() => handleLinkSection(section.id)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemText primary={section.name} />
                <Icons.ChevronRight />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionLinkDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Task Create/Edit Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Content"
            value={newTask.content || ''}
            onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
            fullWidth
            sx={{ mt: 1, mb: 2 }}
            required
          />
          <TextField
            label="Description"
            value={newTask.description || ''}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Box display="flex" gap={2} mb={2}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newTask.priority || 1}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as number })}
                label="Priority"
              >
                <MenuItem value={4}>P1 (Urgent)</MenuItem>
                <MenuItem value={3}>P2 (High)</MenuItem>
                <MenuItem value={2}>P3 (Medium)</MenuItem>
                <MenuItem value={1}>P4 (Low)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Due Date (natural language)"
              value={newTask.due_string || ''}
              onChange={(e) => setNewTask({ ...newTask, due_string: e.target.value })}
              placeholder="e.g., tomorrow, next monday"
              sx={{ flexGrow: 1 }}
            />
          </Box>
          {collaborators.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={newTask.assignee_id || ''}
                onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value as string })}
                label="Assignee"
              >
                <MenuItem value="">Unassigned</MenuItem>
                {collaborators.map(collaborator => (
                  <MenuItem key={collaborator.id} value={collaborator.id}>
                    {collaborator.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={editingTask ? handleUpdateTask : handleCreateTask}
            variant="contained"
            disabled={!newTask.content?.trim()}
          >
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Menu */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={() => setTaskMenuAnchor(null)}
      >
        <MenuItem onClick={() => selectedTask && openEditDialog(selectedTask)}>
          <ListItemIcon><Icons.Edit fontSize="small" /></ListItemIcon>
          Edit Task
        </MenuItem>
        <MenuItem 
          onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Icons.Delete fontSize="small" /></ListItemIcon>
          Delete Task
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default TasksSection; 