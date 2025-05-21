using Mangati.App.Server.Models.Serie;
using Mangati.App.Server.Models.Users;

namespace Mangati.App.Server.Models.Common
{
    public class ReadingProgress
    {
        public string ApplicationUserId { get; set; }
        public virtual ApplicationUser? User { get; set; }

        public int ChapterId { get; set; }
        public virtual Chapter? Chapter { get; set; }

        public int LastReadPage { get; set; }
        public DateTime LastReadAt { get; set; }
    }
}
