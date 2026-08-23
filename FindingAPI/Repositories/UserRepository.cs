using FindingAPI.Data;
using FindingAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var cleanEmail = (email ?? string.Empty).Trim().ToLower();
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == cleanEmail);
    }

    public async Task<User?> GetByMysteryNameAsync(string mysteryName)
    {
        var clean = (mysteryName ?? string.Empty).Trim();
        return await _dbSet.FirstOrDefaultAsync(u => u.AnonymousUsername == clean);
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
        => await _dbSet.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

    public async Task<bool> EmailExistsAsync(string email)
    {
        var cleanEmail = (email ?? string.Empty).Trim().ToLower();
        return await _dbSet.AnyAsync(u => u.Email == cleanEmail);
    }

    public async Task<bool> MysteryNameExistsAsync(string mysteryName)
    {
        var clean = (mysteryName ?? string.Empty).Trim();
        return await _dbSet.AnyAsync(u => u.AnonymousUsername == clean);
    }
}
