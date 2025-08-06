# Navigation Features

## Hamburger Menu & Sidebar

The app now includes a hamburger menu in the top-left corner of the navigation bar that provides access to a customizable sidebar.

### Features

1. **Hamburger Menu Button**
   - Always visible as the leftmost item in the bottom tab navigation bar
   - Opens/closes the sidebar when tapped

2. **Sidebar Navigation Management**
   - Shows all available navigation items for the user's role
   - Allows navigation to any page by tapping on items (even hidden ones)
   - Allows users to show/hide individual navigation items
   - Enables reordering of navigation items
   - Role-based access control (Admin/Manager/User)

3. **Dynamic Tab Bar**
   - Only shows navigation items that are visible and accessible to the user
   - Updates automatically when items are toggled in the sidebar
   - Maintains proper ordering based on user preferences

### Navigation Items

The following navigation items are available:

- **Business List** - Available to all users
- **Map** - Available to all users  
- **Analytics** - Available to Managers and Admins
- **Pending Approvals** - Available to Managers and Admins
- **Settings** - Available to all users

### Usage

1. **Opening the Sidebar**: Tap the hamburger menu icon (☰) in the bottom tab bar
2. **Navigating to Pages**: Tap on any navigation item in the sidebar to navigate to that page
3. **Toggling Item Visibility**: Use the switch next to each navigation item in the sidebar
4. **Reordering Items**: Use the up/down arrow buttons below each item to change the order
5. **Closing the Sidebar**: Tap the X button or tap outside the sidebar

### Technical Implementation

- **NavigationContext**: Manages sidebar state and navigation item preferences
- **CustomTabNavigator**: Replaces the original AppNavigator with hamburger menu integration
- **NavigationSidebar**: Handles the sidebar UI and interaction logic
- **Role-based Access**: Items are filtered based on user role and visibility settings

### State Management

The navigation state is managed through React Context and includes:
- Sidebar open/closed state
- Navigation item visibility preferences
- Navigation item ordering
- Role-based filtering

All changes are applied immediately and persist for the current session. 