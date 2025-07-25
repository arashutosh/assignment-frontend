import React from 'react';
import { useApp } from '../../context/AppContext';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  FolderOpen,
  Calendar,
  BarChart3,
  User,
  CalendarDays
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('manager' | 'engineer')[];
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: ['manager', 'engineer'],
  },
  {
    id: 'engineers',
    label: 'Engineers',
    icon: Users,
    roles: ['manager'],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    roles: ['manager', 'engineer'],
  },
  {
    id: 'assignments',
    label: 'Assignments',
    icon: Calendar,
    roles: ['manager'],
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: CalendarDays,
    roles: ['manager', 'engineer'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['manager'],
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: User,
    roles: ['engineer'],
  },
];

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ activeTab = 'dashboard', onTabChange }: SidebarProps) {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  const filteredItems = sidebarItems.filter(item =>
    item.roles.includes(currentUser.role)
  );

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gray-800 border-r border-gray-700 z-40 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                isActive
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-white hover:bg-green-50 hover:text-green-600'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-green-600' : 'text-white')} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}