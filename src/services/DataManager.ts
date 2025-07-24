import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business, Company, User, BusinessFormData, CompanyFormData, UserFormData, ApiResponse } from '../types';
import { apiService } from './api';
import AuthService from './authService';

// Storage keys
const STORAGE_KEYS = {
  COMPANIES: 'companies',
  BUSINESSES: 'businesses',
  USERS: 'users',
  SELECTED_COMPANY_ID: 'selectedCompanyId',
  SELECTED_USER_ID: 'selectedUserId',
  SELECTED_MANAGER_ID: 'selectedManagerId',
} as const;

// Data state interface
interface DataState {
  companies: Company[];
  businesses: Business[];
  users: User[];
  selectedCompany: Company | null;
  selectedUser: User | null;
  selectedManager: User | null;
  isLoading: boolean;
  lastSync: {
    companies: Date | null;
    businesses: Date | null;
    users: Date | null;
  };
}

// Event types for data changes
type DataEventType = 'companies' | 'businesses' | 'users' | 'selectedCompany' | 'selectedUser' | 'selectedManager';

interface DataEvent {
  type: DataEventType;
  data?: any;
}

// Observer pattern for data changes
type DataObserver = (event: DataEvent) => void;

class DataManager {
  private state: DataState = {
    companies: [],
    businesses: [],
    users: [],
    selectedCompany: null,
    selectedUser: null,
    selectedManager: null,
    isLoading: false,
    lastSync: {
      companies: null,
      businesses: null,
      users: null,
    },
  };

  private observers: DataObserver[] = [];
  private syncInProgress = false;

  // Observer pattern methods
  subscribe(observer: DataObserver): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(event: DataEvent): void {
    this.observers.forEach(observer => observer(event));
  }

  // State getters
  getState(): DataState {
    return { ...this.state };
  }

  getCompanies(): Company[] {
    return [...this.state.companies];
  }

  getBusinesses(): Business[] {
    return [...this.state.businesses];
  }

  getUsers(): User[] {
    return [...this.state.users];
  }

  getSelectedCompany(): Company | null {
    return this.state.selectedCompany;
  }

  getSelectedUser(): User | null {
    return this.state.selectedUser;
  }

  getSelectedManager(): User | null {
    return this.state.selectedManager;
  }

  getIsLoading(): boolean {
    return this.state.isLoading;
  }

  // Filtered data getters
  getBusinessesByCompany(companyId: string): Business[] {
    return this.state.businesses.filter(b => b.companyId === companyId);
  }

  getBusinessesByAssignedUser(userId: string): Business[] {
    return this.state.businesses.filter(b => b.assignedUserId === userId);
  }

  getUsersByRole(role: 'Admin' | 'Manager' | 'User'): User[] {
    return this.state.users.filter(u => u.role === role);
  }

  getUsersByCompany(companyId: string): User[] {
    return this.state.users.filter(u => u.companyId === companyId);
  }

