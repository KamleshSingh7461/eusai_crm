# EUSAI Hub: Android Deployment & Publishing Guide

This document outlines the exact, end-to-end process for building the Android application, locating the files, and publishing them to the Google Play Console for internal EUSAI operatives.

---

## 1. The Build Process

When you are ready to release a new version of the EUSAI Hub for Android, open your terminal at the root of the Flutter project (`eusai_messenger_app`) and run the following commands.

### Clean & Fetch (Recommended before every release)
```bash
flutter clean
flutter pub get
```

### Build the APK (For Direct Operative Sideloading)
Use this if you want to send a file directly to an operative via Slack or Email, bypassing the Play Store entirely.
```bash
flutter build apk --release
```
**Artifact Location:** `d:\dev\eusai_crm\eusai_messenger_app\build\app\outputs\flutter-apk\app-release.apk`

### Build the App Bundle (For Google Play Console Upload)
Use this when you are submitting the official update to Google Play. Google requires the `.aab` format because it is highly optimized.
```bash
flutter build appbundle --release
```
**Artifact Location:** `d:\dev\eusai_crm\eusai_messenger_app\build\app\outputs\bundle\release\app-release.aab`

---

## 2. Google Play Console Publishing

Once you have the `.aab` file, you must upload it to the Google Play Console.

1. Log into your **Google Play Console**.
2. Select **EUSAI Hub**.
3. Go to **Production** (or Internal Testing) in the left menu.
4. Click **Create new release** at the top right.
5. Drag and drop the `app-release.aab` file into the App Bundles section.
6. Add your Release Notes for the operatives (e.g., "Added encrypted background notifications").
7. Click **Save** and then **Review release**.

---

## 3. App Review Credentials (CRITICAL FOR APPROVAL)

Because EUSAI Hub is a private, internal B2B application, a Google reviewer will not be able to log in without a valid account. **If they cannot log in, they will reject the app.**

To ensure 100% approval rates, you must provide a dedicated test account in the Play Console settings.

1. **Create the User:** First, ensure a user with the email `appreview@eusai.com` (Password: `EusaiSecure2026!`) exists in your CRM database and is added to at least one chat channel.
2. **Play Console Setup:**
   * Go to the Play Console dashboard.
   * Scroll down the left menu to **App content**.
   * Under **App access**, click **Manage**.
   * Select **"All or some functionality is restricted"**.
   * Click **Add new instructions**.
   * Name: "Reviewer Login".
   * Provide the email and password above.
   * **Instructions:** *"This is a secure internal communication tool exclusively for EUSAI employees. Please use the provided credentials to bypass the login screen and review the messaging interface."*

Once this is saved, you can safely rollout your release.
