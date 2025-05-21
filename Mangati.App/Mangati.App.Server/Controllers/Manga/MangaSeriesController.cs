using Mangati.App.Server.Data;
using Mangati.App.Server.Dtos;
using Mangati.App.Server.Models.Languages;
using Mangati.App.Server.Models.Serie;
using Mangati.App.Server.Models.Tags;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Mangati.App.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MangaSeriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<MangaSeriesController> _logger;

    public MangaSeriesController(ApplicationDbContext context, ILogger<MangaSeriesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/mangaseries
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MangaSeriesDto>>> GetMangaSeries(
        [FromQuery] string? searchTerm,
        [FromQuery] SeriesStatus? status,
        [FromQuery] int? languageId,
        [FromQuery] int[]? tagIds,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.MangaSeries
            .Include(m => m.Author)
            .Include(m => m.MangaTags)
                .ThenInclude(mt => mt.Tag)
            .Include(m => m.MangaLanguages)
                .ThenInclude(ml => ml.Language)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(m => m.Title.Contains(searchTerm) || m.Synopsis.Contains(searchTerm));
        }

        if (status.HasValue)
        {
            query = query.Where(m => m.Status == status.Value);
        }

        if (languageId.HasValue)
        {
            query = query.Where(m => m.MangaLanguages.Any(ml => ml.LanguageId == languageId.Value));
        }

        if (tagIds?.Length > 0)
        {
            query = query.Where(m => m.MangaTags.Any(mt => tagIds.Contains(mt.TagId)));
        }

        // Calculate pagination
        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var mangaSeries = await query
            .OrderByDescending(m => m.UpdatedAt ?? m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MangaSeriesDto
            {
                Id = m.MangaSeriesId,
                Title = m.Title,
                Synopsis = m.Synopsis,
                CoverImageUrl = m.CoverImageUrl,
                Status = m.Status,
                AuthorId = m.AuthorUserId,
                AuthorName = m.Author.UserName,
                Tags = m.MangaTags.Select(mt => new TagDto
                {
                    Id = mt.Tag.TagId,
                    Name = mt.Tag.Name
                }).ToList(),
                Languages = m.MangaLanguages.Select(ml => new LanguageDto
                {
                    Id = ml.Language.LanguageId,
                    Name = ml.Language.Name
                }).ToList(),
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        Response.Headers.Add("X-Total-Count", totalItems.ToString());
        Response.Headers.Add("X-Total-Pages", totalPages.ToString());

        return Ok(mangaSeries);
    }

    // GET: api/mangaseries/5
    [HttpGet("{id}")]
    public async Task<ActionResult<MangaSeriesDetailDto>> GetMangaSeries(int id)
    {
        var mangaSeries = await _context.MangaSeries
            .Include(m => m.Author)
            .Include(m => m.Chapters.OrderBy(c => c.Number))
            .Include(m => m.MangaTags)
                .ThenInclude(mt => mt.Tag)
            .Include(m => m.MangaLanguages)
                .ThenInclude(ml => ml.Language)
            .FirstOrDefaultAsync(m => m.MangaSeriesId == id);

        if (mangaSeries == null)
        {
            return NotFound();
        }

        var dto = new MangaSeriesDetailDto
        {
            Id = mangaSeries.MangaSeriesId,
            Title = mangaSeries.Title,
            Synopsis = mangaSeries.Synopsis,
            CoverImageUrl = mangaSeries.CoverImageUrl,
            Status = mangaSeries.Status,
            AuthorId = mangaSeries.AuthorUserId,
            AuthorName = mangaSeries.Author.UserName,
            Tags = mangaSeries.MangaTags.Select(mt => new TagDto
            {
                Id = mt.Tag.TagId,
                Name = mt.Tag.Name
            }).ToList(),
            Languages = mangaSeries.MangaLanguages.Select(ml => new LanguageDto
            {
                Id = ml.Language.LanguageId,
                Name = ml.Language.Name
            }).ToList(),
            Chapters = mangaSeries.Chapters
                .Where(c => c.Status == ChapterStatus.Approved)
                .Select(c => new ChapterListItemDto
                {
                    Id = c.ChapterId,
                    Title = c.Title,
                    Number = c.Number,
                    UploadedAt = c.UploadedAt
                }).ToList(),
            CreatedAt = mangaSeries.CreatedAt,
            UpdatedAt = mangaSeries.UpdatedAt
        };

        return Ok(dto);
    }

    // POST: api/mangaseries
    [HttpPost]
    [Authorize(Roles = "Writer,Admin,writer,admin")]
    public async Task<ActionResult<MangaSeriesDto>> CreateMangaSeries(CreateMangaSeriesDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var mangaSeries = new MangaSeries
        {
            Title = dto.Title,
            Synopsis = dto.Synopsis,
            CoverImageUrl = dto.CoverImageUrl,
            Status = SeriesStatus.Ongoing,
            AuthorUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Add languages
        if (dto.LanguageIds?.Any() == true)
        {
            mangaSeries.MangaLanguages = dto.LanguageIds.Select(lid => new MangaSeriesLanguage
            {
                LanguageId = lid
            }).ToList();
        }

        // Add tags
        if (dto.TagIds?.Any() == true)
        {
            mangaSeries.MangaTags = dto.TagIds.Select(tid => new MangaSeriesTag
            {
                TagId = tid
            }).ToList();
        }

        _context.MangaSeries.Add(mangaSeries);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMangaSeries), new { id = mangaSeries.MangaSeriesId },
            new MangaSeriesDto
            {
                Id = mangaSeries.MangaSeriesId,
                Title = mangaSeries.Title,
                Synopsis = mangaSeries.Synopsis,
                CoverImageUrl = mangaSeries.CoverImageUrl,
                Status = mangaSeries.Status,
                AuthorId = mangaSeries.AuthorUserId,
                CreatedAt = mangaSeries.CreatedAt
            });
    }

    // PUT: api/mangaseries/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Writer,Admin")]
    public async Task<IActionResult> UpdateMangaSeries(int id, UpdateMangaSeriesDto dto)
    {
        var mangaSeries = await _context.MangaSeries
            .Include(m => m.MangaLanguages)
            .Include(m => m.MangaTags)
            .FirstOrDefaultAsync(m => m.MangaSeriesId == id);

        if (mangaSeries == null)
        {
            return NotFound();
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

        mangaSeries.Title = dto.Title;
        mangaSeries.Synopsis = dto.Synopsis;
        mangaSeries.CoverImageUrl = dto.CoverImageUrl;
        mangaSeries.Status = dto.Status;
        mangaSeries.UpdatedAt = DateTime.UtcNow;

        // Update languages
        if (dto.LanguageIds != null)
        {
            mangaSeries.MangaLanguages.Clear();
            mangaSeries.MangaLanguages = dto.LanguageIds.Select(lid => new MangaSeriesLanguage
            {
                LanguageId = lid
            }).ToList();
        }

        // Update tags
        if (dto.TagIds != null)
        {
            mangaSeries.MangaTags.Clear();
            mangaSeries.MangaTags = dto.TagIds.Select(tid => new MangaSeriesTag
            {
                TagId = tid
            }).ToList();
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await MangaSeriesExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    // DELETE: api/mangaseries/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Writer,Admin")]
    public async Task<IActionResult> DeleteMangaSeries(int id)
    {
        var mangaSeries = await _context.MangaSeries.FindAsync(id);
        if (mangaSeries == null)
        {
            return NotFound();
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

        _context.MangaSeries.Remove(mangaSeries);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> MangaSeriesExists(int id)
    {
        return await _context.MangaSeries.AnyAsync(e => e.MangaSeriesId == id);
    }
}