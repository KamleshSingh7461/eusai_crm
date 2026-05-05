# EUSAI Hub: Mac Setup & Distribution Guide

This guide provides the tactical sequence for setting up the EUSAI Hub development environment on a Mac (MacBook/Mac Studio) using a professional Apple Developer Account to generate iOS and macOS builds.

---

## 1. Environment Initialization
**Perform these steps on the Mac first.**

1. **Install Homebrew**:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **Install Flutter SDK**:
   ```bash
   brew install --cask flutter
   ```
3. **Install Xcode**: Download from the Mac App Store and run once to install components.
4. **Pre-flight Check**:
   ```bash
   flutter doctor
   ```
   *Ensure Xcode and CocoaPods are marked as ready.*

---

## 2. Repository Synchronization
1. **Clone the Intelligence**:
   ```bash
   git clone -b dev-app https://github.com/KamleshSingh7461/eusai_crm.git
   cd eusai_crm/eusai_messenger_app
   ```
2. **Install Dependencies**:
   ```bash
   flutter pub get
   cd ios && pod install && cd ..
   cd macos && pod install && cd ..
   ```

---

## 3. Signing Configuration (Tactical Alignment)
**This step connects your friend's Developer Account to the software.**

1. **Open Xcode Project**:
   *   For iOS: `open ios/Runner.xcworkspace`
   *   For macOS: `open macos/Runner.xcworkspace`
2. **Select Team**:
   *   Go to the **Runner** target in the sidebar.
   *   Select the **Signing & Capabilities** tab.
   *   Under **Team**, click "Add Account" and sign in with your friend's Apple ID.
   *   Select the team name from the dropdown.
3. **Bundle ID Verification**: Ensure the Bundle Identifier is unique (e.g., `com.eusaiteam.hub`).

---

## 4. Generating iOS Build (.ipa)
1. **Build the Archive**:
   ```bash
   flutter build ipa --release
   ```
2. **Locate Artifact**: 
   *   Path: `build/ios/ipa/eusai_hub.ipa`
3. **Submission**: Use the **Transporter** app (available on Mac App Store) to drag and drop the `.ipa` for App Store Connect.

---

## 5. Generating macOS Build (.dmg)
1. **Build the Application**:
   ```bash
   flutter build macos --release
   ```
2. **Locate the `.app`**: 
   *   Path: `build/macos/Build/Products/Release/eusai_hub.app`
3. **Create the Installer (.dmg)**:
   *   Create a new folder named `Dist`.
   *   Copy `eusai_hub.app` into the `Dist` folder.
   *   Open **Disk Utility** on the Mac.
   *   Go to **File > New Image > Image from Folder...**
   *   Select the `Dist` folder.
   *   Set "Image Format" to **compressed**.
   *   Save as `EUSAI_Hub_MacOS.dmg`.
4. **Publish**: Move this `.dmg` to the `public/downloads` folder in the CRM web project.

---

## 6. Cleanup & Security
1. **Remove Credentials**: Once the build is complete, remember to log out of the Apple ID in Xcode (**Settings > Accounts**) to maintain security.
2. **Git Sync**: Commit any configuration changes (like updated Bundle IDs) back to the repository.
   ```bash
   git add .
   git commit -m "Build: Updated macOS/iOS signing configurations"
   git push origin dev-app
   ```

> [!TIP]
> If you encounter "Signing errors," click **"Automatically manage signing"** in Xcode to let it generate the profiles for you.
