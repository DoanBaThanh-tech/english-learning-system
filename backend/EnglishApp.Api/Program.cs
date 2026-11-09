using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.Common.Middleware;
using EnglishApp.Api.Common.Options;
using EnglishApp.Api.Data;
using EnglishApp.Api.Repositories.Base;
using EnglishApp.Api.Repositories.Specific;
using EnglishApp.Api.Services.External;
using EnglishApp.Api.Services.Implementations;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();

var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Thiếu ConnectionStrings:Default. Hãy cấu hình trong appsettings.Development.json.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options
        .UseSqlServer(connectionString, sql =>
        {
            sql.EnableRetryOnFailure(3);
            sql.CommandTimeout(60);
        })
        .ConfigureWarnings(w => w.Ignore(
            Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.MultipleCollectionIncludeWarning)));

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var generatedJwtKey = false;
if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    jwtOptions.Key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    generatedJwtKey = true;
}
builder.Services.AddSingleton(jwtOptions);

var aiOptions = builder.Configuration.GetSection(AiOptions.SectionName).Get<AiOptions>() ?? new AiOptions();
var externalOptions = builder.Configuration.GetSection(ExternalApiOptions.SectionName).Get<ExternalApiOptions>() ?? new ExternalApiOptions();
builder.Services.AddSingleton(aiOptions);
builder.Services.AddSingleton(externalOptions);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddHttpClient("dictionary", client =>
{
    client.BaseAddress = new Uri("https://api.dictionaryapi.dev/");
    client.Timeout = TimeSpan.FromSeconds(Math.Max(5, externalOptions.TimeoutSeconds));
    client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", externalOptions.UserAgent);
});

builder.Services.AddHttpClient("translate", client =>
{
    client.BaseAddress = new Uri("https://api.mymemory.translated.net/");
    client.Timeout = TimeSpan.FromSeconds(Math.Max(5, externalOptions.TimeoutSeconds));
    client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", externalOptions.UserAgent);
});

builder.Services.AddHttpClient("translate-google", client =>
{
    client.BaseAddress = new Uri("https://translate.googleapis.com/");
    client.Timeout = TimeSpan.FromSeconds(Math.Max(5, externalOptions.TimeoutSeconds));
    client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", externalOptions.UserAgent);
});

builder.Services.AddHttpClient("ai", client =>
{
    client.Timeout = TimeSpan.FromSeconds(Math.Max(10, aiOptions.TimeoutSeconds));
    client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", externalOptions.UserAgent);
});

builder.Services.AddHttpClient("web", client =>
{
    client.Timeout = TimeSpan.FromSeconds(Math.Max(8, externalOptions.TimeoutSeconds));
    client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", externalOptions.UserAgent);
});

// Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IWordRepository, WordRepository>();
builder.Services.AddScoped<IUserWordRepository, UserWordRepository>();

// Domain services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProgressService, ProgressService>();
builder.Services.AddScoped<IStatsService, StatsService>();
builder.Services.AddScoped<IReferenceService, ReferenceService>();
builder.Services.AddScoped<IDictionaryService, DictionaryService>();
builder.Services.AddScoped<IVocabularyService, VocabularyService>();
builder.Services.AddScoped<IStudyService, StudyService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<IPronunciationService, PronunciationService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IErrorService, ErrorService>();
builder.Services.AddScoped<IReadingService, ReadingService>();
builder.Services.AddScoped<ISourceLessonService, SourceLessonService>();
builder.Services.AddScoped<IPlanService, PlanService>();
builder.Services.AddScoped<DatabaseSeeder>();

// External providers (AI tùy chọn; nếu thiếu key sẽ fallback offline)
builder.Services.AddScoped<IDictionaryApiClient, DictionaryApiClient>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddScoped<IAiService, OpenAiService>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseStaticFiles();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Skyword API");
    });
    app.MapGet("/", () => Results.Redirect("/scalar/v1"));
}

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "Skyword API",
    timeUtc = DateTime.UtcNow
}));

app.MapControllers();

var logger = app.Services.GetRequiredService<ILogger<Program>>();

if (generatedJwtKey)
{
    logger.LogWarning(
        "Jwt:Key chưa được cấu hình. Đang dùng khóa tạm cho môi trường phát triển; " +
        "access token sẽ hết hiệu lực khi khởi động lại API.");
}

if (app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Không thể seed dữ liệu. Kiểm tra kết nối SQL Server và schema.");
    }
}

app.Run();

public partial class Program;
