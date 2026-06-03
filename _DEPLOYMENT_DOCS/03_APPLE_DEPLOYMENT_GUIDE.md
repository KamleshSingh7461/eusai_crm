# EUSAI Hub: Apple Ecosystem Deployment Guide (iOS & macOS)

This guide provides the tactical sequence for setting up the environment on a Mac hardware unit to generate the Apple-specific binaries. **Apple strictly requires a physical or cloud Mac to compile iOS and macOS applications.**

---

## 1. Environment Initialization (On the Mac)

1. **Install Homebrew**:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **Install Flutter SDK**:
   ```bash
   brew install --cask flutter
   ```
3. **Install Xcode**: Download from the Mac App Store and run once to install components.

---

## 2. Code Synchronization & Dependency Installation

1. **Clone the Intelligence**:
   ```bash
   git clone -b dev-app https://github.com/KamleshSingh7461/eusai_crm.git
   cd eusai_crm/eusai_messenger_app
   ```
2. **Fetch Packages**:
   ```bash
   flutter pub get
   ```
3. **Install Native Pods (CRITICAL)**:
   ```bash
   cd ios && pod install && cd ..
   cd macos && pod install && cd ..
   ```
   *(Note: If you are on an M1/M2/M3 Silicon Mac and `pod install` fails, use `arch -x86_64 pod install` instead).*

---

## 3. Xcode Code Signing (Developer Account)

You must connect an Apple Developer Account ($99/yr) to authorize the builds.

1. **Open Xcode Workspaces**:
   * For iOS: `open ios/Runner.xcworkspace`
   * For macOS: `open macos/Runner.xcworkspace`
2. **Select Team**:
   * Click the **Runner** target in the left sidebar.
   * Go to the **Signing & Capabilities** tab.
   * Click "Add Account" and sign in with the Apple Developer ID.
   * Check **"Automatically manage signing"**.

---

## 4. Generating iOS Build (.ipa)

1. **Build the Archive**:
   ```bash
   flutter build ipa --release
   ```
2. **Artifact Location:** `build/ios/ipa/eusai_hub.ipa`
3. **Submission**: Download the **Transporter** app from the Mac App Store, log in, and drag the `.ipa` file into it to upload to App Store Connect / TestFlight.

---

## 5. Generating macOS Build (.dmg)

*Note: The `macos/Runner/Release.entitlements` file has already been configured to allow `com.apple.security.network.client`, ensuring Firebase and CRM APIs function correctly outside the Mac sandbox.*

1. **Build the Application**:
   ```bash
   flutter build macos --release
   ```
2. **Artifact Location:** `build/macos/Build/Products/Release/eusai_hub.app`
3. **Create the Installer (.dmg)**:
   * Create a folder named `Dist` on the Desktop.
   * Copy `eusai_hub.app` into `Dist`.
   * Open **Disk Utility** -> **File > New Image > Image from Folder...**
   * Select `Dist`, set format to **compressed**, and save as `EUSAI_Hub_MacOS.dmg`.

---

## 6. App Review Credentials (CRITICAL)

When submitting the iOS app to App Store Connect, Apple will reject internal apps unless they can log in and test it.

1. Create a dummy user in your CRM: `appreview@eusai.com` / `EusaiSecure2026!`.
2. In App Store Connect, scroll to **App Review Information**.
3. Check **"Sign-in required"** and enter the credentials.
4. **Notes section:** *"This is an internal enterprise application for EUSAI staff communication. We have provided a test account so your review team can access the secure dashboard and verify functionality."*
