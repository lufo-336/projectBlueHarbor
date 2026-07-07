using BlueHarbor_QPD_WSA.Server.Infrastructure;
using BlueHarbor_QPD_WSA.Server.Models;
using BlueHarbor_QPD_WSA.Server.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================================================
//  1. CONFIGURAZIONE DEI SERVIZI (dependency injection)
// ==========================================================================

// --- Database: EF Core su SQL Server, connection string da appsettings.json ---
builder.Services.AddDbContext<BlueHarborContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- Controller + serializzazione: gli enum vengono scritti come stringa ("Pending"...) ---
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));

// --- OpenAPI (documento consumato da Scalar per la UI di test) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// --- Gestione errori centralizzata: ProblemDetails standard + handler globale ---
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// --- Servizi di dominio ---
builder.Services.AddScoped<ShipGeneratorService>();
builder.Services.AddScoped<TimeService>();
builder.Services.AddScoped<TokenService>(); // creazione/validazione dei token JWT

var app = builder.Build();

// ==========================================================================
//  SEED: utenti demo per il login (solo se la tabella Users è vuota)
//  Credenziali: operator@blueharbor / operator123  —  scheduler@blueharbor / scheduler123
// ==========================================================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BlueHarborContext>();
    try
    {
        if (!db.Users.Any())
        {
            db.Users.AddRange(
                new User { Username = "operator@blueharbor", PasswordHash = PasswordHasher.Hash("operator123"), Role = "Operator" },
                new User { Username = "scheduler@blueharbor", PasswordHash = PasswordHasher.Hash("scheduler123"), Role = "Scheduler" });
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        // Se il DB non è raggiungibile all'avvio, non blocco l'app: lo segnalo nei log.
        app.Logger.LogWarning(ex, "Seed utenti demo non riuscito.");
    }
}

// ==========================================================================
//  2. PIPELINE HTTP (l'ordine dei middleware conta)
// ==========================================================================

// --- Rete di sicurezza: in cima, cattura le eccezioni di tutto ciò che segue ---
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    // --- Solo in sviluppo: documento OpenAPI + UI Scalar (/scalar/v1) ---
    app.MapOpenApi();
    app.MapScalarApiReference();
}
else
{
    // --- In produzione il backend serve la SPA compilata da wwwroot.
    //     In sviluppo il frontend gira su Vite, quindi qui non serve (evita il warning wwwroot). ---
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseHttpsRedirection();
app.UseAuthorization();

// --- Rotte dei controller (/api/...) ---
app.MapControllers();

// --- Fallback SPA: qualsiasi rotta non-API serve index.html (solo in produzione) ---
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("/index.html");
}

app.Run();
