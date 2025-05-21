using Mangati.App.Server.Models.Serie;

namespace Mangati.App.Server.Models.Languages
{
    public class MangaSeriesLanguage
    {
        public int MangaSeriesId { get; set; }
        public virtual MangaSeries? MangaSeries { get; set; }

        public int LanguageId { get; set; }
        public virtual Language? Language { get; set; }
    }
}
