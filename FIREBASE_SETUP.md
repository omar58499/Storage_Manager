# Web-Based File Storage

Your app uses **browser-based localStorage** for persistent file storage. No backend or Firebase setup required!

## How It Works

Files are stored in your browser's localStorage with the following features:

- ✅ **No server needed** - Files stored locally on your device
- ✅ **Persistent storage** - Files survive page refresh
- ✅ **User-specific** - Each logged-in user has their own file list
- ✅ **Unique tracking** - Each file gets a GR No. (serial number)
- ✅ **Metadata management** - File size, upload date, and type are tracked

## Storage Details

### Storage Location
Files are stored in browser's `localStorage` under the key `uploaded_files_metadata`

### File Format
Each file is stored as:

```typescript
{
  id: string;              // Unique identifier (GR-XXXX-timestamp)
  name: string;            // Original filename
  size: number;            // File size in bytes
  dataUrl: string;         // Base64-encoded file data
  grNo: string;            // Serial number (GR-0001, GR-0002, etc.)
  uploadDate: number;      // Upload timestamp (milliseconds)
  type: string;            // File type (image, video, audio, pdf, document, unknown)
}
```

### Storage Limits

- **Chrome/Edge:** ~10MB per domain
- **Firefox:** ~10MB per domain
- **Safari:** ~5MB per domain

## Getting Started

No configuration needed! Just:

1. Open the web app in your browser
2. Login with your credentials (see [web/index.tsx](web/index.tsx) for demo accounts)
3. Upload files - they're automatically saved to localStorage
4. Files persist even after closing your browser

## API Reference

The storage functions are in [web/src/utils.ts](web/src/utils.ts):

### Load Files
```typescript
import { loadFileMetadata } from './src/utils';

const files = loadFileMetadata(); // Returns FileItem[]
```

### Add File
```typescript
import { addUploadedFile, readFileAsDataUrl } from './src/utils';

const file = event.target.files[0];
const dataUrl = await readFileAsDataUrl(file);
const uploadedFile = await addUploadedFile(file, dataUrl);
```

### Delete File
```typescript
import { deleteUploadedFile } from './src/utils';

deleteUploadedFile(fileId);
```

### Get File Type
```typescript
import { getFileType } from './src/utils';

const type = getFileType('image.jpg'); // Returns 'image'
```

## Limitations

- Files are stored **only on your device** - not synced across browsers or devices
- Files are **deleted if browser cache is cleared**
- Limited by browser storage quota (~10MB)
- Not meant for sensitive data (not encrypted)

## Upgrading to Cloud Storage

If you later want cloud backup:
1. Uncomment Firebase imports in [web-app.tsx](web-app.tsx)
2. Update to use Cloud Storage APIs
3. Follow Firebase console setup for Storage and Authentication

For now, everything works locally in your browser!
4. Click "Publish"

This ensures each user can only access their own data.

### Configure Cloud Storage CORS (important for browser uploads)

If you enable Cloud Storage for browser uploads you must add a CORS rule so the browser's preflight (OPTIONS) succeeds. A `cors.json` has been added to the project root for development.

Apply it with the Cloud SDK (`gsutil`):

```bash
# From the repo root (where cors.json lives):
gsutil cors set cors.json gs://storagemanager-69c10.appspot.com
```

Or use the Console:
- Console → Storage → Browser → select `storagemanager-69c10.appspot.com` → Edit CORS configuration → paste `cors.json` → Save

After applying CORS, hard-refresh the site (Ctrl+F5) and retry uploads. For quick dev testing you may add `"*"` to `origin`, but avoid that in production.

### Local free alternative (no Firebase Storage / billing needed)

If you prefer not to enable Cloud Storage (or can't upgrade your Firebase project), you can run a simple local upload server included in this repo.

How it works:
- Run the local server which accepts file uploads and serves them at `http://localhost:4000/uploads/<file>`.
- The client `saveUploadedFile` will upload to the local server and still save file metadata in the Realtime Database so the UI works the same.

To run the local server:

```bash
# install new dependencies
npm install

# start the local upload server
npm run upload-server
```

Then open the web app (Expo web) and upload files — they will be stored locally in `server/uploads` and served from `http://localhost:4000/uploads/`.

Environment options:
- `REACT_APP_FORCE_LOCAL_UPLOAD=true` — force local uploads even if Firebase Storage is available.
- `REACT_APP_LOCAL_UPLOAD_URL` — override upload URL (default `http://localhost:4000/upload`).
- `REACT_APP_LOCAL_UPLOAD_URL_BASE` — override base URL for generated download links (default `http://localhost:4000`).

