using System.Text;
using FindingAPI.Data;
using FindingAPI.Hubs;
using FindingAPI.Repositories;
using FindingAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// --- Database (SQL Server LocalDB) ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- Repositories ---
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IConfessionRepository, ConfessionRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IInteractionRepository, InteractionRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();

// --- Services ---
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// --- Controllers & SignalR ---
builder.Services.AddControllers();
builder.Services.AddSignalR();

// --- JWT Authentication ---
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "FindingSecretJwtKey32BytesLongMinimumForHmacSha256!";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "Finding",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "FindingUsers",
        ValidateLifetime = false,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/chat"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// --- Swagger ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Finding API",
        Version = "v1",
        Description = "Anonymous College Social & Confession Platform API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

var app = builder.Build();

// --- Ensure Database Created ---
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();
    Console.WriteLine("Database migrated successfully!");
}

// --- Middleware Pipeline ---
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Finding API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// --- Static Files & Single Localhost Hosting ---
var distPath = Path.Combine(builder.Environment.ContentRootPath, "../../frontend/dist");
if (!Directory.Exists(distPath))
    distPath = Path.Combine(builder.Environment.ContentRootPath, "../frontend/dist");
if (!Directory.Exists(distPath))
    distPath = Path.Combine(builder.Environment.ContentRootPath, "frontend/dist");

if (Directory.Exists(distPath))
{
    var fileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(Path.GetFullPath(distPath));
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fileProvider });
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

if (Directory.Exists(distPath))
{
    var fullDistPath = Path.GetFullPath(distPath);
    app.MapFallback(async context =>
    {
        var path = context.Request.Path.Value ?? "";
        if (!path.StartsWith("/api") && !path.StartsWith("/swagger") && !path.StartsWith("/hubs"))
        {
            var indexPath = Path.Combine(fullDistPath, "index.html");
            if (File.Exists(indexPath))
            {
                context.Response.ContentType = "text/html";
                await context.Response.SendFileAsync(indexPath);
                return;
            }
        }
        context.Response.StatusCode = 404;
    });
}
else
{
    app.MapGet("/", () => Results.Redirect("/swagger"));
}

app.Run();
