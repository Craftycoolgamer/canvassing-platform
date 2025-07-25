import { useState, useEffect, useCallback } from 'react';
import { dataManager } from '../services/DataManager';
import { Business, Company, User, BusinessFormData, CompanyFormData, UserFormData } from '../types';

// Hook return type
interface UseDataManagerReturn {
  // Data
  companies: Company[];
  businesses: Business[];
  users: User[];
  selectedCompany: Company | null;
  selectedUser: User | null;
  selectedManager: User | null;
  isLoading: boolean;
  
  // Company operations
  loadCompanies: (forceRefresh?: boolean) => Promise<Company[]>;
  createCompany: (data: CompanyFormData) => Promise<Company | null>;
  updateCompany: (id: string, data: Partial<CompanyFormData>) => Promise<Company | null>;
  deleteCompany: (id: string) => Promise<boolean>;
  setSelectedCompany: (company: Company | null) => Promise<void>;
  
  // Business operations
  loadBusinesses: (forceRefresh?: boolean) => Promise<Business[]>;
  createBusiness: (data: BusinessFormData) => Promise<Business | null>;
  updateBusiness: (id: string, data: Partial<BusinessFormData>) => Promise<Business | null>;
  deleteBusiness: (id: string) => Promise<boolean>;
  getBusinessesByCompany: (companyId: string) => Business[];
  getBusinessesByAssignedUser: (userId: string) => Business[];
  assignBusinessToUser: (businessId: string, userId: string) => Promise<Business | null>;
  unassignBusinessFromUser: (businessId: string) => Promise<Business | null>;
  
  // User operations
  loadUsers: (forceRefresh?: boolean) => Promise<User[]>;
  createUser: (data: UserFormData) => Promise<User | null>;
  updateUser: (id: string, data: Partial<UserFormData>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  getUsersByRole: (role: 'Admin' | 'Manager' | 'User') => User[];
  getUsersByCompany: (companyId: string) => User[];
  setSelectedUser: (user: User | null) => Promise<void>;
  setSelectedManager: (manager: User | null) => Promise<void>;
  
  // Utility operations
  syncAllData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useDataManager = (): UseDataManagerReturn => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [selectedUser, setSelectedUserState] = useState<User | null>(null);
  const [selectedManager, setSelectedManagerState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to data changes and initialize SignalR
  useEffect(() => {
    const unsubscribe = dataManager.subscribe((event) => {
      switch (event.type) {
        case 'companies':
          setCompanies(event.data || []);
          break;
        case 'businesses':
          setBusinesses(event.data || []);
          break;
        case 'users':
          setUsers(event.data || []);
          break;
        case 'selectedCompany':
          setSelectedCompanyState(event.data || null);
          break;
        case 'selectedUser':
          setSelectedUserState(event.data || null);
          break;
        case 'selectedManager':
          setSelectedManagerState(event.data || null);
          break;
      }
    });

    // Initialize state from DataManager
    const state = dataManager.getState();
    setCompanies(state.companies);
    setBusinesses(state.businesses);
    setUsers(state.users);
    setSelectedCompanyState(state.selectedCompany);
    setSelectedUserState(state.selectedUser);
    setSelectedManagerState(state.selectedManager);
    setIsLoading(state.isLoading);

    // Initialize SignalR connection
    dataManager.initializeSignalR();

    return unsubscribe;
  }, []);

  // Company operations
  const loadCompanies = useCallback(async (forceRefresh = false) => {
    return await dataManager.loadCompanies(forceRefresh);
  }, []);

  const createCompany = useCallback(async (data: CompanyFormData) => {
    return await dataManager.createCompany(data);
  }, []);

  const updateCompany = useCallback(async (id: string, data: Partial<CompanyFormData>) => {
    return await dataManager.updateCompany(id, data);
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    return await dataManager.deleteCompany(id);
  }, []);

  const setSelectedCompany = useCallback(async (company: Company | null) => {
    await dataManager.setSelectedCompany(company);
  }, []);

  // Business operations
  const loadBusinesses = useCallback(async (forceRefresh = false) => {
    return await dataManager.loadBusinesses(forceRefresh);
  }, []);

  const createBusiness = useCallback(async (data: BusinessFormData) => {
    return await dataManager.createBusiness(data);
  }, []);

  const updateBusiness = useCallback(async (id: string, data: Partial<BusinessFormData>) => {
    return await dataManager.updateBusiness(id, data);
  }, []);

  const deleteBusiness = useCallback(async (id: string) => {
    return await dataManager.deleteBusiness(id);
  }, []);

  const getBusinessesByCompany = useCallback((companyId: string) => {
    return dataManager.getBusinessesByCompany(companyId);
  }, []);

  const getBusinessesByAssignedUser = useCallback((userId: string) => {
    return dataManager.getBusinessesByAssignedUser(userId);
  }, []);

  const assignBusinessToUser = useCallback(async (businessId: string, userId: string) => {
    return await dataManager.assignBusinessToUser(businessId, userId);
  }, []);

  const unassignBusinessFromUser = useCallback(async (businessId: string) => {
    return await dataManager.unassignBusinessFromUser(businessId);
  }, []);

  // User operations
  const loadUsers = useCallback(async (forceRefresh = false) => {
    return await dataManager.loadUsers(forceRefresh);
  }, []);

  const createUser = useCallback(async (data: UserFormData) => {
    return await dataManager.createUser(data);
  }, []);

  const updateUser = useCallback(async (id: string, data: Partial<UserFormData>) => {
    return await dataManager.updateUser(id, data);
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    return await dataManager.deleteUser(id);
  }, []);

  const getUsersByRole = useCallback((role: 'Admin' | 'Manager' | 'User') => {
    return dataManager.getUsersByRole(role);
  }, []);

  const getUsersByCompany = useCallback((companyId: string) => {
    return dataManager.getUsersByCompany(companyId);
  }, []);

  const setSelectedUser = useCallback(async (user: User | null) => {
    await dataManager.setSelectedUser(user);
  }, []);

  const setSelectedManager = useCallback(async (manager: User | null) => {
    await dataManager.setSelectedManager(manager);
  }, []);

  // Utility operations
  const syncAllData = useCallback(async () => {
    await dataManager.syncAllData();
  }, []);

  const clearAllData = useCallback(async () => {
    await dataManager.clearAllData();
  }, []);

  return {
    // Data
    companies,
    businesses,
    users,
    selectedCompany,
    selectedUser,
    selectedManager,
    isLoading,
    
    // Company operations
    loadCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    setSelectedCompany,
    
    // Business operations
    loadBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getBusinessesByCompany,
    getBusinessesByAssignedUser,
    assignBusinessToUser,
    unassignBusinessFromUser,
    
    // User operations
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    getUsersByRole,
    getUsersByCompany,
    setSelectedUser,
    setSelectedManager,
    
    // Utility operations
    syncAllData,
    clearAllData,
  };
}; 