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
  notes: string;
  latitude: number;
  longitude: number;
  companyId: string;
  status: 'pending' | 'contacted' | 'completed' | 'not-interested';
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
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
  notes: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 