# EUSAI Hub: Windows Deployment & Packaging Guide

This document outlines the process for building the raw Windows executable, packaging it into a professional installer with a License Agreement, and locating the final files.

---

## 1. The Build Process

Open your terminal at the root of the Flutter project (`eusai_messenger_app`) and run the build command.

```bash
flutter build windows --release
```

*Note: The Windows build incorporates a custom C++ Polyfill inside `windows/runner/main.cpp` to bypass MSVC 2022 Linker errors caused by the Firebase SDK. This ensures you do not need to downgrade your Visual Studio installation.*

**Raw Artifact Location:** `d:\dev\eusai_crm\eusai_messenger_app\build\windows\x64\runner\Release\eusai_hub.exe`

*(WARNING: You cannot just send this `.exe` file to an operative. It requires the accompanying `data` folder and `.dll` files to function. This is why we use Inno Setup).*

---

## 2. Inno Setup: Creating the Installer (Manual Step)

To package the app into a single, distributable `Setup.exe` that enforces the EUSAI License Agreement, you must use Inno Setup.

1. **Open Inno Setup Compiler** on your Windows machine.
2. Go to **File > Open** and select the configuration script we created:
   `d:\dev\eusai_crm\eusai_messenger_app\windows\installer\setup.iss`
3. Click the **Compile** button (the green play button) at the top.

### What Inno Setup Does:
* It reads the raw `.exe`, the `flutter_windows.dll`, and the entire `data` folder.
* It injects `EUSAI_Agreement.txt` (The Terms of Service).
* It compresses everything into a professional setup wizard.

**Final Installer Location:** `d:\dev\eusai_crm\eusai_messenger_app\build\windows\installer\EUSAI_Hub_Setup.exe`

---

## 3. The Operative Installation Experience

When you send `EUSAI_Hub_Setup.exe` to an operative:
1. They double-click it.
2. They are immediately presented with the **EUSAI Hub - Internal Use and Confidentiality Agreement**.
3. They must select "I accept the agreement" to proceed.
4. The installer automatically places the app in their Programs folder and creates a desktop shortcut.

Once the Inno Setup compilation is complete, you are ready to automate the deployment to your EC2 server (See `04_EC2_WEB_AUTOMATION_GUIDE.md`).
