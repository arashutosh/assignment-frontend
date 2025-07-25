import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, User, Engineer, Project, Assignment } from '../types';
import { useRealtime } from './RealtimeContext';
import { errorHandler, handleError } from '../utils/errorHandler';
import { AuthenticationError } from '../types/errors';

interface AppContextType extends AppState {
  login: (email: string, password: string, role: 'manager' | 'engineer') => Promise<boolean>;
  logout: () => void;
  addEngineer: (engineer: Omit<Engineer, 'id'>) => Promise<void>;
  updateEngineer: (id: string, engineer: Partial<Engineer>) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  getEngineerWorkload: (engineerId: string) => number;
  getProjectAssignments: (projectId: string) => Assignment[];
  token: string | null;
  dispatch?: React.Dispatch<Action>; // Added dispatch function
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState & { token: string | null } = {
  currentUser: null,
  engineers: [],
  projects: [],
  assignments: [],
  isLoading: false,
  token: null,
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ENGINEERS'; payload: Engineer[] }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_ASSIGNMENTS'; payload: Assignment[] }
  | { type: 'ADD_ENGINEER'; payload: Engineer }
  | { type: 'UPDATE_ENGINEER'; payload: { id: string; engineer: Partial<Engineer> } }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; project: Partial<Project> } }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'REMOVE_ASSIGNMENT'; payload: string };

function appReducer(state: typeof initialState, action: Action): typeof initialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN':
      return { ...state, currentUser: action.payload.user, token: action.payload.token };
    case 'LOGOUT':
      return { ...state, currentUser: null, token: null };
    case 'SET_ENGINEERS':
      return { ...state, engineers: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.payload };
    case 'ADD_ENGINEER':
      return { ...state, engineers: [...state.engineers, action.payload] };
    case 'UPDATE_ENGINEER':
      return {
        ...state,
        engineers: state.engineers.map(eng =>
          eng.id === action.payload.id ? { ...eng, ...action.payload.engineer } : eng
        ),
      };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(proj =>
          proj.id === action.payload.id ? { ...proj, ...action.payload.project } : proj
        ),
      };
    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [...state.assignments, action.payload] };
    case 'REMOVE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.filter(assignment => assignment.id !== action.payload),
      };
    default:
      return state;
  }
}

