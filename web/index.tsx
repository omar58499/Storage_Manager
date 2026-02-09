import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './web.css';

interface FileItem {
  id: string;
  name: string;
  size: number;
  date: string;
  type: 'file' | 'folder';
  grNo?: string;
}

// Sample data
const SAMPLE_FILES: FileItem[] = [
  {
    id: '1',
    name: 'Document1.pdf',
    size: 1024000,
    date: '2024-02-06',
    type: 'file',
    grNo: 'GR-001'
  },
  {
    id: '2',
    name: 'Image1.jpg',
    size: 2048000,
    date: '2024-02-05',
    type: 'file',
    grNo: 'GR-002'
  },
  {
    id: '3',
    name: 'Spreadsheet.xlsx',
    size: 512000,
    date: '2024-02-04',
    type: 'file',
    grNo: 'GR-003'
  },
  {
    id: '4',
    name: 'Project Folder',
    size: 0,
    date: '2024-02-03',
    type: 'folder'
  },
  {
    id: '5',
    name: 'Archive.zip',
    size: 5120000,
    date: '2024-02-02',
    type: 'file',
    grNo: 'GR-004'
  },
  {
    id: '6',
    name: 'Presentation.pptx',
    size: 3072000,
    date: '2024-02-01',
    type: 'file',
    grNo: 'GR-005'
  }
];

const VALID_ACCOUNTS: { [key: string]: string } = {
  'user1': '1234',
  'user2': '5678',
  'admin': 'admin123'
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(fileName: string, type: string): string {
  if (type === 'folder') return '📁';
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconMap: { [key: string]: string } = {
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
    rar: '📦',
  };
  
  return iconMap[ext || ''] || '📄';
}

// Decorative Background Shape Component
function DecorativeShapes() {
  return (
    <svg
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '50%',
        height: '100%',
        zIndex: 1,
        opacity: 0.7,
      }}
      viewBox="0 0 500 800"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Big blob shape */}
      <ellipse cx="400" cy="200" rx="200" ry="250" fill="#FF6B9D" opacity="0.4" />
      <ellipse cx="380" cy="220" rx="150" ry="200" fill="#FF8E72" opacity="0.3" />
      
      {/* Curved lines */}
      <path
        d="M 250 0 Q 350 150 280 400"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M 320 50 Q 420 200 350 500"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Circles */}
      <circle cx="180" cy="150" r="40" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
      <circle cx="200" cy="180" r="60" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />
    </svg>
  );
}


function openFilePage(file: FileItem) {
  const filePage = `
    <html>
      <head>
        <title>${file.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f5f7fb;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .card {
            background: white;
            padding: 32px;
            border-radius: 12px;
            width: 420px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
          }
          h2 { margin-bottom: 12px; }
          p { color: #555; margin: 6px 0; }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 14px 22px;
            background: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
          }
          a:hover { background: #4338ca; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${file.name}</h2>
          <p>Size: ${formatFileSize(file.size)}</p>
          <p>Date: ${file.date}</p>
          ${file.grNo ? `<p>GR No: ${file.grNo}</p>` : ''}
          <a href="#" download="${file.name}">⬇ Download File</a>
        </div>
      </body>
    </html>
  `;

  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(filePage);
    newWindow.document.close();
  }
}




