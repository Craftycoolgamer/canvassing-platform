import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business, Company } from '../types';

export class StorageService {
  private static readonly COMPANIES_KEY = 'companies';
  private static readonly BUSINESSES_KEY = 'businesses';

  // Company operations
  static async saveCompany(company: Company): Promise<void> {
    try {
      const companies = await this.getCompanies();
      const existingIndex = companies.findIndex(c => c.id === company.id);
      
      if (existingIndex >= 0) {
        companies[existingIndex] = company;
      } else {
        companies.push(company);
      }
      
      await AsyncStorage.setItem(this.COMPANIES_KEY, JSON.stringify(companies));
    } catch (error) {
      console.error('Error saving company:', error);
      throw error;
    }
  }

  static async getCompanies(): Promise<Company[]> {
    try {
      const data = await AsyncStorage.getItem(this.COMPANIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting companies:', error);
      return [];
    }
  }

  static async deleteCompany(id: string): Promise<void> {
    try {
      const companies = await this.getCompanies();
      const filteredCompanies = companies.filter(c => c.id !== id);
      await AsyncStorage.setItem(this.COMPANIES_KEY, JSON.stringify(filteredCompanies));
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Business operations
  static async saveBusiness(business: Business): Promise<void> {
    try {
      const businesses = await this.getBusinesses();
      const existingIndex = businesses.findIndex(b => b.id === business.id);
      
      if (existingIndex >= 0) {
        businesses[existingIndex] = business;
      } else {
        businesses.push(business);
      }
      
      await AsyncStorage.setItem(this.BUSINESSES_KEY, JSON.stringify(businesses));
    } catch (error) {
      console.error('Error saving business:', error);
      throw error;
    }
  }

  static async getBusinesses(): Promise<Business[]> {
    try {
      const data = await AsyncStorage.getItem(this.BUSINESSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting businesses:', error);
      return [];
    }
  }

  static async getBusinessesByCompany(companyId: string): Promise<Business[]> {
    try {
      const businesses = await this.getBusinesses();
      return businesses.filter(b => b.companyId === companyId);
    } catch (error) {
      console.error('Error getting businesses by company:', error);
      return [];
    }
  }

  static async deleteBusiness(id: string): Promise<void> {
    try {
      const businesses = await this.getBusinesses();
      const filteredBusinesses = businesses.filter(b => b.id !== id);
      await AsyncStorage.setItem(this.BUSINESSES_KEY, JSON.stringify(filteredBusinesses));
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.COMPANIES_KEY, this.BUSINESSES_KEY]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
} 