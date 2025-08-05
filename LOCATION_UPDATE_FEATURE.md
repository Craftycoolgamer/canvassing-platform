# Business Location Update Feature

## Overview
This feature allows users with pin management permissions to update the location of businesses directly from the business list screen.

## How it works

### 1. Business List Screen
- Users can edit businesses to update their location
- The location update functionality is integrated into the business edit form

### 2. Business Edit Form
When editing a business, users can access location update functionality:
- A "Set Location" or "Change Location" button in the business form
- A modal with a map showing the current business location
- A center icon indicating where the new location will be set
- Instructions to move the map to position the pin correctly
- Cancel and Update Location buttons

### 3. Map Interaction
- Users can pan and zoom the map to position the center icon at the desired location
- The center icon shows exactly where the business pin will be placed
- Real-time feedback as the map center changes

### 4. Location Update
- When "Update Location" is pressed, the business's latitude and longitude are updated
- The API call uses the existing `updateBusiness` endpoint
- Success/error messages are shown to the user
- Upon successful update, the user is returned to the business list

## Technical Implementation

### Files Added/Modified:
1. **`src/components/LocationUpdateModal.tsx`** - Modal component for location updating
2. **`src/components/BusinessForm.tsx`** - Integrated location update functionality
3. **`src/screens/BusinessListScreen.tsx`** - Removed redundant location update button
4. **`src/components/BusinessCard.tsx`** - Removed redundant location update button

### Key Features:
- **Permission-based access**: Only users with `canManagePins` can see the update location button
- **Visual feedback**: Center icon clearly shows where the pin will be placed
- **Error handling**: Proper error messages and loading states
- **Navigation**: Seamless integration with existing navigation structure

### API Integration:
- Uses existing `apiService.updateBusiness()` method
- Only updates latitude and longitude fields
- Maintains all other business data unchanged

## Usage

1. Navigate to the Business List screen
2. Find a business that needs location correction
3. Tap on the business to edit it
4. In the business edit form, tap the "Change Location" button
5. Move the map to position the center icon at the correct location
6. Tap "Update Location" to save the new coordinates
7. Complete the business edit form to save all changes

## Permissions
- **Required**: `canManagePins` user permission
- **Optional**: Location permissions for initial map positioning 