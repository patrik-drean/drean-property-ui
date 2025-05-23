import axios from 'axios';
import { Todo } from '../types/todo';

// Define the base URL from the environment or use a default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://p7mxmmgxaw.us-west-2.awsapprunner.com';

// Define the TodoDTO (Data Transfer Object) for API communication
export interface TodoDTO {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  priority: string;
  propertyId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Convert between our frontend Todo type and the API's TodoDTO
const mapTodoToDTO = (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Todo, 'id'>>): TodoDTO => {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    dueDate: todo.dueDate,
    isCompleted: todo.completed,
    priority: todo.priority,
    propertyId: todo.propertyId || null,
  };
};

const mapDTOToTodo = (dto: TodoDTO): Todo => {
  return {
    id: dto.id || '',
    title: dto.title,
    description: dto.description,
    dueDate: dto.dueDate,
    completed: dto.isCompleted,
    priority: dto.priority as 'low' | 'medium' | 'high',
    propertyId: dto.propertyId || undefined,
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString(),
  };
};

// The TodoService
const TodoService = {
  // Fetch all todos
  async getAllTodos(): Promise<Todo[]> {
    try {
      const response = await axios.get<TodoDTO[]>(`${API_BASE_URL}/api/Todo`);
      return response.data.map(mapDTOToTodo);
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  },

  // Get a specific todo by ID
  async getTodoById(id: string): Promise<Todo> {
    try {
      const response = await axios.get<TodoDTO>(`${API_BASE_URL}/api/Todo/${id}`);
      return mapDTOToTodo(response.data);
    } catch (error) {
      console.error(`Error fetching todo ${id}:`, error);
      throw error;
    }
  },

  // Create a new todo
  async createTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    try {
      const todoDTO = mapTodoToDTO(todo);
      const response = await axios.post<TodoDTO>(`${API_BASE_URL}/api/Todo`, todoDTO);
      return mapDTOToTodo(response.data);
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  },

  // Update an existing todo
  async updateTodo(id: string, todo: Omit<Todo, 'createdAt' | 'updatedAt'>): Promise<Todo> {
    try {
      const todoDTO = mapTodoToDTO(todo);
      const response = await axios.put<TodoDTO>(`${API_BASE_URL}/api/Todo/${id}`, todoDTO);
      return mapDTOToTodo(response.data);
    } catch (error) {
      console.error(`Error updating todo ${id}:`, error);
      throw error;
    }
  },

  // Delete a todo
  async deleteTodo(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/Todo/${id}`);
    } catch (error) {
      console.error(`Error deleting todo ${id}:`, error);
      throw error;
    }
  },

  // Toggle completion status
  async toggleTodoCompletion(id: string, todo: Todo): Promise<Todo> {
    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      return await this.updateTodo(id, updatedTodo);
    } catch (error) {
      console.error(`Error toggling todo completion ${id}:`, error);
      throw error;
    }
  }
};

export default TodoService; 