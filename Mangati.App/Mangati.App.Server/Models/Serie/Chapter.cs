using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Serie
{
    public class Chapter
    {
        public int ChapterId { get; set; }

        [Required, MaxLength(100)]
        public string Title { get; set; }

        [Required]
        public int Number { get; set; }


        public ChapterStatus Status { get; set; } = ChapterStatus.Pending;

        [Required]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // FK to series
        public int MangaSeriesId { get; set; }
        public virtual MangaSeries? MangaSeries { get; set; }

        public virtual ICollection<Page>? Pages { get; set; }
    }

    public enum ChapterStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
}
