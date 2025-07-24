# Centralized Data Management System

This project now uses a centralized data management system that eliminates code duplication and provides a single source of truth for all data operations.

## Overview

The new system consists of:

1. **DataManager** (`src/services/DataManager.ts`) - A singleton service that handles all data operations
2. **useDataManager Hook** (`src/hooks/useDataManager.ts`) - A React hook that provides easy access to the DataManager
3. **Updated Components** - Components that use the new system instead of direct API calls

## Key Benefits

- **Single Source of Truth**: All data operations go through one service
- **Automatic Caching**: Data is cached locally and synchronized with the backend
- **Observer Pattern**: Components automatically update when data changes
- **Reduced Code Duplication**: No more repeated API calls and storage operations
- **Better Error Handling**: Centralized error handling and fallback mechanisms
- **Type Safety**: Full TypeScript support with proper typing

## How It Works

### DataManager Service

The `DataManager` is a singleton class that:

- Manages all data (companies, businesses, users, selections)
- Handles API communication with automatic retry and fallback
- Caches data in AsyncStorage for offline access
- Notifies observers when data changes
- Manages user permissions and data filtering

### useDataManager Hook

The `useDataManager` hook provides:

- Reactive data access (automatically updates when data changes)
- All CRUD operations for companies, businesses, and users
- Selection management (selected company, user, manager)
- Loading states and error handling
- Filtered data access (by company, user role, etc.)

## Usage Examples

### Basic Usage in a Component

```typescript
import { useDataManager } from '../hooks/useDataManager';

export const MyComponent: React.FC = () => {
  const {
    companies,
    businesses,
    users,
    selectedCompany,
    isLoading,
    loadCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    setSelectedCompany,
  } = useDataManager();

  useEffect(() => {
    // Load data on component mount
    loadCompanies();
  }, [loadCompanies]);

  const handleCreateCompany = async () => {
    const newCompany = await createCompany({
      name: 'New Company',
      pinIcon: 'business',
      color: '#007AFF',
    });
    
    if (newCompany) {
      console.log('Company created successfully');
    }
  };

  return (
    <View>
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        companies.map(company => (
          <Text key={company.id}>{company.name}</Text>
        ))
      )}
    </View>
  );
};
```

### Advanced Usage with Filtering

```typescript
export const BusinessList: React.FC = () => {
  const {
    businesses,
    companies,
    selectedCompany,
    getBusinessesByCompany,
    getBusinessesByAssignedUser,
    loadBusinesses,
  } = useDataManager();

  const { user: currentUser } = useAuth();
  const canManagePins = currentUser?.canManagePins || false;

  useEffect(() => {
    // Load businesses based on user permissions
    loadBusinesses();
  }, [loadBusinesses]);

  // Get filtered businesses
  const displayBusinesses = canManagePins && selectedCompany
    ? getBusinessesByCompany(selectedCompany.id)
    : canManagePins
    ? businesses
    : getBusinessesByAssignedUser(currentUser?.id || '');

  return (
    <FlatList
      data={displayBusinesses}
      renderItem={({ item }) => <BusinessCard business={item} />}
    />
  );
};
```

### Selection Management

```typescript
export const CompanySelector: React.FC = () => {
  const {
    companies,
    selectedCompany,
    setSelectedCompany,
  } = useDataManager();

  const handleCompanySelect = async (company: Company) => {
    await setSelectedCompany(company);
    // All components using selectedCompany will automatically update
  };

  const handleClearSelection = async () => {
    await setSelectedCompany(null);
  };

  return (
    <View>
      {companies.map(company => (
        <TouchableOpacity
          key={company.id}
          onPress={() => handleCompanySelect(company)}
          style={[
            styles.companyItem,
            selectedCompany?.id === company.id && styles.selected
          ]}
        >
          <Text>{company.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

## Data Operations

### Companies

```typescript
const {
  companies,
  loadCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} = useDataManager();

// Load companies (with caching)
await loadCompanies();

// Force refresh from API
await loadCompanies(true);

// Create new company
const newCompany = await createCompany({
  name: 'New Company',
  pinIcon: 'business',
  color: '#007AFF',
});

// Update company
const updatedCompany = await updateCompany(companyId, {
  name: 'Updated Name',
});

// Delete company
const success = await deleteCompany(companyId);
```

### Businesses

```typescript
const {
  businesses,
  loadBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  assignBusinessToUser,
  unassignBusinessFromUser,
  getBusinessesByCompany,
  getBusinessesByAssignedUser,
} = useDataManager();

// Load businesses (respects user permissions)
await loadBusinesses();

// Create business
const newBusiness = await createBusiness({
  name: 'New Business',
  address: '123 Main St',
  companyId: selectedCompany?.id,
  // ... other fields
});

// Assign business to user
await assignBusinessToUser(businessId, userId);

// Get businesses by company
const companyBusinesses = getBusinessesByCompany(companyId);
```

### Users

```typescript
const {
  users,
  loadUsers,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUsersByCompany,
} = useDataManager();

// Load users
await loadUsers();

// Create user
const newUser = await createUser({
  email: 'user@example.com',
  username: 'username',
  firstName: 'John',
  lastName: 'Doe',
  password: 'password',
  role: 'User',
  companyId: selectedCompany?.id,
});

// Get users by role
const managers = getUsersByRole('Manager');
const regularUsers = getUsersByRole('User');
```

## Migration Guide

### From Direct API Calls

**Before:**
```typescript
const [companies, setCompanies] = useState<Company[]>([]);

const loadCompanies = async () => {
  try {
    const response = await apiService.getCompanies();
    if (response.success && response.data) {
      setCompanies(response.data);
    }
  } catch (error) {
    console.error('Error loading companies:', error);
  }
};
```

**After:**
```typescript
const { companies, loadCompanies } = useDataManager();

useEffect(() => {
  loadCompanies();
}, [loadCompanies]);
```

### From Direct AsyncStorage

**Before:**
```typescript
const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

const handleCompanySelect = async (company: Company) => {
  await AsyncStorage.setItem('selectedCompanyId', company.id);
  setSelectedCompany(company);
};
```

**After:**
```typescript
const { selectedCompany, setSelectedCompany } = useDataManager();

const handleCompanySelect = async (company: Company) => {
  await setSelectedCompany(company);
};
```

## Best Practices

1. **Use the Hook**: Always use `useDataManager` instead of direct API calls
2. **Load Data Once**: Use `useEffect` to load data on component mount
3. **Force Refresh When Needed**: Use `loadData(true)` to force refresh from API
4. **Handle Loading States**: Use the `isLoading` state for better UX
5. **Subscribe to Changes**: Components automatically update when data changes
6. **Clear Data on Logout**: The AuthContext automatically clears all data on logout

## Error Handling

The DataManager handles errors gracefully:

- API failures fall back to cached data
- Network errors are logged and handled
- Invalid data is filtered out
- Components receive clean, valid data

## Performance

- Data is cached locally for fast access
- API calls are minimized through intelligent caching
- Components only re-render when their specific data changes
- Large datasets are handled efficiently

## Type Safety

All operations are fully typed with TypeScript:

```typescript
// All data is properly typed
const companies: Company[] = companies;
const selectedCompany: Company | null = selectedCompany;

// All operations are typed
const createCompany = (data: CompanyFormData) => Promise<Company | null>;
const updateCompany = (id: string, data: Partial<CompanyFormData>) => Promise<Company | null>;
```

This centralized system significantly reduces code duplication and provides a much more maintainable and reliable data management solution. 