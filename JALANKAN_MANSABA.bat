@echo off
title SISTEM ABSENSI MANSABA
color 0b

echo ==========================================
echo    MEMULAI APLIKASI ABSENSI MANSABA
echo ==========================================
echo.

:: 1. Menjalankan Server Backend
echo [1/3] Menjalankan Server Backend (Port 3001)...
start "MANSABA BACKEND" /min cmd /k "cd /d "%~dp0server" && npm run dev"

:: 2. Menjalankan Server Frontend
echo [2/3] Menjalankan Server Frontend (Port 5173)...
start "MANSABA FRONTEND" /min cmd /k "cd /d "%~dp0client" && npm run dev"

:: 3. Menjalankan Tunneling ke VPS (Domain Publik)
echo [3/3] Menjalankan Tunneling ke Domain...
start "TUNNELING VPS" cmd /k "ssh -R 8080:localhost:5173 root@62.72.7.236"

echo.
echo ------------------------------------------
echo BERHASIL! Aplikasi berjalan di background.
echo.
echo Akses Lokal: http://localhost:5173
echo Akses Online: https://jariku.manubanyuputih.id
echo ------------------------------------------
echo.
echo JANGAN TUTUP jendela hitam yang muncul di Taskbar!
echo Masukkan password VPS jika diminta pada jendela Tunneling.
echo.
echo Tekan tombol apa saja untuk menutup jendela ini...
pause > nul
