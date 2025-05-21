using Mangati.App.Server.Models.Serie;
using Mangati.App.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Reports
{
    public class ContentReport
    {
        public int ReportId { get; set; }

        public string ReportedByUserId { get; set; }
        public virtual ApplicationUser? ReportedBy { get; set; }

        public int? MangaSeriesId { get; set; }
        public virtual MangaSeries? MangaSeries { get; set; }

        public int? ChapterId { get; set; }
        public virtual Chapter? Chapter { get; set; }

        [Required, MaxLength(1000)]
        public string Reason { get; set; }

        public ReportStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
    public enum ReportStatus
    {
        Pending = 0,
        Resolved = 1,
        Rejected = 2
    }
}
