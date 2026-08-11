import EmptyState from '@/src/components/layout/EmptyState';
import StatusModal, { StatusType } from '@/src/components/modals/StatusModal';
import { deleteDocument, fetchDocuments, uploadDocument } from '@/src/services/api/document.api';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { getDocumentAsync } from 'expo-document-picker';
import {
  launchCameraAsync,
  MediaTypeOptions,
  requestCameraPermissionsAsync
} from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { ArrowDownWideNarrow, ArrowLeft, ArrowUpWideNarrow, Eye, FolderOpen, MoreVertical, Plus, Search, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AddRecordModal from './components/AddRecordModal';
import EditRecordModal from './components/EditRecordModal';
import { DocumentTypeValue, getDocumentTypeMeta } from './documentTypes';
import { RecordItem } from './types';

// Must match the backend's hard cap in customerController.js's uploadDocument
// (UPLOAD_LIMIT_REACHED at 10 user_upload documents). Surfaced to the user
// inside AddRecordModal.
const MAX_UPLOADS = 10;

export default function RecordsCategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { documentType, label } = route.params as { documentType: DocumentTypeValue; label: string };
  const [isFocused, setIsFocused] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ uri: string; name: string } | null>(null);

  const [allRecords, setAllRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [menuItem, setMenuItem] = useState<RecordItem | null>(null);
  const [menuTop, setMenuTop] = useState(0);
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({ visible: false, type: 'idle', title: '', message: '' });

  const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
    setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
  };
  const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

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
        size: doc.size || 0,
      }));
      setAllRecords(mapped);
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

  const parseDate = (d: string) => new Date(d + 'T00:00:00');

  const formatDisplayDate = (d: string) => {
    const date = parseDate(d);
    const today = new Date();
    const dTime = new Date(date).setHours(0, 0, 0, 0);
    const tTime = new Date(today).setHours(0, 0, 0, 0);
    const diffDays = (tTime - dTime) / (1000 * 60 * 60 * 24);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (diffDays === 0) return `${dateStr} • Today`;
    if (diffDays === 1) return `${dateStr} • Yesterday`;
    return dateStr;
  };

  const userUploadCount = useMemo(() => allRecords.filter(r => !r.isSystem).length, [allRecords]);

  const categoryRecords = useMemo(
    () => allRecords.filter(r => r.type === documentType),
    [allRecords, documentType]
  );

  // Real, data-driven source list (doctor/hospital/lab names already stored
  // on each document) rather than a fabricated specialty list - only
  // sources actually present in this category show up as chips.
  const sourceOptions = useMemo(() => {
    const names = Array.from(new Set(categoryRecords.map(r => r.subtitle).filter(Boolean)));
    return ['All', ...names];
  }, [categoryRecords]);

  const filteredRecords = useMemo(() => {
    let filtered = categoryRecords;
    if (activeSource !== 'All') {
      filtered = filtered.filter(r => r.subtitle === activeSource);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a, b) => {
      const diff = parseDate(b.date).getTime() - parseDate(a.date).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
  }, [categoryRecords, search, activeSource, sortOrder]);

  // Grouped by upload recency (year), matching the folder-grid's sibling
  // drill-down pattern rather than re-splitting by system/upload source.
  const sections = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const groups = new Map<string, RecordItem[]>();

    filteredRecords.forEach(r => {
      const year = parseDate(r.date).getFullYear();
      const key = year === currentYear ? 'The Last Reports' : `${year} Year Reports`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });

    const orderedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === 'The Last Reports') return -1;
      if (b === 'The Last Reports') return 1;
      return b.localeCompare(a);
    });

    return orderedKeys.map(key => ({ title: key, data: groups.get(key)! }));
  }, [filteredRecords]);

  const handleAddPress = () => setShowAddModal(true);
  const handleRecordPress = (item: RecordItem) => navigation.navigate('RecordDetail', { record: item });

  const handleDeletePress = (item: RecordItem) => {
    setMenuItem(null);
    showStatus(
      'warning',
      'Delete Document?',
      'Are you sure you want to permanently remove this document? This action cannot be reversed.',
      async () => {
        hideStatus();
        try {
          await deleteDocument(item.id);
          await loadRecords();
        } catch (error) {
          showStatus('error', 'Deletion Failed', 'We couldn\'t delete the document. Please check your connection and try again.');
        }
      },
      'Delete'
    );
  };

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

  const fabBottomOffset = insets.bottom - 28;

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="dark" translucent backgroundColor="transparent" />}

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{label}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2FA561" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your file.."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity
              style={styles.filterIconBtn}
              activeOpacity={0.7}
              onPress={() => setSortOrder(o => (o === 'newest' ? 'oldest' : 'newest'))}
            >
              {sortOrder === 'newest' ? (
                <ArrowDownWideNarrow size={18} color="#374151" />
              ) : (
                <ArrowUpWideNarrow size={18} color="#2FA561" />
              )}
            </TouchableOpacity>
          </View>

          {sourceOptions.length > 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {sourceOptions.map(source => (
                <TouchableOpacity
                  key={source}
                  style={[styles.chip, activeSource === source && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setActiveSource(source)}
                >
                  <Text style={[styles.chipText, activeSource === source && styles.chipTextActive]} numberOfLines={1}>
                    {source}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {sections.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              iconColor="#2FA561"
              iconBg="#EAFBF3"
              title="No records found"
              message={`Your ${label.toLowerCase()} will appear here.`}
              actionLabel="Add a document"
              onAction={handleAddPress}
            />
          ) : (
            sections.map(section => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>

                <View style={styles.groupCard}>
                  {section.data.map((item, index) => {
                    const isLast = index === section.data.length - 1;
                    const { icon: Icon, color, bg } = getDocumentTypeMeta(item.type);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.row, !isLast && styles.rowDivider]}
                        activeOpacity={0.7}
                        onPress={() => handleRecordPress(item)}
                      >
                        <View style={[styles.iconAvatar, { backgroundColor: bg }]}>
                          <Icon size={22} color={color} strokeWidth={2.2} />
                        </View>
                        <View style={styles.rowInfo}>
                          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.rowSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                          <Text style={styles.rowDate}>{formatDisplayDate(item.date)}</Text>
                        </View>
                        <TouchableOpacity
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          onPress={(e) => {
                            setMenuTop(e.nativeEvent.pageY - 14);
                            setMenuItem(item);
                          }}
                        >
                          <MoreVertical size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottomOffset }]}
        activeOpacity={0.85}
        onPress={handleAddPress}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

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
        initialType={documentType}
        lockType
      />

      {/* Per-row action menu, anchored at the three-dot button that opened
          it - no dimmed backdrop, just an invisible tap-outside-to-close
          layer, since this is a dropdown, not a dialog. */}
      <Modal visible={!!menuItem} transparent animationType="fade" onRequestClose={() => setMenuItem(null)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuItem(null)}>
          <View style={[styles.menuCard, { top: menuTop }]}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                const item = menuItem;
                setMenuItem(null);
                if (item) handleRecordPress(item);
              }}
            >
              <Eye size={18} color="#374151" />
              <Text style={styles.menuRowText}>View Details</Text>
            </TouchableOpacity>
            {menuItem && !menuItem.isSystem && (
              <TouchableOpacity style={styles.menuRow} onPress={() => menuItem && handleDeletePress(menuItem)}>
                <Trash2 size={18} color="#EF4444" />
                <Text style={[styles.menuRowText, styles.menuRowTextDanger]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
        primaryAction={status.primaryAction}
        primaryActionText={status.primaryActionText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FC',
  },

  // Blends into the page background rather than sitting on its own white
  // bar with a shadow - matches the reference, where the header, search
  // field, and chips all float directly on the same light backdrop and
  // only the search/chip/list cards themselves carry shadows.
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FC',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
  },

  // Soft shadow only - no border stroke, matching the reference exactly.
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },
  filterIconBtn: {
    marginLeft: 8,
  },

  chipRow: {
    paddingBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  chipActive: {
    backgroundColor: '#2FA561',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#fff',
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  // Soft shadow, no border - rounded corners on the outer card only, rows
  // are flat siblings inside separated by a hairline divider.
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  iconAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowInfo: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  rowDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 1,
  },

  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2FA561',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2FA561',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuCard: {
    position: 'absolute',
    right: 24,
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuRowTextDanger: {
    color: '#EF4444',
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
});
