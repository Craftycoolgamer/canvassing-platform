import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';
import { dataManager } from '../services/DataManager';
import signalRService from '../services/signalRService';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'User';
  companyId?: string;
  isActive: boolean;
  isApproved: boolean;
  canManagePins: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Initialize SignalR connection for existing user
        await signalRService.connect();
        dataManager.initializeSignalRListeners();
        
        // Join appropriate groups based on user role
        if (currentUser.role === 'Admin') {
          await signalRService.joinAdminGroup();
        }
        if (currentUser.companyId) {
          await signalRService.joinCompanyGroup(currentUser.companyId);
        }
      }
    } catch (error) {
      console.error('AuthContext: Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
  
      const response = await AuthService.login(email, password);
      if (response.success && response.data) {

        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        
        // Initialize SignalR connection
        await signalRService.connect();
        dataManager.initializeSignalRListeners();
        
        // Join appropriate groups based on user role
        if (loggedInUser.role === 'Admin') {
          await signalRService.joinAdminGroup();
        }
        if (loggedInUser.companyId) {
          await signalRService.joinCompanyGroup(loggedInUser.companyId);
        }
        
        // Set the selected company ID to the user's company ID if they have one
        if (loggedInUser.companyId) {
  
          // Find the company and set it as selected
          const companies = await dataManager.loadCompanies();
          const userCompany = companies.find(c => c.id === loggedInUser.companyId);
          if (userCompany) {
            await dataManager.setSelectedCompany(userCompany);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      
      const response = await AuthService.register(userData);
      if (response.success && response.data) {
        
        const registeredUser = response.data.user;
        setUser(registeredUser);
        
        // Initialize SignalR connection
        await signalRService.connect();
        dataManager.initializeSignalRListeners();
        
        // Join appropriate groups based on user role
        if (registeredUser.role === 'Admin') {
          await signalRService.joinAdminGroup();
        }
        if (registeredUser.companyId) {
          await signalRService.joinCompanyGroup(registeredUser.companyId);
        }
        
        // Set the selected company ID to the user's company ID if they have one
        if (registeredUser.companyId) {
          
          // Find the company and set it as selected
          const companies = await dataManager.loadCompanies();
          const userCompany = companies.find(c => c.id === registeredUser.companyId);
          if (userCompany) {
            await dataManager.setSelectedCompany(userCompany);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('AuthContext: Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      // Clear all data when logging out (this will also disconnect SignalR)
      await dataManager.clearAllData();
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 