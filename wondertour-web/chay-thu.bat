@echo off
REM Chay thu Web WonderTour tren may Windows: xTravelOS gia lap + web.
cd /d "%~dp0"
where node >nul 2>nul || (echo Can cai Node.js 22 tu https://nodejs.org roi chay lai. & pause & exit /b 1)
if not exist node_modules call npm ci
if not exist .env copy .env.example .env
start "xTravelOS gia lap" cmd /k npm run dev:mock
timeout /t 4 >nul
start "Web WonderTour" cmd /k npm run dev
timeout /t 6 >nul
start http://localhost:3000
