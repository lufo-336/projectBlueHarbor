// ═══ SPRINT 1 (composizione) ═══
// Bootstrap dell'applicazione: DI, controller, Swagger, middleware errori.
// Niente UseHttpsRedirection: in dev stiamo dietro il proxy Vite, in prod
// dietro nginx (Sprint 9); il TLS è responsabilità del bordo, non dell'API.
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Middleware;
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

// --- Dependency Injection (modulo C#: DI per non fare new dei servizi a mano) ---
builder.Services.AddSingleton<Db>();          // stateless: una sola istanza basta
builder.Services.AddScoped<SettingsService>();
builder.Services.AddScoped<ShipGeneratorService>();
builder.Services.AddScoped<HistoryService>();
builder.Services.AddScoped<BerthAssignmentService>();
builder.Services.AddScoped<TimeService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();             // autodocumentazione (Sprint 5)

// ═══ SPRINT 6 ═══ Autenticazione a cookie: l'API è consumata dal browser
// (fetch con credentials: 'include'), il cookie HttpOnly non è leggibile da JS (anti-XSS).
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "BlueHarbor.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        // Siamo un'API, non un sito con pagine: mai redirect alla login page,
        // solo status code che il frontend sa interpretare.
        options.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddScoped<AuthService>();

var app = builder.Build();

// Il middleware errori è PRIMO nella pipeline: avvolge tutto il resto.
app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();   // http://localhost:5200/swagger
}

app.UseAuthentication();  // CHI sei (legge il cookie)
app.UseAuthorization();   // COSA puoi fare (confronta i ruoli)

app.MapControllers();
app.Run();
