[Setup]
AppId={{EUSAI-HUB-1A2B3C4D}
AppName=EUSAI Hub
AppVersion=1.0.1
AppPublisher=EUSAI
AppPublisherURL=https://eusai.com
AppSupportURL=https://eusai.com
AppUpdatesURL=https://eusai.com
DefaultDirName={autopf}\EUSAI Hub
DisableProgramGroupPage=yes
LicenseFile=EUSAI_Agreement.txt
OutputDir=..\..\build\windows\installer
OutputBaseFilename=EUSAI_Hub_Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "..\..\build\windows\x64\runner\Release\eusai_hub.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\build\windows\x64\runner\Release\*.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\build\windows\x64\runner\Release\data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs createallsubdirs
; Note: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\EUSAI Hub"; Filename: "{app}\eusai_hub.exe"
Name: "{autodesktop}\EUSAI Hub"; Filename: "{app}\eusai_hub.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\eusai_hub.exe"; Description: "{cm:LaunchProgram,EUSAI Hub}"; Flags: nowait postinstall skipifsilent
