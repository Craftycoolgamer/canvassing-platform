using CanvassingBackend.Models;
using CanvassingBackend.Services;
using CanvassingBackend.Middleware;
using CanvassingBackend.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;

namespace CanvassingBackend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Configure JWT
            var jwtSettings = builder.Configuration.GetSection("Jwt");
            var secretKey = jwtSettings["SecretKey"] ?? "your-super-secret-key-with-at-least-32-characters";
            var issuer = jwtSettings["Issuer"] ?? "CanvassingAPI";
            var audience = jwtSettings["Audience"] ?? "CanvassingApp";

            // Add JWT Authentication
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey)),
                        ValidateIssuer = true,
                        ValidIssuer = issuer,
                        ValidateAudience = true,
                        ValidAudience = audience,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    };
                });

            // Add Authorization
            builder.Services.AddAuthorization();

            // Add services
            builder.Services.AddSingleton<DataService>();
            builder.Services.AddSingleton<JwtService>();
            builder.Services.AddSingleton<AuthService>();

            // Add SignalR
            builder.Services.AddSignalR();

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            var app = builder.Build();

            // Configure middleware
            app.UseCors();
            app.UseRouting();
            app.UseJwtMiddleware(); // Custom JWT middleware
            app.UseAuthentication();
            app.UseAuthorization();

            // Map SignalR hub
            app.MapHub<DataHub>("/datahub");

            // Health check endpoint
            app.MapGet("/api/health", () =>
            {
                return Results.Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Canvassing API is running",
                    Data = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                });
            });

            // Authentication endpoints (no auth required)
            app.MapPost("/api/auth/login", (LoginRequest request, AuthService authService) =>
            {
                var response = authService.Login(request);
                if (response == null)
                    return Results.Unauthorized();

                return Results.Ok(ApiResponse<AuthResponse>.SuccessResponse(response));
            });

            app.MapPost("/api/auth/register", (RegisterRequest request, AuthService authService) =>
            {
                var response = authService.Register(request);
                if (response == null)
                    return Results.BadRequest(ApiResponse<AuthResponse>.ErrorResponse("User already exists"));

                return Results.Created($"/api/auth/register", ApiResponse<AuthResponse>.SuccessResponse(response));
            });

            app.MapPost("/api/auth/refresh", (RefreshTokenRequest request, AuthService authService) =>
            {
                var response = authService.RefreshToken(request);
                if (response == null)
                    return Results.Unauthorized();

                return Results.Ok(ApiResponse<AuthResponse>.SuccessResponse(response));
            });

            app.MapPost("/api/auth/logout", (RefreshTokenRequest request, AuthService authService) =>
            {
                authService.RevokeToken(request.RefreshToken);
                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            });

            // Approval endpoints (require authentication and admin/manager role)
            app.MapGet("/api/auth/pending-approvals", (AuthService authService, HttpContext context) =>
            {
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                {
                    return Results.Unauthorized();
                }

                var user = authService.GetUserById(userId);
                
                if (user == null || (user.Role != "Admin" && user.Role != "Manager"))
                {
                    return Results.Forbid();
                }

                var pendingUsers = authService.GetPendingApprovals(userId);
                
                return Results.Ok(ApiResponse<List<User>>.SuccessResponse(pendingUsers));
            }).RequireAuthorization();

            app.MapPost("/api/auth/approve-user", (ApprovalRequest request, AuthService authService, HttpContext context) =>
            {
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Results.Unauthorized();

                var currentUser = authService.GetUserById(userId);
                if (currentUser == null || (currentUser.Role != "Admin" && currentUser.Role != "Manager"))
                    return Results.Forbid();

                var success = authService.ApproveUser(request.UserId, userId);
                if (!success)
                    return Results.BadRequest(ApiResponse<object>.ErrorResponse("Failed to approve user"));

                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            }).RequireAuthorization();

            app.MapPost("/api/auth/reject-user", (RejectionRequest request, AuthService authService, HttpContext context) =>
            {
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Results.Unauthorized();

                var currentUser = authService.GetUserById(userId);
                if (currentUser == null || (currentUser.Role != "Admin" && currentUser.Role != "Manager"))
                    return Results.Forbid();

                var success = authService.RejectUser(request.UserId, userId);
                if (!success)
                    return Results.BadRequest(ApiResponse<object>.ErrorResponse("Failed to reject user"));

                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            }).RequireAuthorization();



            // Protected endpoints (require authentication)
            app.MapGet("/api/users", (DataService dataService) =>
            {
                var users = dataService.GetAllUsers();
                return Results.Ok(ApiResponse<List<User>>.SuccessResponse(users));
            }).RequireAuthorization();

            app.MapGet("/api/users/{id}", (string id, DataService dataService) =>
            {
                var user = dataService.GetUserById(id);
                if (user == null)
                    return Results.NotFound(ApiResponse<User>.ErrorResponse("User not found"));

                return Results.Ok(ApiResponse<User>.SuccessResponse(user));
            }).RequireAuthorization();

            app.MapPost("/api/users", (UserCreateRequest request, DataService dataService) =>
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Username) || 
                    string.IsNullOrEmpty(request.FirstName) || string.IsNullOrEmpty(request.LastName))
                    return Results.BadRequest(ApiResponse<User>.ErrorResponse("Email, Username, FirstName, and LastName are required"));

                // Check if user with email already exists
                var existingUser = dataService.GetUserByEmail(request.Email);
                if (existingUser != null)
                    return Results.BadRequest(ApiResponse<User>.ErrorResponse("User with this email already exists"));

                // Hash the password if it's provided
                string passwordHash = string.Empty;
                if (!string.IsNullOrEmpty(request.Password))
                {
                    using var sha256 = System.Security.Cryptography.SHA256.Create();
                    var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(request.Password));
                    passwordHash = Convert.ToBase64String(hashedBytes);
                }

                var user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = request.Email,
                    Username = request.Username,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PasswordHash = passwordHash,
                    Role = request.Role,
                    CompanyId = request.CompanyId,
                    IsActive = request.IsActive,
                    CanManagePins = request.CanManagePins,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createdUser = dataService.CreateUser(user);
                return Results.Created($"/api/users/{createdUser.Id}", ApiResponse<User>.SuccessResponse(createdUser));
            }).RequireAuthorization();

            app.MapPut("/api/users/{id}", (string id, User user, DataService dataService) =>
            {
                // Set the ID from the route parameter
                user.Id = id;
                
                var updatedUser = dataService.UpdateUser(user);
                if (updatedUser == null)
                    return Results.NotFound(ApiResponse<User>.ErrorResponse("User not found"));

                return Results.Ok(ApiResponse<User>.SuccessResponse(updatedUser));
            }).RequireAuthorization();

            app.MapDelete("/api/users/{id}", (string id, DataService dataService) =>
            {
                var success = dataService.DeleteUser(id);
                if (!success)
                    return Results.NotFound(ApiResponse<object>.ErrorResponse("User not found"));

                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            }).RequireAuthorization();

            // Companies endpoints (require authentication)
            app.MapGet("/api/companies", (DataService dataService) =>
            {
                var companies = dataService.GetAllCompanies();
                return Results.Ok(ApiResponse<List<Company>>.SuccessResponse(companies));
            }).RequireAuthorization();

            app.MapGet("/api/companies/{id}", (string id, DataService dataService) =>
            {
                var company = dataService.GetCompanyById(id);
                if (company == null)
                    return Results.NotFound(ApiResponse<Company>.ErrorResponse("Company not found"));

                return Results.Ok(ApiResponse<Company>.SuccessResponse(company));
            }).RequireAuthorization();

            app.MapPost("/api/companies", (Company company, DataService dataService) =>
            {
                if (string.IsNullOrEmpty(company.Name) || string.IsNullOrEmpty(company.PinIcon) || string.IsNullOrEmpty(company.Color))
                    return Results.BadRequest(ApiResponse<Company>.ErrorResponse("Name, PinIcon, and Color are required"));

                var createdCompany = dataService.CreateCompany(company);
                return Results.Created($"/api/companies/{createdCompany.Id}", ApiResponse<Company>.SuccessResponse(createdCompany));
            }).RequireAuthorization();

            app.MapPut("/api/companies/{id}", (string id, Company company, DataService dataService) =>
            {
                var updatedCompany = dataService.UpdateCompany(id, company);
                if (updatedCompany == null)
                    return Results.NotFound(ApiResponse<Company>.ErrorResponse("Company not found"));

                return Results.Ok(ApiResponse<Company>.SuccessResponse(updatedCompany));
            }).RequireAuthorization();

            app.MapDelete("/api/companies/{id}", (string id, DataService dataService) =>
            {
                var success = dataService.DeleteCompany(id);
                if (!success)
                    return Results.NotFound(ApiResponse<object>.ErrorResponse("Company not found"));

                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            }).RequireAuthorization();

            // Businesses endpoints (require authentication)
            app.MapGet("/api/businesses", (DataService dataService, HttpContext context) =>
            {
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var user = dataService.GetUserById(userId);
                    if (user != null)
                    {
                        // If user cannot manage pins, only show assigned businesses
                        if (!user.CanManagePins)
                        {
                            var assignedBusinesses = dataService.GetBusinessesByAssignedUserId(user.Id);
                            return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(assignedBusinesses));
                        }
                        
                        // If user is not admin, filter by company
                        if (user.Role != "Admin" && !string.IsNullOrEmpty(user.CompanyId))
                        {
                            var companyBusinesses = dataService.GetBusinessesByCompanyId(user.CompanyId);
                            return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(companyBusinesses));
                        }
                    }
                }

                // Default: return all businesses (for admins or when no user context)
                var businesses = dataService.GetAllBusinesses();
                return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(businesses));
            }).RequireAuthorization();

            app.MapGet("/api/businesses/company/{companyId}", (string companyId, DataService dataService, HttpContext context) =>
            {
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var user = dataService.GetUserById(userId);
                    if (user != null)
                    {
                        // If user cannot manage pins, only show assigned businesses within the company
                        if (!user.CanManagePins)
                        {
                            var assignedBusinesses = dataService.GetBusinessesByCompanyIdAndAssignedUserId(companyId, user.Id);
                            return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(assignedBusinesses));
                        }
                        
                        // If user is not admin, check if they belong to this company
                        if (user.Role != "Admin" && user.CompanyId != companyId)
                        {
                            return Results.Forbid();
                        }
                    }
                }

                var businesses = dataService.GetBusinessesByCompanyId(companyId);
                return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(businesses));
            }).RequireAuthorization();

            app.MapGet("/api/businesses/{id}", (string id, DataService dataService) =>
            {
                var business = dataService.GetBusinessById(id);
                if (business == null)
                    return Results.NotFound(ApiResponse<Business>.ErrorResponse("Business not found"));

                return Results.Ok(ApiResponse<Business>.SuccessResponse(business));
            }).RequireAuthorization();

            app.MapPost("/api/businesses", (Business business, DataService dataService, HttpContext context) =>
            {
                if (string.IsNullOrEmpty(business.Name) || string.IsNullOrEmpty(business.Address) || string.IsNullOrEmpty(business.CompanyId))
                    return Results.BadRequest(ApiResponse<Business>.ErrorResponse("Name, Address, and CompanyId are required"));

                // Ensure Notes is always a non-null array
                if (business.Notes == null)
                    business.Notes = new List<string>();

                // Verify company exists
                var company = dataService.GetCompanyById(business.CompanyId);
                if (company == null)
                    return Results.BadRequest(ApiResponse<Business>.ErrorResponse("Company not found"));

                // Check user permissions
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var user = dataService.GetUserById(userId);
                    if (user != null && user.Role != "Admin" && user.CompanyId != business.CompanyId)
                    {
                        return Results.Forbid();
                    }
                }

                var createdBusiness = dataService.CreateBusiness(business);
                return Results.Created($"/api/businesses/{createdBusiness.Id}", ApiResponse<Business>.SuccessResponse(createdBusiness));
            }).RequireAuthorization();

            app.MapPut("/api/businesses/{id}", (string id, Business business, DataService dataService, HttpContext context) =>
            {
                // Ensure Notes is always a non-null array
                if (business.Notes == null)
                    business.Notes = new List<string>();

                // Check user permissions
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var user = dataService.GetUserById(userId);
                    if (user != null && user.Role != "Admin" && user.CompanyId != business.CompanyId)
                    {
                        return Results.Forbid();
                    }
                }

                var updatedBusiness = dataService.UpdateBusiness(id, business);
                if (updatedBusiness == null)
                    return Results.NotFound(ApiResponse<Business>.ErrorResponse("Business not found"));

                return Results.Ok(ApiResponse<Business>.SuccessResponse(updatedBusiness));
            }).RequireAuthorization();

            app.MapDelete("/api/businesses/{id}", (string id, DataService dataService) =>
            {
                var success = dataService.DeleteBusiness(id);
                if (!success)
                    return Results.NotFound(ApiResponse<object>.ErrorResponse("Business not found"));

                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            }).RequireAuthorization();

            // Business assignment endpoints
            app.MapGet("/api/businesses/assigned/{userId}", (string userId, DataService dataService) =>
            {
                var businesses = dataService.GetBusinessesByAssignedUserId(userId);
                return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(businesses));
            }).RequireAuthorization();

            app.MapGet("/api/businesses/company/{companyId}/assigned/{userId}", (string companyId, string userId, DataService dataService) =>
            {
                var businesses = dataService.GetBusinessesByCompanyIdAndAssignedUserId(companyId, userId);
                return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(businesses));
            }).RequireAuthorization();

            app.MapPut("/api/businesses/{id}/assign", (string id, string userId, DataService dataService, HttpContext context) =>
            {
                // Check if business exists
                var business = dataService.GetBusinessById(id);
                if (business == null)
                    return Results.NotFound(ApiResponse<Business>.ErrorResponse("Business not found"));

                // Check if user exists
                var user = dataService.GetUserById(userId);
                if (user == null)
                    return Results.NotFound(ApiResponse<Business>.ErrorResponse("User not found"));

                // Check permissions - only managers and admins can assign businesses
                var currentUserId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(currentUserId))
                {
                    var currentUser = dataService.GetUserById(currentUserId);
                    if (currentUser != null && currentUser.Role == "User")
                    {
                        return Results.Forbid();
                    }

                    // Managers can only assign businesses within their company
                    if (currentUser != null && currentUser.Role == "Manager" && currentUser.CompanyId != business.CompanyId)
                    {
                        return Results.Forbid();
                    }
                }

                // Update the business assignment
                business.AssignedUserId = userId;
                business.UpdatedAt = DateTime.UtcNow;

                var updatedBusiness = dataService.UpdateBusiness(id, business);
                return Results.Ok(ApiResponse<Business>.SuccessResponse(updatedBusiness));
            }).RequireAuthorization();

            app.MapPut("/api/businesses/{id}/unassign", (string id, DataService dataService, HttpContext context) =>
            {
                // Check if business exists
                var business = dataService.GetBusinessById(id);
                if (business == null)
                    return Results.NotFound(ApiResponse<Business>.ErrorResponse("Business not found"));

                // Check permissions - only managers and admins can unassign businesses
                var currentUserEmail = context.User?.FindFirst("email")?.Value;
                if (!string.IsNullOrEmpty(currentUserEmail))
                {
                    var currentUser = dataService.GetUserByEmail(currentUserEmail);
                    if (currentUser != null && currentUser.Role == "User")
                    {
                        return Results.Forbid();
                    }

                    // Managers can only unassign businesses within their company
                    if (currentUser != null && currentUser.Role == "Manager" && currentUser.CompanyId != business.CompanyId)
                    {
                        return Results.Forbid();
                    }
                }

                // Remove the business assignment
                business.AssignedUserId = null;
                business.UpdatedAt = DateTime.UtcNow;

                var updatedBusiness = dataService.UpdateBusiness(id, business);
                return Results.Ok(ApiResponse<Business>.SuccessResponse(updatedBusiness));
            }).RequireAuthorization();

            // Start the server
            var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
            
            // Get the local IP address dynamically
            var localIp = GetLocalIPAddress();
            
            Console.WriteLine($"Canvassing API server starting on port {port}");
            Console.WriteLine($"Health check: http://localhost:{port}/api/health");
            Console.WriteLine($"Network access: http://{localIp}:{port}/api");
            
            app.Run($"http://0.0.0.0:{port}");
        }
        
        private static string GetLocalIPAddress()
        {
            try
            {
                // Get all network interfaces
                var networkInterfaces = System.Net.NetworkInformation.NetworkInterface.GetAllNetworkInterfaces();
                
                // Filter for active, non-loopback interfaces
                var activeInterfaces = networkInterfaces
                    .Where(ni => ni.OperationalStatus == System.Net.NetworkInformation.OperationalStatus.Up &&
                                 ni.NetworkInterfaceType != System.Net.NetworkInformation.NetworkInterfaceType.Loopback)
                    .ToList();

                // First, try to find an internal IP address
                foreach (var ni in activeInterfaces)
                {
                    var properties = ni.GetIPProperties();
                    var ipv4Addresses = properties.UnicastAddresses
                        .Where(addr => addr.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                        .Select(addr => addr.Address)
                        .ToList();

                    foreach (var ip in ipv4Addresses)
                    {
                        var ipString = ip.ToString();
                        
                        // Return the first private IP we find
                        if (IsPrivateIP(ip))
                            return ipString;
                    }
                }

                // If no internal IP found, try to find an external/public IP address
                foreach (var ni in activeInterfaces)
                {
                    var properties = ni.GetIPProperties();
                    var ipv4Addresses = properties.UnicastAddresses
                        .Where(addr => addr.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                        .Select(addr => addr.Address)
                        .ToList();

                    foreach (var ip in ipv4Addresses)
                    {
                        var ipString = ip.ToString();
                        
                        // Skip private IP ranges
                        if (IsPrivateIP(ip))
                            continue;
                            
                        // This is likely a public/external IP
                        return ipString;
                    }
                }

                

                // Fallback to localhost if no suitable IP found
                return "localhost";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting local IP address: {ex.Message}");
                // Fallback to localhost if any error occurs
                return "localhost";
            }
        }

        private static bool IsPrivateIP(System.Net.IPAddress ip)
        {
            var bytes = ip.GetAddressBytes();
            
            // Private IP ranges:
            // 10.0.0.0 - 10.255.255.255
            // 172.16.0.0 - 172.31.255.255
            // 192.168.0.0 - 192.168.255.255
            // 127.0.0.0 - 127.255.255.255 (loopback)
            
            return (bytes[0] == 10) ||
                   (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                   (bytes[0] == 192 && bytes[1] == 168) ||
                   (bytes[0] == 127);
        }
    }
} 