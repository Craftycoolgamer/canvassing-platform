export interface Company {
  id: string;
  name: string;
  pinIcon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  notes: string[];
  latitude: number;
  longitude: number;
  companyId: string;
  assignedUserId?: string;
  status: 'pending' | 'contacted' | 'completed' | 'not-interested';
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'User';
  companyId?: string;
  isActive: boolean;
  canManagePins: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  companyId?: string;
  confirmPassword?: string; // For frontend validation only
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface MapPin {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  business: Business;
  company: Company;
}

export interface BusinessFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  notes: string[];
  latitude: number;
  longitude: number;
  companyId: string;
  status: 'pending' | 'contacted' | 'completed' | 'not-interested';
}

export interface CompanyFormData {
  name: string;
  pinIcon: string;
  color: string;
}

export interface UserFormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: 'Admin' | 'Manager' | 'User';
  companyId?: string;
  isActive?: boolean;
  canManagePins?: boolean;
}
export interface ManagerFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  companyId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 