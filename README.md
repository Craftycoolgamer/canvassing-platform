# Canvassing Platform

A modern React Native application for managing canvassing operations with map visualization, business tracking, company management, and user authentication.

## Features

- **User Authentication**: Secure login/register system with role-based access
- **Role-Based Authorization**: Admin, Manager, and User permission levels
- **Map View**: Interactive map with business pins and clustering
- **Business List**: Searchable and filterable list of businesses
- **Settings**: User management, company selection, and logout
- **Cross-Platform**: Works on Android, iOS, and Web
- **Offline Support**: Local data storage with AsyncStorage
- **Modern UI**: Clean, intuitive interface with Material Design
- **Company Filtering**: Filter businesses by selected company
- **Real-time Updates**: Automatic refresh when company selection changes
- **Token Management**: Secure JWT-like token system with refresh capabilities

## Screens

### 1. Authentication Screens
- **Login Screen**: Email/password authentication with validation
- **Register Screen**: Complete user registration with form validation
- **Demo Accounts**: Pre-configured test accounts for different roles

### 2. Map Screen
- Interactive map with business pins
- Pin clustering for better visualization
- Tap pins to view business details
- Edit and delete businesses directly from map
- User location tracking
- Company-based business filtering
- Role-based access control

### 3. Business List Screen
- Card-based business display
- Search functionality
- Status filtering (Pending, Contacted, Completed, Not Interested)
- Add new businesses with floating action button
- Edit businesses by tapping cards
- Company-based business filtering
- Role-based permissions

### 4. Settings Screen
- User information display (name, email, role)
- Company management and selection
- Custom pin icons and colors
- Add, edit, and delete companies
- Visual icon and color picker
- Secure logout functionality
- Role-based company access

## User Roles & Permissions

### Admin Role
- **Full Access**: Can manage all companies and businesses
- **User Management**: Can view and manage all users
- **System Settings**: Complete administrative control
- **Data Operations**: Create, read, update, delete any data

### Manager Role
- **Company Access**: Limited to assigned company data
- **Business Management**: Can manage businesses within their company
- **Team Coordination**: Oversee company-specific operations
- **Limited Permissions**: Cannot access other companies' data

### User Role
- **Basic Access**: View and update assigned company data
- **Business Operations**: Read/write access to company businesses
- **Limited Scope**: Cannot manage users or system settings
- **Data Access**: Restricted to company-specific information

## Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **React Native WebView** for map functionality (OpenStreetMap)
- **Expo Location** for GPS services
- **AsyncStorage** for local data persistence
- **Context API** for authentication state management

### Backend
- **.NET 8** with ASP.NET Core Minimal APIs
- **C#** for server-side logic
- **CORS** for cross-origin requests
- **In-memory storage** using ConcurrentDictionary
- **Newtonsoft.Json** for JSON serialization
- **SHA256** password hashing
- **Token-based authentication** with refresh tokens

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- .NET 8.0 SDK

### Frontend Setup

1. Navigate to the project directory:
```bash
cd canvassing-platform
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# Android
npm run android

# iOS (requires macOS)
npm run ios

# Web
npm run web
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Build the project:
```bash
dotnet build
```

4. Start the server:
```bash
dotnet run
```

The backend will run on `http://localhost:3000`

## Configuration

### API Configuration

Update the API base URL in `src/services/api.ts` and `src/services/authService.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

For production, replace with your actual backend URL.

### Authentication Configuration

The authentication system uses:
- **Token Storage**: AsyncStorage for secure token persistence
- **Refresh Tokens**: Automatic token refresh mechanism
- **Role-Based Access**: Permission levels for different user types
- **Session Management**: Automatic logout on token expiration

### Map Configuration

The app uses OpenStreetMap via WebView, which doesn't require API keys. For production, you can:

1. Use the current OpenStreetMap implementation (free)
2. Switch to Google Maps or other map providers
3. Configure custom map tiles

## Usage

### Authentication

#### Demo Accounts
The system comes with pre-configured demo accounts:

- **Admin Account**:
  - Email: `admin@canvassing.com`
  - Password: `admin123`
  - Role: Full system access

- **Manager Account**:
  - Email: `manager@canvassing.com`
  - Password: `admin123`
  - Role: Company-specific access

- **User Account**:
  - Email: `user@canvassing.com`
  - Password: `admin123`
  - Role: Basic user access

#### Registration
1. Open the app
2. Tap "Don't have an account? Sign up"
3. Fill in all required fields
4. Submit the registration form
5. You'll be automatically logged in

#### Login
1. Enter your email and password
2. Tap "Sign In"
3. The app will validate credentials and log you in

#### Logout
1. Go to the Settings tab
2. Tap the "Logout" button
3. Confirm the logout action
4. You'll be returned to the login screen

### Adding Companies

1. Go to the Settings tab
2. Tap the "+" button
3. Enter company name
4. Select a pin icon and color
5. Save the company

### Selecting a Company

1. Go to the Settings tab
2. Tap "Select a company"
3. Choose a company from the list
4. The app will automatically filter businesses for that company

### Adding Businesses

1. Go to the Business List or Map tab
2. Tap the "+" button
3. Fill in business details:
   - Name (required)
   - Address (required)
   - Phone, email, website (optional)
   - Select company
   - Choose status
   - Add notes
4. Save the business

### Managing Businesses

- **View Details**: Tap on business cards or map pins
- **Edit**: Tap the edit button in business details
- **Delete**: Tap the delete button (with confirmation)
- **Search**: Use the search bar in the business list
- **Filter**: Use status filters to view specific businesses

### Map Features

- **Pin Clustering**: Multiple pins in the same area are grouped
- **Business Details**: Tap pins to view full business information
- **Edit/Delete**: Manage businesses directly from the map
- **User Location**: Shows your current position on the map
- **Company Filtering**: Only shows businesses for the selected company

## Data Structure

### User
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'User';
  companyId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Company
```typescript
interface Company {
  id: string;
  name: string;
  pinIcon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}
