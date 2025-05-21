using System.ComponentModel.DataAnnotations;
using Mangati.App.Server.Models.Serie;

namespace Mangati.App.Server.Dtos;

public class MangaSeriesDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Synopsis { get; set; }
    public string CoverImageUrl { get; set; }
    public SeriesStatus Status { get; set; }
    public string AuthorId { get; set; }
    public string AuthorName { get; set; }
    public List<TagDto> Tags { get; set; }
    public List<LanguageDto> Languages { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class MangaSeriesDetailDto : MangaSeriesDto
{
    public List<ChapterListItemDto> Chapters { get; set; }
}

public class CreateMangaSeriesDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; }

    [MaxLength(2000)]
    public string Synopsis { get; set; }

    [Required]
    [Url]
    public string CoverImageUrl { get; set; }

    public int[]? LanguageIds { get; set; }
    public int[]? TagIds { get; set; }
}

public class UpdateMangaSeriesDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; }

    [MaxLength(2000)]
    public string Synopsis { get; set; }

    [Required]
    [Url]
    public string CoverImageUrl { get; set; }

    [Required]
    public SeriesStatus Status { get; set; }

    public int[]? LanguageIds { get; set; }
    public int[]? TagIds { get; set; }
}

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}

public class LanguageDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}

public class ChapterListItemDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public int Number { get; set; }
    public DateTime UploadedAt { get; set; }
}