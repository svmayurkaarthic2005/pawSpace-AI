@echo off
echo 🔄 Restarting React Native app with clean cache...

echo 📦 Clearing Metro cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo 🤖 Cleaning Android build...
cd android
call gradlew.bat clean
cd ..

echo 🚀 Starting Metro bundler with reset cache...
echo    After Metro starts, open a NEW terminal and run: npm run android
npx react-native start --reset-cache
