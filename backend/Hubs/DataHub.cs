using Microsoft.AspNetCore.SignalR;
using CanvassingBackend.Models;
using CanvassingBackend.Services;

namespace CanvassingBackend.Hubs
{
    public class DataHub : Hub
    {
        private readonly DataService _dataService;

        public DataHub(DataService dataService)
        {
            _dataService = dataService;
        }

        // Join a company group for real-time updates
        public async Task JoinCompanyGroup(string companyId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"company_{companyId}");
        }

        // Leave a company group
        public async Task LeaveCompanyGroup(string companyId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"company_{companyId}");
        }

        // Join admin group for admin-only updates
        public async Task JoinAdminGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        }

        // Leave admin group
        public async Task LeaveAdminGroup()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "admins");
        }

        // Business operations
        public async Task<Business?> CreateBusiness(Business business)
        {
            var createdBusiness = _dataService.CreateBusiness(business);
            if (createdBusiness != null)
            {
                // Notify company group
                await Clients.Group($"company_{business.CompanyId}").SendAsync("BusinessCreated", createdBusiness);
                
                // Notify admins
                await Clients.Group("admins").SendAsync("BusinessCreated", createdBusiness);
            }
            return createdBusiness;
        }

        public async Task<Business?> UpdateBusiness(string id, Business business)
        {
            var updatedBusiness = _dataService.UpdateBusiness(id, business);
            if (updatedBusiness != null)
            {
                // Notify company group
                await Clients.Group($"company_{business.CompanyId}").SendAsync("BusinessUpdated", updatedBusiness);
                
                // Notify admins
                await Clients.Group("admins").SendAsync("BusinessUpdated", updatedBusiness);
            }
            return updatedBusiness;
        }

        public async Task<bool> DeleteBusiness(string id)
        {
            var business = _dataService.GetBusinessById(id);
            if (business != null)
            {
                var success = _dataService.DeleteBusiness(id);
                if (success)
                {
                    // Notify company group
                    await Clients.Group($"company_{business.CompanyId}").SendAsync("BusinessDeleted", id);
                    
                    // Notify admins
                    await Clients.Group("admins").SendAsync("BusinessDeleted", id);
                }
                return success;
            }
            return false;
        }

        public async Task<Business?> AssignBusinessToUser(string businessId, string userId)
        {
            var business = _dataService.GetBusinessById(businessId);
            if (business != null)
            {
                business.AssignedUserId = userId;
                business.UpdatedAt = DateTime.UtcNow;
                
                var updatedBusiness = _dataService.UpdateBusiness(businessId, business);
                if (updatedBusiness != null)
                {
                    // Notify company group
                    await Clients.Group($"company_{business.CompanyId}").SendAsync("BusinessUpdated", updatedBusiness);
                    
                    // Notify admins
                    await Clients.Group("admins").SendAsync("BusinessUpdated", updatedBusiness);
                }
                return updatedBusiness;
            }
            return null;
        }

        public async Task<Business?> UnassignBusinessFromUser(string businessId)
        {
            var business = _dataService.GetBusinessById(businessId);
            if (business != null)
            {
                business.AssignedUserId = null;
                business.UpdatedAt = DateTime.UtcNow;
                
                var updatedBusiness = _dataService.UpdateBusiness(businessId, business);
                if (updatedBusiness != null)
                {
                    // Notify company group
                    await Clients.Group($"company_{business.CompanyId}").SendAsync("BusinessUpdated", updatedBusiness);
                    
                    // Notify admins
                    await Clients.Group("admins").SendAsync("BusinessUpdated", updatedBusiness);
                }
                return updatedBusiness;
            }
            return null;
        }

        // Company operations
        public async Task<Company?> CreateCompany(Company company)
        {
            var createdCompany = _dataService.CreateCompany(company);
            if (createdCompany != null)
            {
                // Notify all clients
                await Clients.All.SendAsync("CompanyCreated", createdCompany);
            }
            return createdCompany;
        }

        public async Task<Company?> UpdateCompany(string id, Company company)
        {
            var updatedCompany = _dataService.UpdateCompany(id, company);
            if (updatedCompany != null)
            {
                // Notify all clients
                await Clients.All.SendAsync("CompanyUpdated", updatedCompany);
            }
            return updatedCompany;
        }

        public async Task<bool> DeleteCompany(string id)
        {
            var success = _dataService.DeleteCompany(id);
            if (success)
            {
                // Notify all clients
                await Clients.All.SendAsync("CompanyDeleted", id);
            }
            return success;
        }

        // User operations
        public async Task<User?> CreateUser(User user)
        {
            var createdUser = _dataService.CreateUser(user);
            if (createdUser != null)
            {
                // Notify all clients
                await Clients.All.SendAsync("UserCreated", createdUser);
            }
            return createdUser;
        }

        public async Task<User?> UpdateUser(User user)
        {
            var updatedUser = _dataService.UpdateUser(user);
            if (updatedUser != null)
            {
                // Notify all clients
                await Clients.All.SendAsync("UserUpdated", updatedUser);
            }
            return updatedUser;
        }

        public async Task<bool> DeleteUser(string id)
        {
            var success = _dataService.DeleteUser(id);
            if (success)
            {
                // Notify all clients
                await Clients.All.SendAsync("UserDeleted", id);
            }
            return success;
        }

        // Data retrieval methods (for initial load)
        public List<Business> GetBusinessesByCompany(string companyId)
        {
            return _dataService.GetBusinessesByCompanyId(companyId);
        }

        public List<Business> GetBusinessesByAssignedUser(string userId)
        {
            return _dataService.GetBusinessesByAssignedUserId(userId);
        }

        public List<Company> GetAllCompanies()
        {
            return _dataService.GetAllCompanies();
        }

        public List<User> GetAllUsers()
        {
            return _dataService.GetAllUsers();
        }

        public List<Business> GetAllBusinesses()
        {
            return _dataService.GetAllBusinesses();
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
} 