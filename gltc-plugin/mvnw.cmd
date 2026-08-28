@echo off
setlocal
cd /d "%~dp0"
set "WRAPPER_JAR=%CD%\.mvn\wrapper\maven-wrapper.jar"
if not exist "%WRAPPER_JAR%" (
  echo Could not find maven-wrapper.jar at %WRAPPER_JAR%
  exit /B 1
)
java -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%CD%" org.apache.maven.wrapper.MavenWrapperMain %*
