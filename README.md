# Frontend - Engineering Resource Management App

A modern React application built with TypeScript, featuring real-time updates, role-based interfaces, and comprehensive resource management capabilities.

## 🚀 Tech Stack

- **React 18** with **TypeScript** - Modern component-based architecture
- **Vite** - Lightning-fast build tool and development server  
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled component primitives
- **React Hook Form** + **Zod** - Type-safe form handling and validation
- **Recharts** - Composable charting library for data visualization
- **Lucide React** - Beautiful, customizable SVG icons
- **Sonner** - Modern toast notifications

## 🏗️ Application Architecture

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Analytics/
│   │   │   └── AnalyticsView.tsx      # Charts and metrics dashboard
│   │   ├── Assignments/
│   │   │   ├── AddAssignmentDialog.tsx # Assignment creation modal
│   │   │   └── AssignmentsView.tsx     # Assignment management table
│   │   ├── Auth/
│   │   │   └── LoginForm.tsx           # Authentication interface
│   │   ├── Dashboard/
│   │   │   ├── EngineerDashboard.tsx   # Engineer-specific dashboard
│   │   │   └── ManagerDashboard.tsx    # Manager overview dashboard
│   │   ├── Engineers/
│   │   │   ├── AddEngineerDialog.tsx   # Engineer creation modal
│   │   │   ├── EditProfileView.tsx     # Profile editing interface
│   │   │   └── EngineersView.tsx       # Engineer management table
│   │   ├── Layout/
│   │   │   ├── Header.tsx              # Top navigation with sync status
│   │   │   ├── Layout.tsx              # Main layout wrapper
│   │   │   └── Sidebar.tsx             # Role-based navigation
│   │   ├── Projects/
│   │   │   ├── AddProjectDialog.tsx    # Project creation modal
│   │   │   └── ProjectsView.tsx        # Project management interface
│   │   ├── Timeline/
│   │   │   └── TimelineView.tsx        # Resource timeline visualization
│   │   ├── ui/                         # Reusable UI components (Radix UI)
│   │   └── ErrorBoundary.tsx           # Global error handling
│   ├── context/
│   │   ├── AppContext.tsx              # Core application state
│   │   ├── BackgroundSyncContext.tsx   # Automatic synchronization
│   │   └── RealtimeContext.tsx         # Real-time event system
│   ├── hooks/
│   │   ├── use-toast.ts                # Toast notification hook
│   │   └── useRealtimeSync.ts          # Real-time synchronization
│   ├── types/
│   │   ├── errors.ts                   # Error type definitions
│   │   └── index.ts                    # Core type definitions
│   ├── utils/
│   │   ├── errorHandler.ts             # Centralized error handling
│   │   └── validation.ts               # Form validation schemas
│   ├── lib/
│   │   └── utils.ts                    # Utility functions
│   ├── App.tsx                         # Main application component
│   └── main.tsx                        # Application entry point
├── components.json                     # Radix UI configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── vite.config.ts                      # Vite build configuration
└── tsconfig.json                       # TypeScript configuration
```

### Component Architecture

#### Hierarchical Context System
```typescript
// Multi-layered state management
<RealtimeProvider>          // Event broadcasting & optimistic updates
  <AppProvider>             // Core application state (users, projects, assignments)
    <BackgroundSyncProvider> // Automatic server synchronization
      <AppContent />        // Main application components
    </BackgroundSyncProvider>
  </AppProvider>
