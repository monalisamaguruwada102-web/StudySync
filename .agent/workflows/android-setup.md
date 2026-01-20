---
description: How to fix Android SDK and ADB path errors on Windows
---

If you see the error "Failed to resolve the Android SDK path" or "adb is not recognized", follow these steps:

### Option A: Use a Physical Phone (Easiest)
You do **not** need the Android SDK if you test on your physical phone:
1. Install **Expo Go** from the Google Play Store.
2. Ensure your phone and computer are on the same Wi-Fi (or use `npm run tunnel`).
3. Scan the QR code shown in the terminal.

### Option B: Using an Emulator (Requires Android Studio)
If you want to use the emulator on your PC, you must set your environment variables:

1. **Find your SDK Path**:
   - Open **Android Studio**.
   - Go to **Settings** -> **Languages & Frameworks** -> **Android SDK**.
   - Copy the **Android SDK Location** (e.g., `C:\Users\YourName\AppData\Local\Android\Sdk`).

2. **Set Environment Variables**:
   - Search for "Edit the system environment variables" in Windows Search.
   - Click **Environment Variables**.
   - Under **User variables**, click **New**:
     - Name: `ANDROID_HOME`
     - Value: [Paste your SDK path here]
   - Find the **Path** variable in the same section, click **Edit**, then **New**, and add these two:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\emulator`

3. **Restart your Terminal**:
   - Close and reopen your terminal/VS Code.
   - Run `adb --version` to verify.

4. **Restart Expo**:
   - Run `npx expo start` and press **a** to open on Android.
