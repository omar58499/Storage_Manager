# Firebase Setup Instructions

Your app is now configured with Firebase for persistent file storage. Follow these steps to complete the setup:

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project" or "Add project"
3. Enter a project name (e.g., "Storage Manager")
4. Click "Create project"

## Step 2: Set Up Realtime Database

1. In Firebase Console, click "Realtime Database" (left sidebar)
2. Click "Create Database"
3. Choose location (closest to you)
4. Start in **Test Mode** (for now, you can secure it later)
5. Click "Create"

## Step 3: Enable Authentication

1. In Firebase Console, click "Authentication" (left sidebar)
2. Click "Get Started"
3. Click "Email/Password"
4. Toggle "Enable" and click "Save"

## Step 4: Get Your Config

1. In Firebase Console, click the gear icon ⚙️ (top left)
2. Click "Project Settings"
3. Scroll down to "Your apps"
4. Click the Web icon `</>`
5. Copy your config object that looks like:
```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
}
```

## Step 5: Update firebaseConfig.ts

1. Open `firebaseConfig.ts` in this project
2. Replace the placeholder config with your actual Firebase config from Step 4
3. Save the file

## Step 6: You're Done!

The app will now:
- ✅ Store files in Firebase Realtime Database
- ✅ Authenticate users with email/password
- ✅ Files persist after page refresh
- ✅ Each user has their own isolated files

## Security Rules (Optional - Do This Later)

After testing, update your Realtime Database security rules:

1. Go to Realtime Database
2. Click "Rules" tab
3. Replace with:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['files', 'grCounter'])"
      }
    }
  }
}
```
4. Click "Publish"

This ensures each user can only access their own files.
