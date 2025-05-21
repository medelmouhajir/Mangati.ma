using Mangati.App.Server.Data;
using Mangati.App.Server.Dtos;
using Mangati.App.Server.Models.Languages;
using Mangati.App.Server.Models.Tags;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Mangati.App.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FiltersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<FiltersController> _logger;

    public FiltersController(ApplicationDbContext context, ILogger<FiltersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/filters/tags
    [HttpGet("tags")]
    public async Task<ActionResult<IEnumerable<TagDto>>> GetTags()
    {
        var tags = await _context.Tags
            .Select(t => new TagDto
            {
                Id = t.TagId,
                Name = t.Name
            })
            .OrderBy(t => t.Name)
            .ToListAsync();

        return Ok(tags);
    }

    // POST: api/filters/tags
    [HttpPost("tags")]
    //[Authorize(Roles = "Admin,Writer")]
    public async Task<ActionResult<TagDto>> CreateTag([FromBody] CreateTagDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Check if tag already exists
        var existingTag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Name.ToLower() == dto.Name.ToLower());

        if (existingTag != null)
        {
            return Conflict(new { message = "A tag with this name already exists" });
        }

        var tag = new Tag
        {
            Name = dto.Name.Trim()
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetTags),
            new TagDto
            {
                Id = tag.TagId,
                Name = tag.Name
            });
    }

    // GET: api/filters/languages
    [HttpGet("languages")]
    public async Task<ActionResult<IEnumerable<LanguageDto>>> GetLanguages()
    {
        var languages = await _context.Languages
            .Select(l => new LanguageDto
            {
                Id = l.LanguageId,
                Name = l.Name
            })
            .OrderBy(l => l.Name)
            .ToListAsync();

        return Ok(languages);
    }

    // POST: api/filters/languages
    [HttpPost("languages")]
    //[Authorize(Roles = "Admin")]
    public async Task<ActionResult<LanguageDto>> CreateLanguage([FromBody] CreateLanguageDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Check if language already exists
        var existingLanguage = await _context.Languages
            .FirstOrDefaultAsync(l => l.Name.ToLower() == dto.Name.ToLower());

        if (existingLanguage != null)
        {
            return Conflict(new { message = "A language with this name already exists" });
        }

        var language = new Language
        {
            Name = dto.Name.Trim()
        };

        _context.Languages.Add(language);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetLanguages),
            new LanguageDto
            {
                Id = language.LanguageId,
                Name = language.Name
            });
    }

    // GET: api/filters/all
    [HttpGet("all")]
    public async Task<ActionResult<FiltersDto>> GetAllFilters()
    {
        var tags = await _context.Tags
            .Select(t => new TagDto
            {
                Id = t.TagId,
                Name = t.Name
            })
            .OrderBy(t => t.Name)
            .ToListAsync();

        var languages = await _context.Languages
            .Select(l => new LanguageDto
            {
                Id = l.LanguageId,
                Name = l.Name
            })
            .OrderBy(l => l.Name)
            .ToListAsync();

        var filters = new FiltersDto
        {
            Tags = tags,
            Languages = languages
        };

        return Ok(filters);
    }

    // GET: api/filters/trending-tags
    [HttpGet("trending-tags")]
    public async Task<ActionResult<IEnumerable<TagWithCountDto>>> GetTrendingTags(int limit = 10)
    {
        var trendingTags = await _context.MangaSeriesTags
            .GroupBy(mt => mt.TagId)
            .Select(g => new TagWithCountDto
            {
                Id = g.Key,
                Name = g.First().Tag.Name,
                Count = g.Count()
            })
            .OrderByDescending(t => t.Count)
            .Take(limit)
            .ToListAsync();

        return Ok(trendingTags);
    }
}

// Add these to your Dtos folder
public class FiltersDto
{
    public List<TagDto> Tags { get; set; } = new List<TagDto>();
    public List<LanguageDto> Languages { get; set; } = new List<LanguageDto>();
}

public class TagWithCountDto : TagDto
{
    public int Count { get; set; }
}

public class CreateTagDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; }
}

public class CreateLanguageDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; }
}