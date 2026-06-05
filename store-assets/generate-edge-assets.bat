@echo off
REM ===========================================
REM 生成 Edge Add-ons 商店素材
REM 资源嗅探下载器
REM ===========================================

echo.
echo ========================================
echo   生成 Edge Add-ons 商店素材
echo ========================================
echo.

REM 创建输出目录
if not exist "edge-assets" mkdir "edge-assets"

echo [1/3] 打开素材生成工具...
echo.
echo 请在浏览器中完成以下操作：
echo 1. 点击 "下载商店图标" 按钮
echo 2. 点击 "下载小型促销图" 按钮
echo 3. 点击 "下载大型促销图" 按钮
echo 4. 将下载的文件移动到 edge-assets 文件夹
echo.

REM 打开素材生成工具
start "" "%~dp0generate-edge-assets.html"

echo [2/3] 等待用户下载素材...
echo.
echo 请在浏览器中下载所有素材后，按任意键继续...
pause > nul

echo [3/3] 检查素材文件...
echo.

REM 检查文件是否存在
if exist "edge-assets\edge-store-icon.png" (
    echo ✅ 商店图标已生成
) else (
    echo ❌ 商店图标未找到
)

if exist "edge-assets\edge-small-promo.png" (
    echo ✅ 小型促销图已生成
) else (
    echo ❌ 小型促销图未找到
)

if exist "edge-assets\edge-large-promo.png" (
    echo ✅ 大型促销图已生成
) else (
    echo ❌ 大型促销图未找到
)

echo.
echo ========================================
echo   素材生成完成！
echo ========================================
echo.
echo 请将 edge-assets 文件夹中的图片上传到：
echo https://partner.microsoft.com/dashboard/microsoftedge/overview
echo.
pause
