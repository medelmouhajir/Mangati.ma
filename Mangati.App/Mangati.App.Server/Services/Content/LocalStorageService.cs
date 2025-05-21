using Mangati.App.Server.Services;

namespace Mangati.App.Server.Services.Implementations
{
    public class LocalStorageService : IStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _configuration;
        private readonly string _baseStoragePath;
        private readonly string _baseUrl;

        public LocalStorageService(IWebHostEnvironment env, IConfiguration configuration)
        {
            _env = env;
            _configuration = configuration;

            // Set up storage location - typically in wwwroot/uploads
            _baseStoragePath = Path.Combine(_env.WebRootPath, "uploads");

            // Base URL for accessing files
            _baseUrl = _configuration["StorageSettings:BaseUrl"] ?? "/uploads";

            // Ensure directory exists
            if (!Directory.Exists(_baseStoragePath))
            {
                Directory.CreateDirectory(_baseStoragePath);
            }
        }

        public async Task<string> UploadPageImageAsync(int mangaId, int chapterNumber, int pageNumber, IFormFile file)
        {
            // Create directory structure for this manga/chapter if it doesn't exist
            var mangaDirPath = Path.Combine(_baseStoragePath, mangaId.ToString());
            var chapterDirPath = Path.Combine(mangaDirPath, chapterNumber.ToString());

            if (!Directory.Exists(mangaDirPath))
            {
                Directory.CreateDirectory(mangaDirPath);
            }

            if (!Directory.Exists(chapterDirPath))
            {
                Directory.CreateDirectory(chapterDirPath);
            }

            // Generate a unique filename
            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{pageNumber:D3}{fileExtension}"; // e.g., 001.jpg, 002.png
            var filePath = Path.Combine(chapterDirPath, fileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the URL to access this file
            var relativeFilePath = Path.Combine(
                "uploads",
                mangaId.ToString(),
                chapterNumber.ToString(),
                fileName).Replace("\\", "/");

            return $"/{relativeFilePath}";
        }

        public Task DeletePageImageAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return Task.CompletedTask;
            }

            // Convert URL to file path
            var relativePath = imageUrl.TrimStart('/');
            var filePath = Path.Combine(_env.WebRootPath, relativePath);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            return Task.CompletedTask;
        }
    }
}