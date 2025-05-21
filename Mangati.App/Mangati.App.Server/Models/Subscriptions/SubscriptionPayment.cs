using Mangati.App.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Subscriptions
{
    public class SubscriptionPayment
    {
        [Key]
        public Guid PaymentId { get; set; }

        public string ApplicationUserId { get; set; }
        public virtual ApplicationUser? User { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; }

        public string? TransactionId { get; set; } // External payment provider reference

    }
}