  // Company operations
  async loadCompanies(forceRefresh = false): Promise<Company[]> {
    if (!forceRefresh && this.state.companies.length > 0) {
      return this.state.companies;
    }

    try {
      this.setState({ isLoading: true });
      
      // Try API first
      const response = await apiService.getCompanies();
      let companies: Company[] = [];
      
      if (response.success && response.data) {
        companies = response.data;
        await this.saveToStorage(STORAGE_KEYS.COMPANIES, companies);
        this.setState({ 
          companies,
          lastSync: { ...this.state.lastSync, companies: new Date() }
        });
      } else {
        // Fallback to local storage
        companies = await this.loadFromStorage(STORAGE_KEYS.COMPANIES, []);
        this.setState({ companies });
      }

      this.notifyObservers({ type: 'companies', data: companies });
      return companies;
    } catch (error) {
      console.error('Error loading companies:', error);
      const companies = await this.loadFromStorage(STORAGE_KEYS.COMPANIES, []);
      this.setState({ companies });
      return companies;
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async createCompany(data: CompanyFormData): Promise<Company | null> {
    try {
      const response = await apiService.createCompany(data);
      if (response.success && response.data) {
        const newCompany = response.data;
        const updatedCompanies = [...this.state.companies, newCompany];
        
        this.setState({ companies: updatedCompanies });
        await this.saveToStorage(STORAGE_KEYS.COMPANIES, updatedCompanies);
        this.notifyObservers({ type: 'companies', data: updatedCompanies });
        
        return newCompany;
      }
      return null;
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    }
  }

  async updateCompany(id: string, data: Partial<CompanyFormData>): Promise<Company | null> {
    try {
      const response = await apiService.updateCompany(id, data);
      if (response.success && response.data) {
        const updatedCompany = response.data;
        const updatedCompanies = this.state.companies.map(c => 
          c.id === id ? updatedCompany : c
        );
        
        this.setState({ companies: updatedCompanies });
        await this.saveToStorage(STORAGE_KEYS.COMPANIES, updatedCompanies);
        this.notifyObservers({ type: 'companies', data: updatedCompanies });
        
        // Update selected company if it was the one updated
        if (this.state.selectedCompany?.id === id) {
          this.setState({ selectedCompany: updatedCompany });
          this.notifyObservers({ type: 'selectedCompany', data: updatedCompany });
        }
        
        return updatedCompany;
      }
      return null;
    } catch (error) {
      console.error('Error updating company:', error);
      return null;
    }
  }

  async deleteCompany(id: string): Promise<boolean> {
    try {
      const response = await apiService.deleteCompany(id);
      if (response.success) {
        const updatedCompanies = this.state.companies.filter(c => c.id !== id);
        
        this.setState({ companies: updatedCompanies });
        await this.saveToStorage(STORAGE_KEYS.COMPANIES, updatedCompanies);
        this.notifyObservers({ type: 'companies', data: updatedCompanies });
        
        // Clear selected company if it was deleted
        if (this.state.selectedCompany?.id === id) {
          await this.setSelectedCompany(null);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting company:', error);
      return false;
    }
  }

  // Business operations
  async loadBusinesses(forceRefresh = false): Promise<Business[]> {
    if (!forceRefresh && this.state.businesses.length > 0) {
      return this.state.businesses;
    }

    try {
      this.setState({ isLoading: true });
      
      // Check user permissions and company selection
      const currentUser = await AuthService.getCurrentUser();
      const selectedCompanyId = await this.getSelectedCompanyId();
      
      let businesses: Business[] = [];
      let response: ApiResponse<Business[]>;
      
      if (currentUser && !currentUser.canManagePins) {
        // User cannot manage pins - load only assigned businesses
        response = await apiService.getBusinessesByAssignedUser(currentUser.id);
      } else if (selectedCompanyId) {
        // Load businesses for selected company
        response = await apiService.getBusinessesByCompany(selectedCompanyId);
      } else {
        // Load all businesses
        response = await apiService.getBusinesses();
      }
      
      if (response.success && response.data) {
        businesses = response.data;
        await this.saveToStorage(STORAGE_KEYS.BUSINESSES, businesses);
        this.setState({ 
          businesses,
          lastSync: { ...this.state.lastSync, businesses: new Date() }
        });
      } else {
        // Fallback to local storage
        businesses = await this.loadFromStorage(STORAGE_KEYS.BUSINESSES, []);
        this.setState({ businesses });
      }

      this.notifyObservers({ type: 'businesses', data: businesses });
      return businesses;
    } catch (error) {
      console.error('Error loading businesses:', error);
      const businesses = await this.loadFromStorage(STORAGE_KEYS.BUSINESSES, []);
      this.setState({ businesses });
      return businesses;
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async createBusiness(data: BusinessFormData): Promise<Business | null> {
    try {
      const response = await apiService.createBusiness(data);
      if (response.success && response.data) {
        const newBusiness = response.data;
        const updatedBusinesses = [...this.state.businesses, newBusiness];
        
        this.setState({ businesses: updatedBusinesses });
        await this.saveToStorage(STORAGE_KEYS.BUSINESSES, updatedBusinesses);
        this.notifyObservers({ type: 'businesses', data: updatedBusinesses });
        
        return newBusiness;
      }
      return null;
    } catch (error) {
      console.error('Error creating business:', error);
      return null;
    }
  }

  async updateBusiness(id: string, data: Partial<BusinessFormData>): Promise<Business | null> {
    try {
      const response = await apiService.updateBusiness(id, data);
      if (response.success && response.data) {
        const updatedBusiness = response.data;
        const updatedBusinesses = this.state.businesses.map(b => 
          b.id === id ? updatedBusiness : b
        );
        
        this.setState({ businesses: updatedBusinesses });
        await this.saveToStorage(STORAGE_KEYS.BUSINESSES, updatedBusinesses);
        this.notifyObservers({ type: 'businesses', data: updatedBusinesses });
        
        return updatedBusiness;
      }
      return null;
    } catch (error) {
      console.error('Error updating business:', error);
      return null;
    }
  }

  async deleteBusiness(id: string): Promise<boolean> {
    try {
      const response = await apiService.deleteBusiness(id);
      if (response.success) {
        const updatedBusinesses = this.state.businesses.filter(b => b.id !== id);
        
        this.setState({ businesses: updatedBusinesses });
        await this.saveToStorage(STORAGE_KEYS.BUSINESSES, updatedBusinesses);
        this.notifyObservers({ type: 'businesses', data: updatedBusinesses });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting business:', error);
      return false;
    }
  }

  // User operations
  async loadUsers(forceRefresh = false): Promise<User[]> {
    if (!forceRefresh && this.state.users.length > 0) {
      return this.state.users;
    }

    try {
      this.setState({ isLoading: true });
      
      const response = await apiService.getUsers();
      let users: User[] = [];
      
      if (response.success && response.data) {
        users = response.data;
        await this.saveToStorage(STORAGE_KEYS.USERS, users);
        this.setState({ 
          users,
          lastSync: { ...this.state.lastSync, users: new Date() }
        });
      } else {
        // Fallback to local storage
        users = await this.loadFromStorage(STORAGE_KEYS.USERS, []);
        this.setState({ users });
      }

      this.notifyObservers({ type: 'users', data: users });
      return users;
    } catch (error) {
      console.error('Error loading users:', error);
      const users = await this.loadFromStorage(STORAGE_KEYS.USERS, []);
      this.setState({ users });
      return users;
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async createUser(data: UserFormData): Promise<User | null> {
    try {
      const response = await apiService.createUser(data);
      if (response.success && response.data) {
        const newUser = response.data;
        const updatedUsers = [...this.state.users, newUser];
        
        this.setState({ users: updatedUsers });
        await this.saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
        this.notifyObservers({ type: 'users', data: updatedUsers });
        
        return newUser;
      }
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async updateUser(id: string, data: Partial<UserFormData>): Promise<User | null> {
    try {
      const response = await apiService.updateUser(id, data);
      if (response.success && response.data) {
        const updatedUser = response.data;
        const updatedUsers = this.state.users.map(u => 
          u.id === id ? updatedUser : u
        );
        
        this.setState({ users: updatedUsers });
        await this.saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
        this.notifyObservers({ type: 'users', data: updatedUsers });
        
        // Update selected user/manager if it was the one updated
        if (this.state.selectedUser?.id === id) {
          this.setState({ selectedUser: updatedUser });
          this.notifyObservers({ type: 'selectedUser', data: updatedUser });
        }
        if (this.state.selectedManager?.id === id) {
          this.setState({ selectedManager: updatedUser });
          this.notifyObservers({ type: 'selectedManager', data: updatedUser });
        }
        
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const response = await apiService.deleteUser(id);
      if (response.success) {
        const updatedUsers = this.state.users.filter(u => u.id !== id);
        
        this.setState({ users: updatedUsers });
        await this.saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
        this.notifyObservers({ type: 'users', data: updatedUsers });
        
        // Clear selected user/manager if it was deleted
        if (this.state.selectedUser?.id === id) {
          await this.setSelectedUser(null);
        }
        if (this.state.selectedManager?.id === id) {
          await this.setSelectedManager(null);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Selection operations
  async setSelectedCompany(company: Company | null): Promise<void> {
    try {
      if (company) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY_ID, company.id);
        this.setState({ selectedCompany: company });
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_COMPANY_ID);
        this.setState({ selectedCompany: null });
      }
      this.notifyObservers({ type: 'selectedCompany', data: company });
    } catch (error) {
      console.error('Error setting selected company:', error);
    }
  }

  async setSelectedUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_USER_ID, user.id);
        this.setState({ selectedUser: user });
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_USER_ID);
        this.setState({ selectedUser: null });
      }
      this.notifyObservers({ type: 'selectedUser', data: user });
    } catch (error) {
      console.error('Error setting selected user:', error);
    }
  }

  async setSelectedManager(manager: User | null): Promise<void> {
    try {
      if (manager) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_MANAGER_ID, manager.id);
        this.setState({ selectedManager: manager });
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_MANAGER_ID);
        this.setState({ selectedManager: null });
      }
      this.notifyObservers({ type: 'selectedManager', data: manager });
    } catch (error) {
      console.error('Error setting selected manager:', error);
    }
  }

  // Load selections from storage
  async loadSelections(): Promise<void> {
    try {
      const [selectedCompanyId, selectedUserId, selectedManagerId] = await Promise.all([
        this.getSelectedCompanyId(),
        this.getSelectedUserId(),
        this.getSelectedManagerId(),
      ]);

      const selectedCompany = selectedCompanyId 
        ? this.state.companies.find(c => c.id === selectedCompanyId) || null 
        : null;
      const selectedUser = selectedUserId 
        ? this.state.users.find(u => u.id === selectedUserId) || null 
        : null;
      const selectedManager = selectedManagerId 
        ? this.state.users.find(u => u.id === selectedManagerId) || null 
        : null;

      this.setState({ selectedCompany, selectedUser, selectedManager });
    } catch (error) {
      console.error('Error loading selections:', error);
    }
  }

  // Business assignment operations
  async assignBusinessToUser(businessId: string, userId: string): Promise<Business | null> {
    try {
      const response = await apiService.assignBusinessToUser(businessId, userId);
      if (response.success && response.data) {
        const updatedBusiness = response.data;
        const updatedBusinesses = this.state.businesses.map(b => 
          b.id === businessId ? updatedBusiness : b
        );
        
        this.setState({ businesses: updatedBusinesses });
        await this.saveToStorage(STORAGE_KEYS.BUSINESSES, updatedBusinesses);
        this.notifyObservers({ type: 'businesses', data: updatedBusinesses });
        
        return updatedBusiness;
      }
      return null;
    } catch (error) {
      console.error('Error assigning business to user:', error);
      return null;
    }
  }

  async unassignBusinessFromUser(businessId: string): Promise<Business | null> {
    try {
      const response = await apiService.unassignBusinessFromUser(businessId);
      if (response.success && response.data) {
        const updatedBusiness = response.data;
        const updatedBusinesses = this.state.businesses.map(b => 
          b.id === businessId ? updatedBusiness : b
        );
        
        this.setState({ businesses: updatedBusinesses });
        await this.saveToStorage(STORAGE_KEYS.BUSINESSES, updatedBusinesses);
        this.notifyObservers({ type: 'businesses', data: updatedBusinesses });
        
        return updatedBusiness;
      }
      return null;
    } catch (error) {
      console.error('Error unassigning business from user:', error);
      return null;
    }
  }

  // Sync all data
  async syncAllData(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    try {
      await Promise.all([
        this.loadCompanies(true),
        this.loadUsers(true),
        this.loadBusinesses(true),
      ]);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Clear all data (for logout)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.COMPANIES,
        STORAGE_KEYS.BUSINESSES,
        STORAGE_KEYS.USERS,
        STORAGE_KEYS.SELECTED_COMPANY_ID,
        STORAGE_KEYS.SELECTED_USER_ID,
        STORAGE_KEYS.SELECTED_MANAGER_ID,
      ]);
      
      this.setState({
        companies: [],
        businesses: [],
        users: [],
        selectedCompany: null,
        selectedUser: null,
        selectedManager: null,
        lastSync: { companies: null, businesses: null, users: null },
      });
      
      this.notifyObservers({ type: 'companies', data: [] });
      this.notifyObservers({ type: 'businesses', data: [] });
      this.notifyObservers({ type: 'users', data: [] });
      this.notifyObservers({ type: 'selectedCompany', data: null });
      this.notifyObservers({ type: 'selectedUser', data: null });
      this.notifyObservers({ type: 'selectedManager', data: null });
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // Helper methods
  private setState(updates: Partial<DataState>): void {
    this.state = { ...this.state, ...updates };
  }

  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
    }
  }

  private async loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error loading from storage (${key}):`, error);
      return defaultValue;
    }
  }

  private async getSelectedCompanyId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_COMPANY_ID);
    } catch (error) {
      console.error('Error getting selected company ID:', error);
      return null;
    }
  }

  private async getSelectedUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_USER_ID);
    } catch (error) {
      console.error('Error getting selected user ID:', error);
      return null;
    }
  }

  private async getSelectedManagerId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MANAGER_ID);
    } catch (error) {
      console.error('Error getting selected manager ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const dataManager = new DataManager();
export default dataManager; 