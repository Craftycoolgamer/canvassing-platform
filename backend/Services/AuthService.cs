using System.Security.Cryptography;
using System.Collections.Concurrent;
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