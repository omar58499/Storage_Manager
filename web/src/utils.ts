// Web utilities for file management
const METADATA_KEY = 'uploaded_files_metadata';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string; // Base64 or blob URL
  grNo: string;
  uploadDate: number;
  type: string;
}

// Generate serial number (GR No.)
export const generateGrNo = (count: number): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `GR-${String(count + 1).padStart(4, '0')}-${timestamp}`;
};

// Get file type
export const getFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
    return 'image';
  }
  
  if (['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'].includes(extension)) {
    return 'video';
  }
  
  if (['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma'].includes(extension)) {
    return 'audio';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  if (['txt', 'doc', 'docx', 'json', 'xml', 'csv', 'md'].includes(extension)) {
    return 'document';
  }
  
  return 'unknown';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Format date
export const formatDate = (ms: number): string => {
  try {
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch (error) {
    return 'Invalid Date';
  }
};

// Read file as data URL
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Save file metadata
export const saveFileMetadata = (files: FileItem[]): void => {
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving file metadata:', error);
  }
};

// Load file metadata
export const loadFileMetadata = (): FileItem[] => {
  try {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading file metadata:', error);
    return [];
  }
};

// Add uploaded file
export const addUploadedFile = async (
  file: File,
  dataUrl: string
): Promise<FileItem> => {
  const existingFiles = loadFileMetadata();
  const grNo = generateGrNo(existingFiles.length);
  const uploadDate = Date.now();
  const uniqueId = `${grNo}-${uploadDate}`;

  const newFile: FileItem = {
    id: uniqueId,
    name: file.name,
    size: file.size,
    dataUrl,
    grNo,
    uploadDate,
    type: getFileType(file.name),
  };

  existingFiles.push(newFile);
  saveFileMetadata(existingFiles);
  return newFile;
};

// Get all uploaded files
export const getUploadedFiles = (): FileItem[] => {
  return loadFileMetadata();
};

// Delete uploaded file
export const deleteUploadedFile = (id: string): void => {
  const files = loadFileMetadata();
  const filtered = files.filter(f => f.id !== id);
  saveFileMetadata(filtered);
};
