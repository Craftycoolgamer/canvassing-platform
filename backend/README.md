# Canvassing Backend (C#)

A C# console application that provides a REST API for the canvassing platform with comprehensive JWT authentication, authorization, and user management.

## Features

- **JWT Authentication**: Secure login/register system with username or email login
- **Role-Based Authorization**: Admin, Manager, and User permission levels with granular access control
- **User Management**: Complete user lifecycle management with role assignment and company assignment
- **Pin Management Permissions**: Fine-grained control over who can add/edit/delete business pins
- **Company-Based Access Control**: Users restricted to their assigned company unless admin
- **Companies Management**: CRUD operations for companies with customizable pin icons and colors
- **Businesses Management**: CRUD operations for businesses with location data and status tracking
- **Company Filtering**: Get businesses filtered by company ID for efficient data loading
- **JWT Token Management**: Secure JWT tokens with automatic refresh capabilities
- **Sample Data**: Pre-loaded with sample companies, businesses, and users for testing
- **RESTful API**: Full REST API with proper HTTP status codes and JSON responses
- **CORS Support**: Configured to allow cross-origin requests from the React Native app
- **Dynamic IP Detection**: Automatically detects and displays the server's network IP address

## User Roles & Permissions

### Admin Role
- **Full System Access**: Can manage all companies, businesses, and users
- **User Management**: Can view and manage all user accounts and managers
- **Data Operations**: Create, read, update, delete any data in the system
- **System Configuration**: Complete administrative control
- **Analytics Access**: Full analytics across all companies
- **Pin Management**: Can manage all business pins
- **Company Assignment**: Can assign users to any company

### Manager Role
- **Company-Specific Access**: Limited to assigned company data
- **Business Management**: Can manage businesses within their assigned company
- **Team Operations**: Oversee company-specific canvassing operations
- **Limited Scope**: Cannot access other companies' data or manage users
- **Analytics Access**: Company-specific analytics only
- **Pin Management**: Can manage pins if permission granted
- **User Management**: Cannot manage users

### User Role
- **Basic Access**: View and update assigned company data
- **Business Operations**: Read/write access to company businesses (with pin permissions)
- **Data Access**: Restricted to company-specific information
- **No Administrative Functions**: Cannot manage users or system settings
- **Pin Management**: Can manage pins if permission granted
- **Status/Notes Only**: Can modify business status and notes even without pin permissions

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

The server will start on `http://localhost:3000` by default and automatically detect the network IP address.

## Dynamic IP Detection

The backend automatically detects and displays the server's network IP address on startup:

```
Canvassing API server starting on port 3000
Health check: http://localhost:3000/api/health
Network access: http://192.168.1.100:3000/api
```

## JWT Configuration

The JWT settings are configured in `appsettings.json`:

```json
{
  "Jwt": {
    "SecretKey": "your-super-secret-key-with-at-least-32-characters",
    "Issuer": "CanvassingAPI",
    "Audience": "CanvassingApp",
    "TokenExpirationHours": 24,
    "RefreshTokenExpirationDays": 7
  }
}
```

*** Production Security**: Change the secret key for production use!

## API Endpoints

### Public Endpoints (No Authentication Required)
- `GET /api/health` - Check if the API is running
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/register` - User registration with JWT tokens
- `POST /api/auth/refresh` - Refresh JWT access token
- `POST /api/auth/logout` - User logout and token revocation

### Protected Endpoints (Require JWT Authentication)
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get a specific user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/{id}` - Update a user
- `DELETE /api/users/{id}` - Delete a user

#### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/{id}` - Get a specific company
- `POST /api/companies` - Create a new company
- `PUT /api/companies/{id}` - Update a company
- `DELETE /api/companies/{id}` - Delete a company

#### Businesses
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

## JWT Authentication Flow

### Login Process
1. **Client Request**: Send email/username and password to `/api/auth/login`
2. **Server Validation**: Verify credentials against stored user data (tries email first, then username)
3. **JWT Generation**: Create signed JWT access token and refresh token
4. **Response**: Return JWT tokens and user information
5. **Client Storage**: Store tokens securely in AsyncStorage

### Token Management
- **Access Tokens**: Short-lived JWT tokens (24 hours) for API access
- **Refresh Tokens**: Long-lived tokens (7 days) for token renewal
- **Token Storage**: In-memory storage with automatic cleanup
- **Token Revocation**: Immediate invalidation on logout

