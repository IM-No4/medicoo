import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from '../../components/ThemedStatusBar';
import {
  ChevronLeft,
  Clock,
  Download,
  FileText,
  Trash2
} from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StatusModal, { StatusType } from '@/src/components/modals/StatusModal';
import { deleteDocument, getDocumentViewUrl } from '@/src/services/api/document.api';
import { getToken } from '@/src/utils/tokenManagement';
import { getDocumentTypeMeta } from './documentTypes';
import { RecordItem } from './types';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function RecordDetailScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const record: RecordItem = route.params.record;
  const [isDeleting, setIsDeleting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState(0.75); // Default to ~3:4 (A4ish)

  // Status Modal State
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({
    visible: false,
    type: 'idle',
    title: '',
    message: ''
  });

  useEffect(() => {
    getToken('access_token').then(t => setToken(t));
  }, []);

  useEffect(() => {
    if (!token || !record.uri || !isImage(record.mimeType, record.uri)) return;

    // Check if we can fetch size (works for public or some signed URLs)
    const viewUrl = getDocumentViewUrl(record.id);
    Image.getSize(viewUrl, (width, height) => {
      if (width && height) {
        setImageAspectRatio(width / height);
      }
    }, (error) => {
      // Failed to calculate image size
    });
  }, [token, record.id, record.uri, record.mimeType]);

  const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
    setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
  };

  const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

  const handleDelete = () => {
    showStatus(
      'warning',
      t('delete_document'),
      t('are_you_sure_you_want_to_permanently_r'),
      async () => {
        try {
          setIsDeleting(true);
          hideStatus();
          await deleteDocument(record.id);
          navigation.goBack();
        } catch (error) {
          setIsDeleting(false);
          showStatus('error', t('deletion_failed'), t('we_couldn_t_delete_the_document_please'));
        }
      },
      'Delete'
    );
  };

  const handleDownload = async () => {
    if (!token) return;

    try {
      showStatus('loading', t('downloading'), t('please_wait_while_we_prepare_your_file'));

      const viewUrl = getDocumentViewUrl(record.id);
      // Determine extension
      let extension = 'pdf';
      if (record.mimeType === 'image/jpeg') extension = 'jpg';
      else if (record.mimeType === 'image/png') extension = 'png';
      else if (record.uri) extension = record.uri.split('.').pop() || 'pdf';

      const filename = (record.title || 'document').replace(/[^a-zA-Z0-9]/g, '_') + '.' + extension;
      const fileUri = (FileSystem.documentDirectory || '') + filename;

      const downloadRes = await FileSystem.downloadAsync(
        viewUrl,
        fileUri,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, { encoding: FileSystem.EncodingType.Base64 });
          const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, record.mimeType || 'application/pdf');
          await FileSystem.writeAsStringAsync(createdUri, base64, { encoding: FileSystem.EncodingType.Base64 });

          hideStatus();
          showStatus('success', t('success'), 'File saved successfully to ' + permissions.directoryUri);
        } else {
          hideStatus();
          showStatus('error', t('permission_denied'), t('cannot_save_file_without_storage_permi'));
        }
      } else {
        hideStatus();
        showStatus('success', t('downloaded'), 'File downloaded to app documents: ' + fileUri);
      }
    } catch (error) {
      console.error('Download failed:', error);
      hideStatus();
      showStatus('error', t('error'), t('failed_to_download_file'));
    }
  };

  const isImage = (mimeType?: string, uri?: string) => {
    if (mimeType && mimeType.startsWith('image/')) return true;
    if (uri) {
      const lower = uri.toLowerCase();
      return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
    }
    return false;
  };

  const renderPreview = () => {
    if (!token) {
      return (
        <View style={styles.loadingPreview}>
          <ActivityIndicator size="small" color="#10B981" />
        </View>
      );
    }

    if (isImage(record.mimeType, record.uri)) {
      const viewUrl = getDocumentViewUrl(record.id);

      return (
        <View style={styles.imageCard}>
          <Image
            source={{
              uri: viewUrl,
              headers: { Authorization: `Bearer ${token} ` }
            }}
            style={[styles.previewImage, { aspectRatio: imageAspectRatio }]}
            resizeMode="contain"
          />
        </View>
      );
    }

    // Fallback for non-images (PDFs etc)
    return (
      <View style={styles.fallbackCard}>
        <View style={styles.fallbackIconBg}>
          <FileText size={48} color="#10B981" />
        </View>
        <Text style={styles.fallbackTitle}>{t('preview_unavailable')}</Text>
        <Text style={styles.fallbackSubtitle}>
          This file type ({t(typeMeta.label)}) cannot be previewed directly.
        </Text>
        <TouchableOpacity style={styles.downloadBtnPlaceholder} onPress={handleDownload}>
          <Download size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={styles.downloadBtnText}>{t('download_file')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const typeMeta = getDocumentTypeMeta(record.type);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('document_details')}</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleDownload}
          >
            <Download size={22} color={theme.text} />
          </TouchableOpacity>

          {!record.isSystem && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.errorBg }]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <ActivityIndicator size="small" color="#EF4444" /> : <Trash2 size={22} color="#EF4444" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Document Header Info - Cleaner, Left Aligned */}
        <View style={styles.docHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeMeta.bg }]}>
              <Text style={[styles.typeText, { color: typeMeta.color }]}>{t(typeMeta.label).toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.docTitle}>{record.title}</Text>

          <View style={styles.metaRow}>
            <Clock size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.docSubtitle}>{record.date}</Text>

            <View style={styles.dotSeparator} />

            <Text style={styles.docSubtitle}>{record.subtitle}</Text>
          </View>
        </View>

        {/* File Preview */}
        {renderPreview()}

      </ScrollView>

      {/* Status Modal */}
      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
        primaryAction={status.primaryAction}
        primaryActionText={status.primaryActionText}
        autoCloseDelay={status.type === 'success' ? 2500 : undefined}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // Same header recipe as the rest of the app - white bar + shadow, plain
  // icon back button, fontSize 20/600/#111827 title. The right-side
  // download/delete buttons keep their own filled chip style below
  // (iconBtn) - they're functional actions, not navigation.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: c.cardSecondary,
  },
  scrollContent: {
    padding: 24,
  },

  // Doc Header
  docHeader: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    lineHeight: 32,
    marginBottom: 8,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 10,
  },

  // Preview
  imageCard: {
    backgroundColor: c.cardSecondary,
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    // height: 450, // Removed fixed height
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: 'center', // Keep vertical center in case of loading
    // alignItems: 'center', // Removed to let image fill width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  previewImage: {
    width: '100%',
    height: undefined, // Let aspect ratio drive height
  },
  loadingPreview: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackCard: {
    backgroundColor: c.cardSecondary,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: 400,
  },
  fallbackIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  downloadBtnPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
    borderRadius: 100,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
