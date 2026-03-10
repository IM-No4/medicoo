import AppIcon from '@/src/components/icons/AppIcon';
import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
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
  category?: string;
  showCategory?: boolean;
  isPrescriptionOnly?: boolean;
  onTogglePrescription?: () => void;
};

const SearchHeader = forwardRef<TextInput, Props>(
  ({ value, loading, onChange, onBack, onSubmit, category = 'Medicines', showCategory = false, isPrescriptionOnly, onTogglePrescription }, ref) => {
    
    const renderInput = (
      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          placeholder="Search for medicines..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {loading ? (
          <ActivityIndicator size="small" color="#EB6E25" style={styles.icon} />
        ) : value.length > 0 ? (
          <TouchableOpacity onPress={() => onChange('')} style={styles.icon}>
            <AppIcon name="x" size={18} color="#6B7280" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.icon}>
          <AppIcon name="mic" size={20} color="#EB6E25" />
        </TouchableOpacity>
      </View>
    );

    if (!showCategory) {
      return (
        <View style={styles.container}>
          <View style={styles.singleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <AppIcon name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            {renderInput}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {/* Top Info Row */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <AppIcon name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titlePrefix}>Showing results in</Text>
            <TouchableOpacity style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
              <AppIcon name="chevron-down" size={14} color="#EB6E25" />
            </TouchableOpacity>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar Row */}
        <View style={styles.searchRow}>
          {renderInput}

          <TouchableOpacity
            style={[styles.toggleContainer, isPrescriptionOnly && styles.toggleActive]}
            onPress={onTogglePrescription}
          >
            <View style={[styles.toggleBadge, isPrescriptionOnly && styles.toggleBadgeActive]}>
              <View style={[styles.toggleDot, isPrescriptionOnly && styles.toggleDotActive]} />
            </View>
            <Text style={styles.toggleText}>Rx</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

export default SearchHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titlePrefix: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 12,
  },
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingRight: 12,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    borderWidth: 0,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 0,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  icon: {
    padding: 2,
  },
  toggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  toggleBadge: {
    width: 20,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    padding: 1,
    justifyContent: 'center',
  },
  toggleBadgeActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  toggleDotActive: {
    backgroundColor: '#10B981',
    alignSelf: 'flex-end',
  },
  toggleActive: {
  },
  toggleText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
});
