# ============================================================================
#  Build multi-stage: un'unica immagine che serve API + SPA compilata.
#  Contesto di build atteso: la cartella blueharbor_sprint2/ (contiene
#  frontend/ e BlueHarbor_QPD_WSA.Server/).
# ============================================================================

# ---- Stage 1: build del frontend (Vite) ----
# node:20 (glibc) invece di alpine: evita i problemi delle dipendenze native
# di rollup/vite su musl.
FROM node:20 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
# npm install (non ci): tollera piccole differenze di lock tra versioni di npm
# e risolve i binari nativi corretti per la piattaforma del container.
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build          # produce /app/frontend/dist

# ---- Stage 2: restore + publish del backend (.NET 10) ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /src
COPY BlueHarbor_QPD_WSA.Server/*.csproj BlueHarbor_QPD_WSA.Server/
RUN dotnet restore BlueHarbor_QPD_WSA.Server/BlueHarbor_QPD_WSA.Server.csproj
COPY BlueHarbor_QPD_WSA.Server/ BlueHarbor_QPD_WSA.Server/
RUN dotnet publish BlueHarbor_QPD_WSA.Server/BlueHarbor_QPD_WSA.Server.csproj \
    -c Release -o /app/publish /p:UseAppHost=false

# ---- Stage 3: runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=backend /app/publish ./
# La SPA compilata va in wwwroot: in Production Program.cs la serve
# (UseStaticFiles + MapFallbackToFile).
COPY --from=frontend /app/frontend/dist ./wwwroot/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BlueHarbor_QPD_WSA.Server.dll"]
