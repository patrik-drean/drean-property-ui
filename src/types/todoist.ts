export interface TodoistSection {
  id: string;
  name: string;
  project_id: string;
  order: number;
}

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id: string | null;
  assignee_id: string | null;
  assigner_id: string | null;
  parent_id: string | null;
  order: number;
  priority: number;
  due: {
    date: string;
    is_recurring: boolean;
    datetime?: string;
    string: string;
    timezone?: string;
  } | null;
  url: string;
  comment_count: number;
  is_completed: boolean;
  labels: string[];
  creator_id: string;
  created_at: string;
}

export interface CreateTodoistTask {
  content: string;
  description?: string;
  project_id: string;
  section_id?: string;
  parent_id?: string;
  order?: number;
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  assignee_id?: string;
}

export interface UpdateTodoistTask {
  content?: string;
  description?: string;
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  assignee_id?: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  comment_count: number;
  order: number;
  color: string;
  is_shared: boolean;
  is_favorite: boolean;
  is_inbox_project: boolean;
  is_team_inbox: boolean;
  view_style: string;
  url: string;
  parent_id: string | null;
}

export interface TodoistLabel {
  id: string;
  name: string;
  color: string;
  order: number;
  is_favorite: boolean;
}

export interface TodoistCollaborator {
  id: string;
  name: string;
  email: string;
} 