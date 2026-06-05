@echo off
REM ===========================================
REM Microsoft Edge Add-ons 打包脚本
REM 资源嗅探下载器
REM ===========================================

echo.
echo ========================================
echo   开始打包 Microsoft Edge 扩展
echo ========================================
echo.

REM 设置变量
set SOURCE_DIR=%~dp0
set OUTPUT_DIR=%~dp0..\dist
set OUTPUT_FILE=%OUTPUT_DIR%\resource-sniffer-edge.zip

REM 创建输出目录
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM 删除旧文件
if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"

echo [1/4] 清理临时文件...

REM 创建临时目录
set TEMP_DIR=%TEMP%\resource-sniffer-build
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo [2/4] 复制扩展文件...

REM 复制必要文件
xcopy "%SOURCE_DIR%manifest.json" "%TEMP_DIR%\" /Y
xcopy "%SOURCE_DIR%background.js" "%TEMP_DIR%\" /Y
xcopy "%SOURCE_DIR%content.js" "%TEMP_DIR%\" /Y
xcopy "%SOURCE_DIR%popup" "%TEMP_DIR%\popup\" /Y /E /I
xcopy "%SOURCE_DIR%options" "%TEMP_DIR%\options\" /Y /E /I
xcopy "%SOURCE_DIR%lib" "%TEMP_DIR%\lib\" /Y /E /I
xcopy "%SOURCE_DIR%icons" "%TEMP_DIR%\icons\" /Y /E /I
xcopy "%SOURCE_DIR%_locales" "%TEMP_DIR%\_locales\" /Y /E /I

echo [3/4] 创建 ZIP 文件...

REM 使用 PowerShell 创建 ZIP
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%OUTPUT_FILE%' -Force"

echo [4/4] 清理临时文件...

REM 清理临时目录
rmdir /s /q "%TEMP_DIR%"

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 输出文件: %OUTPUT_FILE%
echo.
echo 请将此文件上传到 Microsoft Edge Add-ons
echo 网址: https://partner.microsoft.com/dashboard/microsoftedge/overview
echo.
pause
