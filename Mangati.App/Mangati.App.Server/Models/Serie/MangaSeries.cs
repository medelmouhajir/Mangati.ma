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

        public string Synopsis { get; set; }

        public string CoverImageUrl { get; set; }

        public SeriesStatus Status { get; set; }  // e.g. Ongoing, Completed

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
