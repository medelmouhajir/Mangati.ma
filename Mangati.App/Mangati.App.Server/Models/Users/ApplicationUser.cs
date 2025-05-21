using Mangati.App.Server.Models.Common;
using Mangati.App.Server.Models.Serie;
using Mangati.App.Server.Models.Subscriptions;
using Microsoft.AspNetCore.Identity;

namespace Mangati.App.Server.Models.Users
{
    public class ApplicationUser : IdentityUser
    {
        public virtual ICollection<MangaSeries>? MangaSeries { get; set; }
        public virtual UserSubscription? Subscription { get; set; }
        public virtual ViewerSettings? ViewerSettings { get; set; }
    }
}
