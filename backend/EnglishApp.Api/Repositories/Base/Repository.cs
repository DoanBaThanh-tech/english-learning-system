using EnglishApp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Repositories.Base;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Db;
    protected readonly DbSet<T> Set;

    public Repository(AppDbContext db)
    {
        Db = db;
        Set = db.Set<T>();
    }

    public IQueryable<T> Query() => Set.AsQueryable();

    public async Task<T?> GetByIdAsync(object id, CancellationToken ct = default) =>
        await Set.FindAsync(new[] { id }, ct);

    public async Task AddAsync(T entity, CancellationToken ct = default) =>
        await Set.AddAsync(entity, ct);

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default) =>
        await Set.AddRangeAsync(entities, ct);

    public void Update(T entity) => Set.Update(entity);

    public void Remove(T entity) => Set.Remove(entity);

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => Db.SaveChangesAsync(ct);
}