</RealtimeProvider>
```

#### Role-Based UI Adaptation
```typescript
// Dynamic interface based on user role
const renderContent = () => {
  switch (activeTab) {
    case 'engineers':
      return currentUser.role === 'manager' ? <EngineersView /> : <EngineerDashboard />;
    case 'assignments':
      return currentUser.role === 'manager' ? <AssignmentsView /> : <EngineerDashboard />;
    // ... other role-specific routes
  }
};
```

## ⚡ Real-Time Features (Without WebSockets)

### Optimistic Updates
Immediate UI responses with server confirmation:

```typescript
const addAssignment = async (data) => {
  const tempId = `temp-${Date.now()}`;
  const optimisticAssignment = { ...data, id: tempId };
  
  // 1. Immediate UI update
  dispatch({ type: 'ADD_ASSIGNMENT', payload: optimisticAssignment });
  
  // 2. Real-time event emission
  emit('assignment:added', optimisticAssignment);
  
  // 3. Background API call with rollback
  try {
    const result = await apiCall(data);
    confirmOptimisticUpdate(tempId);
  } catch (error) {
    revertOptimisticUpdate(tempId);
    showErrorToast(error);
  }
};
```

### Background Synchronization
Automatic data sync every 30 seconds:

```typescript
// Detect external changes and notify users
const checkForExternalChanges = async () => {
  const serverData = await fetchLatestData();
  const changes = detectChanges(localData, serverData);
  
  changes.forEach(change => {
    emit(`external:${change.type}`, change.data, 'server');
    toast({ title: `New ${change.type} from another user` });
  });
};
```

### Event-Driven Communication
Cross-component real-time notifications:

```typescript
// Listen for real-time events in any component
useRealtimeEvent('assignment:added', (event) => {
  if (event.source === 'server') {
    toast({ 
      title: "Assignment added by another user",
      description: `${event.payload.engineerName} assigned to ${event.payload.projectName}`
    });
  }
});
```

## 🎨 UI/UX Design System

### Design Principles
- **Accessibility First** - WCAG compliance with Radix UI primitives
- **Responsive Design** - Mobile-first approach with Tailwind breakpoints
- **Consistent Theming** - Design tokens for colors, spacing, and typography
- **Loading States** - Skeleton components and progress indicators
- **Error States** - Comprehensive error boundaries and user feedback

### Component Library Structure
```typescript
// Radix UI base components with custom styling
├── ui/
│   ├── button.tsx          # Button variants and sizes
│   ├── card.tsx            # Content containers
│   ├── dialog.tsx          # Modal dialogs and overlays
│   ├── form.tsx            # Form controls and validation
│   ├── table.tsx           # Data tables with sorting
│   ├── toast.tsx           # Notification system
│   ├── sync-status.tsx     # Real-time sync indicators
│   └── ...                 # 30+ reusable components
```

### Visual Feedback System
```typescript
// Real-time status indicators
<SyncStatus
  isOnline={isOnline}
  isSyncing={isSyncing}
  pendingCount={pendingOperations.length}
  lastSyncTime={lastSyncTime}
/>

// Pending operation overlays
<PendingIndicator isPending={isPending}>
  <AssignmentCard assignment={assignment} />
</PendingIndicator>
```

## 📊 State Management Strategy

### Context-Based Architecture
No external state management library - leveraging React's built-in capabilities:

#### AppContext - Core Application State
```typescript
interface AppState {
  currentUser: User | null;
  engineers: Engineer[];
  projects: Project[];
  assignments: Assignment[];
  isLoading: boolean;
}

// Available actions
const {
  login, logout,
  addEngineer, updateEngineer,
  addProject, updateProject,
  addAssignment, removeAssignment,
  getEngineerWorkload,
  getProjectAssignments
} = useApp();
```

#### RealtimeContext - Event System
```typescript
const {
  emit,                      // Broadcast events
  addOptimisticUpdate,       // Track pending operations
  confirmOptimisticUpdate,   // Confirm server sync
  revertOptimisticUpdate     // Rollback on error
} = useRealtime();
```

#### BackgroundSyncContext - Auto Synchronization
```typescript
const {
  isOnline,           // Network status
  isSyncing,          // Sync in progress
  pendingChanges,     // Unsynced operations
  forceSync,          // Manual sync trigger
  lastSyncTime        // Last successful sync
} = useBackgroundSync();
```

### Local State Patterns
```typescript
// Form state with validation
const form = useForm<AssignmentFormData>({
  resolver: zodResolver(assignmentSchema),
  defaultValues: { allocationPercentage: 50 }
});

// Loading and error states
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Optimistic updates
const [optimisticData, setOptimisticData] = useState([]);
```

## 🔐 Authentication & Authorization

### JWT Token Management
```typescript
// Automatic token storage and retrieval
const login = async (email: string, password: string, role: string) => {
  const { token, user } = await authAPI.login(email, password, role);
  localStorage.setItem('token', token);
  dispatch({ type: 'LOGIN', payload: { user, token } });
};

