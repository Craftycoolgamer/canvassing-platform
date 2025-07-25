import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Business, Company, User, BusinessFormData, CompanyFormData, UserFormData } from '../types';
import AuthService from './authService';
import { getApiBaseUrl } from '../config/api';

export interface SignalRResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased max attempts
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds between attempts
  private backgroundReconnectInterval: NodeJS.Timeout | null = null;
  private isBackgroundReconnecting = false;

  // Event listeners
  private listeners: {
    [key: string]: ((data: any) => void)[];
  } = {};

  // Connection management
  async connect(): Promise<boolean> {
    if (this.connection?.state === 'Connected' || this.isConnecting) {
      return true;
    }

    this.isConnecting = true;

    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const baseUrl = getApiBaseUrl().replace('/api', '');
      this.connection = new HubConnectionBuilder()
        .withUrl(`${baseUrl}/datahub`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000]) // Retry delays
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      await this.connection.start();
      console.log('SignalR connected successfully');
      
      // Reset reconnection state on successful connection
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.isConnecting = false;
      this.stopBackgroundReconnect();
      
      return true;
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.isConnecting = false;
      
      // Emit disconnected event
      this.emit('disconnected', null);
      
      // Start background reconnection if not already running
      if (!this.isBackgroundReconnecting) {
        this.startBackgroundReconnect();
      }
      
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.stopBackgroundReconnect();
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  // Background reconnection methods
  private startBackgroundReconnect(): void {
    if (this.isBackgroundReconnecting) return;
    
    this.isBackgroundReconnecting = true;
    console.log('Starting background reconnection...');
    
    this.backgroundReconnectInterval = setInterval(async () => {
      if (this.connection?.state === 'Connected') {
        this.stopBackgroundReconnect();
        return;
      }
      
      if (this.isConnecting) return;
      
      try {
        console.log(`Background reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        const success = await this.connect();
        
        if (success) {
          console.log('Background reconnection successful');
          this.stopBackgroundReconnect();
        } else {
          this.reconnectAttempts++;
          // Exponential backoff with max delay
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached, will continue trying in background');
            this.reconnectAttempts = 0; // Reset for continuous background attempts
            this.reconnectDelay = this.maxReconnectDelay; // Use max delay for continuous attempts
          }
        }
      } catch (error) {
        console.error('Background reconnection error:', error);
        this.reconnectAttempts++;
      }
    }, this.reconnectDelay);
  }

  private stopBackgroundReconnect(): void {
    if (this.backgroundReconnectInterval) {
      clearInterval(this.backgroundReconnectInterval);
      this.backgroundReconnectInterval = null;
    }
    this.isBackgroundReconnecting = false;
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Business events
    this.connection.on('BusinessCreated', (business: Business) => {
      this.emit('businessCreated', business);
    });

    this.connection.on('BusinessUpdated', (business: Business) => {
      this.emit('businessUpdated', business);
    });

    this.connection.on('BusinessDeleted', (businessId: string) => {
      this.emit('businessDeleted', businessId);
    });

    // Company events
    this.connection.on('CompanyCreated', (company: Company) => {
      this.emit('companyCreated', company);
    });

    this.connection.on('CompanyUpdated', (company: Company) => {
      this.emit('companyUpdated', company);
    });

    this.connection.on('CompanyDeleted', (companyId: string) => {
      this.emit('companyDeleted', companyId);
    });

    // User events
    this.connection.on('UserCreated', (user: User) => {
      this.emit('userCreated', user);
    });

    this.connection.on('UserUpdated', (user: User) => {
      this.emit('userUpdated', user);
    });

    this.connection.on('UserDeleted', (userId: string) => {
      this.emit('userDeleted', userId);
    });

    // Connection events
    this.connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      this.emit('reconnecting', null);
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.stopBackgroundReconnect();
      this.emit('reconnected', null);
    });

    this.connection.onclose(() => {
      console.log('SignalR connection closed');
      this.emit('disconnected', null);
      
      // Start background reconnection if not already running
      if (!this.isBackgroundReconnecting) {
        this.startBackgroundReconnect();
      }
    });
  }

  // Event listener management
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    };
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Group management
  async joinCompanyGroup(companyId: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('JoinCompanyGroup', companyId);
    }
  }

  async leaveCompanyGroup(companyId: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('LeaveCompanyGroup', companyId);
    }
  }

  async joinAdminGroup(): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('JoinAdminGroup');
    }
  }

  async leaveAdminGroup(): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('LeaveAdminGroup');
    }
  }

  // Business operations
  async createBusiness(data: BusinessFormData): Promise<SignalRResponse<Business>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const business = await this.connection!.invoke('CreateBusiness', data);
      return { success: true, data: business };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async updateBusiness(id: string, data: Partial<BusinessFormData>): Promise<SignalRResponse<Business>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const business = await this.connection!.invoke('UpdateBusiness', id, data);
      return { success: true, data: business };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async deleteBusiness(id: string): Promise<SignalRResponse<boolean>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const success = await this.connection!.invoke('DeleteBusiness', id);
      return { success: true, data: success };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async assignBusinessToUser(businessId: string, userId: string): Promise<SignalRResponse<Business>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const business = await this.connection!.invoke('AssignBusinessToUser', businessId, userId);
      return { success: true, data: business };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async unassignBusinessFromUser(businessId: string): Promise<SignalRResponse<Business>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const business = await this.connection!.invoke('UnassignBusinessFromUser', businessId);
      return { success: true, data: business };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Company operations
  async createCompany(data: CompanyFormData): Promise<SignalRResponse<Company>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const company = await this.connection!.invoke('CreateCompany', data);
      return { success: true, data: company };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async updateCompany(id: string, data: Partial<CompanyFormData>): Promise<SignalRResponse<Company>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const company = await this.connection!.invoke('UpdateCompany', id, data);
      return { success: true, data: company };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async deleteCompany(id: string): Promise<SignalRResponse<boolean>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const success = await this.connection!.invoke('DeleteCompany', id);
      return { success: true, data: success };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // User operations
  async createUser(data: UserFormData): Promise<SignalRResponse<User>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const user = await this.connection!.invoke('CreateUser', data);
      return { success: true, data: user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async updateUser(id: string, data: Partial<UserFormData>): Promise<SignalRResponse<User>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const user = await this.connection!.invoke('UpdateUser', id, data);
      return { success: true, data: user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async deleteUser(id: string): Promise<SignalRResponse<boolean>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const success = await this.connection!.invoke('DeleteUser', id);
      return { success: true, data: success };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Data retrieval methods
  async getBusinessesByCompany(companyId: string): Promise<SignalRResponse<Business[]>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const businesses = await this.connection!.invoke('GetBusinessesByCompany', companyId);
      return { success: true, data: businesses };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getBusinessesByAssignedUser(userId: string): Promise<SignalRResponse<Business[]>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const businesses = await this.connection!.invoke('GetBusinessesByAssignedUser', userId);
      return { success: true, data: businesses };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getAllCompanies(): Promise<SignalRResponse<Company[]>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const companies = await this.connection!.invoke('GetAllCompanies');
      return { success: true, data: companies };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getAllUsers(): Promise<SignalRResponse<User[]>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const users = await this.connection!.invoke('GetAllUsers');
      return { success: true, data: users };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getAllBusinesses(): Promise<SignalRResponse<Business[]>> {
    try {
      if (this.connection?.state !== 'Connected') {
        await this.connect();
      }

      const businesses = await this.connection!.invoke('GetAllBusinesses');
      return { success: true, data: businesses };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }
}

export const signalRService = new SignalRService();
export default signalRService; 