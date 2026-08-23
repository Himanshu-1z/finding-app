using FindingAPI.Data;
using FindingAPI.DTOs.Auth;
using FindingAPI.Models.Entities;
using FindingAPI.Models.Enums;
using FindingAPI.Repositories;

namespace FindingAPI.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;
    private readonly IPasswordService _passwordService;
    private readonly AppDbContext _context;

    public AuthService(
        IUserRepository userRepository,
        IJwtService jwtService,
        IPasswordService passwordService,
        AppDbContext context)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _passwordService = passwordService;
        _context = context;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = (request.Email ?? "").Trim().ToLower();

        if (await _userRepository.EmailExistsAsync(email))
        {
            // Return existing user token if email already registered
            var existingUser = await _userRepository.GetByEmailAsync(email);
            if (existingUser != null)
            {
                if (!string.IsNullOrEmpty(request.CapturedIdImage))
                {
                    existingUser.CapturedIdImage = request.CapturedIdImage;
                    existingUser.StudentIdPhotoUrl = request.CapturedIdImage;
                    _userRepository.Update(existingUser);
                    await _userRepository.SaveChangesAsync();
                }
                var existingToken = _jwtService.GenerateAccessToken(existingUser);
                return new AuthResponse
                {
                    AccessToken = existingToken,
                    RefreshToken = _jwtService.GenerateRefreshToken(),
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    User = MapUserDto(existingUser)
                };
            }
        }

        var photo = request.CapturedIdImage ?? string.Empty;

        var user = new User
        {
            Id = Guid.NewGuid(),
            AnonymousUsername = request.MysteryName ?? "AnonUser_" + Guid.NewGuid().ToString("N")[..6],
            Email = email,
            PasswordHash = _passwordService.HashPassword(request.Password ?? "Password123"),
            RealName = request.RealName ?? "",
            CollegeName = request.College ?? "",
            YearSemester = request.YearSemester ?? "",
            MobileNumber = request.MobileNumber ?? "",
            StudentIdPhotoUrl = photo,
            CapturedIdImage = photo,
            AvatarUrl = photo,
            Gender = Enum.TryParse<Gender>(request.Gender, true, out var g) ? g : Gender.Other,
            DateOfBirth = DateOnly.TryParse(request.DateOfBirth, out var dob) ? dob : new DateOnly(2002, 1, 1),
            VerificationStatus = VerificationStatus.Pending,
            IsSetupComplete = true
        };

        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        await _userRepository.AddAsync(user);

        if (!string.IsNullOrEmpty(photo))
        {
            var verification = new StudentVerification
            {
                UserId = user.Id,
                StudentIdPhotoUrl = photo,
                ExtractedName = user.RealName,
                ExtractedCollege = user.CollegeName,
                Status = VerificationStatus.Pending,
                SubmittedAt = DateTime.UtcNow
            };
            await _context.StudentVerifications.AddAsync(verification);
        }

        await _context.SaveChangesAsync();

        var accessToken = _jwtService.GenerateAccessToken(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = MapUserDto(user)
        };
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var email = (request.Email ?? "").Trim().ToLower();
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null) return null;
        if (!_passwordService.VerifyPassword(request.Password ?? "", user.PasswordHash)) return null;

        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var accessToken = _jwtService.GenerateAccessToken(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = MapUserDto(user)
        };
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string accessToken, string refreshToken)
    {
        var principal = _jwtService.ValidateToken(accessToken);
        if (principal == null) return null;

        var userId = principal.FindFirst("sub")?.Value ?? principal.FindFirst("uid")?.Value;
        if (!Guid.TryParse(userId, out var uid)) return null;

        var user = await _userRepository.GetByIdAsync(uid);
        if (user == null || user.RefreshToken != refreshToken) return null;
        if (user.RefreshTokenExpiry < DateTime.UtcNow) return null;

        var newRefresh = _jwtService.GenerateRefreshToken();
        user.RefreshToken = newRefresh;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = _jwtService.GenerateAccessToken(user),
            RefreshToken = newRefresh,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = MapUserDto(user)
        };
    }

    private static UserDto MapUserDto(User user) => new()
    {
        Id = user.Id,
        MysteryName = user.AnonymousUsername,
        Email = user.Email,
        Gender = user.Gender.ToString(),
        College = user.CollegeName,
        IsAdmin = user.IsAdmin
    };
}
