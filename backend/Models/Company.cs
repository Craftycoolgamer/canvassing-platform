using System.ComponentModel.DataAnnotations;

namespace CanvassingBackend.Models
{
    public class Company
    {
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string PinIcon { get; set; } = string.Empty;
        
        [Required]
        public string Color { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
} 