# Canvassing Backend (C#)

A C# console application that provides a REST API for the canvassing platform with comprehensive authentication and authorization.

## Features

- **User Authentication**: Secure login/register system with token-based authentication
- **Role-Based Authorization**: Admin, Manager, and User permission levels
- **Companies Management**: CRUD operations for companies with customizable pin icons and colors
- **Businesses Management**: CRUD operations for businesses with location data and status tracking
- **Company Filtering**: Get businesses filtered by company ID for efficient data loading
- **User Management**: Complete user lifecycle management with role assignment
- **Token Management**: Secure token system with refresh capabilities
- **Sample Data**: Pre-loaded with sample companies, businesses, and users for testing
- **RESTful API**: Full REST API with proper HTTP status codes and JSON responses
- **CORS Support**: Configured to allow cross-origin requests from the React Native app

## User Roles & Permissions

### Admin Role
- **Full System Access**: Can manage all companies, businesses, and users
- **User Management**: Can view and manage all user accounts
- **Data Operations**: Create, read, update, delete any data in the system
- **System Configuration**: Complete administrative control

### Manager Role
- **Company-Specific Access**: Limited to assigned company data
- **Business Management**: Can manage businesses within their assigned company
- **Team Operations**: Oversee company-specific canvassing operations
- **Limited Scope**: Cannot access other companies' data or manage users

### User Role
- **Basic Access**: View and update assigned company data
- **Business Operations**: Read/write access to company businesses
- **Data Access**: Restricted to company-specific information
- **No Administrative Functions**: Cannot manage users or system settings

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

### Authentication
- `POST /api/auth/login` - User login with email and password
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/logout` - User logout and token revocation

### Users
- `GET /api/users` - Get all users (Admin access recommended)
- `GET /api/users/{id}` - Get a specific user by ID

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

## Authentication Flow

### Login Process
1. **Client Request**: Send email and password to `/api/auth/login`
2. **Server Validation**: Verify credentials against stored user data
3. **Token Generation**: Create access token and refresh token
4. **Response**: Return tokens and user information
5. **Client Storage**: Store tokens securely in AsyncStorage

### Token Management
- **Access Tokens**: Short-lived tokens (24 hours) for API access
- **Refresh Tokens**: Long-lived tokens (7 days) for token renewal
- **Token Storage**: In-memory storage with automatic cleanup
- **Token Revocation**: Immediate invalidation on logout

### Security Features
- **Password Hashing**: SHA256 hashing for password security
- **Token Validation**: Server-side token verification
- **Session Management**: Automatic token expiration handling
- **Secure Logout**: Complete token revocation on logout

## Sample Data

The application comes pre-loaded with sample data:

**Users:**
- **Admin User**:
  - Email: `admin@canvassing.com`
  - Password: `admin123`
  - Role: Admin
  - Access: Full system access

- **Manager User**:
  - Email: `manager@canvassing.com`
  - Password: `admin123`
  - Role: Manager
  - Company: Sample Company
  - Access: Company-specific access

- **Regular User**:
  - Email: `user@canvassing.com`
  - Password: `admin123`
  - Role: User
  - Company: Sample Company
  - Access: Basic user access

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
- **Token Expiration**: Configurable token lifetimes
- **Password Security**: SHA256 hashing (upgrade to bcrypt for production)

## Development

The application uses:
- **ASP.NET Core Minimal APIs** for the HTTP server
- **In-memory storage** using ConcurrentDictionary for thread safety
- **Newtonsoft.Json** for JSON serialization
- **Data annotations** for model validation
- **SHA256** for password hashing
- **Token-based authentication** with refresh capabilities

## Project Structure

```
backend/
├── Models/
│   ├── Company.cs
│   ├── Business.cs
│   ├── User.cs
│   ├── AuthModels.cs
│   └── ApiResponse.cs
├── Services/
│   ├── DataService.cs
│   └── AuthService.cs
├── Program.cs
├── CanvassingBackend.csproj
└── README.md
```

## Testing

You can test the API using curl or any HTTP client:

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@canvassing.com","password":"admin123"}'

# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","username":"newuser","firstName":"New","lastName":"User","password":"password123"}'

# Get all companies
curl http://localhost:3000/api/companies

# Get all businesses
curl http://localhost:3000/api/businesses

# Get businesses for a specific company
curl http://localhost:3000/api/businesses/company/sample-company-1

# Get all users
curl http://localhost:3000/api/users
```

## Security Considerations

### Current Implementation
- **Password Hashing**: SHA256 (should upgrade to bcrypt for production)
- **Token Security**: Simple base64 tokens (should upgrade to JWT)
- **In-Memory Storage**: Data stored in memory (should use database)
- **CORS**: Open configuration for development

### Production Recommendations
1. **JWT Implementation**: Replace simple tokens with proper JWT
2. **Database Integration**: Use SQL Server or PostgreSQL
3. **Password Security**: Implement bcrypt for password hashing
4. **HTTPS**: Use SSL/TLS for all communications
5. **Rate Limiting**: Implement API rate limiting
6. **Input Validation**: Enhanced input validation
7. **Audit Logging**: Track all authentication events
8. **Session Management**: Proper session tracking
9. **CORS Configuration**: Restrict cross-origin requests
10. **Environment Variables**: Secure configuration management

## Future Enhancements

- [ ] JWT token implementation
- [ ] Database integration (SQL Server/PostgreSQL)
- [ ] Role-based endpoint protection
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Audit logging system
- [ ] Rate limiting implementation
- [ ] Advanced security features 