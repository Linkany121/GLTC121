@echo off
chcp 65001 >nul
setlocal
title GLTC 一键构建
cd /d "%~dp0"

rem ============================================================
rem   GLTC 联合协议 - 一键构建脚本
rem   用法：双击本文件即可（自动编译 + 复制到服务器 plugins）
rem
rem   可调项：
rem    SERVER_PLUGINS ：服务器 plugins 目录，路径变了改这一行
rem    mvnw 里的 -o  ：离线模式（依赖已缓存更快）；
rem                    若报依赖下载失败，把 -o 删掉即可联网下载
rem ============================================================

set "SERVER_PLUGINS=%~dp0..\..\..\..\"
rem 把上面的相对路径展开为规范化的绝对路径（仅用于展示）
for %%I in ("%SERVER_PLUGINS%") do set "SERVER_PLUGINS=%%~fI"

echo.
echo   ========================================
echo     GLTC 联合协议 - 构建
echo   ========================================
echo.

rem 清理旧产物，避免构建失败时误用旧 jar
if exist "target\GLTC.jar" del /f /q "target\GLTC.jar" >nul 2>&1

echo   [1/3] 开始 Maven 打包...
call mvnw.cmd -o package -DskipTests > build.log 2>&1
findstr /C:"BUILD SUCCESS" "build.log" >nul
if errorlevel 1 goto FAIL

echo   [2/3] 构建成功。

if not exist "target\GLTC.jar" goto FAIL2
copy /y "target\GLTC.jar" "%SERVER_PLUGINS%GLTC.jar" >nul
if errorlevel 1 goto FAIL2

echo   [3/3] 已复制到服务器：
echo         %SERVER_PLUGINS%GLTC.jar
echo.
echo   [OK] 全部完成！重启服务器即可生效。
goto END

:FAIL
echo.
echo   [X] 构建失败！错误摘要如下：
findstr /C:"[ERROR]" "build.log"
echo       完整日志见同目录 build.log
goto END

:FAIL2
echo.
echo   [X] jar 复制失败，请检查 SERVER_PLUGINS 路径是否正确。
echo       当前值：%SERVER_PLUGINS%
goto END

:END
echo.
pause
endlocal
