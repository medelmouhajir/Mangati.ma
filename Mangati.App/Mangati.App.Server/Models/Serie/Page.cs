using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Serie
{
    public class Page
    {
        public int PageId { get; set; }

        [Required]
        public string ImageUrl { get; set; }

        public long FileSizeBytes { get; set; }

        public int Order { get; set; }

        // FK to chapter
        public int ChapterId { get; set; }
        public virtual Chapter? Chapter { get; set; }
    }
}
