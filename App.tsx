import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { formatFileSize, formatDate, addUploadedFile, getUploadedFiles, deleteUploadedFile, getFileType } from './utils/fileSystemUtils';
import { FileList } from './components/FileList';

interface FileItem {
  id: string;
  uri: string;
  name: string;
  size: number;
  modificationTime: number;
  isDirectory: boolean;
  mediaType?: string;
  albumId?: string;
  grNo?: string;
  uploadDate?: number;
}

type FilterType = 'name' | 'date' | 'grNo' | 'size' | null;
type SortType = 'newest' | 'oldest' | 'name' | 'size';
type ViewMode = 'home' | 'details';

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('newest');

  // Load uploaded files on mount
  useEffect(() => {
    const loadUploaded = async () => {
      try {
        setLoading(true);
        const uploaded = await getUploadedFiles();
        // Remove duplicates by ID
        const uniqueFiles = uploaded.reduce((acc: FileItem[], file: FileItem) => {
          if (!acc.find(f => f.id === file.id)) {
            acc.push(file);
          }
          return acc;
        }, []);
        setUploadedFiles(uniqueFiles);
      } catch (err) {
        console.error('Error loading uploaded files:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUploaded();
  }, []);

  const handleSelectFile = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleShareFile = async () => {
    if (!selectedFile) return;
    try {
      await Share.share({
        message: `File: ${selectedFile.name}\nGR No: ${selectedFile.grNo}\nSize: ${formatFileSize(selectedFile.size)}\nPath: ${selectedFile.uri}`,
        title: selectedFile.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.name || 'unknown_file';
        const documentDirectory = FileSystem.documentDirectory || '';
        const newFileUri = documentDirectory + fileName;

        // Copy file
        await FileSystem.copyAsync({
          from: asset.uri,
          to: newFileUri,
        });

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(newFileUri);

        // Add to uploaded files with metadata
        const newFile = await addUploadedFile(newFileUri, fileName, asset.size || 0);
        
        // Update local state
        setUploadedFiles([...uploadedFiles, newFile]);
        
        Alert.alert('Success', `File "${fileName}" uploaded with GR No. ${newFile.grNo}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const handleDeleteUploadedFile = async (fileId: string) => {
    try {
      await deleteUploadedFile(fileId);
      setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
      Alert.alert('Success', 'File deleted');
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', 'Failed to delete file');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const uploaded = await getUploadedFiles();
      setUploadedFiles(uploaded);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort uploaded files
  const getFilteredAndSortedFiles = () => {
    let filtered = [...uploadedFiles];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.grNo?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply active filter
    if (activeFilter && filterValue) {
      switch (activeFilter) {
        case 'name':
          filtered = filtered.filter((f) =>
            f.name.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        case 'size':
          const sizeKB = parseFloat(filterValue) * 1024;
          if (!isNaN(sizeKB)) {
            filtered = filtered.filter((f) => f.size >= sizeKB);
          }
          break;
        case 'date':
          const filterDate = new Date(filterValue).getTime();
          if (!isNaN(filterDate)) {
            const filterDateObj = new Date(filterDate);
            filtered = filtered.filter((f) => {
              const fileDate = new Date((f.uploadDate || f.modificationTime) * (f.uploadDate ? 1 : 1000));
              return fileDate.toDateString() === filterDateObj.toDateString();
            });
          }
          break;
        case 'grNo':
          filtered = filtered.filter((f) =>
            f.grNo?.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
      }
    }

    // Apply sort
    filtered.sort((a, b) => {
      const aTime = a.uploadDate || a.modificationTime;
      const bTime = b.uploadDate || b.modificationTime;
      
      switch (sortBy) {
        case 'newest':
          return bTime - aTime;
        case 'oldest':
          return aTime - bTime;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const processedFiles = getFilteredAndSortedFiles();

  // File details view
  if (selectedFile) {
    const fileType = getFileType(selectedFile.name);
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedFile(null)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File Details</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView style={styles.detailsContent}>
          {/* Media Preview Section */}
          <View style={styles.mediaPreviewContainer}>
            {fileType === 'image' && (
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            )}
            
            {fileType === 'video' && (
              <View style={styles.videoPreviewContainer}>
                <Text style={styles.videoIcon}>🎬</Text>
                <Text style={styles.videoText}>Video File</Text>
                <Text style={styles.videoSubtext}>{selectedFile.name}</Text>
                <TouchableOpacity 
                  style={styles.playVideoButton}
                  onPress={() => Alert.alert('Video Player', 'Video player would open in external app\n\nFile: ' + selectedFile.name)}
                >
                  <Text style={styles.playVideoButtonText}>▶️ Play Video</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {fileType === 'audio' && (
              <View style={styles.audioPreviewContainer}>
                <Text style={styles.audioIcon}>🎵</Text>
                <Text style={styles.audioText}>Audio File</Text>
                <Text style={styles.audioSubtext}>{selectedFile.name}</Text>
                <TouchableOpacity 
                  style={styles.playAudioButton}
                  onPress={() => Alert.alert('Audio Player', 'Music player would open\n\nFile: ' + selectedFile.name)}
                >
                  <Text style={styles.playAudioButtonText}>▶️ Play Audio</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {fileType === 'pdf' && (
              <View style={styles.pdfPreviewContainer}>
                <Text style={styles.pdfIcon}>📄</Text>
                <Text style={styles.pdfText}>PDF File</Text>
                <Text style={styles.pdfSubtext}>{selectedFile.name}</Text>
                <TouchableOpacity 
                  style={styles.openPdfButton}
                  onPress={() => Alert.alert('PDF Viewer', 'PDF reader would open\n\nFile: ' + selectedFile.name, [
                    { text: 'Close' }
                  ])}
                >
                  <Text style={styles.openPdfButtonText}>📖 View PDF</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {fileType === 'document' && (
              <View style={styles.documentPreviewContainer}>
                <Text style={styles.docIcon}>📝</Text>
                <Text style={styles.docText}>Document File</Text>
                <Text style={styles.docSubtext}>{selectedFile.name}</Text>
                <TouchableOpacity 
                  style={styles.openDocButton}
                  onPress={async () => {
                    try {
                      const content = await FileSystem.readAsStringAsync(selectedFile.uri);
                      const preview = content.substring(0, 200).replace(/\n/g, ' ');
                      Alert.alert('Document Preview', preview + (content.length > 200 ? '...' : ''));
                    } catch (error) {
                      Alert.alert('Error', 'Could not read document');
                    }
                  }}
                >
                  <Text style={styles.openDocButtonText}>📖 Preview</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {fileType === 'unknown' && (
              <View style={styles.iconContainer}>
                <Text style={styles.detailsIcon}>📁</Text>
              </View>
            )}
          </View>

          <Text style={styles.detailsFileName}>{selectedFile.name}</Text>

          {selectedFile.grNo && (
            <Text style={styles.grNoBadge}>📌 {selectedFile.grNo}</Text>
          )}

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serial Number (GR No):</Text>
              <Text style={styles.detailValue}>{selectedFile.grNo || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Type:</Text>
              <Text style={styles.detailValue}>{fileType.charAt(0).toUpperCase() + fileType.slice(1)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Size:</Text>
              <Text style={styles.detailValue}>{formatFileSize(selectedFile.size)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Uploaded:</Text>
              <Text style={styles.detailValue}>{formatDate((selectedFile.uploadDate || selectedFile.modificationTime) / (selectedFile.uploadDate ? 1 : 1000))}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Name:</Text>
              <Text style={styles.detailValue}>{selectedFile.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Path:</Text>
              <Text style={styles.detailValue} numberOfLines={3}>{selectedFile.uri}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareFile}>
            <Text style={styles.shareButtonText}>📤 Share File Info</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deleteButton]} 
            onPress={() => {
              Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
                { text: 'Cancel', onPress: () => {} },
                { text: 'Delete', onPress: () => {
                  handleDeleteUploadedFile(selectedFile.id);
                  setSelectedFile(null);
                } }
              ]);
            }}
          >
            <Text style={styles.deleteButtonText}>🗑️ Delete File</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Home view - Uploaded Files Drive
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📁 My Drive</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading files...</Text>
          </View>
        ) : (
          <>
            {/* Search bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or GR No..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />

            {/* Filter buttons */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Filter:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['name', 'date', 'grNo', 'size'] as FilterType[]).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
                    onPress={() => setActiveFilter(activeFilter === filter ? null : filter)}
                  >
                    <Text style={[styles.filterButtonText, activeFilter === filter && styles.filterButtonTextActive]}>
                      {filter === 'grNo' ? 'GR No' : filter?.charAt(0).toUpperCase()}{filter && filter !== 'grNo' ? filter?.slice(1) : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Filter input */}
            {activeFilter && (
              <TextInput
                style={styles.filterInput}
                placeholder={
                  activeFilter === 'size' ? 'Filter by size (KB)...' :
                  activeFilter === 'date' ? 'Filter by date (YYYY-MM-DD)...' :
                  activeFilter === 'grNo' ? 'Filter by GR No...' :
                  `Filter by ${activeFilter}...`
                }
                value={filterValue}
                onChangeText={setFilterValue}
                placeholderTextColor="#999"
              />
            )}

            {/* Sort buttons */}
            <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort:</Text>
            {(['newest', 'oldest', 'name', 'size'] as SortType[]).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[styles.sortButton, sortBy === sort && styles.sortButtonActive]}
                onPress={() => setSortBy(sort)}
              >
                <Text style={[styles.sortButtonText, sortBy === sort && styles.sortButtonTextActive]}>
                  {sort === 'newest' ? '🆕 New' : sort === 'oldest' ? '⏰ Old' : sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fileCount}>
            {processedFiles.length} of {uploadedFiles.length} files
          </Text>

          <FlatList
            data={processedFiles}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.fileItem} 
                onPress={() => setSelectedFile(item)}
                onLongPress={() => {
                  Alert.alert('Delete File', 'Are you sure?', [
                    { text: 'Cancel', onPress: () => {} },
                    { text: 'Delete', onPress: () => handleDeleteUploadedFile(item.id) }
                  ]);
                }}
              >
                <Text style={styles.fileIcon}>📄</Text>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                  {item.grNo && (
                    <Text style={styles.fileGrNo}>{item.grNo}</Text>
                  )}
                  <Text style={styles.fileDetails}>
                    {formatFileSize(item.size)} • {formatDate((item.uploadDate || item.modificationTime) / (item.uploadDate ? 1 : 1000))}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📁</Text>
                <Text style={styles.emptyText}>No files yet</Text>
                <Text style={styles.emptySubtext}>Tap upload to add files to your drive</Text>
              </View>
            }
          />
        </>
      )}
      </View>
      
      {/* Floating Action Button - Upload */}
      {!selectedFile && (
        <TouchableOpacity 
          style={styles.fabButton} 
          onPress={handleUploadFile}
        >
          <Text style={styles.fabButtonText}>⬆️</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  uploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabButtonText: {
    fontSize: 28,
  },
  spacer: {
    width: 60,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    marginVertical: 14,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  permissionButtonSecondary: {
    backgroundColor: '#34C759',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionLoadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  permissionLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#007AFF',
  },
  permissionErrorText: {
    marginTop: 16,
    fontSize: 13,
    color: '#c62828',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  permissionHint: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
  },
  errorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    flex: 1,
  },
  errorActionButton: {
    backgroundColor: '#c62828',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  errorActionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mediaTypeContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  mediaTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  mediaTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  mediaTypeText: {
    fontSize: 12,
    color: '#666',
  },
  mediaTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  allFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#e3f2fd',
  },
  allFilesIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  allFilesInfo: {
    flex: 1,
  },
  allFilesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  allFilesSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  allFilesArrow: {
    fontSize: 20,
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  albumIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  albumCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  albumArrow: {
    fontSize: 20,
    color: '#007AFF',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  searchInput: {
    margin: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterInput: {
    marginHorizontal: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#34C759',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  fileCount: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontSize: 12,
    color: '#999',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  fileDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsIcon: {
    fontSize: 64,
  },
  detailsFileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
  },
  shareButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileGrNo: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FF9500',
    marginTop: 2,
  },
  grNoBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  mediaPreviewContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
  },
  videoPreviewContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  videoIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  videoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  videoSubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  playVideoButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playVideoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  audioPreviewContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  audioIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  audioText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  audioSubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  playAudioButton: {
    backgroundColor: '#9B59B6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playAudioButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pdfPreviewContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff5e6',
  },
  pdfIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  pdfText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pdfSubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  openPdfButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openPdfButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  documentPreviewContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  docIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  docText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  docSubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  openDocButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openDocButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
