import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      {/* Fixed Header */}
      <Header />

      {/* Main container with sidebar and content */}
      <div className="flex h-full pt-16"> {/* pt-16 accounts for fixed header height */}
        {/* Fixed Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pl-64"> {/* pl-64 accounts for fixed sidebar width */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}