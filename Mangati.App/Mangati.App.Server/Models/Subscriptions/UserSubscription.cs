using Mangati.App.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Subscriptions
{
    public class UserSubscription
    {
        [Key]
        public Guid UserSubscriptionId { get; set; }

        public string ApplicationUserId { get; set; }
        public virtual ApplicationUser? User { get; set; }

        public int SubscriptionPlanId { get; set; }
        public virtual SubscriptionPlan? SubscriptionPlan { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        // Add subscription status
        public SubscriptionStatus Status { get; set; }

        // Track payment history
        public virtual ICollection<SubscriptionPayment>? Payments { get; set; }

        // Track usage
        public int ChaptersUploadedThisMonth { get; set; }
        public DateTime LastUploadResetDate { get; set; }
    }

    public enum SubscriptionStatus
    {
        Active = 0,
        Cancelled = 1,
        Expired = 2,
        PaymentFailed = 3
    }
}
