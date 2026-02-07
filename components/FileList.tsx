import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { FileItem, formatFileSize, formatDate } from '../utils/fileSystemUtils';

interface FileListProps {
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  loading: boolean;
  onGoBack?: () => void;
  canGoBack?: boolean;
  dirName?: string;
  onRefresh?: () => void;
  onDeleteFile?: (fileId: string) => void;
}

type FilterType = 'name' | 'date' | 'grNo' | 'size';
type SortType = 'newest' | 'oldest' | 'name' | 'size';

export const FileList: React.FC<FileListProps> = ({ 
  files, 
  onSelectFile, 
  loading,
  onGoBack,
  canGoBack = false,
  dirName = 'Files',
  onRefresh,
  onDeleteFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('name');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [filterValue, setFilterValue] = useState('');

  const filterFiles = useCallback(() => {
    let filtered = [...files];

    if (searchQuery.trim()) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.grNo?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply specific filters
    if (filterValue.trim()) {
      switch (filterType) {
        case 'name':
          filtered = filtered.filter(file =>
            file.name.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        case 'date':
          // Filter by date (format: YYYY-MM-DD)
          try {
            const filterDate = new Date(filterValue).getTime();
            filtered = filtered.filter(file => {
              const fileDate = new Date((file.uploadDate || file.modificationTime) * (file.uploadDate ? 1 : 1000));
              const filterDateObj = new Date(filterDate);
              return (
                fileDate.toDateString() === filterDateObj.toDateString()
              );
            });
          } catch (e) {
            console.log('Invalid date filter');
          }
          break;
        case 'grNo':
          filtered = filtered.filter(file =>
            file.grNo?.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        case 'size':
          const sizeInBytes = parseFloat(filterValue) * 1024; // Assuming input in KB
          filtered = filtered.filter(file => file.size <= sizeInBytes);
          break;
      }
    }

    return filtered;
  }, [files, searchQuery, filterType, filterValue]);

  const sortFiles = useCallback((filesToSort: FileItem[]) => {
    const sorted = [...filesToSort];
    
    switch (sortType) {
      case 'newest':
        sorted.sort((a, b) => {
          const aTime = a.uploadDate || a.modificationTime;
          const bTime = b.uploadDate || b.modificationTime;
          return bTime - aTime; // Newest first
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const aTime = a.uploadDate || a.modificationTime;
          const bTime = b.uploadDate || b.modificationTime;
          return aTime - bTime; // Oldest first
        });
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'size':
        sorted.sort((a, b) => a.size - b.size);
        break;
    }
    
    return sorted;
  }, [sortType]);

  const processedFiles = sortFiles(filterFiles());

  const renderFilterButton = (type: FilterType, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.filterButtonActive,
      ]}
      onPress={() => {
        setFilterType(type);
        setFilterValue('');
      }}
    >
      <Text
        style={[
          styles.filterButtonText,
          filterType === type && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSortButton = (type: SortType, label: string) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortType === type && styles.sortButtonActive,
      ]}
      onPress={() => setSortType(type)}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortType === type && styles.sortButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => onSelectFile(item)}
    >
      <View style={styles.fileContent}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.grNo && (
          <Text style={styles.grNo}>
            📌 {item.grNo}
          </Text>
        )}
        <View style={styles.fileDetails}>
          <Text style={styles.fileDetail}>
            Size: {formatFileSize(item.size)}
          </Text>
          <Text style={styles.fileDetail}>
            Uploaded: {formatDate((item.uploadDate || item.modificationTime) / (item.uploadDate ? 1 : 1000))}
          </Text>
        </View>
      </View>
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>
          {item.isDirectory ? '📁' : '📄'}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search files by name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />

      {/* Header with Back Button and Refresh */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, !canGoBack && styles.backButtonDisabled]}
          onPress={onGoBack}
          disabled={!canGoBack}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dirName}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filter By:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            {renderFilterButton('name', 'Name')}
            {renderFilterButton('date', 'Date')}
            {renderFilterButton('grNo', 'GR No.')}
            {renderFilterButton('size', 'Size')}
          </View>
        </ScrollView>

        {/* Filter Input based on selected filter type */}
        {filterValue !== '' || filterType !== 'name' ? (
          <TextInput
            style={styles.filterInput}
            placeholder={
              filterType === 'name'
                ? 'Filter by name...'
                : filterType === 'date'
                ? 'Filter by date (YYYY-MM-DD)...'
                : filterType === 'grNo'
                ? 'Filter by GR No...'
                : 'Filter by size (KB)...'
            }
            value={filterValue}
            onChangeText={setFilterValue}
            placeholderTextColor="#999"
            keyboardType={filterType === 'size' ? 'decimal-pad' : 'default'}
          />
        ) : null}
      </View>

      {/* Sort Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sort By:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortContainer}>
            {renderSortButton('newest', 'Newest')}
            {renderSortButton('oldest', 'Oldest')}
            {renderSortButton('name', 'Name')}
            {renderSortButton('size', 'Size')}
          </View>
        </ScrollView>
      </View>

      {/* File Count */}
      <Text style={styles.fileCount}>
        Total: {processedFiles.length} / {files.length} files
      </Text>

      {/* Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={processedFiles}
          renderItem={renderFileItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No files found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  backButtonDisabled: {
    backgroundColor: '#ccc',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  searchInput: {
    margin: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    fontSize: 14,
    color: '#000',
  },
  section: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterInput: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    fontSize: 14,
    color: '#000',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  fileCount: {
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  fileItem: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  fileContent: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  grNo: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF9500',
    marginBottom: 6,
  },
  fileDetails: {
    gap: 4,
  },
  fileDetail: {
    fontSize: 11,
    color: '#666',
  },
  fileIcon: {
    fontSize: 28,
  },
  fileIconText: {
    fontSize: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginTop: 20,
  },
});
