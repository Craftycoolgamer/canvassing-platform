# Profile Approval System

## Overview

The canvassing platform now includes a profile approval system where new user registrations must be approved by an administrator or manager before they can access the platform.

## How It Works

### For New Users

1. **Registration Process**: When a new user registers, their account is created with `IsApproved = false`
2. **Pending Approval Screen**: After registration, users are redirected to a pending approval screen
3. **Approval Required**: Users cannot access the main application until approved by an admin/manager
4. **Status Check**: The system checks approval status on login and redirects accordingly

### For Administrators and Managers

1. **Pending Approvals Tab**: Admins and managers see a "Pending Approvals" tab in the main navigation
2. **Role-based Filtering**:
   - **Admins**: Can see and approve/reject pending users from all companies
   - **Managers**: Can only see and approve/reject pending users from their own company
3. **Review Process**: They can view pending registrations with user details including company information
4. **Approve/Reject Actions**: 
   - **Approve**: Sets `IsApproved = true`, user can now access the platform
   - **Reject**: Sets `IsActive = false`, user account is deactivated
5. **Real-time Updates**: The pending approvals list updates automatically

## Technical Implementation

### Backend Changes

#### User Model (`backend/Models/User.cs`)
- Added `IsApproved` boolean field (defaults to `false`)

#### AuthService (`backend/Services/AuthService.cs`)
- Modified `Login()` method to check approval status
- Modified `Register()` method to set `IsApproved = false`
- Added approval methods:
  - `ApproveUser(userId, approvedByUserId)` - Includes role-based permission checks
  - `RejectUser(userId, rejectedByUserId)` - Includes role-based permission checks
  - `GetPendingApprovals(currentUserId)` - Returns filtered list based on user role and company
- Added `GetUserById(userId)` method for efficient user lookups

#### API Endpoints (`backend/Program.cs`)
- `GET /api/auth/pending-approvals` - Get list of pending approvals (uses user ID from JWT)
- `POST /api/auth/approve-user` - Approve a user (uses user ID from JWT)
- `POST /api/auth/reject-user` - Reject a user (uses user ID from JWT)
- Updated all business endpoints to use user ID from JWT instead of email lookups

### Frontend Changes

#### New Screens
- `PendingApprovalScreen.tsx` - For users waiting for approval
- `PendingApprovalsScreen.tsx` - For admins/managers to review approvals

#### Updated Components
- `AppNavigator.tsx` - Added "Pending Approvals" tab for admins/managers
- `App.tsx` - Added logic to show pending approval screen for unapproved users
- `AuthContext.tsx` - Updated User interface to include `isApproved` field

#### Type Definitions
- Updated `User` interface to include `isApproved: boolean`
- Added `ApprovalRequest` and `RejectionRequest` interfaces

## User Experience

### For New Users
1. Register with email, username, name, and password
2. See success message explaining approval is required
3. Redirected to pending approval screen
4. Can logout while waiting for approval
5. Once approved, can access the full platform

### For Admins/Managers
1. See "Pending Approvals" tab in main navigation
2. **Role-based Access**:
   - **Admins**: View all pending registrations from all companies
   - **Managers**: View only pending registrations from their own company
3. See user details: name, email, username, company ID, registration date
4. Click "Approve" or "Reject" for each user (with role-based permissions)
5. Optional reason field when rejecting users
6. Real-time updates to the pending list

## Security Features

- Only admins and managers can approve/reject users
- Login is blocked for unapproved users (except admin users)
- Rejected users are deactivated and cannot login
- All approval actions are logged with the approving user's ID

## Configuration

The approval system is enabled by default for all new registrations. To disable it for testing:

1. Modify `backend/Services/AuthService.cs` in the `Register` method
2. Change `IsApproved = false` to `IsApproved = true`

## Testing

### Test Scenarios

1. **New User Registration**
   - Register a new user
   - Verify they're redirected to pending approval screen
   - Verify they cannot access main app

2. **Admin Approval Process**
   - Login as admin/manager
   - Navigate to "Pending Approvals" tab
   - Approve a pending user
   - Verify user can now login and access app

3. **User Rejection**
   - Reject a pending user
   - Verify user cannot login
   - Verify user account is deactivated

4. **Approval Status Check**
   - Login with unapproved user
   - Verify they see pending approval screen
   - Login with approved user
   - Verify they can access main app

## Future Enhancements

- Email notifications for approval/rejection
- Bulk approval/rejection actions
- Approval workflow with multiple approvers
- Approval history and audit trail
- Custom approval criteria based on user attributes 