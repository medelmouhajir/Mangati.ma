using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Languages
{
    public class Language
    {
        public int LanguageId { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        public virtual ICollection<MangaSeriesLanguage>? MangaLanguages { get; set; }
    }
}
