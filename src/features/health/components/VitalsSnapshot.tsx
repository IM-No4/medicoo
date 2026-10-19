import { useNavigation } from '@react-navigation/native';
import { Activity, Plus, TrendingUp, Weight } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

export function VitalsSnapshot() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const { records } = useSelector((state: RootState) => state.vitals);

  // Find latest recorded vitals. Heart Rate and Temperature are shown
  // higher up on this screen already (the ring, and the summary row), so
  // this snapshot only covers the two vitals that aren't shown anywhere
  // else - showing them again here would just be the same number twice.
  const latestManual = records[0];
  const latestSystolic = latestManual?.systolic;
  const latestDiastolic = latestManual?.diastolic;
  const latestWeight = latestManual?.weight;

  const openHistory = (metric: 'weight' | 'blood_pressure') => {
    navigation.navigate('VitalsHistory', { metric });
  };

  return (
    <HealthSection
      title={t('vitals_snapshot')}
      icon={
        <View style={styles.headerActionsContainer}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('LogVitals')}
            activeOpacity={0.7}
          >
            <Plus size={12} color="#10B981" style={{ marginRight: 2 }} />
            <Text style={styles.headerActionBtnText}>{t('log')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('VitalsHistory')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerActionBtnText}>{t('history')}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.vitalsContainer}>
        <View style={styles.topRow}>
          {/* Weight */}
          <VitalCard
            label={t('weight')}
            value={latestWeight !== undefined ? `${latestWeight}` : '--'}
            unit="KG"
            icon={<Weight size={16} color="#8B5CF6" />}
            bgColor={isDark ? '#8B5CF626' : '#F5F3FF'}
            onPress={() => openHistory('weight')}
          />

          {/* Blood Pressure */}
          <VitalCard
            label={t('blood_pressure')}
            value={latestSystolic !== undefined && latestDiastolic !== undefined ? `${latestSystolic}/${latestDiastolic}` : '--'}
            unit="mmHg"
            icon={<Activity size={16} color="#3B82F6" />}
            bgColor={isDark ? '#3B82F626' : '#EFF6FF'}
            onPress={() => openHistory('blood_pressure')}
          />
        </View>
      </View>
    </HealthSection>
  );
}

function VitalCard({ label, value, unit, icon, bgColor, onPress }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity
      style={styles.vitalCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.vitalTop}>
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          {icon}
        </View>
        {value !== '--' && <TrendingUp size={14} color="#10B981" />}
      </View>
      <View style={styles.vitalBottom}>
        <View style={styles.valueRow}>
          <Text style={styles.vitalValue}>{value}</Text>
          <Text style={styles.vitalUnit}>{unit}</Text>
        </View>
        <Text style={styles.vitalLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  headerActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.successBg,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.isDark ? 'rgba(16,185,129,0.25)' : '#DCFCE7',
  },
  headerActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  vitalsContainer: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
  },
  vitalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalBottom: {
    gap: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  vitalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: c.text,
  },
  vitalUnit: {
    fontSize: 11,
    color: c.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vitalLabel: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
});
