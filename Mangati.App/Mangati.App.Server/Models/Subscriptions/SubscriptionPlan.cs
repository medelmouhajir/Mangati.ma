using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Subscriptions
{
    public class SubscriptionPlan
    {
        public int SubscriptionPlanId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        public decimal Price { get; set; }

        public int UploadLimitPerMonth { get; set; }

        public virtual ICollection<UserSubscription>? UserSubscriptions { get; set; }
    }
}
