import EmptyState from '@/src/components/layout/EmptyState';
import StatusModal, { StatusType } from '@/src/components/modals/StatusModal';
import { deleteDocument, fetchDocuments } from '@/src/services/api/document.api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getDocumentAsync } from 'expo-document-picker';
import {
  launchCameraAsync,
  MediaTypeOptions,
  requestCameraPermissionsAsync
} from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Eye, FolderOpen, FolderPlus, MoreVertical, Plus, Search, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uploadDocument } from '@/src/services/api/document.api';
import AddRecordModal from './components/AddRecordModal';
import EditRecordModal from './components/EditRecordModal';
import { DOCUMENT_TYPES, DocumentTypeMeta, DocumentTypeValue, getDocumentTypeMeta } from './documentTypes';
import RecordsSkeleton from './RecordsSkeleton';
import { RecordItem } from './types';

type Menu =
  | { kind: 'folder'; meta: DocumentTypeMeta }
  | { kind: 'record'; item: RecordItem };

// Must match the backend's hard cap in customerController.js's uploadDocument
// (UPLOAD_LIMIT_REACHED at 10 user_upload documents). Surfaced to the user
// inside AddRecordModal.
const MAX_UPLOADS = 10;

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function RecordsHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ uri: string; name: string } | null>(null);
  const [targetType, setTargetType] = useState<DocumentTypeValue | undefined>(undefined);

  const [menu, setMenu] = useState<Menu | null>(null);
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

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks only pull-to-refresh gestures, separate from `loading` (which is
  // the initial/full-screen spinner) - same split used on the Calendar
  // screen, so pulling down refreshes in place instead of swapping the
  // whole screen out for a centered spinner.
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const loadRecords = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsManualRefreshing(true); else setLoading(true);
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
      setRecords(mapped);
    } catch (e) {
      // Error fetching records
    } finally {
      if (isRefresh) setIsManualRefreshing(false); else setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadRecords(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      loadRecords();
      return () => setIsFocused(false);
    }, [])
  );

  const userUploadCount = useMemo(() => records.filter(r => !r.isSystem).length, [records]);

  // Per-category folder stats
  const folders = useMemo(() => {
    return DOCUMENT_TYPES.map(meta => {
      const items = records.filter(r => r.type === meta.value);
      const totalSize = items.reduce((sum, r) => sum + (r.size || 0), 0);
      return { meta, count: items.length, totalSize };
    });
  }, [records]);

  // While searching, show a flat result list across every category instead
  // of the folder grid.
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return records
      .filter(r => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q))
      .sort((a, b) => {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return sortOrder === 'newest' ? diff : -diff;
      });
  }, [search, records, sortOrder]);

  const isSearching = search.trim().length > 0;

  const handleAddPress = () => {
    setTargetType(undefined);
    setShowAddModal(true);
  };

  const handleFolderPress = (documentType: string, label: string) => {
    navigation.navigate('RecordsCategory', { documentType, label });
  };

  const handleRecordPress = (item: RecordItem) => navigation.navigate('RecordDetail', { record: item });

  const handleFolderAddPress = (meta: DocumentTypeMeta) => {
    setMenu(null);
    setTargetType(meta.value);
    setShowAddModal(true);
  };

  const handleDeletePress = (item: RecordItem) => {
    setMenu(null);
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

  // Matches MainTabs.tsx's actual tab bar height (64 + insets.bottom) plus
  // a clean gap above it, rather than a guessed offset.
  const fabBottomOffset = insets.bottom - 28;

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="dark" translucent backgroundColor="transparent" />}

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.topBarTitle}>Medical Records</Text>
      </View>

      {loading ? (
        <RecordsSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isManualRefreshing} onRefresh={onRefresh} />
          }
        >
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
                <ArrowUpWideNarrow size={18} color="#0FBBA1" />
              )}
            </TouchableOpacity>
          </View>

          {isSearching ? (
            searchResults.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                iconColor="#0FBBA1"
                iconBg="#EAFBF3"
                title="No matches"
                message="Try a different search term."
              />
            ) : (
              <View style={styles.groupCard}>
                {searchResults.map((item, index) => {
                  const isLast = index === searchResults.length - 1;
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
                      </View>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={(e) => {
                          setMenuTop(e.nativeEvent.pageY - 14);
                          setMenu({ kind: 'record', item });
                        }}
                      >
                        <MoreVertical size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            <View style={styles.grid}>
              {folders.map(({ meta, count, totalSize }) => {
                const Icon = meta.icon;
                return (
                  <TouchableOpacity
                    key={meta.value}
                    style={styles.folderCard}
                    activeOpacity={0.75}
                    onPress={() => handleFolderPress(meta.value, meta.folderLabel)}
                  >
                    <View style={{ padding: 16 }}>
                      <View style={styles.folderTopRow}>
                        <View style={[styles.folderIconBox, { backgroundColor: meta.bg }]}>
                          <Icon size={24} color={meta.color} strokeWidth={2.2} />
                        </View>
                        <TouchableOpacity
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          onPress={(e) => {
                            setMenuTop(e.nativeEvent.pageY - 14);
                            setMenu({ kind: 'folder', meta });
                          }}
                        >
                          <MoreVertical size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.folderTitle} numberOfLines={2}>{meta.folderLabel}</Text>
                    </View>
                    <View style={{ backgroundColor: '#fafafa', paddingVertical: 6, paddingHorizontal: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 14  }}>
                      <Text style={styles.folderCount}>{count} {count === 1 ? 'file' : 'files'}</Text>
                      <Text style={styles.folderSize}>{formatBytes(totalSize)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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
        initialType={targetType}
        lockType={!!targetType}
      />

      {/* Per-card action menu, anchored at the three-dot that opened it -
          no dimmed backdrop, just an invisible tap-outside-to-close layer. */}
      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenu(null)}>
          <View style={[styles.menuCard, { top: menuTop }]}>
            {menu?.kind === 'folder' ? (
              <>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    const meta = menu.meta;
                    setMenu(null);
                    handleFolderPress(meta.value, meta.folderLabel);
                  }}
                >
                  <FolderOpen size={18} color="#374151" />
                  <Text style={styles.menuRowText}>View All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={() => handleFolderAddPress(menu.meta)}>
                  <FolderPlus size={18} color="#374151" />
                  <Text style={styles.menuRowText}>Add Document</Text>
                </TouchableOpacity>
              </>
            ) : menu?.kind === 'record' ? (
              <>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    const item = menu.item;
                    setMenu(null);
                    handleRecordPress(item);
                  }}
                >
                  <Eye size={18} color="#374151" />
                  <Text style={styles.menuRowText}>View Details</Text>
                </TouchableOpacity>
                {!menu.item.isSystem && (
                  <TouchableOpacity style={styles.menuRow} onPress={() => handleDeletePress(menu.item)}>
                    <Trash2 size={18} color="#EF4444" />
                    <Text style={[styles.menuRowText, styles.menuRowTextDanger]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
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

  topBar: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFF',
  },
  filterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8FC',
    marginLeft: 8,
  },

  // 2-column folder grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    // padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  folderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  folderIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    minHeight: 22,
  },
  folderCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  folderSize: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Search-result grouped card (reused row visuals from the category screen)
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },

  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0FBBA1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0FBBA1',
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
});
