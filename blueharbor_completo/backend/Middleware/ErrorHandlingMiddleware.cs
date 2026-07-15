// ═══ SPRINT 7 ═══
// UNICO punto di gestione errori: i controller non hanno try/catch.
// Ogni eccezione diventa una risposta ProblemDetails (RFC 7807), il formato
// standard studiato nel modulo RESTful API.
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context); // lascia passare la richiesta...
        }
        catch (NotFoundException ex)
        {
            await WriteProblemAsync(context, StatusCodes.Status404NotFound, "Risorsa non trovata", ex.Message);
        }
        catch (DomainException ex)
        {
            await WriteProblemAsync(context, StatusCodes.Status409Conflict, "Operazione non consentita", ex.Message);
        }
        catch (Exception ex)
        {
            // Errore imprevisto: log completo lato server, dettaglio generico al client.
            _logger.LogError(ex, "Errore non gestito su {Path}", context.Request.Path);
            await WriteProblemAsync(context, StatusCodes.Status500InternalServerError,
                "Errore interno", "Si è verificato un errore imprevisto.");
        }
    }

    private static async Task WriteProblemAsync(HttpContext context, int status, string title, string detail)
    {
        context.Response.StatusCode = status;
        // Il Content-Type va passato ESPLICITAMENTE a WriteAsJsonAsync: l'overload
        // senza parametro contentType sovrascriverebbe l'header con il default
        // "application/json; charset=utf-8". Il media type corretto per gli errori
        // è "application/problem+json", come prescrive la RFC 7807 (modulo RESTful API).
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        }, options: null, contentType: "application/problem+json");
    }
}
