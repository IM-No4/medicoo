import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';
import { useSelector } from 'react-redux';

import { executeAction } from '@/src/actions/ActionExecutor';
import { RootState } from '@/src/redux/store';
import { resolveCommands } from './resolveCommands';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CommandPalette({
  visible,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');

  const searchResults = useSelector(
    (state: RootState) => state.search.results
  );

  const commands = resolveCommands(query, searchResults);

  // ✅ Clear input when closed
  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose} // ✅ Android back button
    >
      {/* 🌫 BACKDROP */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* 🧠 Stop propagation so taps inside don't close */}
        <Pressable style={styles.container}>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search or type a command…"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          {commands.map((cmd) => (
            <TouchableOpacity
              key={cmd.id}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => {
                executeAction(
                  cmd.actionKey as any,
                  cmd.params
                );
                onClose(); // ✅ close after action
              }}
            >
              <Text style={styles.title}>{cmd.title}</Text>
              {cmd.subtitle && (
                <Text style={styles.subtitle}>
                  {cmd.subtitle}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    maxHeight: '70%',
  },
  input: {
    padding: 12,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
    color: '#111827',
  },
  row: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
