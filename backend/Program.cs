using CanvassingBackend.Models;
using CanvassingBackend.Services;
using CanvassingBackend.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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

            app.MapPost("/api/users", (User user, DataService dataService) =>
            {
                if (string.IsNullOrEmpty(user.Email) || string.IsNullOrEmpty(user.Username) || 
                    string.IsNullOrEmpty(user.FirstName) || string.IsNullOrEmpty(user.LastName))
                    return Results.BadRequest(ApiResponse<User>.ErrorResponse("Email, Username, FirstName, and LastName are required"));

                // Check if user with email already exists
                var existingUser = dataService.GetUserByEmail(user.Email);
                if (existingUser != null)
                    return Results.BadRequest(ApiResponse<User>.ErrorResponse("User with this email already exists"));

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
            app.MapGet("/api/businesses", (DataService dataService) =>
            {
                var businesses = dataService.GetAllBusinesses();
                return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(businesses));
            }).RequireAuthorization();

            app.MapGet("/api/businesses/company/{companyId}", (string companyId, DataService dataService) =>
            {
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

            app.MapPost("/api/businesses", (Business business, DataService dataService) =>
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

                var createdBusiness = dataService.CreateBusiness(business);
                return Results.Created($"/api/businesses/{createdBusiness.Id}", ApiResponse<Business>.SuccessResponse(createdBusiness));
            }).RequireAuthorization();

            app.MapPut("/api/businesses/{id}", (string id, Business business, DataService dataService) =>
            {
                // Ensure Notes is always a non-null array
                if (business.Notes == null)
                    business.Notes = new List<string>();

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
                // Get the host name
                var hostName = System.Net.Dns.GetHostName();
                
                // Get all IP addresses for the host
                var host = System.Net.Dns.GetHostEntry(hostName);
                
                // Find the first non-loopback IPv4 address
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        return ip.ToString();
                    }
                }
                
                // Fallback to localhost if no network IP found
                return "localhost";
            }
            catch (Exception)
            {
                // Fallback to localhost if any error occurs
                return "localhost";
            }
        }
    }
} 