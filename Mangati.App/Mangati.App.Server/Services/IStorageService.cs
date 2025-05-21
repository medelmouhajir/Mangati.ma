namespace Mangati.App.Server.Services;

public interface IStorageService
{
    /// <summary>
    /// Uploads a page image to storage and returns the URL
    /// </summary>
    Task<string> UploadPageImageAsync(int mangaId, int chapterNumber, int pageNumber, IFormFile file);

    /// <summary>
    /// Deletes a page image from storage
    /// </summary>
    Task DeletePageImageAsync(string imageUrl);
}