using System.Security.Cryptography;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using CanvassingBackend.Models;

namespace CanvassingBackend.Services
{
    public class AuthService
    {
        private readonly DataService _dataService;
        private readonly JwtService _jwtService;
        private readonly ConcurrentDictionary<string, RefreshToken> _refreshTokens = new();

        public AuthService(DataService dataService, JwtService jwtService)
        {
            _dataService = dataService;
            _jwtService = jwtService;
        }

        public AuthResponse? Login(LoginRequest request)
        {
            // Try to find user by email first, then by username
            var user = _dataService.GetUserByEmail(request.Email);
            if (user == null)
            {
                // If not found by email, try by username
                user = _dataService.GetUserByUsername(request.Email);
            }
            
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
                return null;

            if (!user.IsActive)
                return null;

            // Check if user is approved (except for Admin users who can always login)
            if (!user.IsApproved && user.Role != "Admin")
                return null;

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            _dataService.UpdateUser(user);

            return GenerateAuthResponse(user);
        }

        public AuthResponse? Register(RegisterRequest request)
        {
            // Check if user already exists
            if (_dataService.GetUserByEmail(request.Email) != null)
                return null;

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = request.Email,
                Username = request.Username,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PasswordHash = HashPassword(request.Password),
                Role = "User", // Default role
                CompanyId = request.CompanyId,
                IsActive = true,
                IsApproved = false, // New users must be approved by admin/manager
                CanManagePins = false, // Default to false for new users
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdUser = _dataService.CreateUser(user);
            return GenerateAuthResponse(createdUser);
        }

        public AuthResponse? RefreshToken(RefreshTokenRequest request)
        {
            if (!_refreshTokens.TryGetValue(request.RefreshToken, out var refreshToken))
                return null;

            if (refreshToken.ExpiresAt < DateTime.UtcNow)
            {
                _refreshTokens.TryRemove(request.RefreshToken, out _);
                return null;
            }

            var user = _dataService.GetUserById(refreshToken.UserId);
            if (user == null || !user.IsActive)
                return null;

            return GenerateAuthResponse(user);
        }

        public void RevokeToken(string refreshToken)
        {
            _refreshTokens.TryRemove(refreshToken, out _);
        }

        public bool ApproveUser(string userId, string approvedByUserId)
        {
            var user = _dataService.GetUserById(userId);
            if (user == null) return false;

            var approvedByUser = _dataService.GetUserById(approvedByUserId);
            if (approvedByUser == null || (approvedByUser.Role != "Admin" && approvedByUser.Role != "Manager"))
                return false;

            // Check if the approving user has permission to approve this specific user
            if (approvedByUser.Role == "Manager")
            {
                // Managers can only approve users from their own company
                if (string.IsNullOrEmpty(approvedByUser.CompanyId) || user.CompanyId != approvedByUser.CompanyId)
                    return false;
            }
            // Admins can approve any user (no additional check needed)

            user.IsApproved = true;
            user.UpdatedAt = DateTime.UtcNow;
            return _dataService.UpdateUser(user) != null;
        }

        public bool RejectUser(string userId, string rejectedByUserId)
        {
            var user = _dataService.GetUserById(userId);
            if (user == null) return false;

            var rejectedByUser = _dataService.GetUserById(rejectedByUserId);
            if (rejectedByUser == null || (rejectedByUser.Role != "Admin" && rejectedByUser.Role != "Manager"))
                return false;

            // Check if the rejecting user has permission to reject this specific user
            if (rejectedByUser.Role == "Manager")
            {
                // Managers can only reject users from their own company
                if (string.IsNullOrEmpty(rejectedByUser.CompanyId) || user.CompanyId != rejectedByUser.CompanyId)
                    return false;
            }
            // Admins can reject any user (no additional check needed)

            user.IsActive = false; // Deactivate the user
            user.UpdatedAt = DateTime.UtcNow;
            return _dataService.UpdateUser(user) != null;
        }

        public List<User> GetPendingApprovals(string currentUserId)
        {
            var currentUser = _dataService.GetUserById(currentUserId);
            if (currentUser == null) return new List<User>();

            var allPendingUsers = _dataService.GetAllUsers().Where(u => !u.IsApproved && u.IsActive).ToList();

            // If user is Admin, return all pending approvals from all companies
            if (currentUser.Role == "Admin")
            {
                return allPendingUsers;
            }

            // If user is Manager, return only pending approvals from their company
            if (currentUser.Role == "Manager" && !string.IsNullOrEmpty(currentUser.CompanyId))
            {
                return allPendingUsers.Where(u => u.CompanyId == currentUser.CompanyId).ToList();
            }

            // If user is not Admin or Manager, return empty list
            return new List<User>();
        }

        public User? GetUserByEmail(string email)
        {
            return _dataService.GetUserByEmail(email);
        }

        public User? GetUserById(string userId)
        {
            return _dataService.GetUserById(userId);
        }

        private AuthResponse GenerateAuthResponse(User user)
        {
            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddHours(_jwtService.GetTokenExpirationHours());

            _refreshTokens.TryAdd(refreshToken, new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtService.GetRefreshTokenExpirationDays())
            });

            return new AuthResponse
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = user
            };
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string password, string hash)
        {
            var hashedPassword = HashPassword(password);
            return hashedPassword == hash;
        }
    }

    public class RefreshToken
    {
        public string Token { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }
} 