using System.ComponentModel.DataAnnotations;
using Mangati.App.Server.Models.Serie;

namespace Mangati.App.Server.Dtos;

public class ChapterDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public int Number { get; set; }
    public ChapterStatus Status { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class ChapterDetailDto : ChapterDto
{
    public List<PageDto> Pages { get; set; }
}

public class PageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; }
    public int Order { get; set; }
}

public class CreateChapterDto
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; }

    public int? Number { get; set; }  // Optional, will be auto-incremented if not provided

    [Required]
    public List<IFormFile> Pages { get; set; }
}

public class UpdateChapterStatusDto
{
    [Required]
    public ChapterStatus Status { get; set; }
}