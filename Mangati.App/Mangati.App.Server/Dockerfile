# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Mangati.App/Mangati.App.Server/Mangati.App.Server.csproj", "Mangati.App/Mangati.App.Server/"]
COPY ["Mangati.App/mangati.app.client/mangati.app.client.esproj", "Mangati.App/mangati.app.client/"]
RUN dotnet restore "./Mangati.App/Mangati.App.Server/Mangati.App.Server.csproj"
COPY . .
WORKDIR "/src/Mangati.App/Mangati.App.Server"
RUN dotnet build "./Mangati.App.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Mangati.App.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Mangati.App.Server.dll"]