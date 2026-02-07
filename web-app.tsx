import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

// Helper to generate sample files
const generateSampleFiles = (startId: number, startGR: number): FileData[] => {
  const files: FileData[] = [];
  const fileTypes = [
    { ext: 'pdf', name: 'Document', size: () => Math.floor(Math.random() * 3000000) + 500000 },
    { ext: 'xlsx', name: 'Spreadsheet', size: () => Math.floor(Math.random() * 1000000) + 200000 },
    { ext: 'docx', name: 'Report', size: () => Math.floor(Math.random() * 2000000) + 300000 },
    { ext: 'pptx', name: 'Presentation', size: () => Math.floor(Math.random() * 4000000) + 1000000 },
    { ext: 'jpg', name: 'Image', size: () => Math.floor(Math.random() * 5000000) + 1000000 },
    { ext: 'png', name: 'Screenshot', size: () => Math.floor(Math.random() * 3000000) + 500000 },
    { ext: 'zip', name: 'Archive', size: () => Math.floor(Math.random() * 10000000) + 2000000 },
    { ext: 'mp4', name: 'Video', size: () => Math.floor(Math.random() * 500000000) + 50000000 },
    { ext: 'txt', name: 'Notes', size: () => Math.floor(Math.random() * 500000) + 50000 }
  ];

  let id = startId;
  let gr = startGR;
  for (let i = 0; i < 50; i++) {
    const fileType = fileTypes[i % fileTypes.length];
    const num = Math.floor(i / fileTypes.length) + 1;
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    files.push({
      id: String(id++),
      name: `${fileType.name}${num}.${fileType.ext}`,
      size: fileType.size(),
      date,
      type: 'file',
      grNo: `GR-${String(gr++).padStart(3, '0')}`
    });
  }
  return files;
};

const USERS: Record<string, User> = {
  user1: {
    username: 'user1',
    password: '1234',
    files: generateSampleFiles(1, 1)
  },
  user2: {
    username: 'user2',
    password: '5678',
    files: generateSampleFiles(101, 51)
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    files: generateSampleFiles(201, 101)
  }
};

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

const saveUploadedFile = (username: string, fileData: FileData, file: File) => {
  const reader = new FileReader();
  reader.onload = event => {
    const base64 = event.target?.result;
    const userFiles = JSON.parse(localStorage.getItem(`uploaded_${username}`) || '[]');
    userFiles.push({ fileData, base64 });
    localStorage.setItem(`uploaded_${username}`, JSON.stringify(userFiles));
  };
  reader.readAsDataURL(file);
};

const loadUploadedFiles = (username: string): StoredFile[] => {
  try {
    return JSON.parse(localStorage.getItem(`uploaded_${username}`) || '[]');
  } catch (error) {
    console.warn('Could not parse uploaded files', error);
    return [];
  }
};

const saveUsersToStorage = () => {
  localStorage.setItem('USERS', JSON.stringify(USERS));
};

