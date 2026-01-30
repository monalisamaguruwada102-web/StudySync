# Data Persistence - Quick Reference

## ✅ What's Protected

Your StudySync data is now **fully protected** and will persist across:
- Server restarts
- Browser refreshes  
- Network outages
- System crashes

## 📦 Where Your Data Lives

### Server-Side (Primary)
- **Location:** `server/db.json`
- **Backups:** `server/backups/` (last 10 kept)
- **Auto-backup:** Every 5 minutes + on shutdown

### Client-Side (Cache)
- **Location:** Browser localStorage
- **Expiry:** 24 hours
- **Purpose:** Offline viewing

## 🛠️ Common Tasks

### Create Manual Backup
\`\`\`bash
npm run backup
\`\`\`

### Restore from Backup
\`\`\`bash
# 1. Stop server (Ctrl+C)
# 2. Copy backup to db.json
cp server/backups/db-backup-TIMESTAMP.json server/db.json
# 3. Restart server
npm run dev
\`\`\`

### Clear Client Cache
Open browser console (F12):
\`\`\`javascript
localStorage.clear()
\`\`\`

## 🔍 How to Verify

### Test 1: Data Persists After Restart
1. Add some data
2. Stop server (Ctrl+C)
3. Restart: `npm run dev`
4. Data should still be there ✅

### Test 2: Offline Mode Works
1. Load app with server running
2. Stop server
3. Refresh browser
4. Should see cached data + offline notice ✅

### Test 3: Backups Are Created
1. Check `server/backups/` folder
2. Should see timestamped backup files ✅

## 🚨 Troubleshooting

**Problem:** Data disappeared after restart
- **Solution:** Check `server/backups/` and restore latest backup

**Problem:** "Cannot read database" error
- **Solution:** Database will auto-restore from latest backup

**Problem:** Offline mode shows no data
- **Solution:** Data wasn't cached yet. Load pages while online first.

## 📊 What Changed

| File | What Changed |
|------|-------------|
| `server/database.cjs` | Added write queue, error handling, auto-backups |
| `server/index.cjs` | Added graceful shutdown with backup on exit |
| `server/backup.cjs` | Made modular, improved output |
| `src/utils/dataCache.js` | **NEW** - Client-side caching utility |
| `src/services/firestoreService.js` | Integrated caching, offline fallback |
| `src/components/ConnectionStatus.jsx` | Updated offline message |
| `package.json` | Added `npm run backup` script |

## ✨ Key Features

- ✅ **Write Queue** - Prevents data corruption
- ✅ **Auto-Backups** - Every 5 min + on shutdown
- ✅ **Graceful Shutdown** - No data loss on Ctrl+C
- ✅ **Error Recovery** - Auto-restore from backup
- ✅ **Client Cache** - Offline viewing
- ✅ **Manual Backup** - `npm run backup`

Your data is **safe and persistent**! 🎉
