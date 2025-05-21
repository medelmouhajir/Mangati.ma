using Mangati.App.Server.Data;
using Mangati.App.Server.Models.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Mangati.App.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ViewerSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ViewerSettingsController> _logger;

        public ViewerSettingsController(ApplicationDbContext context, ILogger<ViewerSettingsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/viewersettings
        [HttpGet]
        public async Task<ActionResult<ViewerSettings>> GetSettings()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var settings = await _context.ViewerSettings
                .FirstOrDefaultAsync(s => s.ApplicationUserId == userId);

            if (settings == null)
            {
                // Return default settings if not found
                return new ViewerSettings
                {
                    ApplicationUserId = userId,
                    Theme = ThemeMode.Light,
                    ReadingMode = ReadingMode.PageFlip,
                    FitToWidth = true,
                    ZoomLevel = 100
                };
            }

            return settings;
        }

        // PUT: api/viewersettings
        [HttpPut]
        public async Task<IActionResult> UpdateSettings(ViewerSettings settings)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Ensure we're updating the correct user's settings
            settings.ApplicationUserId = userId;

            var existingSettings = await _context.ViewerSettings
                .FirstOrDefaultAsync(s => s.ApplicationUserId == userId);

            if (existingSettings == null)
            {
                // Create new settings if not found
                _context.ViewerSettings.Add(settings);
            }
            else
            {
                // Update existing settings
                existingSettings.Theme = settings.Theme;
                existingSettings.ReadingMode = settings.ReadingMode;
                existingSettings.FitToWidth = settings.FitToWidth;
                existingSettings.ZoomLevel = settings.ZoomLevel;
            }

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating viewer settings for user {UserId}", userId);
                return StatusCode(500, "An error occurred while updating settings");
            }
        }
    }
}