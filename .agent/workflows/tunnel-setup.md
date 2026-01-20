---
description: How to start the Off Rez Connect application using ngrok tunnel
---

To use the ngrok tunnel (recommended for testing on physical devices outside your local network), follow these steps:

### 1. Create an ngrok Account
- Go to [ngrok.com](https://ngrok.com/) and create a free account.
- In your dashboard, find your **Auth Token** (under "Your Authtoken").

### 2. Configure ngrok in your Terminal
Run the following command in your project terminal to link your account (replace `YOUR_TOKEN` with your actual token):
```powershell
npx expo login
# OR (preferred for ngrok specific issues)
npx ngrok config add-authtoken YOUR_TOKEN
```

### 3. Start the Tunnel
Once configured, use the custom script in `package.json`:
```powershell
npm run tunnel
```

### Why use this?
- **Remote Testing**: Testing the app from a different Wi-Fi or cellular data.
- **Persistent URL**: More stable than basic LAN connections in some environments.

### Troubleshooting
If you see "ngrok tunnel took too long to connect":
1. **Clear Metro Cache**: `npx expo start -c --tunnel`
2. **Check Port**: Make sure port `8081` isn't blocked by a ghost process.
3. **Restart ngrok**: Sometimes ngrok's servers are busy; waiting 2 minutes and retrying usually fixes it.
