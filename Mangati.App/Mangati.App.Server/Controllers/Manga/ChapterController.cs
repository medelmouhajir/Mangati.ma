using Mangati.App.Server.Data;
using Mangati.App.Server.Dtos;
using Mangati.App.Server.Models.Common;
using Mangati.App.Server.Models.Serie;
using Mangati.App.Server.Models.Subscriptions;
using Mangati.App.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Mangati.App.Server.Controllers;

[ApiController]
[Route("api/manga/{mangaId}/[controller]")]
public class ChapterController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ChapterController> _logger;
    private readonly IStorageService _storageService;

    public ChapterController(
        ApplicationDbContext context,
        ILogger<ChapterController> logger,
        IStorageService storageService)
    {
        _context = context;
        _logger = logger;
        _storageService = storageService;
    }

    // GET: api/manga/5/chapter
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ChapterDto>>> GetChapters(
        int mangaId,
        [FromQuery] ChapterStatus? status = null)
    {
        var mangaSeries = await _context.MangaSeries
            .Include(m => m.Chapters)
            .FirstOrDefaultAsync(m => m.MangaSeriesId == mangaId);

        if (mangaSeries == null)
        {
            return NotFound("Manga series not found");
        }

        var query = mangaSeries.Chapters.AsQueryable();

        // Only show approved chapters to regular users
        if (!User.IsInRole("Admin") && !User.IsInRole("Writer"))
        {
            query = query.Where(c => c.Status == ChapterStatus.Approved);
        }
        // Allow filtering by status for admins/writers
        else if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        var chapters = await query
            .OrderBy(c => c.Number)
            .Select(c => new ChapterDto
            {
                Id = c.ChapterId,
                Title = c.Title,
                Number = c.Number,
                Status = c.Status,
                UploadedAt = c.UploadedAt
            })
            .ToListAsync();

        return Ok(chapters);
    }

    // GET: api/manga/5/chapter/3
    [HttpGet("{id}")]
    public async Task<ActionResult<ChapterDetailDto>> GetChapter(int mangaId, int id)
    {
        var chapter = await _context.Chapters
            .Include(c => c.MangaSeries)
            .Include(c => c.Pages.OrderBy(p => p.Order))
            .FirstOrDefaultAsync(c => c.MangaSeriesId == mangaId && c.ChapterId == id);

        if (chapter == null)
        {
            return NotFound("Chapter not found");
        }

        // Check if chapter is approved or user has rights to view it
        if (chapter.Status != ChapterStatus.Approved &&
            !User.IsInRole("Admin") &&
            !(User.IsInRole("Writer") && chapter.MangaSeries.AuthorUserId == User.FindFirst(ClaimTypes.NameIdentifier)?.Value))
        {
            return NotFound("Chapter not available");
        }

        var dto = new ChapterDetailDto
        {
            Id = chapter.ChapterId,
            Title = chapter.Title,
            Number = chapter.Number,
            Status = chapter.Status,
            UploadedAt = chapter.UploadedAt,
            Pages = chapter.Pages.Select(p => new PageDto
            {
                Id = p.PageId,
                ImageUrl = p.ImageUrl,
                Order = p.Order
            }).ToList()
        };

        // Update reading progress if user is authenticated
        if (User.Identity.IsAuthenticated)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var progress = await _context.ReadingProgress
                .FirstOrDefaultAsync(p => p.ApplicationUserId == userId && p.ChapterId == id);

            if (progress == null)
            {
                progress = new ReadingProgress
                {
                    ApplicationUserId = userId,
                    ChapterId = id,
                    LastReadPage = 1,
                    LastReadAt = DateTime.UtcNow
                };
                _context.ReadingProgress.Add(progress);
            }
            else
            {
                progress.LastReadAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }

        return Ok(dto);
    }

    // POST: api/manga/5/chapter
    [HttpPost]
    [Authorize(Roles = "Writer,Admin")]
    public async Task<ActionResult<ChapterDto>> CreateChapter(int mangaId, [FromForm] CreateChapterDto dto)
    {
        var mangaSeries = await _context.MangaSeries
            .Include(m => m.Chapters)
            .FirstOrDefaultAsync(m => m.MangaSeriesId == mangaId);

        if (mangaSeries == null)
        {
            return NotFound("Manga series not found");
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Check if user is author or admin
        if (mangaSeries.AuthorUserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        // Check upload limits for non-admin users
        if (!User.IsInRole("Admin"))
        {
            var subscription = await _context.UserSubscriptions
                .Include(s => s.SubscriptionPlan)
                .FirstOrDefaultAsync(s => s.ApplicationUserId == userId);

            if (subscription == null)
            {
                return BadRequest("Active subscription required to upload chapters");
            }

            // Reset monthly upload count if it's a new month
            if (subscription.LastUploadResetDate.Month != DateTime.UtcNow.Month)
            {
                subscription.ChaptersUploadedThisMonth = 0;
                subscription.LastUploadResetDate = DateTime.UtcNow;
            }

            if (subscription.ChaptersUploadedThisMonth >= subscription.SubscriptionPlan.UploadLimitPerMonth)
            {
                return BadRequest("Monthly upload limit reached");
            }

            subscription.ChaptersUploadedThisMonth++;
        }

        // Create chapter
        var chapter = new Chapter
        {
            MangaSeriesId = mangaId,
            Title = dto.Title,
            Number = dto.Number ?? (mangaSeries.Chapters?.Max(c => c.Number) ?? 0) + 1,
            Status = User.IsInRole("Admin") ? ChapterStatus.Approved : ChapterStatus.Pending,
            UploadedAt = DateTime.UtcNow
        };

        // Upload and process pages
        if (dto.Pages != null && dto.Pages.Any())
        {
            chapter.Pages = new List<Page>();
            for (int i = 0; i < dto.Pages.Count; i++)
            {
                var file = dto.Pages[i];
                if (file.Length > 0)
                {
                    // Upload to storage (e.g. Azure Blob, S3, etc.)
                    var imageUrl = await _storageService.UploadPageImageAsync(mangaId, chapter.Number, i + 1, file);

                    chapter.Pages.Add(new Page
                    {
                        ImageUrl = imageUrl,
                        Order = i + 1,
                        FileSizeBytes = file.Length
                    });
                }
            }
        }

        _context.Chapters.Add(chapter);
        await _context.SaveChangesAsync();

        // Update manga series
        mangaSeries.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChapter),
            new { mangaId = mangaId, id = chapter.ChapterId },
            new ChapterDto
            {
                Id = chapter.ChapterId,
                Title = chapter.Title,
                Number = chapter.Number,
                Status = chapter.Status,
                UploadedAt = chapter.UploadedAt
            });
    }

    // PUT: api/manga/5/chapter/3/status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateChapterStatus(int mangaId, int id, [FromBody] UpdateChapterStatusDto dto)
    {
        var chapter = await _context.Chapters
            .Include(c => c.MangaSeries)
            .FirstOrDefaultAsync(c => c.MangaSeriesId == mangaId && c.ChapterId == id);

        if (chapter == null)
        {
            return NotFound();
        }

        chapter.Status = dto.Status;

        if (dto.Status == ChapterStatus.Approved)
        {
            // Update manga series timestamp when new chapter is approved
            chapter.MangaSeries.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/manga/5/chapter/3
    [HttpDelete("{id}")]
    [Authorize(Roles = "Writer,Admin")]
    public async Task<IActionResult> DeleteChapter(int mangaId, int id)
    {
        var chapter = await _context.Chapters
            .Include(c => c.Pages)
            .FirstOrDefaultAsync(c => c.MangaSeriesId == mangaId && c.ChapterId == id);

        if (chapter == null)
        {
            return NotFound();
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Check if user is author or admin
        var mangaSeries = await _context.MangaSeries.FindAsync(mangaId);
        if (mangaSeries.AuthorUserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        // Delete page images from storage
        foreach (var page in chapter.Pages)
        {
            await _storageService.DeletePageImageAsync(page.ImageUrl);
        }

        _context.Chapters.Remove(chapter);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}