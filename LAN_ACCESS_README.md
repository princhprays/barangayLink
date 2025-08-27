# 🌐 LAN Access Setup for BarangayLink

This guide explains how to make your BarangayLink app accessible from other devices on your local network (LAN).

## 🚀 Quick Start

### Option 1: Using npm scripts (Recommended)
```bash
# In the frontend directory
npm run start:lan
```

### Option 2: Using provided scripts
- **Windows**: Double-click `start-lan.bat` in the frontend folder
- **Unix/Linux/Mac**: Run `./start-lan.sh` in the frontend folder

### Option 3: Manual environment variable
```bash
# Windows (PowerShell)
$env:HOST="0.0.0.0"; npm start

# Unix/Linux/Mac
HOST=0.0.0.0 npm start
```

## 📱 Accessing from Other Devices

1. **Find your PC's IP address:**
   - **Windows**: Run `ipconfig` in Command Prompt
   - **Mac/Linux**: Run `ifconfig` or `ip addr` in Terminal
   - Look for your local IP (usually starts with `192.168.x.x`, `10.x.x.x`, or `172.16-31.x.x`)

2. **Access the app:**
   - Frontend: `http://YOUR_IP:3000` (e.g., `http://192.168.1.100:3000`)
   - Backend API: `http://YOUR_IP:5000` (e.g., `http://192.168.1.100:5000`)

## 🔧 What Was Changed

### Backend (server.js)
- ✅ Server now listens on `0.0.0.0:5000` instead of just `localhost:5000`
- ✅ CORS updated to allow requests from LAN IP addresses
- ✅ Added logging for LAN access

### Frontend (package.json)
- ✅ Added `"proxy": "http://localhost:5000"` for API calls
- ✅ Added `start:lan` script for easy LAN access
- ✅ Added `cross-env` dependency for cross-platform compatibility

### Frontend (apiClient.js)
- ✅ Removed hardcoded `http://localhost:5000`
- ✅ Now uses relative paths (`/api`) that work with the proxy

## 🌍 Network Configuration

### CORS Allowed Origins
The backend now accepts requests from:
- `http://localhost:3000` (local development)
- `http://192.x.x.x:*` (common home network range)
- `http://10.x.x.x:*` (common LAN range)
- `http://172.16-31.x.x:*` (common LAN range)

### Proxy Configuration
- Frontend dev server proxies all `/api/*` requests to `http://localhost:5000`
- This means API calls work seamlessly from any device on your network

## 🧪 Testing LAN Access

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend (LAN mode)
   cd frontend
   npm run start:lan
   ```

2. **Test from another device:**
   - Open `http://YOUR_IP:3000` on your phone/tablet
   - Try to log in or register
   - Check browser console for any errors

3. **Verify API calls:**
   - All API calls should work without CORS errors
   - Login/registration should work from LAN devices

## 🔒 Security Notes

- This setup is for **local development only**
- Your app will be accessible to anyone on your WiFi network
- Don't use this configuration in production
- Consider using a firewall to restrict access if needed

## 🐛 Troubleshooting

### "Connection refused" errors
- Ensure both backend and frontend are running
- Check that backend is listening on `0.0.0.0:5000`
- Verify your firewall allows connections on ports 3000 and 5000

### CORS errors
- Restart both servers after making changes
- Check that CORS patterns in `server.js` include your network range
- Verify the proxy is working in `package.json`

### Can't access from other devices
- Ensure both servers are running with LAN access
- Check your router's settings (some routers block local network access)
- Try accessing from a device on the same WiFi network first

## 📋 Summary

Your BarangayLink app is now configured for LAN access! Users on your local network can:

✅ Access the frontend at `http://YOUR_IP:3000`  
✅ Log in and register without errors  
✅ Use all app features from mobile devices  
✅ Access the API through the proxy system  

The app maintains all existing functionality while being accessible across your local network.
