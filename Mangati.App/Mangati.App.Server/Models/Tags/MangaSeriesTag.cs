using Mangati.App.Server.Models.Serie;

namespace Mangati.App.Server.Models.Tags
{
    public class MangaSeriesTag
    {
        public int MangaSeriesId { get; set; }
        public virtual MangaSeries? MangaSeries { get; set; }

        public int TagId { get; set; }
        public virtual Tag? Tag { get; set; }
    }
}
