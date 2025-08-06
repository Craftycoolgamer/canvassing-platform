import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  isVisible: boolean;
  order: number;
  requiresRole?: 'Admin' | 'Manager' | 'User';
}

interface NavigationContextType {
  isSidebarOpen: boolean;
  navigationItems: NavigationItem[];
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleItemVisibility: (itemId: string) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  getVisibleItems: () => NavigationItem[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([
    {
      id: 'businessList',
      name: 'Business List',
      icon: 'list',
      isVisible: true,
      order: 0,
    },
    {
      id: 'map',
      name: 'Map',
      icon: 'map',
      isVisible: true,
      order: 1,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: 'analytics',
      isVisible: true,
      order: 2,
      requiresRole: 'Manager',
    },
    {
      id: 'pendingApprovals',
      name: 'Pending Approvals',
      icon: 'people',
      isVisible: true,
      order: 3,
      requiresRole: 'Manager',
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: 'settings',
      isVisible: true,
      order: 4,
    },
  ]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleItemVisibility = (itemId: string) => {
    setNavigationItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, isVisible: !item.isVisible }
          : item
      )
    );
  };

  const reorderItems = (fromIndex: number, toIndex: number) => {
    setNavigationItems(prev => {
      const newItems = [...prev];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      
      // Update order property for all items
      return newItems.map((item, index) => ({
        ...item,
        order: index,
      }));
    });
  };

  const getVisibleItems = (): NavigationItem[] => {
    return navigationItems
      .filter(item => {
        // Check if item is visible
        if (!item.isVisible) return false;
        
        // Check role requirements
        if (item.requiresRole) {
          if (item.requiresRole === 'Admin' && user?.role !== 'Admin') return false;
          if (item.requiresRole === 'Manager' && user?.role !== 'Admin' && user?.role !== 'Manager') return false;
        }
        
        return true;
      })
      .sort((a, b) => a.order - b.order);
  };

  return (
    <NavigationContext.Provider
      value={{
        isSidebarOpen,
        navigationItems,
        toggleSidebar,
        closeSidebar,
        toggleItemVisibility,
        reorderItems,
        getVisibleItems,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}; 