using Mangati.App.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Models.Common
{
    public class ViewerSettings
    {

        [Key]
        public string ApplicationUserId { get; set; }
        public virtual ApplicationUser? User { get; set; }

        public ThemeMode Theme { get; set; }            // Light, Dark
        public ReadingMode ReadingMode { get; set; }    // PageFlip, VerticalScroll
        public bool FitToWidth { get; set; }
        public int ZoomLevel { get; set; }
    }

    public enum ThemeMode
    {
        Light,
        Dark
    }

    public enum ReadingMode
    {
        PageFlip,
        VerticalScroll
    }
}
