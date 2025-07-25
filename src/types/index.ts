export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'engineer';
  avatar?: string;
}

export interface Engineer {
  id: string;
  name: string;
  email: string;
  skills: string[];
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead';
  employmentType: 'full-time' | 'part-time';
  capacity: number; // 100 for full-time, 50 for part-time
  currentAllocation: number; // percentage currently allocated
  avatar?: string;
  joinDate: string;
  department?: string; // Added missing department property
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredTeamSize: number;
  requiredSkills: string[];
  status: 'planning' | 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  createdAt: string;
}

// Populated objects from backend
interface PopulatedEngineer {
  _id: string;
  name: string;
  email: string;
}

interface PopulatedProject {
  _id: string;
  name: string;
}

export interface Assignment {
  id: string;
  engineerId: string | PopulatedEngineer;
  projectId: string | PopulatedProject;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface AppState {
  currentUser: User | null;
  engineers: Engineer[];
  projects: Project[];
  assignments: Assignment[];
  isLoading: boolean;
}