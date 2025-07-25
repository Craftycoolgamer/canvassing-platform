# SignalR Integration

This document describes the SignalR integration that has been implemented to replace REST API calls with real-time communication.

## Overview

The application now uses SignalR for real-time communication between the frontend and backend, providing:

- Real-time updates when data changes
- Automatic reconnection handling
- Group-based notifications (company-specific, admin-only)
- Fallback to local storage when offline

## Backend Changes

### SignalR Hub (`backend/Hubs/DataHub.cs`)

The `DataHub` class handles all real-time communication:

- **Business Operations**: Create, update, delete, assign/unassign businesses
- **Company Operations**: Create, update, delete companies
- **User Operations**: Create, update, delete users
- **Group Management**: Join/leave company groups and admin groups
- **Data Retrieval**: Get businesses, companies, and users

### Program.cs Updates

- Added SignalR service registration
- Mapped the DataHub to `/datahub` endpoint
- Kept all existing REST API endpoints for backward compatibility

## Frontend Changes

### SignalR Service (`src/services/signalRService.ts`)

The `SignalRService` class provides:

- **Connection Management**: Connect, disconnect, automatic reconnection
- **Event Handling**: Listen for real-time updates
- **Group Management**: Join/leave company and admin groups
- **Data Operations**: All CRUD operations via SignalR
- **Error Handling**: Graceful fallback and error reporting

### DataManager Updates (`src/services/DataManager.ts`)

- Replaced all API calls with SignalR calls
- Added real-time event listeners for automatic data updates
- Maintained local storage for offline functionality
- Added SignalR cleanup on logout

### AuthContext Updates (`src/contexts/AuthContext.tsx`)

- Initialize SignalR connection on login/register
- Join appropriate groups based on user role and company
- Clean up SignalR connection on logout

## Real-time Features

### Automatic Updates

When any user makes changes, all connected clients receive real-time updates:

- **Business Changes**: All users in the same company see updates immediately
- **Company Changes**: All users see company updates
- **User Changes**: All users see user updates
- **Admin Updates**: Admins receive updates for all companies

### Group-based Notifications

- **Company Groups**: Users only receive updates for their company
- **Admin Group**: Admins receive updates for all companies
- **Automatic Group Management**: Users are automatically added to appropriate groups

### Connection Management

- **Automatic Reconnection**: Handles network interruptions
- **Exponential Backoff**: Smart retry strategy
- **Connection Status**: Visual indicator of connection state
- **Offline Support**: Falls back to local storage when disconnected

## Usage

### For Developers

1. **Making Changes**: Use the DataManager methods as before - they now use SignalR internally
2. **Real-time Updates**: Data updates automatically without manual refresh
3. **Connection Status**: Use the `SignalRStatus` component to show connection state

### For Users

- **No Changes Required**: The app works the same way but with real-time updates
- **Connection Indicator**: The SignalR status shows connection state
- **Offline Support**: App continues to work with cached data when offline

## Configuration

### Backend

The SignalR hub is automatically configured when the backend starts. No additional configuration is required.

### Frontend

The SignalR service automatically connects when users log in. The connection URL is derived from the API base URL.

## Troubleshooting

### Connection Issues

1. Check the SignalR status indicator
2. Verify the backend is running
3. Check network connectivity
4. Review console logs for connection errors

### Data Sync Issues

1. The app automatically falls back to local storage
2. Manual refresh is available in the UI
3. Check SignalR connection status

## Benefits

1. **Real-time Updates**: No need to manually refresh data
2. **Better UX**: Immediate feedback on changes
3. **Reduced Server Load**: Fewer polling requests
4. **Offline Support**: App works with cached data
5. **Scalable**: SignalR handles multiple concurrent connections efficiently

## Future Enhancements

- Typing indicators for collaborative features
- Presence indicators (who's online)
- Real-time notifications
- Conflict resolution for concurrent edits 