using FindingAPI.Data;
using FindingAPI.Models.Entities;

namespace FindingAPI.Repositories;

public class ReportRepository : Repository<Report>, IReportRepository
{
    public ReportRepository(AppDbContext context) : base(context) { }
}
