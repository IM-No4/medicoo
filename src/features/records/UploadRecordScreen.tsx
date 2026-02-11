import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AppIcon from '../../components/icons/AppIcon';

type RecordType = 'prescription' | 'lab' | 'imaging' | 'other';

export default function UploadRecordScreen() {
  const [file, setFile] = useState<any>(null);
  const [type, setType] = useState<RecordType>('prescription');

  const pickFile = async () => {
    const result =
      await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Text style={styles.title}>Upload Record</Text>

      {/* File picker */}
      <TouchableOpacity
        style={styles.pickBox}
        onPress={pickFile}
      >
        <AppIcon name="upload" size={28} />
        <Text style={styles.pickText}>
          {file ? file.name : 'Select PDF or Image'}
        </Text>
      </TouchableOpacity>

      {/* Type selector */}
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
            onPress={() =>
              setType(t.key as RecordType)
            }
          >
            <Text>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[
          styles.saveBtn,
          !file && { opacity: 0.4 },
        ]}
        disabled={!file}
        onPress={() => {
          // TODO: dispatch saveRecord()
          alert('Record saved (mock)');
        }}
      >
        <Text style={styles.saveText}>
          Save Record
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* styles */
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
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  typeActive: {
    backgroundColor: '#D1FAE5',
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
    fontWeight: '600',
  },
});
