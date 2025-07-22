using System.ComponentModel.DataAnnotations;

namespace CanvassingBackend.Models
{
    public class Business
    {
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Address { get; set; } = string.Empty;
        
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public List<string> Notes { get; set; } = new List<string>();
        
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        
        [Required]
        public string CompanyId { get; set; } = string.Empty;
        
        public string? AssignedUserId { get; set; } // User assigned to this business
        
        public string Status { get; set; } = "pending";
        public DateTime? LastContactDate { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
} 