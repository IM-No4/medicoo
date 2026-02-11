import AppIcon from '@/src/components/icons/AppIcon';
import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  value: string;
  loading?: boolean;
  onChange: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

const SearchHeader = forwardRef<TextInput, Props>(
  ({ value, loading, onChange, onBack, onSubmit }, ref) => {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <AppIcon name="arrow-left" size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <AppIcon name="search" size={18} color="#6B7280" />

          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChange}
            placeholder="Search medicines, doctors, labs"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
          />

          {loading ? (
            <ActivityIndicator size="small" />
          ) : value.length > 0 ? (
            <TouchableOpacity onPress={() => onChange('')}>
              <AppIcon name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }
);

export default SearchHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
});
