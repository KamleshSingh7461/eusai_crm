# EUSAI Hub: EC2 Automation & Web Deployment Pipeline

This document explains the final step of the distribution process: bridging the compiled desktop and mobile apps to your live Next.js CRM so operatives can download them directly from the web server.

---

## 1. The Automation Script (`publish-hub.ps1`)

We have created a highly efficient PowerShell script that automates moving your compiled artifacts from the Flutter project into your Next.js web project.

### Prerequisites:
Before running this script, you MUST have completed the following:
1. `flutter build apk --release` (To generate the Android APK)
2. `flutter build windows --release` (To generate the raw Windows EXE)
3. **Compiled the Inno Setup script** (`setup.iss`) to generate the `EUSAI_Hub_Setup.exe` installer.

### Running the Automation
Open PowerShell at the root of your `eusai_crm` directory and execute:
```powershell
.\publish-hub.ps1
```

### What the Script Does:
1. It locates `app-release.apk` and copies it to `d:\dev\eusai_crm\public\downloads\eusai_hub_android.apk`.
2. It locates `EUSAI_Hub_Setup.exe` (from your Inno Setup) and copies it to `d:\dev\eusai_crm\public\downloads\EUSAI_Hub_Setup.exe`.
3. It automatically compresses the Windows Setup into a `.zip` file for operatives who have aggressive firewalls blocking `.exe` downloads.

---

## 2. Syncing to EC2

Because the `publish-hub.ps1` script places the files directly into the `public/downloads` directory of your Next.js project, **the EC2 update is entirely automated by your existing web deployment flow.**

To push the new app versions live to the world:

1. Commit the web changes:
   ```bash
   git add public/downloads/*
   git commit -m "Deploy: Updated Hub Client Download Binaries"
   git push origin main
   ```
2. Trigger your standard EC2 deployment protocol (e.g., pulling the git repo on the server and restarting pm2/docker).

---

## 3. The End-User Experience

Once the EC2 server pulls the latest code, your operatives can instantly download the clients by visiting your CRM's URL:

*   **Android APK:** `https://your-crm-url.com/downloads/eusai_hub_android.apk`
*   **Windows Setup:** `https://your-crm-url.com/downloads/EUSAI_Hub_Setup.exe`
*   **Windows Zip:** `https://your-crm-url.com/downloads/EUSAI_Hub_Setup.zip`

*(Note: Apple restricts direct web downloads of iOS `.ipa` files without an Enterprise MDM profile. iOS users must use TestFlight/App Store. macOS users can download the `.dmg` if you place it in the same `public/downloads` folder).*
