# EUSAI Hub Tactical Deployment Walkthrough

This document outlines the standard operating procedure for deploying alterations across the EUSAI ecosystem, from local development to the EC2 production environment.

---

## 1. Web Suite (Frontend & Backend)
**Run these steps when you modify Next.js code, API routes, or UI components.**

### Local Environment (Development)
1. **Sync Changes**:
   ```bash
   git add .
   git commit -m "Tactical: [Brief Description of Change]"
   git push origin dev-app
   ```

### EC2 Production Environment
1. **Remote Access**: Connect to your EC2 instance via SSH.
2. **Pull & Update**:
   ```bash
   cd ~/eusai_crm
   git pull origin dev-app
   ```
3. **Build & Restart**:
   ```bash
   npm run build
   pm2 restart all
   ```

---

## 2. Database Synchronization (Prisma)
**Run these steps ONLY when you modify `prisma/schema.prisma`.**

### EC2 Production Environment
1. **Generate Client**:
   ```bash
   npx prisma generate
   ```
2. **Sync Schema**:
   *If you want to keep existing data and just apply changes:*
   ```bash
   npx prisma db push
   ```
   *If you are doing a formal migration:*
   ```bash
   npx prisma migrate deploy
   ```

---

## 3. Desktop Suite (Windows .exe)
**Run these steps when you modify the Flutter code (`eusai_messenger_app`) and want to update the Windows app.**

### Local Environment
1. **Flutter Build**:
   ```bash
   cd eusai_messenger_app
   flutter build windows
   ```
2. **Generate Installer**: Open **Inno Setup Compiler** and run the `eusai_hub.iss` script.
3. **Publish Assets**: Run the tactical script from the root project directory:
   ```powershell
   .\publish-hub.ps1
   ```
4. **Deploy to Web**: Push the updated assets to GitHub so they appear in the Web CRM.
   ```bash
   git add public/downloads
   git commit -m "Update: EUSAI Hub Windows Build [v1.x.x]"
   git push origin dev-app
   ```

---

## 4. Android Hub (.apk / .aab)
**Run these steps to update the Android app and Google Play Store.**

### Local Environment
1. **Flutter Build (Play Store - RECOMMENDED)**:
   ```bash
   flutter build appbundle --release
   ```
   *   **Target File**: `eusai_messenger_app/build/app/outputs/bundle/release/app-release.aab`
   *   **Action**: Upload this `.aab` file to the **Google Play Console**.

2. **Flutter Build (Direct APK)**:
   ```bash
   flutter build apk --release
   ```
   *   **Target File**: `eusai_messenger_app/build/app/outputs/flutter-apk/app-release.apk`
   *   **Action**: Run `.\publish-hub.ps1` to move this to the web downloads.

---

## 5. iOS Intelligence (.ipa)
**Run these steps to update the iOS app and Apple App Store.**

### Local Environment (macOS Required)
1. **Flutter Build**:
   ```bash
   flutter build ipa --release
   ```
   *   **Target File**: `eusai_messenger_app/build/ios/ipa/eusai_hub.ipa`
   *   **Action**: Upload this file via **Transporter** or **Xcode** to **App Store Connect**.

2. **Submit to Store**: 
   *   Open Xcode.
   *   Go to **Product > Archive**.
   *   Select the archive and click **Distribute App**.
   *   Follow prompts to upload to **App Store Connect**.

---

## Deployment Summary Table

| Change Type | Platform | Location | Primary Command |
| :--- | :--- | :--- | :--- |
| **UI/API** | Web | EC2 | `npm run build && pm2 restart all` |
| **Schema** | Database | EC2 | `npx prisma db push` |
| **App Logic** | Windows | Local | `flutter build windows` + `publish-hub.ps1` |
| **App Logic** | Android | Local | `flutter build apk` + `publish-hub.ps1` |
| **App Logic** | iOS | Local | `flutter build ipa` + App Store Connect |

> [!IMPORTANT]
> Always verify the **EC2 status** via `pm2 status` after a web deployment to ensure all services are running correctly.
