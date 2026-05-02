; --- EUSAI Hub Tactical Deployment Script ---
#define MyAppName "EUSAI Hub"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "EUSAI Team"
#define MyAppURL "https://crm.eusaiteam.com"
#define MyAppExeName "eusai_hub.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
AppId={{EUSAI-HUB-TACTICAL-2026-STABILIZED}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
SetupIconFile=D:\dev\eusai_crm\eusai_messenger_app\windows\runner\resources\app_icon.ico
; The output file will be created in your build directory
OutputDir=D:\dev\eusai_crm\eusai_messenger_app\build\windows\installer
OutputBaseFilename=EUSAI_Hub_Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; IMPORTANT: This points to your Flutter Windows Release folder
Source: "D:\dev\eusai_crm\eusai_messenger_app\build\windows\x64\runner\Release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\dev\eusai_crm\eusai_messenger_app\build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
