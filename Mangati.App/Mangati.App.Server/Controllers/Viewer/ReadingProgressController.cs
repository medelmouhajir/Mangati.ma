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
    public class ReadingProgressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReadingProgressController> _logger;

        public ReadingProgressController(ApplicationDbContext context, ILogger<ReadingProgressController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/readingprogress/{mangaId}
        [HttpGet("{mangaId}")]
        public async Task<ActionResult<List<ChapterProgressDto>>> GetMangaProgress(int mangaId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var progress = await _context.ReadingProgress
                .Where(p => p.User.Id == userId && p.Chapter.MangaSeriesId == mangaId)
                .Select(p => new ChapterProgressDto
                {
                    ChapterId = p.ChapterId,
                    ChapterNumber = p.Chapter.Number,
                    LastReadPage = p.LastReadPage,
                    LastReadAt = p.LastReadAt
                })
                .ToListAsync();

            return Ok(progress);
        }

        // GET: api/readingprogress/chapter/{chapterId}
        [HttpGet("chapter/{chapterId}")]
        public async Task<ActionResult<ChapterProgressDto>> GetChapterProgress(int chapterId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var progress = await _context.ReadingProgress
                .Where(p => p.User.Id == userId && p.ChapterId == chapterId)
                .Select(p => new ChapterProgressDto
                {
                    ChapterId = p.ChapterId,
                    ChapterNumber = p.Chapter.Number,
                    LastReadPage = p.LastReadPage,
                    LastReadAt = p.LastReadAt
                })
                .FirstOrDefaultAsync();

            if (progress == null)
            {
                return NotFound();
            }

            return Ok(progress);
        }

        // POST: api/readingprogress
        [HttpPost]
        public async Task<IActionResult> UpdateProgress(UpdateProgressDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Check if chapter exists
            var chapterExists = await _context.Chapters.AnyAsync(c => c.ChapterId == dto.ChapterId);
            if (!chapterExists)
            {
                return NotFound("Chapter not found");
            }

            var progress = await _context.ReadingProgress
                .FirstOrDefaultAsync(p => p.ApplicationUserId == userId && p.ChapterId == dto.ChapterId);

            if (progress == null)
            {
                // Create new progress entry
                progress = new ReadingProgress
                {
                    ApplicationUserId = userId,
                    ChapterId = dto.ChapterId,
                    LastReadPage = dto.PageNumber,
                    LastReadAt = DateTime.UtcNow
                };
                _context.ReadingProgress.Add(progress);
            }
            else
            {
                // Update existing progress
                progress.LastReadPage = dto.PageNumber;
                progress.LastReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
    }

    public class ChapterProgressDto
    {
        public int ChapterId { get; set; }
        public int ChapterNumber { get; set; }
        public int LastReadPage { get; set; }
        public DateTime LastReadAt { get; set; }
    }

    public class UpdateProgressDto
    {
        public int ChapterId { get; set; }
        public int PageNumber { get; set; }
    }
}