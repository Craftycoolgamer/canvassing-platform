import { Business, Company, BusinessFormData, CompanyFormData, User, UserFormData, ApiResponse } from '../types';
import AuthService from './authService';
import { getApiBaseUrl } from '../config/api';

// Use the shared API configuration
const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get authorization header
      const authHeader = await AuthService.getAuthHeader();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
          ...options.headers,
        },
        ...options,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Try to refresh token
        const refreshResult = await AuthService.refreshToken();
        if (refreshResult.success) {
          // Retry the request with new token
          const newAuthHeader = await AuthService.getAuthHeader();
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
              'Content-Type': 'application/json',
              ...newAuthHeader,
              ...options.headers,
            },
            ...options,
          });
          
          const retryData = await retryResponse.json();
          return retryData;
        } else {
          // Refresh failed, user needs to login again
          await AuthService.logout();
          return {
            success: false,
            error: 'Authentication required',
          };
        }
      }

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

  // User endpoints
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: UserFormData): Promise<ApiResponse<User>> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<UserFormData>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Business assignment endpoints
  async getBusinessesByAssignedUser(userId: string): Promise<ApiResponse<Business[]>> {
    return this.request<Business[]>(`/businesses/assigned/${userId}`);
  }

  async getBusinessesByCompanyAndAssignedUser(companyId: string, userId: string): Promise<ApiResponse<Business[]>> {
    return this.request<Business[]>(`/businesses/company/${companyId}/assigned/${userId}`);
  }

  async assignBusinessToUser(businessId: string, userId: string): Promise<ApiResponse<Business>> {
    return this.request<Business>(`/businesses/${businessId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  }

  async unassignBusinessFromUser(businessId: string): Promise<ApiResponse<Business>> {
    return this.request<Business>(`/businesses/${businessId}/unassign`, {
      method: 'PUT',
    });
  }
}

export const apiService = new ApiService(); 