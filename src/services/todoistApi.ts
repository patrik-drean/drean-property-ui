import axios from 'axios';
import {
  TodoistSection,
  TodoistTask,
  CreateTodoistTask,
  UpdateTodoistTask,
  TodoistProject,
  TodoistCollaborator
} from '../types/todoist';

class TodoistApiService {
  private api: ReturnType<typeof axios.create>;
  private apiToken: string;
  private projectId: string;

  constructor() {
    this.apiToken = process.env.REACT_APP_TODOIST_API_KEY || '';
    this.projectId = process.env.REACT_APP_TODOIST_PROJECT_ID || '';
    
    if (!this.apiToken) {
      console.warn('Todoist API key not found in environment variables');
    }
    
    if (!this.projectId) {
      console.warn('Todoist project ID not found in environment variables');
    }

    this.api = axios.create({
      baseURL: 'https://api.todoist.com/rest/v2',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Sections
  async getSections(): Promise<TodoistSection[]> {
    try {
      const response = await this.api.get<TodoistSection[]>(`/sections?project_id=${this.projectId}`);
      return response.data.sort((a: TodoistSection, b: TodoistSection) => a.order - b.order);
    } catch (error) {
      console.error('Error fetching Todoist sections:', error);
      throw new Error('Failed to fetch Todoist sections');
    }
  }

  async getSection(sectionId: string): Promise<TodoistSection> {
    try {
      const response = await this.api.get<TodoistSection>(`/sections/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Todoist section:', error);
      throw new Error('Failed to fetch Todoist section');
    }
  }

  // Tasks
  async getTasks(sectionId?: string): Promise<TodoistTask[]> {
    try {
      const params = new URLSearchParams({
        project_id: this.projectId,
      });
      
      if (sectionId) {
        params.append('section_id', sectionId);
      }

      const response = await this.api.get<TodoistTask[]>(`/tasks?${params.toString()}`);
      return response.data.sort((a: TodoistTask, b: TodoistTask) => a.order - b.order);
    } catch (error) {
      console.error('Error fetching Todoist tasks:', error);
      throw new Error('Failed to fetch Todoist tasks');
    }
  }

  async getTask(taskId: string): Promise<TodoistTask> {
    try {
      const response = await this.api.get<TodoistTask>(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Todoist task:', error);
      throw new Error('Failed to fetch Todoist task');
    }
  }

  async createTask(task: CreateTodoistTask): Promise<TodoistTask> {
    try {
      // Ensure the task is created in the correct project
      const taskData = {
        ...task,
        project_id: this.projectId,
      };

      const response = await this.api.post<TodoistTask>('/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating Todoist task:', error);
      throw new Error('Failed to create Todoist task');
    }
  }

  async updateTask(taskId: string, updates: UpdateTodoistTask): Promise<TodoistTask> {
    try {
      const response = await this.api.post<TodoistTask>(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating Todoist task:', error);
      throw new Error('Failed to update Todoist task');
    }
  }

  async completeTask(taskId: string): Promise<void> {
    try {
      await this.api.post(`/tasks/${taskId}/close`);
    } catch (error) {
      console.error('Error completing Todoist task:', error);
      throw new Error('Failed to complete Todoist task');
    }
  }

  async reopenTask(taskId: string): Promise<void> {
    try {
      await this.api.post(`/tasks/${taskId}/reopen`);
    } catch (error) {
      console.error('Error reopening Todoist task:', error);
      throw new Error('Failed to reopen Todoist task');
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Error deleting Todoist task:', error);
      throw new Error('Failed to delete Todoist task');
    }
  }

  // Project info
  async getProject(): Promise<TodoistProject> {
    try {
      const response = await this.api.get<TodoistProject>(`/projects/${this.projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Todoist project:', error);
      throw new Error('Failed to fetch Todoist project');
    }
  }

  // Collaborators
  async getCollaborators(): Promise<TodoistCollaborator[]> {
    try {
      const response = await this.api.get<TodoistCollaborator[]>(`/projects/${this.projectId}/collaborators`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Todoist collaborators:', error);
      throw new Error('Failed to fetch Todoist collaborators');
    }
  }

  // Utility methods
  isConfigured(): boolean {
    return !!(this.apiToken && this.projectId);
  }

  getProjectId(): string {
    return this.projectId;
  }
}

// Export singleton instance
export const todoistApi = new TodoistApiService();
export default todoistApi; 