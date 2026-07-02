using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace BlueHarbor_QPD_WSA.Server.Infrastructure;

/// <summary>
/// Rete di sicurezza per le eccezioni NON gestite dai controller.
/// Le registra nei log e risponde con un ProblemDetails 500 pulito,
/// senza mai esporre lo stack trace al client.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IProblemDetailsService _problemDetailsService;

    public GlobalExceptionHandler(
        ILogger<GlobalExceptionHandler> logger,
        IProblemDetailsService problemDetailsService)
    {
        _logger = logger;
        _problemDetailsService = problemDetailsService;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception,
            "Eccezione non gestita su {Method} {Path}",
            httpContext.Request.Method, httpContext.Request.Path);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        // true = eccezione gestita; il ProblemDetails viene scritto nella risposta.
        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails =
            {
                Title = "Errore interno del server.",
                Detail = "Si è verificato un problema imprevisto. Riprova più tardi.",
                Status = StatusCodes.Status500InternalServerError
            }
        });
    }
}
