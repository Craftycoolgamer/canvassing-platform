# Business Location Update Feature

## Overview
This feature allows users with pin management permissions to update the location of businesses directly from the business list screen.

## How it works

### 1. Business List Screen
- Users with `canManagePins` permission will see an "Update Location" button on each business card
- The button appears next to the "Assign" button (if applicable)

### 2. Location Update Screen
When the "Update Location" button is pressed, users are taken to a dedicated screen with:
- A map showing the current business location
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
1. **`src/screens/LocationUpdateScreen.tsx`** - New screen for location updating
2. **`src/components/BusinessCard.tsx`** - Added update location button
3. **`src/screens/BusinessListScreen.tsx`** - Added navigation to location update screen
4. **`src/navigation/BusinessStackNavigator.tsx`** - New stack navigator for business list
5. **`src/navigation/AppNavigator.tsx`** - Updated to use stack navigator

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
3. Tap the "Update Location" button (only visible if you have pin management permissions)
4. Move the map to position the center icon at the correct location
5. Tap "Update Location" to save the new coordinates
6. Confirm the success message to return to the business list

## Permissions
- **Required**: `canManagePins` user permission
- **Optional**: Location permissions for initial map positioning 