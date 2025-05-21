using Mangati.App.Server.Models.Serie;
using Mangati.App.Server.Models.Users;

namespace Mangati.App.Server.Models.Common
{
    public class UserFavorite
    {
        public string ApplicationUserId { get; set; }
        public virtual ApplicationUser? User { get; set; }

        public int MangaSeriesId { get; set; }
        public virtual MangaSeries? MangaSeries { get; set; }

        public DateTime AddedAt { get; set; }
    }
}
