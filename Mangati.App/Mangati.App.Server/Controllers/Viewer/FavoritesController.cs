using Mangati.App.Server.Data;
using Mangati.App.Server.Dtos;
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
    public class FavoritesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FavoritesController> _logger;

        public FavoritesController(ApplicationDbContext context, ILogger<FavoritesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/favorites
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MangaSeriesDto>>> GetFavorites()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var favorites = await _context.UserFavorites
                .Where(f => f.ApplicationUserId == userId)
                .Include(f => f.MangaSeries)
                .ThenInclude(m => m.Author)
                .Include(f => f.MangaSeries.MangaTags)
                .ThenInclude(mt => mt.Tag)
                .Include(f => f.MangaSeries.MangaLanguages)
                .ThenInclude(ml => ml.Language)
                .Select(f => new MangaSeriesDto
                {
                    Id = f.MangaSeries.MangaSeriesId,
                    Title = f.MangaSeries.Title,
                    Synopsis = f.MangaSeries.Synopsis,
                    CoverImageUrl = f.MangaSeries.CoverImageUrl,
                    Status = f.MangaSeries.Status,
                    AuthorId = f.MangaSeries.AuthorUserId,
                    AuthorName = f.MangaSeries.Author.UserName,
                    Tags = f.MangaSeries.MangaTags.Select(mt => new TagDto
                    {
                        Id = mt.Tag.TagId,
                        Name = mt.Tag.Name
                    }).ToList(),
                    Languages = f.MangaSeries.MangaLanguages.Select(ml => new LanguageDto
                    {
                        Id = ml.Language.LanguageId,
                        Name = ml.Language.Name
                    }).ToList(),
                    CreatedAt = f.MangaSeries.CreatedAt,
                    UpdatedAt = f.MangaSeries.UpdatedAt
                })
                .ToListAsync();

            return Ok(favorites);
        }

        // POST: api/favorites
        [HttpPost]
        public async Task<IActionResult> AddToFavorites([FromBody] FavoriteRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Check if the manga exists
            var mangaExists = await _context.MangaSeries.AnyAsync(m => m.MangaSeriesId == request.MangaSeriesId);
            if (!mangaExists)
            {
                return NotFound("Manga series not found");
            }

            // Check if already favorited
            var existingFavorite = await _context.UserFavorites
                .FirstOrDefaultAsync(f => f.ApplicationUserId == userId && f.MangaSeriesId == request.MangaSeriesId);

            if (existingFavorite != null)
            {
                return Ok(); // Already favorited, just return success
            }

            // Add to favorites
            var favorite = new UserFavorite
            {
                ApplicationUserId = userId,
                MangaSeriesId = request.MangaSeriesId,
                AddedAt = DateTime.UtcNow
            };

            _context.UserFavorites.Add(favorite);
            await _context.SaveChangesAsync();

            return Ok();
        }

        // DELETE: api/favorites/{mangaId}
        [HttpDelete("{mangaId}")]
        public async Task<IActionResult> RemoveFromFavorites(int mangaId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var favorite = await _context.UserFavorites
                .FirstOrDefaultAsync(f => f.ApplicationUserId == userId && f.MangaSeriesId == mangaId);

            if (favorite == null)
            {
                return NotFound();
            }

            _context.UserFavorites.Remove(favorite);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class FavoriteRequestDto
    {
        public int MangaSeriesId { get; set; }
    }
}