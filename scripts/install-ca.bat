@echo off
echo ====================================================
echo RENTipid - Installing mkcert CA into Windows Trust Store
echo ====================================================
echo.
"C:\Users\user\AppData\Local\Microsoft\WinGet\Packages\FiloSottile.mkcert_Microsoft.Winget.Source_8wekyb3d8bbwe\mkcert.exe" -install
echo.
echo If you saw a Security Warning dialog, please ensure you clicked YES.
echo.
pause
