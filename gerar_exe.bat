@echo off
setlocal
cd /d "%~dp0"

python -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
)

python -m PyInstaller --noconfirm --clean --windowed --onefile --name Organiza --icon="assets\organiza.ico" --collect-all webview --add-data "index.html;." --add-data "styles.css;." --add-data "script.js;." --add-data "assets\organiza.png;assets" main.py
if errorlevel 1 (
    echo.
    echo Nao foi possivel gerar o executavel.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$shell = New-Object -ComObject WScript.Shell; $shortcut = $shell.CreateShortcut((Join-Path (Get-Location) 'dist\Organiza.lnk')); $shortcut.TargetPath = (Join-Path (Get-Location) 'dist\Organiza.exe'); $shortcut.WorkingDirectory = (Join-Path (Get-Location) 'dist'); $shortcut.IconLocation = $shortcut.TargetPath; $shortcut.Save()"
if errorlevel 1 (
    echo.
    echo Nao foi possivel criar o atalho do aplicativo.
    pause
    exit /b 1
)

echo.
echo Executavel criado em: dist\Organiza.exe
echo Atalho criado em: dist\Organiza.lnk
pause
