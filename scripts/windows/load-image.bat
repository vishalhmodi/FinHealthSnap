@echo off
if exist "%~dp0finhealthsnap-release.tar" (
    cd /d "%~dp0"
) else if exist "%~dp0..\finhealthsnap-release.tar" (
    cd /d "%~dp0.."
)

echo Loading FinHealthSnap Docker image. This may take a few minutes...
docker load -i finhealthsnap-release.tar

echo.
echo Load complete.
echo Press any key to exit...
pause >nul
