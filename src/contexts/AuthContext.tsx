import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/authService';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'User';
  companyId?: string;
  isActive: boolean;
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
      }
    } catch (error) {
      console.error('AuthContext: Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      const response = await AuthService.login(email, password);
      if (response.success && response.data) {
        console.log('AuthContext: Login successful, updating user state');
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        
        // Set the selected company ID to the user's company ID if they have one
        if (loggedInUser.companyId) {
          console.log('AuthContext: Setting selected company ID to user company ID:', loggedInUser.companyId);
          await AsyncStorage.setItem('selectedCompanyId', loggedInUser.companyId);
        }
        
        return true;
      }
      console.log('AuthContext: Login failed');
      return false;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      console.log('AuthContext: Attempting registration for:', userData.email);
      const response = await AuthService.register(userData);
      if (response.success && response.data) {
        console.log('AuthContext: Registration successful, updating user state');
        const registeredUser = response.data.user;
        setUser(registeredUser);
        
        // Set the selected company ID to the user's company ID if they have one
        if (registeredUser.companyId) {
          console.log('AuthContext: Setting selected company ID to user company ID:', registeredUser.companyId);
          await AsyncStorage.setItem('selectedCompanyId', registeredUser.companyId);
        }
        
        return true;
      }
      console.log('AuthContext: Registration failed');
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
      // Clear the selected company ID when logging out
      await AsyncStorage.removeItem('selectedCompanyId');
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