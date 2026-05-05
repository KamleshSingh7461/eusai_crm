# EUSAI Hub Tactical Publication Script
# Use this to move builds from Flutter directory to Web Public folder

$windowsSource = "D:\dev\eusai_crm\eusai_messenger_app\build\windows\installer\EUSAI_Hub_Setup.exe"
$androidSource = "D:\dev\eusai_crm\eusai_messenger_app\build\app\outputs\flutter-apk\app-release.apk"
$webDownloadDir = "D:\dev\eusai_crm\public\downloads"

Write-Host "--- TACTICAL DEPLOYMENT INITIATED ---" -ForegroundColor Cyan

# 1. Windows Deployment
if (Test-Path $windowsSource) {
    Write-Host "[WIN] Deploying Windows Installer..." -ForegroundColor White
    Copy-Item $windowsSource -Destination "$webDownloadDir\EUSAI_Hub_Setup.exe" -Force
    
    Write-Host "[WIN] Generating Secure Archive (.zip)..." -ForegroundColor Green
    Compress-Archive -Path "$webDownloadDir\EUSAI_Hub_Setup.exe" -DestinationPath "$webDownloadDir\EUSAI_Hub_Setup.zip" -Force
} else {
    Write-Warning "Windows source not found at $windowsSource"
}

# 2. Android Deployment
if (Test-Path $androidSource) {
    Write-Host "[AND] Deploying Android APK..." -ForegroundColor White
    Copy-Item $androidSource -Destination "$webDownloadDir\eusai_hub_android.apk" -Force
} else {
    Write-Warning "Android source not found at $androidSource"
}

Write-Host "--- DEPLOYMENT COMPLETE ---" -ForegroundColor Cyan
