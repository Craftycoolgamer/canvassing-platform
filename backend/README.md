# Canvassing Backend (C#)

A C# console application that provides a REST API for the canvassing platform.

## Features

- **Companies Management**: CRUD operations for companies with customizable pin icons and colors
- **Businesses Management**: CRUD operations for businesses with location data and status tracking
- **Company Filtering**: Get businesses filtered by company ID for efficient data loading
- **Sample Data**: Pre-loaded with sample companies and businesses for testing
- **RESTful API**: Full REST API with proper HTTP status codes and JSON responses
- **CORS Support**: Configured to allow cross-origin requests from the React Native app

## Prerequisites

- .NET 8.0 SDK or later
- Visual Studio 2022, VS Code, or any .NET-compatible IDE

## Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Restore dependencies**:
   ```bash
   dotnet restore
   ```

3. **Build the project**:
   ```bash
   dotnet build
   ```

4. **Run the application**:
   ```bash
   dotnet run
   ```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/{id}` - Get a specific company
- `POST /api/companies` - Create a new company
- `PUT /api/companies/{id}` - Update a company
- `DELETE /api/companies/{id}` - Delete a company

### Businesses
- `GET /api/businesses` - Get all businesses
- `GET /api/businesses/company/{companyId}` - Get businesses by company ID
- `GET /api/businesses/{id}` - Get a specific business
- `POST /api/businesses` - Create a new business
- `PUT /api/businesses/{id}` - Update a business
- `DELETE /api/businesses/{id}` - Delete a business

## API Response Format

All API endpoints return responses in the following format:

```json
{
  "success": true,
  "data": [...],
  "error": null,
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

For error responses:
```json
{
  "success": false,
  "data": null,
  "error": "Error message",
  "message": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Sample Data

The application comes pre-loaded with sample data:

**Companies:**
- Sample Company (5 businesses)
- Retail Chain (3 businesses)
- Restaurant Group (3 businesses)
- Tech Startups (3 businesses)
- Healthcare Providers (3 businesses)

**Business Statuses:**
- `pending` - Orange
- `contacted` - Blue
- `completed` - Green
- `not-interested` - Red

## Configuration

- **Port**: Set the `PORT` environment variable to change the default port (3000)
- **CORS**: Configured to allow all origins for development

## Development

The application uses:
- **ASP.NET Core Minimal APIs** for the HTTP server
- **In-memory storage** using ConcurrentDictionary for thread safety
- **Newtonsoft.Json** for JSON serialization
- **Data annotations** for model validation

## Project Structure

```
backend/
├── Models/
│   ├── Company.cs
│   ├── Business.cs
│   └── ApiResponse.cs
├── Services/
│   └── DataService.cs
├── Program.cs
├── CanvassingBackend.csproj
└── README.md
```

## Testing

You can test the API using curl or any HTTP client:

```bash
# Health check
curl http://localhost:3000/api/health

# Get all companies
curl http://localhost:3000/api/companies

# Get all businesses
curl http://localhost:3000/api/businesses

# Get businesses for a specific company
curl http://localhost:3000/api/businesses/company/sample-company-1

# Get a specific business
curl http://localhost:3000/api/businesses/sample-business-1
``` 