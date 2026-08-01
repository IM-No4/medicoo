import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AppIcon from '../../components/icons/AppIcon';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { uploadDocument } from '../../services/api/document.api';

type RecordType = 'prescription' | 'lab' | 'imaging' | 'other';

export default function UploadRecordScreen() {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [type, setType] = useState<RecordType>('prescription');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
  }>({ visible: false, type: 'idle', title: '', message: '' });

  const showStatus = (type: StatusType, title: string, message: string) => {
    setStatus({ visible: true, type, title, message });
  };
  const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      setFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || `record.${(file.mimeType || '').includes('pdf') ? 'pdf' : 'jpg'}`,
        type: file.mimeType || 'application/octet-stream',
      } as any);
      formData.append('name', file.name || 'Medical Record');
      formData.append('documentType', type);
      formData.append('sourceName', 'mobile_app');

      await uploadDocument(formData);

      showStatus('success', 'Success', 'Your record has been uploaded successfully.');
      setFile(null);
      setType('prescription');
    } catch {
      showStatus('error', 'Upload Failed', 'We could not upload the record right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Text style={styles.title}>Upload Record</Text>

      <TouchableOpacity
        style={styles.pickBox}
        onPress={pickFile}
        disabled={saving}
      >
        <AppIcon name="upload" size={28} />
        <Text style={styles.pickText}>
          {file ? file.name : 'Select PDF or Image'}
        </Text>
        <Text style={styles.pickHint}>
          {file ? 'Tap to replace the selected file' : 'PDF, JPG, PNG, or WebP'}
        </Text>
      </TouchableOpacity>

      <View style={styles.types}>
        {[
          { key: 'prescription', label: 'Prescription' },
          { key: 'lab', label: 'Lab Report' },
          { key: 'imaging', label: 'Imaging' },
          { key: 'other', label: 'Other' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.typeChip,
              type === t.key && styles.typeActive,
            ]}
            onPress={() => setType(t.key as RecordType)}
            disabled={saving}
          >
            <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.saveBtn,
          (!file || saving) && { opacity: 0.5 },
        ]}
        disabled={!file || saving}
        onPress={handleUpload}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Upload Record</Text>
        )}
      </TouchableOpacity>

      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
        autoCloseDelay={status.type === 'success' ? 2000 : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  pickBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  pickText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  pickHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  typeActive: {
    backgroundColor: '#D1FAE5',
  },
  typeText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#065F46',
  },
  saveBtn: {
    marginTop: 'auto',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