```

### Business
```typescript
interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
  latitude: number;
  longitude: number;
  companyId: string;
  status: 'pending' | 'contacted' | 'completed' | 'not-interested';
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/{id}` - Get specific user

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/{id}` - Get specific company
- `POST /api/companies` - Create new company
- `PUT /api/companies/{id}` - Update company
- `DELETE /api/companies/{id}` - Delete company

### Businesses
- `GET /api/businesses` - Get all businesses
- `GET /api/businesses/company/{companyId}` - Get businesses by company ID
- `GET /api/businesses/{id}` - Get specific business
- `POST /api/businesses` - Create new business
- `PUT /api/businesses/{id}` - Update business
- `DELETE /api/businesses/{id}` - Delete business

### Health Check
- `GET /api/health` - Check if the API is running

## Development

### Project Structure
```
canvassing-platform/
├── src/
│   ├── components/     # Reusable components
│   ├── screens/        # Screen components
│   ├── services/       # API and storage services
│   ├── contexts/       # React contexts (Auth)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── navigation/     # Navigation configuration
├── backend/            # .NET 8 API server
│   ├── Models/         # C# model classes
│   ├── Services/       # Business logic services
│   └── Program.cs      # API endpoints
├── assets/             # Static assets
└── App.tsx            # Main app component
```

### Adding New Features

1. **New Screen**: Create in `src/screens/`
2. **New Component**: Create in `src/components/`
3. **New API Endpoint**: Add to `backend/Program.cs`
4. **New Type**: Add to `src/types/index.ts`
5. **Authentication**: Use `useAuth()` hook for auth state

### Authentication Development

1. **Add Protected Routes**: Use `useAuth()` to check authentication
2. **Role-Based Access**: Check user role for feature access
3. **API Authorization**: Include auth headers in API requests
4. **Token Management**: Use `AuthService` for token operations

## Deployment

### Frontend (Expo)
1. Build for production:
```bash
expo build:android
expo build:ios
expo build:web
```

2. Deploy to app stores or web hosting

### Backend (.NET)
1. Build for production:
```bash
dotnet publish -c Release
```

2. Deploy to your preferred hosting service (Azure, AWS, etc.)
3. Update the API base URL in the frontend
4. Set up environment variables for production
5. Configure JWT secrets and database connections

## Security Considerations

### Production Security
1. **JWT Implementation**: Replace simple tokens with proper JWT
2. **Database Security**: Use encrypted database connections
3. **Password Hashing**: Implement bcrypt for password security
4. **HTTPS**: Use SSL/TLS for all communications
5. **Rate Limiting**: Implement API rate limiting
6. **Input Validation**: Validate all user inputs
7. **SQL Injection**: Use parameterized queries
8. **CORS Configuration**: Restrict cross-origin requests

### Authentication Security
1. **Token Expiration**: Implement proper token expiration
2. **Refresh Token Rotation**: Rotate refresh tokens on use
3. **Session Management**: Track active sessions
4. **Audit Logging**: Log all authentication events
5. **Account Lockout**: Implement failed login protection

## Sample Data

The backend comes pre-loaded with sample data:

**Users:**
- Admin User (admin@canvassing.com)
- Manager User (manager@canvassing.com)
- Regular User (user@canvassing.com)

**Companies:**
- Sample Company (3 businesses)
- Retail Chain (3 businesses)
- Restaurant Group (3 businesses)
- Tech Startups (3 businesses)
- Healthcare Providers (3 businesses)

**Business Statuses:**
- `pending` - Orange
- `contacted` - Blue
- `completed` - Green
- `not-interested` - Red

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## Roadmap

- [x] User authentication and authorization
- [x] Role-based access control
- [ ] Database integration (SQL Server/PostgreSQL)
- [ ] JWT implementation
- [ ] Real-time synchronization
- [ ] Advanced analytics and reporting
- [ ] Export functionality (CSV, PDF)
- [ ] Push notifications
- [ ] Offline-first architecture
- [ ] Multi-language support
- [ ] Advanced security features 