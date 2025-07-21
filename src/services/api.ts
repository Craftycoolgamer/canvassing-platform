import { Business, Company, BusinessFormData, CompanyFormData, ApiResponse } from '../types';

// Replace with your actual backend URL
const API_BASE_URL = 'http://192.168.1.34:3000/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Business endpoints
  async getBusinesses(): Promise<ApiResponse<Business[]>> {
    return this.request<Business[]>('/businesses');
  }

  async getBusinessesByCompany(companyId: string): Promise<ApiResponse<Business[]>> {
    return this.request<Business[]>(`/businesses/company/${companyId}`);
  }

  async getBusiness(id: string): Promise<ApiResponse<Business>> {
    return this.request<Business>(`/businesses/${id}`);
  }

  async createBusiness(data: BusinessFormData): Promise<ApiResponse<Business>> {
    return this.request<Business>('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusiness(id: string, data: Partial<BusinessFormData>): Promise<ApiResponse<Business>> {
    return this.request<Business>(`/businesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBusiness(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/businesses/${id}`, {
      method: 'DELETE',
    });
  }

  // Company endpoints
  async getCompanies(): Promise<ApiResponse<Company[]>> {
    return this.request<Company[]>('/companies');
  }

  async getCompany(id: string): Promise<ApiResponse<Company>> {
    return this.request<Company>(`/companies/${id}`);
  }

  async createCompany(data: CompanyFormData): Promise<ApiResponse<Company>> {
    return this.request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: Partial<CompanyFormData>): Promise<ApiResponse<Company>> {
    return this.request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/companies/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService(); 