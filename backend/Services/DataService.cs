using CanvassingBackend.Models;
using System.Collections.Concurrent;

namespace CanvassingBackend.Services
{
    public class DataService
    {
        private readonly ConcurrentDictionary<string, Company> _companies = new();
        private readonly ConcurrentDictionary<string, Business> _businesses = new();

        public DataService()
        {
            InitializeSampleData();
        }

        private void InitializeSampleData()
        {
            // Add sample companies
            var sampleCompanies = new List<Company>
            {
                new Company
                {
                    Id = "sample-company-1",
                    Name = "Sample Company",
                    PinIcon = "business",
                    Color = "#FF6B9D",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Company
                {
                    Id = "retail-chain-1",
                    Name = "Retail Chain",
                    PinIcon = "store",
                    Color = "#34C759",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Company
                {
                    Id = "restaurant-group-1",
                    Name = "Restaurant Group",
                    PinIcon = "restaurant",
                    Color = "#FF9500",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Company
                {
                    Id = "tech-startups-1",
                    Name = "Tech Startups",
                    PinIcon = "computer",
                    Color = "#007AFF",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Company
                {
                    Id = "healthcare-providers-1",
                    Name = "Healthcare Providers",
                    PinIcon = "local-hospital",
                    Color = "#AF52DE",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            foreach (var company in sampleCompanies)
            {
                _companies.TryAdd(company.Id, company);
            }

            // Add sample businesses
            var sampleBusinesses = new List<Business>
            {
                // Sample Company businesses
                new Business
                {
                    Id = "sample-business-1",
                    Name = "Downtown Coffee Shop",
                    Address = "123 Main St, San Francisco, CA",
                    Phone = "(555) 123-4567",
                    Email = "coffee@example.com",
                    Website = "https://example.com",
                    Notes = "Great location for meetings",
                    Latitude = 37.7749,
                    Longitude = -122.4194,
                    CompanyId = "sample-company-1",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "sample-business-2",
                    Name = "Tech Startup Office",
                    Address = "456 Market St, San Francisco, CA",
                    Phone = "(555) 987-6543",
                    Email = "contact@techstartup.com",
                    Website = "https://techstartup.com",
                    Notes = "Innovative company",
                    Latitude = 37.8044,
                    Longitude = -122.2711,
                    CompanyId = "sample-company-1",
                    Status = "contacted",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "sample-business-3",
                    Name = "Restaurant & Bar",
                    Address = "789 Mission St, San Francisco, CA",
                    Phone = "(555) 456-7890",
                    Email = "info@restaurant.com",
                    Website = "https://restaurant.com",
                    Notes = "Popular dining spot",
                    Latitude = 37.6879,
                    Longitude = -122.4702,
                    CompanyId = "sample-company-1",
                    Status = "completed",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Retail Chain businesses
                new Business
                {
                    Id = "retail-business-1",
                    Name = "Downtown Mall",
                    Address = "100 Market St, San Francisco, CA",
                    Phone = "(555) 111-2222",
                    Email = "info@downtownmall.com",
                    Website = "https://downtownmall.com",
                    Notes = "High foot traffic area",
                    Latitude = 37.8715,
                    Longitude = -122.2730,
                    CompanyId = "retail-chain-1",
                    Status = "contacted",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "retail-business-2",
                    Name = "Shopping Center",
                    Address = "200 Castro St, San Francisco, CA",
                    Phone = "(555) 333-4444",
                    Email = "contact@shoppingcenter.com",
                    Website = "https://shoppingcenter.com",
                    Notes = "Family-friendly location",
                    Latitude = 37.4419,
                    Longitude = -122.1430,
                    CompanyId = "retail-chain-1",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "retail-business-3",
                    Name = "Outlet Store",
                    Address = "300 Mission Bay Blvd, San Francisco, CA",
                    Phone = "(555) 555-6666",
                    Email = "sales@outletstore.com",
                    Website = "https://outletstore.com",
                    Notes = "Near tourist attractions",
                    Latitude = 37.3382,
                    Longitude = -121.8863,
                    CompanyId = "retail-chain-1",
                    Status = "completed",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Restaurant Group businesses
                new Business
                {
                    Id = "restaurant-business-1",
                    Name = "Fine Dining Restaurant",
                    Address = "500 Embarcadero, San Francisco, CA",
                    Phone = "(555) 777-8888",
                    Email = "reservations@finedining.com",
                    Website = "https://finedining.com",
                    Notes = "Waterfront location",
                    Latitude = 37.6391,
                    Longitude = -122.4000,
                    CompanyId = "restaurant-group-1",
                    Status = "contacted",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "restaurant-business-2",
                    Name = "Casual Bistro",
                    Address = "600 Hayes St, San Francisco, CA",
                    Phone = "(555) 999-0000",
                    Email = "hello@casualbistro.com",
                    Website = "https://casualbistro.com",
                    Notes = "Neighborhood favorite",
                    Latitude = 37.7749,
                    Longitude = -122.5107,
                    CompanyId = "restaurant-group-1",
                    Status = "not-interested",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "restaurant-business-3",
                    Name = "Food Truck Park",
                    Address = "700 SOMA St, San Francisco, CA",
                    Phone = "(555) 111-3333",
                    Email = "info@foodtruckpark.com",
                    Website = "https://foodtruckpark.com",
                    Notes = "Trendy food scene",
                    Latitude = 37.7577,
                    Longitude = -122.4376,
                    CompanyId = "restaurant-group-1",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Tech Startups businesses
                new Business
                {
                    Id = "tech-business-1",
                    Name = "AI Startup",
                    Address = "800 Mission St, San Francisco, CA",
                    Phone = "(555) 444-5555",
                    Email = "contact@aistartup.com",
                    Website = "https://aistartup.com",
                    Notes = "Cutting-edge technology",
                    Latitude = 37.8000,
                    Longitude = -122.4376,
                    CompanyId = "tech-startups-1",
                    Status = "contacted",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "tech-business-2",
                    Name = "FinTech Company",
                    Address = "900 Financial District, San Francisco, CA",
                    Phone = "(555) 666-7777",
                    Email = "hello@fintech.com",
                    Website = "https://fintech.com",
                    Notes = "Financial services innovation",
                    Latitude = 37.7849,
                    Longitude = -122.4194,
                    CompanyId = "tech-startups-1",
                    Status = "completed",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "tech-business-3",
                    Name = "GreenTech Solutions",
                    Address = "1000 Market St, San Francisco, CA",
                    Phone = "(555) 888-9999",
                    Email = "info@greentech.com",
                    Website = "https://greentech.com",
                    Notes = "Sustainable technology",
                    Latitude = 37.7649,
                    Longitude = -122.4294,
                    CompanyId = "tech-startups-1",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Healthcare Providers businesses
                new Business
                {
                    Id = "healthcare-business-1",
                    Name = "Medical Center",
                    Address = "1100 Castro St, San Francisco, CA",
                    Phone = "(555) 000-1111",
                    Email = "info@medicalcenter.com",
                    Website = "https://medicalcenter.com",
                    Notes = "Comprehensive healthcare",
                    Latitude = 37.7649,
                    Longitude = -122.4094,
                    CompanyId = "healthcare-providers-1",
                    Status = "contacted",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "healthcare-business-2",
                    Name = "Dental Clinic",
                    Address = "1200 Mission Bay, San Francisco, CA",
                    Phone = "(555) 222-3333",
                    Email = "appointments@dentalclinic.com",
                    Website = "https://dentalclinic.com",
                    Notes = "Modern dental care",
                    Latitude = 37.7849,
                    Longitude = -122.4394,
                    CompanyId = "healthcare-providers-1",
                    Status = "completed",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Business
                {
                    Id = "healthcare-business-3",
                    Name = "Wellness Center",
                    Address = "1300 Hayes Valley, San Francisco, CA",
                    Phone = "(555) 444-5555",
                    Email = "hello@wellnesscenter.com",
                    Website = "https://wellnesscenter.com",
                    Notes = "Holistic health services",
                    Latitude = 37.7749,
                    Longitude = -122.3994,
                    CompanyId = "healthcare-providers-1",
                    Status = "not-interested",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            foreach (var business in sampleBusinesses)
            {
                _businesses.TryAdd(business.Id, business);
            }

            Console.WriteLine($"Sample data added: {_companies.Count} companies, {_businesses.Count} businesses");
        }

        // Company methods
        public List<Company> GetAllCompanies() => _companies.Values.ToList();

        public Company? GetCompanyById(string id) => _companies.TryGetValue(id, out var company) ? company : null;

        public Company CreateCompany(Company company)
        {
            company.Id = Guid.NewGuid().ToString();
            company.CreatedAt = DateTime.UtcNow;
            company.UpdatedAt = DateTime.UtcNow;
            _companies.TryAdd(company.Id, company);
            return company;
        }

        public Company? UpdateCompany(string id, Company company)
        {
            if (!_companies.TryGetValue(id, out var existingCompany))
                return null;

            existingCompany.Name = company.Name;
            existingCompany.PinIcon = company.PinIcon;
            existingCompany.Color = company.Color;
            existingCompany.UpdatedAt = DateTime.UtcNow;
            return existingCompany;
        }

        public bool DeleteCompany(string id)
        {
            if (!_companies.TryRemove(id, out _))
                return false;

            // Remove associated businesses
            var businessesToRemove = _businesses.Values.Where(b => b.CompanyId == id).ToList();
            foreach (var business in businessesToRemove)
            {
                _businesses.TryRemove(business.Id, out _);
            }

            return true;
        }

        // Business methods
        public List<Business> GetAllBusinesses() => _businesses.Values.ToList();

        public List<Business> GetBusinessesByCompanyId(string companyId) => 
            _businesses.Values.Where(b => b.CompanyId == companyId).ToList();

        public Business? GetBusinessById(string id) => _businesses.TryGetValue(id, out var business) ? business : null;

        public Business CreateBusiness(Business business)
        {
            business.Id = Guid.NewGuid().ToString();
            business.CreatedAt = DateTime.UtcNow;
            business.UpdatedAt = DateTime.UtcNow;
            _businesses.TryAdd(business.Id, business);
            return business;
        }

        public Business? UpdateBusiness(string id, Business business)
        {
            if (!_businesses.TryGetValue(id, out var existingBusiness))
                return null;

            existingBusiness.Name = business.Name;
            existingBusiness.Address = business.Address;
            existingBusiness.Phone = business.Phone;
            existingBusiness.Email = business.Email;
            existingBusiness.Website = business.Website;
            existingBusiness.Notes = business.Notes;
            existingBusiness.Latitude = business.Latitude;
            existingBusiness.Longitude = business.Longitude;
            existingBusiness.CompanyId = business.CompanyId;
            existingBusiness.Status = business.Status;
            existingBusiness.LastContactDate = business.LastContactDate;
            existingBusiness.UpdatedAt = DateTime.UtcNow;
            return existingBusiness;
        }

        public bool DeleteBusiness(string id) => _businesses.TryRemove(id, out _);
    }
} 