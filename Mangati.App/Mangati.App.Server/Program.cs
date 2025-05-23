using Mangati.App.Server.Data;
using Mangati.App.Server.Models.Users;
using Mangati.App.Server.Services;
using Mangati.App.Server.Services.Implementations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Mangati.App.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add database context
            if (builder.Environment.IsDevelopment() && !builder.Configuration.GetValue<bool>("UseDockerDatabase", false))
            {
                builder.Services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("MangatiApp"));
            }
            else
            {
                builder.Services.AddDbContext<ApplicationDbContext>(options =>
                {
                    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                    options.UseSqlServer(connectionString, sqlServerOptions =>
                    {
                        sqlServerOptions.EnableRetryOnFailure(
                            maxRetryCount: 10,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                        sqlServerOptions.CommandTimeout(30);
                    });

                    if (builder.Environment.IsDevelopment())
                    {
                        options.EnableDetailedErrors();
                        options.EnableSensitiveDataLogging();
                    }
                });

                builder.Services.AddHealthChecks()
                    .AddDbContextCheck<ApplicationDbContext>(
                        name: "database",
                        tags: new[] { "db", "sql", "sqlserver" });
            }

            // Add Identity
            builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequiredLength = 8;

                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();


            ConfigureJwtAuthentication(builder);

            // Add CORS
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins(
                            "http://localhost:53109",
                            "http://localhost:5173",
                            "http://localhost:3000",
                            "http://localhost:5000",
                            "http://localhost",
                            "https://localhost:53109",
                            "https://localhost:5173",
                            "https://localhost:3000",
                            "https://localhost:5000",
                            "https://localhost"
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            // Register services
            builder.Services.AddScoped<IStorageService, LocalStorageService>();

            // Add controllers and API explorer
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();

            // Add Swagger
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Manga Reader API",
                    Version = "v1"
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Create uploads directory
            var uploadsPath = Path.Combine(app.Environment.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            // CRITICAL: Middleware order matters!
            app.UseCors();
            app.UseAuthentication(); // MUST come before UseAuthorization
            app.UseAuthorization();

            app.MapControllers();
            app.MapFallbackToFile("/index.html");

            // Health checks
            app.MapHealthChecks("/health", new HealthCheckOptions
            {
                ResponseWriter = async (context, report) =>
                {
                    context.Response.ContentType = "application/json";
                    var response = new
                    {
                        Status = report.Status.ToString(),
                        Duration = report.TotalDuration,
                        Info = report.Entries.Select(e => new
                        {
                            Key = e.Key,
                            Status = e.Value.Status.ToString(),
                            Duration = e.Value.Duration,
                            Description = e.Value.Description,
                            Data = e.Value.Data
                        })
                    };
                    await context.Response.WriteAsJsonAsync(response);
                }
            });

            // Database seeding
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
                    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

                    context.Database.EnsureCreated();

                    SeedRoles(roleManager).Wait();
                    SeedAdminUser(userManager).Wait();
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while seeding the database.");
                }
            }

            Console.WriteLine("Starting application...");

            app.Run();
        }

        private static async Task SeedRoles(RoleManager<IdentityRole> roleManager)
        {
            foreach (var role in new[] { "Admin", "Writer", "Viewer" })
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }

        private static async Task SeedAdminUser(UserManager<ApplicationUser> userManager)
        {
            if (!userManager.Users.Any())
            {
                var adminUser = new ApplicationUser
                {
                    UserName = "admin@mangati.app",
                    Email = "admin@mangati.app",
                    EmailConfirmed = true
                };

                await userManager.CreateAsync(adminUser, "Admin123!@#");
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }


        private static void ConfigureJwtAuthentication(WebApplicationBuilder builder)
        {
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key is not configured");

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // Only require HTTPS in production
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey)),
                    ValidateIssuer = false, // Set to true in production and specify issuer
                    ValidateAudience = false, // Set to true in production and specify audience
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // Remove default 5-minute tolerance for token expiration
                };

                // For signalR support (if needed later)
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });
        }
    }
}