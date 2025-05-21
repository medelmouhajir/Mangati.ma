using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Serie
{
    public class Chapter
    {
        public int ChapterId { get; set; }

        [Required, MaxLength(100)]
        public string Title { get; set; }

        public DateTime UploadedAt { get; set; }

        // FK to series
        public int MangaSeriesId { get; set; }
        public virtual MangaSeries? MangaSeries { get; set; }

        public virtual ICollection<Page>? Pages { get; set; }
    }
}
