using Mangati.App.Server.Models.Users;

namespace Mangati.App.Server.Models.Subscriptions
{
    public class UserSubscription
    {
        // PK is same as UserId for one-to-one
        public string ApplicationUserId { get; set; }
        public virtual ApplicationUser? User { get; set; }

        public int SubscriptionPlanId { get; set; }
        public virtual SubscriptionPlan? SubscriptionPlan { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
