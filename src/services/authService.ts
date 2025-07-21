import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest, RegisterRequest, AuthResponse, RefreshTokenRequest, ApiResponse } from '../types';

class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'current_user';

  // Login user
  static async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch('http://192.168.1.34:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        // Store authentication data
        await this.storeAuthData(data.data);
        return data;
      } else {
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Register user
  static async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch('http://192.168.1.34:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        // Store authentication data
        await this.storeAuthData(data.data);
        return data;
      } else {
        return {
          success: false,
          error: data.error || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Refresh token
  static async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      const response = await fetch('http://192.168.1.34:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        // Store new authentication data
        await this.storeAuthData(data.data);
        return data;
      } else {
        // Clear invalid tokens
        await this.logout();
        return {
          success: false,
          error: data.error || 'Token refresh failed',
        };
      }
    } catch (error) {
      await this.logout();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        // Revoke token on server
        await fetch('http://192.168.1.34:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.USER_KEY,
      ]);
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get access token
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Get refresh token
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const user = await this.getCurrentUser();
      return !!(token && user);
    } catch (error) {
      return false;
    }
  }

  // Check if token is expired
  static async isTokenExpired(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return true;

      // For now, we'll use a simple approach
      // In a real app, you'd decode the JWT and check expiration
      return false;
    } catch (error) {
      return true;
    }
  }

  // Store authentication data
  private static async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, authData.token],
        [this.REFRESH_TOKEN_KEY, authData.refreshToken],
        [this.USER_KEY, JSON.stringify(authData.user)],
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  // Get authorization header for API requests
  static async getAuthHeader(): Promise<{ Authorization: string } | {}> {
    try {
      const token = await this.getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      return {};
    }
  }
}

export default AuthService; 