@echo off
if exist "%~dp0docker-compose.yml" (
    cd /d "%~dp0"
) else if exist "%~dp0..\docker-compose.yml" (
    cd /d "%~dp0.."
)

echo Checking Docker container status...

:: Check if the container defined in docker-compose.yml is running
set CONTAINER_ID=
for /f "tokens=*" %%i in ('docker compose ps -q 2^>nul') do set CONTAINER_ID=%%i

if "%CONTAINER_ID%"=="" (
    echo ==================================================
    echo STATUS: STOPPED
    echo The FinHealthSnap Docker application is not currently running.
    echo ==================================================
    echo Starting the application...
    docker compose up -d
    echo.
    echo Application started successfully in the background!
    echo You can access it at: http://localhost:3005 ^(or whichever port is configured^)
) else (
    echo ==================================================
    echo STATUS: RUNNING
    echo The FinHealthSnap Docker application is currently running.
    echo ==================================================
    set /p USER_INPUT="Would you like to STOP it? (y/n): "
    
    if /i "%USER_INPUT%"=="y" (
        echo Stopping the application...
        docker compose down
        echo Application stopped successfully.
    ) else (
        echo Action canceled. The application remains running.
    )
)
