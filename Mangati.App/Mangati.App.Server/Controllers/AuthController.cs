using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Mangati.App.Server.Dtos;
using Mangati.App.Server.Models.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Mangati.App.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if email already exists
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email is already registered" });
            }

            // Check if username already exists
            existingUser = await _userManager.FindByNameAsync(model.Username);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Username is already taken" });
            }

            // Create new user
            var user = new ApplicationUser
            {
                UserName = model.Username,
                Email = model.Email,
                EmailConfirmed = true // Auto-confirm for now, consider adding email verification later
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            // Assign appropriate role
            string role = model.Role.ToLower() switch
            {
                "writer" => "Writer",
                "admin" => "Admin", // Should be restricted in a real app
                _ => "Viewer" // Default role
            };

            // Check if the role exists
            if (!await _roleManager.RoleExistsAsync(role))
            {
                // Fall back to Viewer role
                role = "Viewer";
            }

            await _userManager.AddToRoleAsync(user, role);

            // Generate token for the new user
            var token = await GenerateJwtTokenAsync(user);
            var userDto = await CreateUserDtoAsync(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = userDto
            });
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: false);
            if (!result.Succeeded)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Generate token
            var token = await GenerateJwtTokenAsync(user);
            var userDto = await CreateUserDtoAsync(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = userDto
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            // Use "sub" claim instead of ClaimTypes.NameIdentifier since we cleared default mappings
            var userId = User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("No 'sub' claim found in token. Available claims: {Claims}",
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            var userDto = await CreateUserDtoAsync(user);
            return Ok(userDto);
        }

        [HttpGet("debug")]
        [Authorize]
        public IActionResult DebugAuth()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            var roles = User.FindAll("role").Select(c => c.Value).ToList();

            // Use "sub" instead of ClaimTypes.NameIdentifier
            var userId = User.FindFirst("sub")?.Value;
            var email = User.FindFirst("email")?.Value;
            var username = User.FindFirst("unique_name")?.Value;

            var debugInfo = new
            {
                IsAuthenticated = User.Identity.IsAuthenticated,
                AuthenticationType = User.Identity.AuthenticationType,
                Name = User.Identity.Name,
                UserId = userId,
                Email = email,
                Username = username,
                AllClaims = claims,
                RoleClaims = roles,
                IsInWriterRole = User.IsInRole("Writer"),
                IsInAdminRole = User.IsInRole("Admin"),
                IsInViewerRole = User.IsInRole("Viewer"),
                // Test different case variations
                IsInWriterRoleUppercase = User.IsInRole("WRITER"),
                IsInWriterRoleLowercase = User.IsInRole("writer"),
                ClaimsCount = claims.Count,
                RoleClaimsCount = roles.Count
            };

            _logger.LogInformation("Debug auth called. User {UserId} with roles: {Roles}", userId, string.Join(", ", roles));

            return Ok(debugInfo);
        }


        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key is not configured"));
            var tokenExpiryMinutes = jwtSettings.GetValue<int>("TokenExpirationInMinutes");

            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
        new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

            // Add roles - KEEP ORIGINAL CASING (Remove ToUpperInvariant())
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role)); // ← Fixed: No case conversion
            }

            // Log the claims for debugging
            _logger.LogInformation("Creating token for user {Username} with roles: {Roles}",
                user.UserName, string.Join(", ", roles));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(tokenExpiryMinutes),
                Issuer = jwtSettings["ValidIssuer"],
                Audience = jwtSettings["ValidAudience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        private async Task<UserDto> CreateUserDtoAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var createdAt = DateTime.UtcNow; // In a real app, you might store this in the user entity

            return new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                Roles = roles.ToList(),
                CreatedAt = createdAt
            };
        }



        [HttpGet("test-writer")]
        [Authorize(Roles = "Writer")]
        public IActionResult TestWriter()
        {
            return Ok(new { Message = "Writer role access successful!", Time = DateTime.UtcNow });
        }

        [HttpGet("test-admin")]
        [Authorize(Roles = "Admin , ADMIN")]
        public IActionResult TestAdmin()
        {
            return Ok(new { Message = "Admin role access successful!", Time = DateTime.UtcNow });
        }
    }
}