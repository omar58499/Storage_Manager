import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, database, storage } from './firebaseConfig';
import { ref as storageRef, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, set, get, update, remove, onValue } from 'firebase/database';

interface FileData {
  id: string;
  name: string;
  size: number;
  date: string;
  type: 'file' | 'folder';
  grNo?: string;
}

interface StoredFile {
  fileData: FileData;
  base64: string;
}

interface User {
  username: string;
  password: string;
  files: FileData[];
}

const SORT_OPTIONS: Array<{ value: 'date' | 'date-asc' | 'name' | 'size'; label: string }> = [
  { value: 'date', label: 'Newest' },
  { value: 'date-asc', label: 'Oldest' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' }
];

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const getIcon = (name: string, type: string) => {
  if (type === 'folder') return '📁';
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📄',
    xlsx: '📊',
    xls: '📊',
    pptx: '🎨',
    ppt: '🎨',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    mp4: '🎬',
    mp3: '🎵',
    zip: '📦',
    rar: '📦'
  };
  return map[ext || ''] || '📄';
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#0f172a', backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', backgroundSize: 'cover', backgroundAttachment: 'fixed' } as any,
  scrollContent: { padding: 24, paddingBottom: 48 },
  header: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: '#cbd5e1' },
  userInfo: { marginTop: 16, color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  logoutBtn: { backgroundColor: '#dc2626', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  searchRow: { marginBottom: 20 },
  searchInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
    fontSize: 15,
    color: '#f1f5f9'
  },
  controls: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 },
  uploadButton: { backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginRight: 12, marginBottom: 12 },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
  sortRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 12 },
  sortLabel: { fontSize: 13, color: '#cbd5e1', marginRight: 8, fontWeight: '600' },
  sortChip: { borderRadius: 16, borderWidth: 1, borderColor: '#475569', paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, backgroundColor: '#0f172a' },
  sortChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  sortChipText: { fontSize: 13, color: '#cbd5e1', fontWeight: '600' },
  sortChipTextActive: { color: '#fff' },
  summaryText: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    width: '48%',
    minWidth: 220,
    marginHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    position: 'relative' as any,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardPressed: { transform: [{ scale: 0.97 }] },
  deleteButton: {
    position: 'absolute' as any,
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    cursor: 'pointer' as any
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  icon: { fontSize: 36, marginBottom: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', marginBottom: 12 },
  infoSection: { marginTop: 4 },
  infoText: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#cbd5e1', fontWeight: '500' },
  modalOverlay: { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', padding: 24, zIndex: 9999, display: 'flex' as any },
  modalContent: { width: '90%', maxWidth: 500, backgroundColor: '#1e293b', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20, borderWidth: 1, borderColor: '#334155' },
  modalClose: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 24, fontWeight: '700', color: '#94a3b8' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: '5%',
    backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden'
  } as any,
  authBox: {
    width: 380,
    backgroundColor: '#1e293b',
    padding: 36,
    borderRadius: 16,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#f1f5f9',
    letterSpacing: -0.5 as any
  },
  authSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#cbd5e1',
    marginBottom: 24,
    lineHeight: 1.5
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    fontSize: 15,
    marginBottom: 15,
    fontFamily: 'inherit',
    color: '#f1f5f9'
  },
  errorInput: { borderColor: '#dc2626', backgroundColor: '#7f1d1d' },
  button: {
    marginTop: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15, textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  toggle: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 8
  },
  toggleText: { color: '#3b82f6', fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },
  helperBlock: {
    marginTop: 24,
    borderTopWidth: 0,
    borderTopColor: '#334155',
    paddingTop: 20,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginLeft: -35,
    marginRight: -35,
    marginBottom: -35,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  helperHeading: { fontSize: 12, fontWeight: '600', color: '#cbd5e1', marginBottom: 10, textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  helperText: { fontSize: 13, color: '#94a3b8', marginBottom: 6, cursor: 'pointer', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, userSelect: 'none' as any }
});

// Firebase helper functions
const saveUploadedFile = async (userId: string, fileData: FileData, fileOrBase64: File | string): Promise<string | null> => {
  try {
    const storageReference = storageRef(storage, `users/${userId}/files/${fileData.id}`);

    if (fileOrBase64 instanceof File) {
      await uploadBytes(storageReference, fileOrBase64);
    } else {
      await uploadString(storageReference, fileOrBase64, 'data_url');
    }

    const downloadURL = await getDownloadURL(storageReference);

    const fileRef = ref(database, `users/${userId}/files/${fileData.id}`);
    await set(fileRef, { ...fileData, downloadURL });

    console.log(`Saved file ${fileData.name} (${fileData.id}) for user ${userId} at ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error('Error saving file to Firebase:', error);
    return null;
  }
};

const loadUploadedFiles = async (userId: string): Promise<(FileData & { downloadURL?: string })[]> => {
  try {
    const filesRef = ref(database, `users/${userId}/files`);
    const snapshot = await get(filesRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error('Error loading files from Firebase:', error);
    return [];
  }
};

const deleteFileFromFirebase = async (userId: string, fileId: string) => {
  try {
    const fileRef = ref(database, `users/${userId}/files/${fileId}`);
    await remove(fileRef);
  } catch (error) {
    console.error('Error deleting file from Firebase:', error);
  }
};

const saveGRCounter = async (userId: string, counter: number) => {
  try {
    const counterRef = ref(database, `users/${userId}/grCounter`);
    await set(counterRef, counter);
  } catch (error) {
    console.error('Error saving GR counter:', error);
  }
};

const loadGRCounter = async (userId: string): Promise<number> => {
  try {
    const counterRef = ref(database, `users/${userId}/grCounter`);
    const snapshot = await get(counterRef);
    return snapshot.exists() ? snapshot.val() : 0;
  } catch (error) {
    console.error('Error loading GR counter:', error);
    return 0;
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'date' | 'date-asc' | 'name' | 'size'>('date');
  const [dateFilter, setDateFilter] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<(FileData & { downloadURL?: string })[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ fileId: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsLoggedIn(true);
        const userObj: User = {
          username: user.email || '',
          password: '',
          files: []
        };
        setCurrentUser(userObj);
        // Load user's files from Firebase
        const files = await loadUploadedFiles(user.uid);
        setUploadedFiles(files);
        // Recreate File objects for downloads by fetching the storage download URL
        for (const file of files) {
          if ((file as any).downloadURL) {
            try {
              const res = await fetch((file as any).downloadURL);
              const blob = await res.blob();
              const fileObj = new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
              fileMapRef.current.set(file.id, fileObj);
            } catch (err) {
              console.warn(`Failed to fetch file blob for ${file.name}`, err);
            }
          }
        }
      } else {
        setFirebaseUser(null);
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUploadedFiles([]);
        fileMapRef.current.clear();
      }
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      setIsSignUp(false);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!firebaseUser) return;

    const buffer = Array.from(event.target.files || []);

    // Load current GR counter from Firebase
    let grCounter = await loadGRCounter(firebaseUser.uid);

    if (!grCounter || grCounter <= 0) {
      // Fallback: compute from existing files if counter not present
      let maxGRNum = 0;
      uploadedFiles.forEach(f => {
        if (f.grNo) {
          const parts = f.grNo.replace(/^GR-/, '').split('-');
          const num = parseInt(parts[0], 10);
          if (!isNaN(num) && num > maxGRNum) maxGRNum = num;
        }
      });
      grCounter = maxGRNum;
    }

    // Process each file
    for (const file of buffer) {
      grCounter++;
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const safeId = `${Date.now()}-${randomSuffix}`;
      const descriptor: FileData = {
        id: safeId,
        name: file.name,
        size: file.size,
        date: new Date().toISOString().split('T')[0],
        type: 'file',
        grNo: `GR-${String(grCounter).padStart(3, '0')}`
      };

      // Keep local file reference for immediate preview/download
      fileMapRef.current.set(descriptor.id, file);

      // Upload to Firebase Storage (handles large files) and save metadata
      const downloadURL = await saveUploadedFile(firebaseUser.uid, descriptor, file);

      if (!downloadURL) {
        setError(`Failed to save ${descriptor.name} to cloud. Check console for details.`);
        continue;
      }

      // Update local state only after successful cloud save
      setUploadedFiles(prev => {
        const withoutDupe = prev.filter(f => f.id !== descriptor.id);
        return [...withoutDupe, { ...descriptor, downloadURL } as any];
      });

      if (currentUser) {
        setCurrentUser(prev => {
          if (!prev) return prev;
          const withoutDupe = prev.files.filter(f => f.id !== descriptor.id);
          const updatedFiles = [...withoutDupe, descriptor];
          return { ...prev, files: updatedFiles };
        });
      }
    }

    // Save updated counter
    await saveGRCounter(firebaseUser.uid, grCounter);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFilePress = (file: FileData) => {
    if (file.type === 'folder') {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const previewable = ['pdf', 'mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'docx', 'ppt', 'pptx', 'xlsx','csv','py'];

    if (ext && previewable.includes(ext)) {
      setSelectedFile(file);
      return;
    }

    const rawFile = fileMapRef.current.get(file.id);
    if (rawFile) {
      const url = URL.createObjectURL(rawFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteClick = (fileId: string, fileName: string, e: any) => {
    e.stopPropagation();
    setDeleteConfirmation({ fileId, fileName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation || !currentUser || !firebaseUser) return;

    const { fileId } = deleteConfirmation;

    // Remove from uploaded files
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

    // Remove from current user's files
    const updatedFiles = currentUser.files.filter(f => f.id !== fileId);
    const updatedUser = { ...currentUser, files: updatedFiles };
    setCurrentUser(updatedUser);

    // Remove from Firebase
    await deleteFileFromFirebase(firebaseUser.uid, fileId);

    // Clear file map reference
    fileMapRef.current.delete(fileId);

    setDeleteConfirmation(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  if (!isReady) {
    return null;
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <View style={styles.authContainer}>
        {/* Left side branding */}
        <View style={{ position: 'absolute', left: '5%', top: '50%', transform: [{ translateY: -140 }], zIndex: 2, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 100 }}>📂</Text>

          <Text style={{ fontSize: 56, fontWeight: '800', color: 'white', marginTop: 18, marginBottom: 6, letterSpacing: -1 as any }}>
            File Explorer
          </Text>
          <Text style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.95)', fontWeight: '300' }}>
            Manage your files securely
          </Text>
        </View>

        <View style={styles.authBox}>
          <Text style={styles.authTitle}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          <Text style={styles.authSubtitle}>
            {isSignUp ? 'Join File Explorer today' : 'Sign in to continue to your files.'}
          </Text>

          <TextInput
            style={[styles.input, error ? styles.errorInput : null]}
            placeholder="Email (e.g. you@example.com)"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={text => {
              setEmail(text.trim());
              setError('');
            }}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            style={[styles.input, error ? styles.errorInput : null]}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={text => {
              setPassword(text);
              setError('');
            }}
            placeholderTextColor="#9ca3af"
          />

          {error ? <Text style={{ color: '#ef4444', fontWeight: '600', marginBottom: 8 }}>{error}</Text> : null}

          <Pressable
            onPress={isSignUp ? handleSignUp : handleLogin}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setIsSignUp(prev => !prev);
              setError('');
            }}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? Sign in' : "Need an account? Sign up"}
            </Text>
          </Pressable>

          <View style={styles.helperBlock}>
            <Text style={styles.helperHeading}>📝 Getting Started</Text>
            <Text style={{ color: '#94a3b8', marginBottom: 12, fontSize: 13, lineHeight: 1.5 }}>
              {isSignUp 
                ? 'Create an account with your email and password to start storing files.' 
                : 'Sign in with your email and password to access your files.'}
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>
              Files are automatically saved to the cloud after upload.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const allFiles = uploadedFiles.length > 0 ? uploadedFiles : (currentUser?.files || []);
  const filtered = allFiles
    .filter(file => {
      const normalized = query.trim().toLowerCase();
      if (normalized && !file.name.toLowerCase().includes(normalized) && !(file.grNo || '').toLowerCase().includes(normalized)) {
        return false;
      }
      if (dateFilter && file.date !== dateFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sort === 'size') {
        return b.size - a.size;
      }
      if (sort === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  if (selectedFile) {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const fileRef = fileMapRef.current.get(selectedFile.id);
    const url = fileRef ? URL.createObjectURL(fileRef) : null;

    const handleDownloadFromPreview = () => {
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = selectedFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          if (fileRef) URL.revokeObjectURL(url);
        }, 100);
      }
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'absolute' as any, top: 0, left: 0, zIndex: 99999, overflow: 'hidden' } as any}>
        <View style={{ padding: 20, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 } as any}>
          <Pressable onPress={() => setSelectedFile(null)} style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, cursor: 'pointer' } as any}>
            <Text style={{ color: 'white', fontSize: 16 } as any}>← Back</Text>
          </Pressable>
          <View style={{ flex: 1, marginLeft: 20, overflow: 'hidden' } as any}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 5, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{selectedFile.name}</Text>
            <Text style={{ marginTop: 0, color: '#94a3b8', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>GR: {selectedFile.grNo || 'N/A'} | Size: {formatSize(selectedFile.size)} | Date: {selectedFile.date}</Text>
          </View>
          <Pressable 
            onPress={handleDownloadFromPreview}
            style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, cursor: 'pointer', flexShrink: 0, marginLeft: 20 } as any}
          >
            <Text style={{ color: 'white', fontSize: 16, whiteSpace: 'nowrap' } as any}>⬇ Download</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto', width: '100%', backgroundColor: '#0f172a' } as any}>
          {!url ? (
            <View style={{ paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#1e293b', borderRadius: 8, textAlign: 'center', maxWidth: 600, borderWidth: 1, borderColor: '#334155' } as any}>
              <Text style={{ fontSize: 64, marginBottom: 20 } as any}>📄</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
              <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>This is a demo file and cannot be previewed</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20, marginTop: 10 } as any}>Size: {formatSize(selectedFile.size)}</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>To preview this file, upload your own file using the upload button</Text>
            </View>
          ) : ext === 'pdf' ? (
            <View style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <View style={{ width: '100%', maxWidth: 900, height: '80vh', backgroundColor: '#0f172a', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' } as any}>
                {url ? (
                  <iframe
                    src={url}
                    title={selectedFile.name}
                    style={{ width: '100%', height: '100%', border: 'none' } as any}
                  />
                ) : (
                  <View style={{ padding: 24, textAlign: 'center' } as any}>
                    <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
                    <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>PDF File</Text>
                    <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Download to preview the PDF</Text>
                    <Pressable
                      onPress={handleDownloadFromPreview}
                      style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, marginTop: 20, cursor: 'pointer' } as any}
                    >
                      <Text style={{ color: 'white', fontWeight: '600' } as any}>Download & Open</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ) : ext && ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'].includes(ext) ? (
            <View style={{ paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#1e293b', borderRadius: 8, textAlign: 'center', maxWidth: 600, borderWidth: 1, borderColor: '#334155' } as any}>
              <Text style={{ fontSize: 64, marginBottom: 20 } as any}>🎵</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
              <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>Audio File</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Download to play audio</Text>
              <Pressable
                onPress={handleDownloadFromPreview}
                style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, marginTop: 20, cursor: 'pointer' } as any}
              >
                <Text style={{ color: 'white', fontWeight: '600' } as any}>Download & Play</Text>
              </Pressable>
            </View>
          ) : ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext) ? (
            <View style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <View style={{ width: '100%', maxWidth: 900, backgroundColor: '#0f172a', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' } as any}>
                {url ? (
                  <img src={url} alt={selectedFile.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
                ) : (
                  <View style={{ padding: 24, textAlign: 'center' } as any}>
                    <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
                    <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>Image File</Text>
                    <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Size: {formatSize(selectedFile.size)}</Text>
                    <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Download to view the image</Text>
                    <Pressable
                      onPress={handleDownloadFromPreview}
                      style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, marginTop: 20, cursor: 'pointer' } as any}
                    >
                      <Text style={{ color: 'white', fontWeight: '600' } as any}>Download & View</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ) : ext === 'docx' ? (
            <View style={{ paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#1e293b', borderRadius: 8, textAlign: 'center', maxWidth: 600, borderWidth: 1, borderColor: '#334155' } as any}>
              <Text style={{ fontSize: 64, marginBottom: 20 } as any}>📄</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
              <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>Word Document</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Size: {formatSize(selectedFile.size)}</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Download to view the full document content</Text>
              <Pressable
                onPress={handleDownloadFromPreview}
                style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, marginTop: 20, cursor: 'pointer' } as any}
              >
                <Text style={{ color: 'white', fontWeight: '600' } as any}>Download & Open</Text>
              </Pressable>
            </View>
          ) : ext === 'ppt' || ext === 'pptx' ? (
            <View style={{ paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#1e293b', borderRadius: 8, textAlign: 'center', maxWidth: 600, borderWidth: 1, borderColor: '#334155' } as any}>
              <Text style={{ fontSize: 64, marginBottom: 20 } as any}>🎨</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
              <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>PowerPoint Presentation</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Size: {formatSize(selectedFile.size)}</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Download to view the full presentation</Text>
              <Pressable
                onPress={handleDownloadFromPreview}
                style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, marginTop: 20, cursor: 'pointer' } as any}
              >
                <Text style={{ color: 'white', fontWeight: '600' } as any}>Download & Open</Text>
              </Pressable>
            </View>
          ) : ext === 'xlsx' ? (
            <View style={{ paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#1e293b', borderRadius: 8, textAlign: 'center', maxWidth: 600, borderWidth: 1, borderColor: '#334155' } as any}>
              <Text style={{ fontSize: 64, marginBottom: 20 } as any}>📊</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
              <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>Excel Spreadsheet</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Size: {formatSize(selectedFile.size)}</Text>
              <Text style={{ color: '#94a3b8', marginBottom: 20 } as any}>Download to view the full spreadsheet</Text>
              <Pressable
                onPress={handleDownloadFromPreview}
                style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#3b82f6', borderRadius: 5, marginTop: 20, cursor: 'pointer' } as any}
              >
                <Text style={{ color: 'white', fontWeight: '600' } as any}>Download & Open</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#1e293b', borderRadius: 8, textAlign: 'center', maxWidth: 600, borderWidth: 1, borderColor: '#334155' } as any}>
              <Text style={{ fontSize: 48, marginBottom: 20 } as any}>📄</Text>
              <Text style={{ color: '#cbd5e1' } as any}>Preview not available for this file type</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.headerTitle}>📂 File Browser</Text>
              <Text style={styles.headerSubtitle}>Securely manage and preview your files</Text>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
          <Text style={styles.userInfo}>Signed in as {firebaseUser?.email}</Text>
        </View>

        <View style={styles.searchRow}>
          <input
            style={{
              width: '100%',
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '16px',
              paddingRight: '16px',
              borderRadius: '10px',
              border: '1px solid #475569',
              backgroundColor: '#1e293b',
              fontSize: '15px',
              color: '#f1f5f9',
              boxSizing: 'border-box' as any
            }}
            type="text"
            placeholder="Search by file name or GR number"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={() => fileInputRef.current?.click()}
            style={({ pressed }) => [styles.uploadButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.uploadButtonText}>📤 Upload File</Text>
          </Pressable>

          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort:</Text>
            {SORT_OPTIONS.map(option => (
              <Pressable
                key={option.value}
                onPress={() => setSort(option.value)}
                style={({ pressed }) => [
                  styles.sortChip,
                  sort === option.value && styles.sortChipActive,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    sort === option.value && styles.sortChipTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.currentTarget.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #475569',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              marginBottom: '12px'
            } as any}
          />

          <Text style={styles.summaryText}>
            Showing {filtered.length} of {allFiles.length} files
          </Text>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="*"
          />
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No files matched your filters.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map(file => (
              <Pressable
                key={file.id}
                onPress={() => handleFilePress(file)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <Pressable
                  onPress={(e) => handleDeleteClick(file.id, file.name, e)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </Pressable>
                <Text style={styles.icon}>{getIcon(file.name, file.type)}</Text>
                <Text style={styles.name}>{file.name}</Text>
                <View style={styles.infoSection}>
                  {file.type === 'file' ? (
                    <Text style={styles.infoText}>Size: {formatSize(file.size)}</Text>
                  ) : (
                    <Text style={styles.infoText}>Folder</Text>
                  )}
                  <Text style={styles.infoText}>Date: {file.date}</Text>
                  {file.grNo ? <Text style={styles.infoText}>GR: {file.grNo}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {deleteConfirmation && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable onPress={handleCancelDelete} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Delete File?</Text>
            <View style={{ marginBottom: 28, marginTop: 12 }}>
              <Text style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 24, marginBottom: 12 }}>
                Are you sure you want to delete:
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#f1f5f9', backgroundColor: '#0f172a', padding: 12, borderRadius: 6, marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}>
                {deleteConfirmation.fileName}
              </Text>
              <Text style={{ fontSize: 15, color: '#94a3b8', lineHeight: 24 }}>
                This action cannot be undone.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, width: '100%' }}>
              <Pressable
                onPress={handleCancelDelete}
                style={({ pressed }) => [
                  { backgroundColor: '#334155', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Text style={{ color: '#f1f5f9', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                style={({ pressed }) => [
                  { backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