const API_BASE = 'http://localhost:5001/api';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { emit, addOptimisticUpdate, confirmOptimisticUpdate, revertOptimisticUpdate } = useRealtime();

  // Helper to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {};
    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }
    return headers;
  };

  // Fetch all data after login
  const fetchAllData = async (token: string) => {
    try {
      const [engineersRes, projectsRes, assignmentsRes] = await Promise.all([
        errorHandler.fetchWithErrorHandling(`${API_BASE}/engineers`, {
          headers: { Authorization: `Bearer ${token}` }
        }, { context: 'AppContext.fetchAllData', showToast: false }),
        errorHandler.fetchWithErrorHandling(`${API_BASE}/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        }, { context: 'AppContext.fetchAllData', showToast: false }),
        errorHandler.fetchWithErrorHandling(`${API_BASE}/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        }, { context: 'AppContext.fetchAllData', showToast: false }),
      ]);

      const [engineers, projects, assignments] = await Promise.all([
        engineersRes.json(),
        projectsRes.json(),
        assignmentsRes.json(),
      ]);

      dispatch({ type: 'SET_ENGINEERS', payload: engineers });
      dispatch({ type: 'SET_PROJECTS', payload: projects });
      dispatch({ type: 'SET_ASSIGNMENTS', payload: assignments });
    } catch (error) {
      handleError(error, {
        context: 'AppContext.fetchAllData',
        showToast: true
      });

      // If data fetching fails due to auth, logout the user
      if (error instanceof AuthenticationError) {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      }
    }
  };

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({ type: 'SET_LOADING', payload: true });

      errorHandler.fetchWithErrorHandling(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }, { context: 'AppContext.sessionRestore', showToast: false })
        .then(res => res.json())
        .then(user => {
          dispatch({ type: 'LOGIN', payload: { user, token } });
          fetchAllData(token);
        })
        .catch((error) => {
          handleError(error, {
            context: 'AppContext.sessionRestore',
            showToast: false // Don't show toast for session restore failures
          });
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        })
        .finally(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    }
    // eslint-disable-next-line
  }, []);

  const login = async (email: string, password: string, role: 'manager' | 'engineer'): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const endpoint = role === 'manager' ? '/auth/login/manager' : '/auth/login/engineer';
      const res = await errorHandler.fetchWithErrorHandling(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }, { context: 'AppContext.login' });

      const { token, user } = await res.json();
      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN', payload: { user, token } });
      await fetchAllData(token);
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } catch (error) {
      handleError(error, {
        context: 'AppContext.login'
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  // CRUD operations with optimistic updates
  const addEngineer = async (engineerData: Omit<Engineer, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticEngineer = { ...engineerData, id: tempId };

    // Optimistic update
    dispatch({ type: 'ADD_ENGINEER', payload: optimisticEngineer });
    addOptimisticUpdate(
      tempId,
      'engineer:add',
      optimisticEngineer,
      () => dispatch({ type: 'SET_ENGINEERS', payload: state.engineers.filter(e => e.id !== tempId) })
    );

    // Emit real-time event
    emit('engineer:added', optimisticEngineer);

    try {
      const res = await errorHandler.fetchWithErrorHandling(`${API_BASE}/engineers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(engineerData),
      }, { context: 'AppContext.addEngineer' });

      if (res.ok) {
        const engineer = await res.json();
        confirmOptimisticUpdate(tempId);
        dispatch({ type: 'UPDATE_ENGINEER', payload: { id: tempId, engineer } });
        emit('engineer:confirmed', engineer);
      } else {
        revertOptimisticUpdate(tempId);
        throw new Error('Failed to add engineer');
      }
    } catch (error) {
      revertOptimisticUpdate(tempId);
      emit('engineer:error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const updateEngineer = async (id: string, engineerData: Partial<Engineer>) => {
    const currentEngineer = state.engineers.find(e => e.id === id);
    if (!currentEngineer) return;

    const updateId = `update-${id}-${Date.now()}`;

    // Optimistic update
    dispatch({ type: 'UPDATE_ENGINEER', payload: { id, engineer: engineerData } });
    addOptimisticUpdate(
      updateId,
      'engineer:update',
      { id, data: engineerData },
      () => dispatch({ type: 'UPDATE_ENGINEER', payload: { id, engineer: currentEngineer } })
    );

    // Emit real-time event
    emit('engineer:updated', { id, data: engineerData });

    try {
      const res = await errorHandler.fetchWithErrorHandling(`${API_BASE}/engineers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(engineerData),
      }, { context: 'AppContext.updateEngineer' });

      const updated = await res.json();
      confirmOptimisticUpdate(updateId);
      dispatch({ type: 'UPDATE_ENGINEER', payload: { id, engineer: updated } });
      emit('engineer:confirmed', updated);
    } catch (error) {
      revertOptimisticUpdate(updateId);
      handleError(error, { context: 'AppContext.updateEngineer' });
      emit('engineer:error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'createdBy'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticProject = {
      ...projectData,
      id: tempId,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser?.id || ''
    };

    // Optimistic update
    dispatch({ type: 'ADD_PROJECT', payload: optimisticProject });
    addOptimisticUpdate(
      tempId,
      'project:add',
      optimisticProject,
      () => dispatch({ type: 'SET_PROJECTS', payload: state.projects.filter(p => p.id !== tempId) })
    );

    // Emit real-time event
    emit('project:added', optimisticProject);

    try {
      const res = await errorHandler.fetchWithErrorHandling(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(projectData),
      }, { context: 'AppContext.addProject' });

      const project = await res.json();
      confirmOptimisticUpdate(tempId);
      dispatch({ type: 'UPDATE_PROJECT', payload: { id: tempId, project } });
      emit('project:confirmed', project);
    } catch (error) {
      revertOptimisticUpdate(tempId);
      handleError(error, { context: 'AppContext.addProject' });
      emit('project:error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    try {
      const res = await errorHandler.fetchWithErrorHandling(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(projectData),
      }, { context: 'AppContext.updateProject' });

      const updated = await res.json();
      dispatch({ type: 'UPDATE_PROJECT', payload: { id, project: updated } });
    } catch (error) {
      handleError(error, { context: 'AppContext.updateProject' });
      throw error;
    }
  };

  const addAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'createdBy'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticAssignment = {
      ...assignmentData,
      id: tempId,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser?.id || ''
    };

    // Optimistic update
    dispatch({ type: 'ADD_ASSIGNMENT', payload: optimisticAssignment });
    addOptimisticUpdate(
      tempId,
      'assignment:add',
      optimisticAssignment,
      () => dispatch({ type: 'REMOVE_ASSIGNMENT', payload: tempId })
    );

    // Emit real-time event
    emit('assignment:added', optimisticAssignment);

    try {
      const res = await errorHandler.fetchWithErrorHandling(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(assignmentData),
      }, { context: 'AppContext.addAssignment' });

      const assignment = await res.json();
      confirmOptimisticUpdate(tempId);
      dispatch({ type: 'REMOVE_ASSIGNMENT', payload: tempId });
      dispatch({ type: 'ADD_ASSIGNMENT', payload: assignment });
      emit('assignment:confirmed', assignment);
    } catch (error) {
      revertOptimisticUpdate(tempId);
      handleError(error, { context: 'AppContext.addAssignment' });
      emit('assignment:error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const removeAssignment = async (id: string) => {
    const assignment = state.assignments.find(a => a.id === id);
    if (!assignment) return;

    const removeId = `remove-${id}-${Date.now()}`;

    // Optimistic update
    dispatch({ type: 'REMOVE_ASSIGNMENT', payload: id });
    addOptimisticUpdate(
      removeId,
      'assignment:remove',
      { id },
      () => dispatch({ type: 'ADD_ASSIGNMENT', payload: assignment })
    );

    // Emit real-time event
    emit('assignment:removed', { id });

    try {
      await errorHandler.fetchWithErrorHandling(`${API_BASE}/assignments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }, { context: 'AppContext.removeAssignment' });

      confirmOptimisticUpdate(removeId);
      emit('assignment:confirmed', { id, action: 'remove' });
    } catch (error) {
      revertOptimisticUpdate(removeId);
      handleError(error, { context: 'AppContext.removeAssignment' });
      emit('assignment:error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  // Utility functions
  const getEngineerWorkload = (engineerId: string): number => {
    return state.assignments
      .filter(assignment => assignment.engineerId === engineerId)
      .reduce((total, assignment) => total + assignment.allocationPercentage, 0);
  };

  const getProjectAssignments = (projectId: string): Assignment[] => {
    return state.assignments.filter(assignment => assignment.projectId === projectId);
  };

  const value: AppContextType = {
    ...state,
    login,
    logout,
    addEngineer,
    updateEngineer,
    addProject,
    updateProject,
    addAssignment,
    removeAssignment,
    getEngineerWorkload,
    getProjectAssignments,
    token: state.token,
    dispatch, // Expose dispatch
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}