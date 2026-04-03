@echo off
setlocal

set "HTML=%~dp0index.html"
for %%I in ("%HTML%") do set "ABS=%%~fI"
set "URL=file:///%ABS:\=/%"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

set "FLAGS=--autoplay-policy=no-user-gesture-required --disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies"

if exist "%CHROME%" (
    start "" "%CHROME%" %FLAGS% "%URL%"
    exit /b 0
)

if exist "%EDGE%" (
    start "" "%EDGE%" %FLAGS% "%URL%"
    exit /b 0
)

echo Could not find Chrome or Edge in default locations.
echo Open the page manually with browser flags:
echo   --autoplay-policy=no-user-gesture-required
exit /b 1
