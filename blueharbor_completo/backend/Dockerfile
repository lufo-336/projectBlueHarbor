# ═══ SPRINT 9 ═══
# Multi-stage build (modulo Infrastruttura): lo stage "build" usa l'SDK
# completo, l'immagine finale solo il runtime ASP.NET (molto più piccola).
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Prima solo il csproj: il restore resta in cache finché non cambiano i pacchetti.
COPY BlueHarbor.Api.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# In container si ascolta su 8080 (non privilegiata); la connection string
# arriva da docker-compose via variabile d'ambiente.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BlueHarbor.Api.dll"]
