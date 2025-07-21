using CanvassingBackend.Models;
using CanvassingBackend.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Http;

namespace CanvassingBackend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services
            builder.Services.AddSingleton<DataService>();
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

            // Companies endpoints
            app.MapGet("/api/companies", (DataService dataService) =>
            {
                var companies = dataService.GetAllCompanies();
                return Results.Ok(ApiResponse<List<Company>>.SuccessResponse(companies));
            });

            app.MapGet("/api/companies/{id}", (string id, DataService dataService) =>
            {
                var company = dataService.GetCompanyById(id);
                if (company == null)
                    return Results.NotFound(ApiResponse<Company>.ErrorResponse("Company not found"));

                return Results.Ok(ApiResponse<Company>.SuccessResponse(company));
            });

            app.MapPost("/api/companies", (Company company, DataService dataService) =>
            {
                if (string.IsNullOrEmpty(company.Name) || string.IsNullOrEmpty(company.PinIcon) || string.IsNullOrEmpty(company.Color))
                    return Results.BadRequest(ApiResponse<Company>.ErrorResponse("Name, PinIcon, and Color are required"));

                var createdCompany = dataService.CreateCompany(company);
                return Results.Created($"/api/companies/{createdCompany.Id}", ApiResponse<Company>.SuccessResponse(createdCompany));
            });

            app.MapPut("/api/companies/{id}", (string id, Company company, DataService dataService) =>
            {
                var updatedCompany = dataService.UpdateCompany(id, company);
                if (updatedCompany == null)
                    return Results.NotFound(ApiResponse<Company>.ErrorResponse("Company not found"));

                return Results.Ok(ApiResponse<Company>.SuccessResponse(updatedCompany));
            });

            app.MapDelete("/api/companies/{id}", (string id, DataService dataService) =>
            {
                var success = dataService.DeleteCompany(id);
                if (!success)
                    return Results.NotFound(ApiResponse<object>.ErrorResponse("Company not found"));

                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            });

            // Businesses endpoints
            app.MapGet("/api/businesses", (DataService dataService) =>
            {
                var businesses = dataService.GetAllBusinesses();
                return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(businesses));
            });

            app.MapGet("/api/businesses/company/{companyId}", (string companyId, DataService dataService) =>
            {
                var businesses = dataService.GetBusinessesByCompanyId(companyId);
                return Results.Ok(ApiResponse<List<Business>>.SuccessResponse(businesses));
            });

            app.MapGet("/api/businesses/{id}", (string id, DataService dataService) =>
            {
                var business = dataService.GetBusinessById(id);
                if (business == null)
                    return Results.NotFound(ApiResponse<Business>.ErrorResponse("Business not found"));

                return Results.Ok(ApiResponse<Business>.SuccessResponse(business));
            });

            app.MapPost("/api/businesses", (Business business, DataService dataService) =>
            {
                if (string.IsNullOrEmpty(business.Name) || string.IsNullOrEmpty(business.Address) || string.IsNullOrEmpty(business.CompanyId))
                    return Results.BadRequest(ApiResponse<Business>.ErrorResponse("Name, Address, and CompanyId are required"));

                // Verify company exists
                var company = dataService.GetCompanyById(business.CompanyId);
                if (company == null)
                    return Results.BadRequest(ApiResponse<Business>.ErrorResponse("Company not found"));

                var createdBusiness = dataService.CreateBusiness(business);
                return Results.Created($"/api/businesses/{createdBusiness.Id}", ApiResponse<Business>.SuccessResponse(createdBusiness));
            });

            app.MapPut("/api/businesses/{id}", (string id, Business business, DataService dataService) =>
            {
                var updatedBusiness = dataService.UpdateBusiness(id, business);
                if (updatedBusiness == null)
                    return Results.NotFound(ApiResponse<Business>.ErrorResponse("Business not found"));

                return Results.Ok(ApiResponse<Business>.SuccessResponse(updatedBusiness));
            });

            app.MapDelete("/api/businesses/{id}", (string id, DataService dataService) =>
            {
                var success = dataService.DeleteBusiness(id);
                if (!success)
                    return Results.NotFound(ApiResponse<object>.ErrorResponse("Business not found"));

                return Results.Ok(ApiResponse<object>.SuccessResponse((object?)null));
            });

            // Start the server
            var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
            Console.WriteLine($"Canvassing API server starting on port {port}");
            Console.WriteLine($"Health check: http://localhost:{port}/api/health");
            Console.WriteLine($"Network access: http://192.168.1.34:{port}/api");
            
            app.Run($"http://0.0.0.0:{port}");
        }
    }
} 