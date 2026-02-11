import { fetchDocuments, uploadDocument } from '@/src/services/api/document.api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getDocumentAsync } from 'expo-document-picker';
import {
  launchCameraAsync,
  MediaTypeOptions,
  requestCameraPermissionsAsync
} from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { FolderOpen, PieChart, Plus, Search, UploadCloud } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AddRecordModal from './components/AddRecordModal';
import EditRecordModal from './components/EditRecordModal';
import RecordCard from './components/RecordCard';

type RecordItem = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  date: string;
  isSystem?: boolean;
  uri?: string;
  mimeType?: string;
};

const MAX_UPLOADS = 15;
const FILTERS = ['All', 'Prescriptions', 'Lab Reports', 'Scans', 'Discharge Summary'];

export default function RecordsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Data & State
  const [pendingUpload, setPendingUpload] = useState<{ uri: string; name: string } | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Animations
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await fetchDocuments();
      const mapped: RecordItem[] = data.map(doc => ({
        id: doc._id,
        title: doc.name,
        subtitle: doc.sourceName || 'User Uploaded',
        type: doc.documentType,
        date: doc.createdAt.split('T')[0],
        isSystem: doc.sourceType !== 'user_upload',
        uri: doc.fileUrl,
        mimeType: doc.mimeType,
      }));
      setRecords(mapped);
    } catch (e) {
      // Error fetching records
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      loadRecords();
      return () => setIsFocused(false);
    }, [])
  );

  // Helpers
  const parseDate = (d: string) => new Date(d + 'T00:00:00');

  const formatDisplayDate = (d: string) => {
    const date = parseDate(d);
    const today = new Date();
    const dTime = new Date(date).setHours(0, 0, 0, 0);
    const tTime = new Date(today).setHours(0, 0, 0, 0);
    const diffDays = (tTime - dTime) / (1000 * 60 * 60 * 24);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (diffDays === 0) return `${dateStr} • Today`;
    if (diffDays === 1) return `${dateStr} • Yesterday`;
    return dateStr;
  };

  const getRecordIconArgs = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lab_report': return { name: 'flask', color: '#7C3AED', bg: '#F3E8FF' };
      case 'scan': return { name: 'image', color: '#0284C7', bg: '#E0F2FE' };
      case 'prescription': return { name: 'file-text', color: '#059669', bg: '#D1FAE5' };
      default: return { name: 'file', color: '#6B7280', bg: '#F3F4F6' };
    }
  }

  // Derived Data
  const { filteredRecords, userUploadCount, storageUsed } = useMemo(() => {
    let filtered = records;

    // 1. Text Search
    const q = search.toLowerCase();
    if (q) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (activeFilter !== 'All') {
      const typeMap: Record<string, string> = {
        'Prescriptions': 'prescription',
        'Lab Reports': 'lab_report',
        'Scans': 'scan',
        'Discharge Summary': 'discharge_summary'
      };
      const targetType = typeMap[activeFilter];
      if (targetType) {
        filtered = filtered.filter(r => r.type === targetType);
      }
    }

    // 3. Sort
    filtered.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

    const totalUserUploads = records.filter(r => !r.isSystem).length;

    // Mock storage calc
    const storageUsed = Math.min((totalUserUploads / MAX_UPLOADS) * 100, 100);

    return {
      filteredRecords: filtered,
      userUploadCount: totalUserUploads,
      storageUsed
    };
  }, [search, records, activeFilter]);

  // Sectioning
  const sections = useMemo(() => {
    const medical = filteredRecords.filter(r => r.isSystem);
    const uploads = filteredRecords.filter(r => !r.isSystem);
    const arr = [];
    if (medical.length > 0) arr.push({ title: 'Medical Records', data: medical });
    if (uploads.length > 0) arr.push({ title: 'My Uploads', data: uploads });
    return arr;
  }, [filteredRecords]);

  // Handlers
  const handleAddPress = () => setShowAddModal(true);
  const handleRecordPress = (item: RecordItem) => navigation.navigate('RecordDetail', { record: item });

  const handleScan = async () => {
    try {
      const { status } = await requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Camera permission is required.');
        return;
      }
      const result = await launchCameraAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) {
        setPendingUpload({ uri: result.assets[0].uri, name: 'Scanned_Doc_' + new Date().getTime() });
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Scan error:', error);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setPendingUpload({ uri: result.assets[0].uri, name: result.assets[0].name });
        setShowEditModal(true);
      }
    } catch (err) {
      // Pick error
    }
  };

  const handleSaveRecord = async (details: { title: string; type: string; subtitle: string }) => {
    if (!pendingUpload) return;
    try {
      const formData = new FormData();
      const uri = pendingUpload.uri;
      let type = 'application/octet-stream';
      if (uri.endsWith('.pdf')) type = 'application/pdf';
      else if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) type = 'image/jpeg';
      else if (uri.endsWith('.png')) type = 'image/png';

      formData.append('file', {
        uri: uri,
        name: pendingUpload.name || 'upload.jpg',
        type: type,
      } as any);

      formData.append('name', details.title);
      formData.append('documentType', details.type);
      if (details.subtitle) formData.append('sourceName', details.subtitle);

      await uploadDocument(formData);
      await loadRecords();
      setShowEditModal(false);
      setPendingUpload(null);
    } catch (error) {
      console.error("Upload failed", error);
      throw error;
    }
  };

  const renderListEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBg}>
        <FolderOpen size={40} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No records found</Text>
      <Text style={styles.emptyText}>
        Your health documents will appear here. Tap the + button to add your first record.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="dark" translucent backgroundColor="transparent" />}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>Medical Records</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={handleAddPress}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Storage / Summary Card */}
      <View style={styles.summaryContainer}>
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <View style={styles.storageIcon}>
              <PieChart size={18} color="#2FA561" />
            </View>
            <View>
              <Text style={styles.storageTitle}>Digital Locker</Text>
              <Text style={styles.storageSubtitle}>
                {userUploadCount} of {MAX_UPLOADS} uploads used
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.storageBadge}>
              <UploadCloud size={12} color="#2FA561" style={{ marginRight: 4 }} />
              <Text style={styles.storageBadgeText}>{Math.round(storageUsed)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${storageUsed}%` }]} />
          </View>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === item && styles.filterTextActive
              ]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2FA561" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={renderListEmpty}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const iconArgs = getRecordIconArgs(item.type);
            return (
              <RecordCard
                title={item.title}
                subtitle={item.subtitle}
                type={item.type}
                date={formatDisplayDate(item.date)}
                iconName={iconArgs.name}
                iconColor={iconArgs.color}
                iconBg={iconArgs.bg}
                variant={item.isSystem ? 'elevated' : 'soft'}
                onPress={() => handleRecordPress(item)}
              />
            );
          }}
        />
      )}

      {/* Modals */}
      <AddRecordModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onScan={handleScan}
        onUpload={handleUpload}
        uploadCount={userUploadCount}
        maxUploads={MAX_UPLOADS}
      />

      <EditRecordModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setPendingUpload(null);
        }}
        onSubmit={handleSaveRecord}
        initialData={pendingUpload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2FA561',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2FA561',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Summary Card
  summaryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  storageCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  storageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  storageSubtitle: {
    fontSize: 12,
    color: '#15803D',
    opacity: 0.8,
  },
  storageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2FA561',
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2FA561',
    borderRadius: 3,
  },

  // Controls
  controlsContainer: {
    marginTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
});
