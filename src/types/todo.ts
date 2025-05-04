export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  propertyId?: string; // Optional since some todos won't be tied to a property
}

export interface Property {
  id: string;
  name: string;
  address: string;
  // Add other property fields as needed
} 