using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Manager.Services;

using oncalltool.Backend.Common.Demo;
var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();

builder.Services.AddOpenApi();


builder.Services.AddDbContext<AppDbContext>(
    options =>
        options.UseNpgsql(
            builder.Configuration
                .GetConnectionString("DefaultConnection")
        )
);


builder.Services.AddScoped<ManagerService>();
builder.Services.AddScoped<CsvOnCallImportService>();


var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseHttpsRedirection();

app.UseDefaultFiles();

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();
using (var scope =
    app.Services.CreateScope())
{
    var db =
        scope.ServiceProvider
            .GetRequiredService<AppDbContext>();


    await DemoDataSeeder.SeedAsync(
        db);
}


app.Run();