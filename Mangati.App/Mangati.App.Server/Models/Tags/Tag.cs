using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Tags
{
    public class Tag
    {
        public int TagId { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        public virtual ICollection<MangaSeriesTag>? MangaTags { get; set; }
    }
}
