using Mangati.App.Server.Models.Languages;
using Mangati.App.Server.Models.Tags;
using Mangati.App.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Serie
{
    public class MangaSeries
    {
        public int MangaSeriesId { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; }

        [MaxLength(2000)]
        public string Synopsis { get; set; }

        [Url]
        public string CoverImageUrl { get; set; }

        [Required]
        public SeriesStatus Status { get; set; }  // e.g. Ongoing, Completed


        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Foreign key to owner (writer)
        public string AuthorUserId { get; set; }
        public virtual ApplicationUser? Author { get; set; }

        // Relations
        public virtual ICollection<Chapter>? Chapters { get; set; }
        public virtual ICollection<MangaSeriesTag>? MangaTags { get; set; }
        public virtual ICollection<MangaSeriesLanguage>? MangaLanguages { get; set; }
    }

    public enum SeriesStatus
    {
        Ongoing = 0,
        Completed = 1
    }
}
