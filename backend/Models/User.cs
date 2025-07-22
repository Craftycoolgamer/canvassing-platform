using System.ComponentModel.DataAnnotations;

namespace CanvassingBackend.Models
{
    public class User
    {
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        public string Role { get; set; } = "User"; // Admin, Manager, User
        
        public string? CompanyId { get; set; } // For company-specific users
        
        public bool IsActive { get; set; } = true;
        
        public bool CanManagePins { get; set; } = false; // Controls pin management permissions
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastLoginAt { get; set; }
    }
} 