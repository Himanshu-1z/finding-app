using FindingAPI.Models.Entities;

namespace FindingAPI.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByMysteryNameAsync(string mysteryName);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> MysteryNameExistsAsync(string mysteryName);
}
