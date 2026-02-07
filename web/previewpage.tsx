import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface FileItem {
  id: string;
  name: string;
  size: number;
  date: string;
  type: 'file' | 'folder';
  grNo?: string;
}

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

export function PreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const file = SAMPLE_FILES.find(f => f.id === id);
  
  if (!file) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>← Back</button>
          <p>File not found</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/files/${file.name}`;
    link.download = file.name;
    link.click();
  };

  const ext = file.name.toLowerCase().split('.').pop() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>← Back</button>
        <div style={{ flex: 1, marginLeft: '20px' }}>
          <h2 style={{ margin: '0 0 5px 0' }}>{file.name}</h2>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>GR: {file.grNo || 'N/A'} | Size: {formatFileSize(file.size)} | Date: {file.date}</p>
        </div>
        <button onClick={handleDownload} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>⬇ Download File</button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
        {isPdf && (
          <object
            data="data:application/pdf;base64,JVBERi0xLjQKCjEgMCBvYmo="
            type="application/pdf"
            style={{ width: '100%', height: '100%', borderRadius: '8px' }}
          >
            <p>PDF Preview not supported. <button onClick={handleDownload}>Download PDF</button></p>
          </object>
        )}
        
        {isImage && (
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23ddd' width='800' height='600'/%3E%3Ctext x='50%' y='50%' font-size='32' text-anchor='middle' dy='.3em' fill='%23999'%3EImage Preview%3C/text%3E%3C/svg%3E"
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}
          />
        )}
        
        {isVideo && (
          <video
            controls
            style={{ width: '100%', height: '100%', borderRadius: '8px', backgroundColor: '#000', maxHeight: '100%', objectFit: 'contain' }}
          >
            <source src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28=" type="video/mp4" />
            Your browser does not support video playback.
          </video>
        )}
        
        {isAudio && (
          <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎵</div>
            <h3 style={{ marginTop: '0' }}>{file.name}</h3>
            <audio
              controls
              style={{ width: '100%', marginBottom: '20px' }}
            >
              <source src="data:audio/mpeg;base64,ID3BAAAAAAA=" type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
            <p style={{ color: '#666', fontSize: '14px' }}>Audio file preview</p>
          </div>
        )}
        
        {!isPdf && !isImage && !isVideo && !isAudio && (
          <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📄</div>
            <p style={{ color: '#666' }}>Preview not available for this file type (.{ext})</p>
            <button onClick={handleDownload} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}>Download {file.name}</button>
          </div>
        )}
      </div>
    </div>
  );
}
