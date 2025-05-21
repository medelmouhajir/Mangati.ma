using Mangati.App.Server.Models.Common;
using Mangati.App.Server.Models.Languages;
using Mangati.App.Server.Models.Reports;
using Mangati.App.Server.Models.Serie;
using Mangati.App.Server.Models.Subscriptions;
using Mangati.App.Server.Models.Tags;
using Mangati.App.Server.Models.Users;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Mangati.App.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Series related
        public DbSet<MangaSeries> MangaSeries { get; set; }
        public DbSet<Chapter> Chapters { get; set; }
        public DbSet<Page> Pages { get; set; }

        // Tags
        public DbSet<Tag> Tags { get; set; }
        public DbSet<MangaSeriesTag> MangaSeriesTags { get; set; }

        // Languages
        public DbSet<Language> Languages { get; set; }
        public DbSet<MangaSeriesLanguage> MangaSeriesLanguages { get; set; }

        // Subscriptions
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<UserSubscription> UserSubscriptions { get; set; }
        public DbSet<SubscriptionPayment> SubscriptionPayments { get; set; }

        // User related
        public DbSet<ViewerSettings> ViewerSettings { get; set; }
        public DbSet<ReadingProgress> ReadingProgress { get; set; }
        public DbSet<UserFavorite> UserFavorites { get; set; }

        // Reports
        public DbSet<ContentReport> ContentReports { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure many-to-many relationships
            builder.Entity<MangaSeriesTag>()
                .HasKey(mt => new { mt.MangaSeriesId, mt.TagId });

            builder.Entity<MangaSeriesLanguage>()
                .HasKey(ml => new { ml.MangaSeriesId, ml.LanguageId });

            builder.Entity<UserFavorite>()
                .HasKey(uf => new { uf.ApplicationUserId, uf.MangaSeriesId });

            builder.Entity<ReadingProgress>()
                .HasKey(rp => new { rp.ApplicationUserId, rp.ChapterId });

            // Configure one-to-one relationships
            builder.Entity<ViewerSettings>(entity =>
            {
                entity.HasKey(e => e.ApplicationUserId);

                entity.HasOne(vs => vs.User)
                    .WithOne(u => u.ViewerSettings)
                    .HasForeignKey<ViewerSettings>(vs => vs.ApplicationUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<UserSubscription>()
                .HasOne(us => us.User)
                .WithOne(u => u.Subscription)
                .HasForeignKey<UserSubscription>(us => us.ApplicationUserId);

            // Configure one-to-many relationships
            builder.Entity<MangaSeries>()
                .HasOne(ms => ms.Author)
                .WithMany(u => u.MangaSeries)
                .HasForeignKey(ms => ms.AuthorUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Chapter>()
                .HasOne(c => c.MangaSeries)
                .WithMany(ms => ms.Chapters)
                .HasForeignKey(c => c.MangaSeriesId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Page>()
                .HasOne(p => p.Chapter)
                .WithMany(c => c.Pages)
                .HasForeignKey(p => p.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ContentReport>()
                .HasOne(cr => cr.ReportedBy)
                .WithMany()
                .HasForeignKey(cr => cr.ReportedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<SubscriptionPayment>()
                .HasOne(sp => sp.User)
                .WithMany()
                .HasForeignKey(sp => sp.ApplicationUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure required fields and string length limits
            builder.Entity<MangaSeries>()
                .Property(ms => ms.Title)
                .IsRequired()
                .HasMaxLength(200);

            builder.Entity<MangaSeries>()
                .Property(ms => ms.Synopsis)
                .HasMaxLength(2000);

            builder.Entity<Chapter>()
                .Property(c => c.Title)
                .IsRequired()
                .HasMaxLength(100);

            builder.Entity<Tag>()
                .Property(t => t.Name)
                .IsRequired()
                .HasMaxLength(50);

            builder.Entity<Language>()
                .Property(l => l.Name)
                .IsRequired()
                .HasMaxLength(50);

            builder.Entity<SubscriptionPlan>()
                .Property(sp => sp.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Entity<ContentReport>()
                .Property(cr => cr.Reason)
                .IsRequired()
                .HasMaxLength(1000);
        }
    }
}