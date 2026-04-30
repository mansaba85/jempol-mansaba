@echo off
echo Starting Full Build Test...
cd client
echo [1/4] Installing Client Deps...
call npm install
echo [2/4] Building Client...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

cd ../server
echo [3/4] Installing Server Deps...
call npm install
echo [4/4] Building Server...
call npx prisma generate
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo SUCCESS: Full Build Passed!
