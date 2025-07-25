import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { BackgroundSyncProvider } from './context/BackgroundSyncContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { Layout } from './components/Layout/Layout';
import { LoginForm } from './components/Auth/LoginForm';
import { ManagerDashboard } from './components/Dashboard/ManagerDashboard';
import { EngineerDashboard } from './components/Dashboard/EngineerDashboard';
import { EngineersView } from './components/Engineers/EngineersView';
import { EditProfileView } from './components/Engineers/EditProfileView';
import { ProjectsView } from './components/Projects/ProjectsView';
import { AssignmentsView } from './components/Assignments/AssignmentsView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { TimelineView } from './components/Timeline/TimelineView';

function AppContent() {
  const { currentUser, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRole, setSelectedRole] = useState<'manager' | 'engineer'>('manager');

  // Show loading spinner while checking for existing session
  if (isLoading && !currentUser) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="mb-6 flex gap-4">
            <button
              className={`px-4 py-2 rounded font-semibold border transition-colors ${selectedRole === 'manager' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600'}`}
              onClick={() => setSelectedRole('manager')}
            >
              Manager
            </button>
            <button
              className={`px-4 py-2 rounded font-semibold border transition-colors ${selectedRole === 'engineer' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600'}`}
              onClick={() => setSelectedRole('engineer')}
            >
              Engineer
            </button>
          </div>
          <LoginForm role={selectedRole} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentUser.role === 'manager' ? <ManagerDashboard /> : <EngineerDashboard />;
      case 'engineers':
        // Manager-only feature
        return currentUser.role === 'manager' ? <EngineersView /> : <EngineerDashboard />;
      case 'projects':
        return <ProjectsView />;
      case 'assignments':
        // Manager-only feature
        return currentUser.role === 'manager' ? <AssignmentsView /> : <EngineerDashboard />;
      case 'timeline':
        return <TimelineView />;
      case 'analytics':
        // Manager-only feature
        return currentUser.role === 'manager' ? <AnalyticsView /> : <EngineerDashboard />;
      case 'profile':
        // Engineer-only feature
        return currentUser.role === 'engineer' ? <EditProfileView /> : <ManagerDashboard />;
      default:
        return currentUser.role === 'manager' ? <ManagerDashboard /> : <EngineerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <RealtimeProvider>
        <AppProvider>
          <BackgroundSyncProvider>
            <AppContent />
          </BackgroundSyncProvider>
        </AppProvider>
      </RealtimeProvider>
    </ErrorBoundary>
  );
}

export default App;