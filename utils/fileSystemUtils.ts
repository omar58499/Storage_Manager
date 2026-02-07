import * as FileSystem from 'expo-file-system/legacy';

export interface FileItem {
  id: string;
  uri: string;
  name: string;
  size: number;
  modificationTime: number;
  isDirectory: boolean;
  grNo?: string; // Serial/Growth number
  uploadDate?: number; // Upload timestamp
}

// Storage file path
const METADATA_FILE = (FileSystem.documentDirectory || '') + 'uploaded_files_metadata.json';

// Generate serial number (GR No.)
export const generateGrNo = (count: number): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `GR-${String(count + 1).padStart(4, '0')}-${timestamp}`;
};

// Save file metadata to JSON file
export const saveFileMetadata = async (files: FileItem[]): Promise<void> => {
  try {
    await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(files, null, 2));
  } catch (error) {
    console.error('Error saving file metadata:', error);
  }
};

// Load file metadata from JSON file
export const loadFileMetadata = async (): Promise<FileItem[]> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(METADATA_FILE);
    if (!fileInfo.exists) {
      return [];
    }
    const data = await FileSystem.readAsStringAsync(METADATA_FILE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading file metadata:', error);
    return [];
  }
};

// Add new uploaded file with metadata
export const addUploadedFile = async (
  uri: string,
  name: string,
  size: number
): Promise<FileItem> => {
  const existingFiles = await loadFileMetadata();
  const grNo = generateGrNo(existingFiles.length);
  const uploadDate = Date.now();
  const uniqueId = `${grNo}-${uploadDate}`;

  const newFile: FileItem = {
    id: uniqueId,
    uri,
    name,
    size,
    modificationTime: uploadDate,
    isDirectory: false,
    grNo,
    uploadDate,
  };

  existingFiles.push(newFile);
  await saveFileMetadata(existingFiles);
  return newFile;
};

// Get all uploaded files
export const getUploadedFiles = async (): Promise<FileItem[]> => {
  return await loadFileMetadata();
};

// Delete uploaded file
export const deleteUploadedFile = async (id: string): Promise<void> => {
  const files = await loadFileMetadata();
  const filtered = files.filter(f => f.id !== id);
  await saveFileMetadata(filtered);

  // Also delete the actual file
  try {
    const fileInfo = await FileSystem.getInfoAsync(id);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(id);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export const getFilesFromDirectory = async (dirUri: string): Promise<FileItem[]> => {
  try {
    if (!dirUri || dirUri.trim() === '') {
      throw new Error('Invalid directory path: path is empty');
    }

    // Normalize the directory path (remove trailing slash for consistency)
    const normalizedDir = dirUri.endsWith('/') ? dirUri.slice(0, -1) : dirUri;
    
    // Check if directory exists first
    const dirInfo = await FileSystem.getInfoAsync(normalizedDir);
    if (!dirInfo.exists) {
      // Try to create the directory if it doesn't exist (for documentDirectory)
      try {
        await FileSystem.makeDirectoryAsync(normalizedDir, { intermediates: true });
      } catch {
        throw new Error(`Directory does not exist: ${normalizedDir}`);
      }
    }

    const files = await FileSystem.readDirectoryAsync(normalizedDir);
    const fileItems: FileItem[] = [];

    for (const fileName of files) {
      try {
        const fileUri = `${normalizedDir}/${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists) {
          fileItems.push({
            id: fileUri,
            uri: fileUri,
            name: fileName,
            size: fileInfo.size || 0,
            modificationTime: fileInfo.modificationTime || 0,
            isDirectory: fileInfo.isDirectory || false,
          });
        }
      } catch (error) {
        console.warn(`Warning reading file: ${fileName}`, error);
      }
    }

    return fileItems;
  } catch (error) {
    console.error('Error reading directory:', dirUri, error);
    throw error;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (timestamp: number): string => {
  try {
    // Handle both seconds and milliseconds
    const ms = timestamp > 9999999999 ? timestamp : timestamp * 1000;
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch (error) {
    return 'Invalid Date';
  }
};

// Get file type from filename
export const getFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
    return 'image';
  }
  
  // Video types
  if (['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'].includes(extension)) {
    return 'video';
  }
  
  // Audio types
  if (['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma'].includes(extension)) {
    return 'audio';
  }
  
  // PDF
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  // Text/Document types
  if (['txt', 'doc', 'docx', 'json', 'xml', 'csv', 'md'].includes(extension)) {
    return 'document';
  }
  
  return 'unknown';
};

