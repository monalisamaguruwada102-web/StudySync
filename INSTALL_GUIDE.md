# Installation Guide

## 1. Quick Install
1.  Navigate to the `dist_electron` folder on your desktop.
2.  Double-click `StudySync Setup 0.0.0.exe`.
3.  The app will install automatically and launch.

## 2. "Windows protected your PC" Warning
Since this app is built locally and not digitally signed (which costs money), Windows SmartScreen might flag it. This is normal for internal apps.

**To bypass:**
1.  Click **"More info"**.
2.  Click **"Run anyway"**.

## 3. Accessing from Other Devices (Network Install)
You can download the installer from other devices (like your phone or another laptop) connected to the same Wi-Fi.

1.  **Start the Server**:
    Ensure your app is running on your main computer (`npm run dev` or `npm start`).

2.  **Find Your IP Address**:
    - Open Command Prompt.
    - Type `ipconfig` and press Enter.
    - Look for `IPv4 Address` (e.g., `192.168.1.15`).

3.  **Open in Browser**:
    On your other device, open Chrome/Safari and go to:
    `http://YOUR_IP_ADDRESS:5173/login` (for Dev mode)
    or
    `http://YOUR_IP_ADDRESS:3001/login` (for Production mode)

4.  **Download**:
    Use the "Download for Desktop" button on the login screen. It will download the `.exe` directly from your main computer.
