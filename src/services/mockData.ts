import { Todo, Property } from '../types/todo';

// Mock properties
export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Main House',
    address: '123 Main St',
  },
  {
    id: '2',
    name: 'Vacation Home',
    address: '456 Beach Ave',
  },
];

// Mock todos
export const mockTodos: Todo[] = [
  {
    id: '1',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, and apples',
    dueDate: '2025-05-05T17:00:00Z',
    completed: false,
    priority: 'medium',
    createdAt: '2025-05-04T12:30:00Z',
    updatedAt: '2025-05-04T12:30:00Z',
    propertyId: '1',
  },
  {
    id: '2',
    title: 'Fix leaky faucet',
    description: 'Kitchen sink is leaking',
    dueDate: '2025-05-10T09:00:00Z',
    completed: false,
    priority: 'high',
    createdAt: '2025-05-04T12:30:00Z',
    updatedAt: '2025-05-04T12:30:00Z',
    propertyId: '1',
  },
  {
    id: '3',
    title: 'General maintenance',
    description: 'Check all smoke detectors',
    dueDate: '2025-05-15T14:00:00Z',
    completed: false,
    priority: 'low',
    createdAt: '2025-05-04T12:30:00Z',
    updatedAt: '2025-05-04T12:30:00Z',
  },
];

// Helper functions for sorting
export const sortTodos = (todos: Todo[]): Todo[] => {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...todos].sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}; 