// Automatic session restoration
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    restoreSession(token);
  }
}, []);
```

### Role-Based Interface
```typescript
// Conditional rendering based on user role
{currentUser?.role === 'manager' && (
  <Button onClick={openAddEngineerDialog}>
    Add Engineer
  </Button>
)}

// Route protection
const renderContent = () => {
  if (activeTab === 'engineers' && currentUser?.role !== 'manager') {
    return <UnauthorizedView />;
  }
  return <EngineersView />;
};
```

## 📱 Responsive Design

### Breakpoint Strategy
```typescript
// Tailwind CSS responsive utilities
<div className="
  grid grid-cols-1           // Mobile: Single column
  md:grid-cols-2             // Tablet: Two columns  
  lg:grid-cols-3             // Desktop: Three columns
  gap-4 p-4
">
```

### Mobile-First Components
```typescript
// Adaptive navigation
<div className="
  hidden md:block            // Desktop sidebar
">
  <Sidebar />
</div>

<div className="
  md:hidden                  // Mobile drawer
">
  <MobileNav />
</div>
```

## 🧪 Form Handling & Validation

### React Hook Form + Zod Integration
```typescript
// Type-safe form schema
const assignmentSchema = z.object({
  engineerId: z.string().min(1, "Engineer is required"),
  projectId: z.string().min(1, "Project is required"),
  allocationPercentage: z.number().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  role: z.string().optional(),
  notes: z.string().optional()
});

// Form component with validation
const AddAssignmentDialog = () => {
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema)
  });

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      await addAssignment(data);
      toast({ title: "Assignment created successfully" });
      onClose();
    } catch (error) {
      toast({ title: "Failed to create assignment", variant: "destructive" });
    }
  };
};
```

## 📈 Data Visualization

### Recharts Integration
```typescript
// Analytics dashboard with interactive charts
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={workloadData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="allocation" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>

// Real-time data updates
useEffect(() => {
  const updateCharts = () => {
    setWorkloadData(calculateWorkloadDistribution(engineers, assignments));
  };
  
  updateCharts();
  const interval = setInterval(updateCharts, 30000); // Update every 30s
  return () => clearInterval(interval);
}, [engineers, assignments]);
```

## 🚦 Setup & Development

### Prerequisites
- **Node.js** v18+ and npm
- **Modern browser** with ES2020+ support

### Installation
```bash
# Install dependencies
npm install

# Start development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Environment Variables
Create `.env.local` (optional):
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5001/api

# Development flags
VITE_DEBUG_MODE=true
VITE_ENABLE_MOCK_DATA=false
```

### Development Server
```bash
# Development server starts at http://localhost:5173
npm run dev

# Features:
# - Hot Module Replacement (HMR)
# - TypeScript compilation
# - Tailwind CSS processing
# - ESLint integration
```

## 🎯 Key Features Demonstration

### Multi-Tab Real-Time Testing
1. Open application in multiple browser tabs
2. Login as manager in both tabs
3. Create/modify assignments in one tab
4. Watch real-time updates in other tabs

### Offline Functionality
1. Disconnect network while using the app
2. Continue making changes (marked as pending)
3. Reconnect to see automatic synchronization

### Role-Based Experience
1. Login as manager: Full access to all features
2. Login as engineer: Limited to personal dashboard and profile

## 🔮 Future Frontend Enhancements

### Performance Optimizations
- **React.lazy()** for code splitting
- **React.memo()** for expensive components  
- **Virtual scrolling** for large datasets
- **Service Worker** for offline caching

### Advanced Features
- **Drag & drop** assignment interface
- **Keyboard shortcuts** for power users
- **Advanced filtering** and search
- **Print-friendly** reports and exports
- **Dark mode** theme toggle

### Accessibility Improvements
- **Screen reader** optimization
- **High contrast** mode
- **Keyboard navigation** enhancement
- **Focus management** improvements

### Developer Experience
- **Storybook** component documentation
- **Jest + React Testing Library** unit tests
- **Cypress** end-to-end testing
- **Bundle analyzer** optimization

---

*This frontend application showcases modern React development practices with a focus on user experience, type safety, and real-time collaboration features.* 