// Login Page Component
function LoginPage({ onLogin, onSignUpClick }: { onLogin: (username: string) => void; onSignUpClick: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (VALID_ACCOUNTS[username] === password) {
      onLogin(username);
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  const autoFillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div style={styles.authPage}>
      <DecorativeShapes />
      
      <div style={styles.contentWrapper}>
        <div style={styles.leftContent}>
          <div style={styles.logo}>📁</div>
          <h1 style={styles.title}>File Explorer</h1>
          <p style={styles.subtitle}>Your secure file management solution</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.submitButton}>
              Log In
            </button>
          </form>

          <div style={styles.dividerContainer}>
            <span style={styles.dividerText}>or try demo accounts</span>
          </div>

          <div style={styles.demoAccounts}>
            <div onClick={() => autoFillDemo('user1', '1234')} style={styles.demoOption}>
              <span style={styles.demoBadge}>👤</span>
              <div>
                <div style={styles.demoUser}>user1</div>
                <div style={styles.demoCreds}>1234</div>
              </div>
            </div>
            <div onClick={() => autoFillDemo('user2', '5678')} style={styles.demoOption}>
              <span style={styles.demoBadge}>👤</span>
              <div>
                <div style={styles.demoUser}>user2</div>
                <div style={styles.demoCreds}>5678</div>
              </div>
            </div>
            <div onClick={() => autoFillDemo('admin', 'admin123')} style={styles.demoOption}>
              <span style={styles.demoBadge}>⚙️</span>
              <div>
                <div style={styles.demoUser}>admin</div>
                <div style={styles.demoCreds}>admin123</div>
              </div>
            </div>
          </div>

          <div style={styles.signupPrompt}>
            Don't have an account?{' '}
            <button
              onClick={onSignUpClick}
              style={styles.signupLink}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sign Up Page Component
function SignUpPage({ onSignUp, onLoginClick }: { onSignUp: (username: string) => void; onLoginClick: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    // Add new account to valid accounts
    VALID_ACCOUNTS[formData.username] = formData.password;
    onSignUp(formData.username);
  };

  return (
    <div style={styles.authPage}>
      <DecorativeShapes />
      
      <div style={styles.contentWrapper}>
        <div style={styles.leftContent}>
          <div style={styles.logo}>📁</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join File Explorer today</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.submitButton}>
              Create Account
            </button>
          </form>

          <div style={styles.signupPrompt}>
            Already have an account?{' '}
            <button
              onClick={onLoginClick}
              style={styles.signupLink}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Styles
const styles: { [key: string]: React.CSSProperties } = {
  authPage: {
    width: '100%',
    height: '100vh',
    background: 'linear-gradient(135deg, #FF5975 0%, #FF8E72 50%, #FFB366 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  contentWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 2,
    paddingLeft: '5%',
  },
  leftContent: {
    width: '40%',
    color: 'white',
    animation: 'slideIn 0.6s ease-out',
  },
  logo: {
    fontSize: '64px',
    marginBottom: '20px',
    display: 'inline-block',
  },
  title: {
    fontSize: '56px',
    fontWeight: '700',
    margin: '0 0 15px 0',
    lineHeight: '1.1',
    letterSpacing: '-1px',
  },
  subtitle: {
    fontSize: '18px',
    opacity: 0.95,
    margin: '0 0 30px 0',
    fontWeight: '300',
    lineHeight: '1.5',
  },
  form: {
    marginBottom: '30px',
    maxWidth: '350px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#333',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'all 0.3s ease',
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FF5975',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '5px',
  },
  error: {
    color: '#FFE0E6',
    fontSize: '14px',
    marginBottom: '15px',
    textAlign: 'center' as const,
    backgroundColor: 'rgba(255, 0, 50, 0.2)',
    padding: '10px',
    borderRadius: '8px',
  },
  dividerContainer: {
    textAlign: 'center' as const,
    margin: '25px 0',
    opacity: 0.9,
  },
  dividerText: {
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: '500',
    opacity: 0.8,
  },
  demoAccounts: {
    maxWidth: '350px',
  },
  demoOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    marginBottom: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  },
  demoBadge: {
    fontSize: '20px',
    display: 'block',
  },
  demoUser: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
  },
  demoCreds: {
    fontSize: '12px',
    opacity: 0.8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  signupPrompt: {
    marginTop: '25px',
    fontSize: '15px',
    opacity: 0.95,
  },
  signupLink: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'underline',
    padding: '0',
  },
};

// File Explorer Component
function FileExplorer() {
  const [files] = useState<FileItem[]>(SAMPLE_FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleDownload = (file: FileItem) => {
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${btoa(file.name)}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ext = selectedFile?.name.toLowerCase().split('.').pop() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext);

  const filteredFiles = files
    .filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.grNo?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'size') {
        return b.size - a.size;
      }
      return 0;
    });

  if (selectedFile) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#f5f5f5', zIndex: 9999, display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
        <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => setSelectedFile(null)} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>← Back</button>
          <div style={{ flex: 1, marginLeft: '20px' }}>
            <h2 style={{ margin: '0 0 5px 0' }}>{selectedFile.name}</h2>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>GR: {selectedFile.grNo || 'N/A'} | Size: {formatFileSize(selectedFile.size)} | Date: {selectedFile.date}</p>
          </div>
          <button onClick={() => handleDownload(selectedFile)} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>⬇ Download File</button>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto', width: '100%', height: 'calc(100vh - 80px)' }}>
          {isPdf && (
            <div style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
                <p style={{ color: '#666', marginBottom: '20px' }}>PDF Preview</p>
                <p style={{ color: '#999', marginBottom: '20px' }}>{selectedFile.name}</p>
                <button onClick={() => handleDownload(selectedFile)} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Download PDF</button>
              </div>
            </div>
          )}
          
          {isImage && (
            <div style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23ddd' width='800' height='600'/%3E%3Ctext x='50%' y='50%' font-size='32' text-anchor='middle' dy='.3em' fill='%23999'%3EImage: {selectedFile.name}%3C/text%3E%3C/svg%3E"
                alt={selectedFile.name}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
          )}
          
          {isVideo && (
            <div style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: '8px' }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎬</div>
                <p style={{ marginBottom: '20px' }}>Video Preview</p>
                <p style={{ marginBottom: '20px' }}>{selectedFile.name}</p>
                <button onClick={() => handleDownload(selectedFile)} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Download Video</button>
              </div>
            </div>
          )}
          
          {isAudio && (
            <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center', maxWidth: '600px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎵</div>
              <h3 style={{ marginTop: '0', marginBottom: '10px' }}>{selectedFile.name}</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>Audio File Preview</p>
              <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
                <p style={{ color: '#999', marginBottom: '10px' }}>Size: {formatFileSize(selectedFile.size)}</p>
                <p style={{ color: '#999' }}>Date: {selectedFile.date}</p>
              </div>
              <button onClick={() => handleDownload(selectedFile)} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Download Audio</button>
            </div>
          )}
          
          {!isPdf && !isImage && !isVideo && !isAudio && (
            <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center', maxWidth: '600px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📄</div>
              <h3 style={{ marginTop: '0', marginBottom: '10px' }}>{selectedFile.name}</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>Preview not available for this file type (.{ext})</p>
              <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
                <p style={{ color: '#999', marginBottom: '10px' }}>Size: {formatFileSize(selectedFile.size)}</p>
                <p style={{ color: '#999' }}>Date: {selectedFile.date}</p>
              </div>
              <button onClick={() => handleDownload(selectedFile)} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Download File</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📂 File Browser</h1>
        <p>Securely manage and preview your files</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-box upload-box">
          <div className="box-icon">📤</div>
          <h3>Upload File</h3>
          <p>Add new files to your storage</p>
          <button className="box-button">
            Choose File
          </button>
        </div>

        <div className="dashboard-box finder-box">
          <div className="box-icon">🔍</div>
          <h3>Find Files</h3>
          <p>Search by name or GR number</p>S
          <input
            type="text"
            className="finder-input"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>No files found</p>
          <p>Use the finder box above to search for files</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
            Showing {filteredFiles.length} of {files.length} files
          </div>
          <div className="file-grid">
            {filteredFiles.map(file => (
              <div key={file.id} className="file-card" onClick={() => handleFileClick(file)}>
                <div className="file-icon">{getFileIcon(file.name, file.type)}</div>
                <div className="file-name">{file.name}</div>
                <div className="file-info">
                  {file.type === 'file' && <div>Size: {formatFileSize(file.size)}</div>}
                  {file.type === 'folder' && <div>Folder</div>}
                  <div style={{ marginTop: '8px', color: '#999' }}>{file.date}</div>
                  {file.grNo && <div style={{ marginTop: '8px', color: '#667eea', fontWeight: '600' }}>GR: {file.grNo}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Main App Component
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  if (!isLoggedIn) {
    return isSignUp ? (
      <SignUpPage 
        onSignUp={() => setIsLoggedIn(true)} 
        onLoginClick={() => setIsSignUp(false)}
      />
    ) : (
      <LoginPage 
        onLogin={() => setIsLoggedIn(true)}
        onSignUpClick={() => setIsSignUp(true)}
      />
    );
  }

  return <FileExplorer />;
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

