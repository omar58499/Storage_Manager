# File Browser React Native App

A React Native application for browsing files on your phone with advanced filtering and sorting capabilities.

## Features

- 📂 Browse all files and directories on your device
- 🔍 **Search** files by name in real-time
- **Filter By:**
  - Name: Filter files by filename
  - Date: Filter by modification date
  - ID: Filter by unique file identifier (URI)
  - Size: Filter files by maximum size
- **Sort By:**
  - Name (alphabetically)
  - Size (smallest to largest)
  - Date (newest to oldest)
  - ID (alphabetically)
- 📄 View detailed file information
  - File ID (unique identifier)
  - File size with human-readable format
  - Modification date and time
  - File type (Folder/File)
  - Full file path
- 📤 Share file information
- 🔄 Navigate through directories
- ⬅️ Go back to parent directories

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Setup

1. Navigate to the project directory:
```bash
cd "Storage APK"
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Choose your platform:
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for Web

## Project Structure

```
Storage APK/
├── App.tsx                 # Main application component
├── components/
│   └── FileList.tsx       # File listing with filtering and sorting
├── utils/
│   └── fileSystemUtils.ts # File system utilities and helpers
├── package.json           # Project dependencies
├── app.json              # Expo configuration
└── index.js              # Entry point
```

## How to Use

### Browsing Files
1. App starts in the Documents directory
2. Tap on folders to navigate into them
3. Use the "← Back" button to go to parent directory

### Searching
- Use the search bar at the top to find files by name
- Search works in real-time as you type

### Filtering
1. Select a filter type: Name, Date, ID, or Size
2. Enter the filter value:
   - **Name**: Partial name to match
   - **Date**: Format YYYY-MM-DD (e.g., 2024-01-15)
   - **ID**: Partial file path/ID to match
   - **Size**: Maximum size in KB
3. Results update automatically

### Sorting
- Tap on a sort button to sort files by:
  - **Name**: A-Z alphabetically
  - **Size**: Smallest to largest
  - **Date**: Newest to oldest
  - **ID**: Alphabetically by identifier

### Viewing File Details
1. Tap on any file to see detailed information
2. View the file ID, size, modification date, type, and full path
3. Use "📤 Share File Info" to share file details
4. Tap "← Back" to return to the file list

## File Information Displayed

Each file shows:
- **Name**: The filename
- **ID**: Unique file identifier (full path/URI)
- **Size**: Human-readable file size (B, KB, MB, GB, TB)
- **Modified**: Last modification date and time
- **Icon**: 📁 for folders, 📄 for files

## Permissions

The app requests the following permissions:
- **File System Access**: To read files and directories on your device
- **Photos/Media Library Access**: To browse media files (if applicable)

## Technical Details

- Built with React Native and Expo
- Uses Expo File System API for file operations
- TypeScript for type safety
- Responsive UI with ScrollView and FlatList
- Real-time filtering and sorting

## Troubleshooting

### App won't start
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Permission denied errors
- Make sure you've granted file system permissions to the app
- Check app settings on your device

### Files not showing
- Ensure you have files in the current directory
- Check that the app has proper permissions
- Use the refresh button (🔄) to reload files

## Future Enhancements

- File preview (images, documents)
- Delete/rename files
- File compression
- Download history
- Favorites
- Advanced search with regex
- File type filtering
- Batch operations

## License

MIT

## Support

For issues or feature requests, please refer to the project repository.