const loadUsersFromStorage = () => {
  try {
    const stored = localStorage.getItem('USERS');
    if (stored) {
      Object.assign(USERS, JSON.parse(stored));
    }
  } catch (error) {
    console.warn('Could not load users from storage', error);
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'date' | 'date-asc' | 'name' | 'size'>('date');
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ fileId: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    loadUsersFromStorage();

    // Restore session from localStorage so refreshing keeps user logged in
    try {
      const sessionUser = localStorage.getItem('sessionUser');
      if (sessionUser && USERS[sessionUser]) {
        const user = USERS[sessionUser];
        setCurrentUser(user);
        setIsLoggedIn(true);

        // Load any uploaded files saved for this user
        const savedFiles = loadUploadedFiles(sessionUser);
        // Deduplicate by ID to prevent duplicates on refresh
        const dedupedFiles = Array.from(
          new Map(savedFiles.map(f => [f.fileData.id, f])).values()
        );
        setUploadedFiles(dedupedFiles.map(item => item.fileData));

        // Re-create File objects for downloads/previews from base64
        savedFiles.forEach(({ fileData, base64 }) => {
          if (base64) {
            try {
              // Convert data URL to Blob
              const arr = base64.split(',');
              const mimeMatch = arr[0].match(/:(.*?);/) || ['', 'application/octet-stream'];
              const mime = mimeMatch[1];
              const bstr = atob(arr[1]);
              const n = bstr.length;
              const u8arr = new Uint8Array(n);
              for (let i = 0; i < n; i++) {
                u8arr[i] = bstr.charCodeAt(i);
              }
              const blob = new Blob([u8arr], { type: mime });
              const file = new File([blob], fileData.name, { type: mime });
              fileMapRef.current.set(fileData.id, file);
            } catch (err) {
              console.warn(`Failed to restore file blob for ${fileData.name}`, err);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Failed to restore session', err);
    }

    setIsReady(true);
  }, []);

  const handleLogin = () => {
    setError('');
    const user = USERS[username];
    if (!user || user.password !== password) {
      setError('Invalid username or password');
      return;
    }

    setCurrentUser(user);
    setIsLoggedIn(true);

    // Persist session so refresh keeps the user logged in
    try { localStorage.setItem('sessionUser', username); } catch (e) { /* ignore */ }

    const savedFiles = loadUploadedFiles(username);
    // Deduplicate by ID to prevent duplicates
    const dedupedFiles = Array.from(
      new Map(savedFiles.map(f => [f.fileData.id, f])).values()
    );
    setUploadedFiles(dedupedFiles.map(item => item.fileData));
    dedupedFiles.forEach(({ fileData, base64 }) => {
      if (base64) {
        try {
          // Convert data URL to Blob
          const arr = base64.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/) || ['', 'application/octet-stream'];
          const mime = mimeMatch[1];
          const bstr = atob(arr[1]);
          const n = bstr.length;
          const u8arr = new Uint8Array(n);
          for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
          }
          const blob = new Blob([u8arr], { type: mime });
          const file = new File([blob], fileData.name, { type: mime });
          fileMapRef.current.set(fileData.id, file);
        } catch (err) {
          console.warn(`Failed to restore file blob for ${fileData.name}`, err);
        }
      }
    });
    setUsername('');
    setPassword('');
  };

  const handleSignUp = () => {
    setError('');
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (USERS[username]) {
      setError('Username already exists');
      return;
    }

    const newUser: User = {
      username,
      password,
      files: [
        {
          id: 'welcome',
          name: 'Welcome.txt',
          size: 512,
          date: new Date().toISOString().split('T')[0],
          type: 'file',
          grNo: 'GR-001'
        }
      ]
    };

    USERS[username] = newUser;
    saveUsersToStorage();
    setCurrentUser(newUser);
    setIsLoggedIn(true);

    // Persist session for newly created user
    try { localStorage.setItem('sessionUser', newUser.username); } catch (e) { /* ignore */ }

    setUploadedFiles([]);
    setUsername('');
    setPassword('');
    setIsSignUp(false);
  };

  const handleLogout = () => {
    // Clear session persistence
    try { localStorage.removeItem('sessionUser'); } catch (e) { /* ignore */ }

    setIsLoggedIn(false);
    setCurrentUser(null);
    setUploadedFiles([]);
    setQuery('');
    setSelectedFile(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const buffer = Array.from(event.target.files || []);
    
    // Find the highest GR number to ensure uniqueness
    const allExistingFiles = [...(currentUser?.files || []), ...uploadedFiles];
    let maxGRNum = 0;
    allExistingFiles.forEach(f => {
      if (f.grNo) {
        const num = parseInt(f.grNo.replace('GR-', ''), 10);
        if (num > maxGRNum) maxGRNum = num;
      }
    });
    
    let grCounter = maxGRNum;

    buffer.forEach(file => {
      grCounter++; // Increment GR number for each file
      const descriptor: FileData = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        date: new Date().toISOString().split('T')[0],
        type: 'file',
        grNo: `GR-${String(grCounter).padStart(3, '0')}`
      };

      fileMapRef.current.set(descriptor.id, file);
      if (currentUser) {
        saveUploadedFile(currentUser.username, descriptor, file);
      }
      // Deduplicate before adding new file
      setUploadedFiles(prev => {
        const withoutDupe = prev.filter(f => f.id !== descriptor.id);
        return [...withoutDupe, descriptor];
      });
    });

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

  const handleConfirmDelete = () => {
    if (!deleteConfirmation || !currentUser) return;

    const { fileId } = deleteConfirmation;

    // Remove from uploaded files
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

    // Remove from current user's files
    const updatedFiles = currentUser.files.filter(f => f.id !== fileId);
    const updatedUser = { ...currentUser, files: updatedFiles };
    setCurrentUser(updatedUser);
    USERS[currentUser.username] = updatedUser;
    saveUsersToStorage();

    // Remove from localStorage if it's an uploaded file
    const savedFiles = loadUploadedFiles(currentUser.username);
    const filteredSavedFiles = savedFiles.filter(f => f.fileData.id !== fileId);
    localStorage.setItem(`uploaded_${currentUser.username}`, JSON.stringify(filteredSavedFiles));

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
          {/* Modern SVG folder logo */}
          <svg width="160" height="160" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="18" floodOpacity="0.18" floodColor="#0b5ddf" />
              </filter>
            </defs>
            <g filter="url(#f1)">
              <rect x="4" y="18" width="56" height="34" rx="6" fill="url(#g1)" />
              <path d="M10 18 L20 10 H44 L54 18 Z" fill="#fff" opacity="0.06" />
              <path d="M12 22 L52 22" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
            </g>
          </svg>

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
            placeholder="Username"
            value={username}
            onChangeText={text => {
              setUsername(text.trim());
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
            <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
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
            <Text style={styles.helperHeading}>👤 Try Demo Accounts</Text>
            <Pressable
              onPress={() => {
                setUsername('user1');
                setPassword('1234');
                setError('');
              }}
              style={({ pressed }) => [styles.helperText, pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
            >
              <Text style={{ color: 'inherit' }}>user1 / 1234</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setUsername('user2');
                setPassword('5678');
                setError('');
              }}
              style={({ pressed }) => [styles.helperText, pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
            >
              <Text style={{ color: 'inherit' }}>user2 / 5678</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setUsername('admin');
                setPassword('admin123');
                setError('');
              }}
              style={({ pressed }) => [styles.helperText, pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
            >
              <Text style={{ color: 'inherit' }}>admin / admin123</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const allFiles = [...currentUser.files, ...uploadedFiles];
  const filtered = allFiles
    .filter(file => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return true;
      return file.name.toLowerCase().includes(normalized) || file.grNo?.toLowerCase().includes(normalized);
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
            <View style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: '#334155' } as any}>
              <iframe title={selectedFile.name} src={url} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} />
            </View>
          ) : ext && ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'].includes(ext) ? (
            <View style={{ paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#1e293b', borderRadius: 8, textAlign: 'center', maxWidth: 600, borderWidth: 1, borderColor: '#334155' } as any}>
              <Text style={{ fontSize: 64, marginBottom: 20 } as any}>🎵</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#f1f5f9' } as any}>{selectedFile.name}</Text>
              <Text style={{ color: '#cbd5e1', marginBottom: 20 } as any}>Audio File Preview</Text>
              <audio controls style={{ width: '100%', marginBottom: 20 }}>
                <source src={url} type={`audio/${ext}`} />
                Your browser does not support the audio element.
              </audio>
            </View>
          ) : ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext) ? (
            <View style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', borderRadius: 8, paddingVertical: 20, paddingHorizontal: 20, borderWidth: 1, borderColor: '#334155' } as any}>
              <img src={url} alt={selectedFile.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
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
          <Text style={styles.userInfo}>Signed in as {currentUser.username}</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by file name or GR number"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
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
