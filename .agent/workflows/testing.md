---
description: How to test the Off Rez Connect mobile application
---

To test the application, follow these steps:

### 1. Start the Development Server
Run the following command in your terminal within the project directory:
```powershell
npm run start
```
This will start the Expo CLI and display a QR code.

### 2. View the App
You have three options to see the app in action:

- **Physical Device (Recommended)**: Download the **Expo Go** app (Android/iOS) and scan the QR code from the terminal.
- **Android Emulator**: Ensure you have Android Studio/Emulator running and press `a` in the terminal.
- **iOS Simulator**: (Mac only) Ensure you have Xcode/Simulator running and press `i` in the terminal.

### 3. Test the User Roles
Once the app is open:
1. **Student View**: On the Login screen, select the "Student" tab and enter any email (e.g., `student@test.com`). Press Login.
2. **Owner View**: Logout (or reload), select the "Owner" tab on the Login screen, and enter any email (e.g., `owner@test.com`). Press Login.

### 4. Interactive Testing
- **Search**: Go to the Explore tab and use the search bar to filter houses.
- **Details**: Click on any property card to see images, amenities, and owner info.
- **Chat**: Click "Chat with Owner" on a details page, or view the "Messages" tab.
- **Owner Dashboard**: Check the stats and management features while logged in as an owner.