### Security Features
- **JWT Signing**: HMAC SHA256 signature verification
- **Token Validation**: Server-side JWT verification with claims
- **Session Management**: Automatic token expiration handling
- **Secure Logout**: Complete token revocation on logout
- **Role-Based Access**: JWT claims contain user permissions
- **Company-Based Restrictions**: Non-admin users restricted to their assigned company

## Sample Data

The application comes pre-loaded with sample data:

**Users:**
- **Admin User**:
  - Email: `admin@canvassing.com` or Username: `admin`
  - Password: `admin123`
  - Role: Admin
  - Access: Full system access
  - Pin Management: Enabled

- **Manager User**:
  - Email: `manager@canvassing.com` or Username: `manager`
  - Password: `admin123`
  - Role: Manager
  - Company: Sample Company
  - Access: Company-specific access
  - Pin Management: Enabled

- **Regular User**:
  - Email: `user@canvassing.com` or Username: `user`
  - Password: `admin123`
  - Role: User
  - Company: Sample Company
  - Access: Basic user access
  - Pin Management: Disabled

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
- **JWT Settings**: Configurable in `appsettings.json`
- **Password Security**: SHA256 hashing (upgrade to bcrypt for production)
- **Dynamic IP**: Automatically detects network IP address
- **Company Restrictions**: Non-admin users automatically restricted to assigned company

## Development

The application uses:
- **ASP.NET Core Minimal APIs** for the HTTP server
- **JWT Authentication** with proper token validation
- **In-memory storage** using ConcurrentDictionary for thread safety
- **Newtonsoft.Json** for JSON serialization
- **Data annotations** for model validation
- **SHA256** for password hashing
- **Role-based authorization** with JWT claims
- **Dynamic IP detection** for network connectivity
- **Company-based access control** for business operations

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
│   ├── AuthService.cs
│   └── JwtService.cs
├── Middleware/
│   └── JwtMiddleware.cs
├── appsettings.json
├── Program.cs
├── CanvassingBackend.csproj
└── README.md
```

## Testing

You can test the API using curl or any HTTP client:

```bash
# Health check
curl http://localhost:3000/api/health

# Login with email (get JWT token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@canvassing.com","password":"admin123"}'

# Login with username (get JWT token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin123"}'

# Use JWT token for protected endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/companies

# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","username":"newuser","firstName":"New","lastName":"User","password":"password123"}'

# Get all companies (requires JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/companies

# Get all businesses (requires JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/businesses

# Get businesses for a specific company (requires JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/businesses/company/sample-company-1

# Get all users (requires JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/users

# Create new user (requires JWT)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","firstName":"Test","lastName":"User","password":"password123","role":"User","companyId":"sample-company-1","canManagePins":false}'
```

## Security Considerations

### JWT Security 
- **Secret Key**: Strong, unique secret key (32+ characters)
- **Token Expiration**: 24-hour access tokens, 7-day refresh tokens
- **Signature Validation**: HMAC SHA256 signature verification
- **Claims Validation**: Proper issuer, audience, and lifetime validation
- **Token Revocation**: Immediate invalidation on logout

### Current Implementation 
- **JWT Authentication**: Proper JWT implementation
- **Password Hashing**: SHA256 (should upgrade to bcrypt for production)
- **Token Security**: Secure JWT tokens with proper validation
- **In-Memory Storage**: Data stored in memory (should use database)
- **CORS**: Open configuration for development
- **Company Restrictions**: Non-admin users restricted to assigned company
- **Pin Management**: Fine-grained control over business operations

### Production Recommendations
1. **JWT Implementation**: Implemented proper JWT
2. **Database Integration**: Use SQL Server or PostgreSQL
3. **Password Security**: Implement bcrypt for password hashing
4. **HTTPS**: Use SSL/TLS for all communications
5. **Rate Limiting**: Implement API rate limiting
6. **Input Validation**: Enhanced input validation
7. **Audit Logging**: Track all authentication events
8. **Session Management**: Proper JWT session management
9. **CORS Configuration**: Restrict cross-origin requests
10. **Environment Variables**: Secure configuration management

## Future Enhancements

- [x] JWT token implementation 
- [x] Role-based endpoint protection 
- [x] User management system
- [x] Company-based access restrictions
- [x] Pin management permissions
- [x] Username/email login
- [ ] Database integration (SQL Server/PostgreSQL)
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Audit logging system
- [ ] Rate limiting implementation
- [ ] Advanced security features 