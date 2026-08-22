import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Activity, ChevronLeft, Heart, Thermometer, Weight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { VitalRecord } from '../../redux/slices/vitalsSlice';

type MetricType = 'heart_rate' | 'blood_pressure' | 'weight' | 'temperature';
type RangeType = 'D' | 'W' | 'M' | '6M';

interface MetricConfig {
  key: MetricType;
  label: string;
  unit: string;
  color: string;
  bg: string;
}

const METRICS: MetricConfig[] = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'BPM', color: '#EF4444', bg: '#FEF2F2' },
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'weight', label: 'Weight', unit: 'KG', color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'temperature', label: 'Temperature', unit: '°F', color: '#0EA5E9', bg: '#F0F9FF' },
];

const RANGES: RangeType[] = ['D', 'W', 'M', '6M'];
const RANGE_LABEL: Record<RangeType, string> = { D: 'Daily', W: 'Weekly', M: 'Monthly', '6M': '6-Month' };

const iconForMetric = (key: MetricType) => {
  if (key === 'heart_rate') return Heart;
  if (key === 'blood_pressure') return Activity;
  if (key === 'temperature') return Thermometer;
  return Weight;
};

// Full-screen version of what used to be HealthHistoryModal - a dedicated,
// navigable place to track any one vital over time, opened with that vital
// pre-selected from wherever its card was tapped (Vitals Snapshot, Home's
// Health Summary), instead of a modal popup.
export default function VitalsHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { records } = useSelector((state: RootState) => state.vitals);
  const connectedDeviceHeartRate = useSelector((state: RootState) => state.device.connectedDevice?.data?.heartRate);

  const initialMetric: MetricType = route.params?.metric ?? 'heart_rate';
  const [activeRange, setActiveRange] = useState<RangeType>('W');
  const [activeMetric, setActiveMetric] = useState<MetricType>(initialMetric);

  const metric = METRICS.find(m => m.key === activeMetric)!;
  const Icon = iconForMetric(activeMetric);

  const processedRecords = useMemo(() => {
    let result = [...records];

    if (connectedDeviceHeartRate && !records.some(r => {
      const diff = Date.now() - new Date(r.timestamp).getTime();
      return diff < 60 * 1000 && r.heartRate === connectedDeviceHeartRate;
    })) {
      result.unshift({
        id: 'device_live',
        timestamp: new Date().toISOString(),
        heartRate: connectedDeviceHeartRate,
      });
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [records, connectedDeviceHeartRate]);

  const rangeStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (activeRange === 'W') d.setDate(d.getDate() - 6);
    else if (activeRange === 'M') d.setMonth(d.getMonth() - 1);
    else if (activeRange === '6M') d.setMonth(d.getMonth() - 6);
    return d.getTime();
  }, [activeRange]);

  const rangeRecords = useMemo(
    () => processedRecords.filter(r => new Date(r.timestamp).getTime() >= rangeStart),
    [processedRecords, rangeStart]
  );

  const metricRecords = useMemo(() => rangeRecords.filter((r: VitalRecord) => {
    if (activeMetric === 'heart_rate') return r.heartRate !== undefined;
    if (activeMetric === 'blood_pressure') return r.systolic !== undefined && r.diastolic !== undefined;
    if (activeMetric === 'temperature') return r.temperature !== undefined;
    return r.weight !== undefined;
  }), [rangeRecords, activeMetric]);

  const graphRecords = useMemo(() => [...metricRecords].slice(0, 7).reverse(), [metricRecords]);

  const graphMinMax = useMemo(() => {
    if (graphRecords.length === 0) return { min: 0, max: 100 };

    let values: number[] = [];
    if (activeMetric === 'heart_rate') values = graphRecords.map(r => r.heartRate!);
    else if (activeMetric === 'blood_pressure') values = graphRecords.flatMap(r => [r.systolic!, r.diastolic!]);
    else if (activeMetric === 'temperature') values = graphRecords.map(r => r.temperature!);
    else values = graphRecords.map(r => r.weight!);

    const max = Math.max(...values);
    const min = Math.min(...values);

    const padding = (max - min) * 0.15 || 10;
    return {
      min: Math.max(0, Math.floor(min - padding)),
      max: Math.ceil(max + padding),
    };
  }, [graphRecords, activeMetric]);

  const latestRecord = metricRecords[0];

  const latestValueText = useMemo(() => {
    if (!latestRecord) return 'No Data';
    if (activeMetric === 'heart_rate') return `${latestRecord.heartRate} ${metric.unit}`;
    if (activeMetric === 'blood_pressure') return `${latestRecord.systolic}/${latestRecord.diastolic} ${metric.unit}`;
    if (activeMetric === 'temperature') return `${latestRecord.temperature} ${metric.unit}`;
    return `${latestRecord.weight} ${metric.unit}`;
  }, [latestRecord, activeMetric, metric.unit]);

  const formatBarLabel = (date: Date) => {
    if (activeRange === 'D') return date.toLocaleTimeString([], { hour: 'numeric' });
    if (activeRange === '6M') return date.toLocaleDateString([], { month: 'short' });
    if (activeRange === 'M') return `${date.getDate()}`;
    return date.toLocaleDateString([], { weekday: 'short' });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vitals History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.metricPillScroll}
        contentContainerStyle={styles.metricPillRow}
      >
        {METRICS.map((m) => {
          const active = m.key === activeMetric;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.metricPill, active && { backgroundColor: m.bg, borderColor: m.color }]}
              onPress={() => setActiveMetric(m.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.metricPillText, active && { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.rangeBar}>
        <View style={styles.rangeSegment}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, activeRange === r && styles.rangeBtnActive]}
              onPress={() => setActiveRange(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangeBtnText, activeRange === r && styles.rangeBtnTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.valueHeader}>
          <Text style={styles.valueHeaderTitle}>{latestValueText}</Text>
          <Text style={styles.valueHeaderDate}>
            {latestRecord ? formatDate(latestRecord.timestamp) : formatDate(new Date().toISOString())}
          </Text>
        </View>

        <View style={styles.graphCard}>
          {graphRecords.length === 0 ? (
            <View style={styles.emptyGraph}>
              <Text style={styles.emptyGraphText}>
                No {RANGE_LABEL[activeRange].toLowerCase()} data yet. Log a reading to see a trend.
              </Text>
            </View>
          ) : (
            <View style={styles.graphContainer}>
              <View style={styles.graphViewport}>
                <View style={styles.horizontalLines}>
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                </View>

                <View style={styles.barsContainer}>
                  {graphRecords.map((record) => {
                    const date = new Date(record.timestamp);
                    const label = formatBarLabel(date);

                    let barHeight = 0;
                    let bottomOffset = 0;

                    if (activeMetric === 'heart_rate' && record.heartRate) {
                      const percent = ((record.heartRate - graphMinMax.min) / (graphMinMax.max - graphMinMax.min)) * 100;
                      barHeight = Math.max(10, percent);
                    } else if (activeMetric === 'weight' && record.weight) {
                      const percent = ((record.weight - graphMinMax.min) / (graphMinMax.max - graphMinMax.min)) * 100;
                      barHeight = Math.max(10, percent);
                    } else if (activeMetric === 'temperature' && record.temperature) {
                      const percent = ((record.temperature - graphMinMax.min) / (graphMinMax.max - graphMinMax.min)) * 100;
                      barHeight = Math.max(10, percent);
                    } else if (activeMetric === 'blood_pressure' && record.systolic && record.diastolic) {
                      const sysPercent = ((record.systolic - graphMinMax.min) / (graphMinMax.max - graphMinMax.min)) * 100;
                      const diaPercent = ((record.diastolic - graphMinMax.min) / (graphMinMax.max - graphMinMax.min)) * 100;

                      bottomOffset = diaPercent;
                      barHeight = sysPercent - diaPercent;
                    }

                    return (
                      <View key={record.id} style={styles.graphColumn}>
                        <View style={styles.barViewport}>
                          {activeMetric === 'blood_pressure' ? (
                            <View
                              style={[
                                styles.graphBar,
                                {
                                  backgroundColor: metric.color,
                                  height: `${barHeight}%`,
                                  bottom: `${bottomOffset}%`,
                                  borderRadius: 4,
                                  position: 'absolute',
                                  width: 8,
                                },
                              ]}
                            />
                          ) : (
                            <View
                              style={[
                                styles.graphBar,
                                {
                                  backgroundColor: metric.color,
                                  height: `${barHeight}%`,
                                  borderTopLeftRadius: 6,
                                  borderTopRightRadius: 6,
                                  width: 10,
                                },
                              ]}
                            />
                          )}
                        </View>
                        <Text style={styles.xAxisText}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.yAxis}>
                <Text style={styles.yAxisText}>{graphMinMax.max}</Text>
                <Text style={styles.yAxisText}>{Math.round((graphMinMax.max + graphMinMax.min) / 2)}</Text>
                <Text style={styles.yAxisText}>{graphMinMax.min}</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.listSectionTitle}>LOGGED RECORDS</Text>

        {metricRecords.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>No {metric.label.toLowerCase()} logs in this period.</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {metricRecords.map((item) => {
              let valText = '';
              if (activeMetric === 'heart_rate') valText = `${item.heartRate}`;
              else if (activeMetric === 'blood_pressure') valText = `${item.systolic}/${item.diastolic}`;
              else if (activeMetric === 'temperature') valText = `${item.temperature}`;
              else valText = `${item.weight}`;

              return (
                <View key={item.id} style={styles.logRow}>
                  <View style={[styles.logIconWrapper, { backgroundColor: metric.bg }]}>
                    <Icon size={14} color={metric.color} />
                  </View>

                  <View style={styles.logMeta}>
                    <Text style={styles.logDate}>{formatDate(item.timestamp)}</Text>
                    <Text style={styles.logTime}>
                      {formatTime(item.timestamp)} {item.id === 'device_live' ? '• Wearable Sync' : '• Manual Input'}
                    </Text>
                  </View>

                  <View style={styles.logValueRow}>
                    <Text style={styles.logValue}>{valText}</Text>
                    <Text style={styles.logUnit}>{metric.unit}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb76',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  /* Apple Health-style D/W/M/6M segmented control */
  rangeBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rangeSegment: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    padding: 2,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb76',
  },
  rangeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  rangeBtnTextActive: {
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  /* Big value + date header, matching Apple's "72 BPM / Aug 7" style block */
  valueHeader: {
    marginBottom: 12,
  },
  valueHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  valueHeaderDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  /* Graph styles */
  graphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
    marginBottom: 12,
  },
  emptyGraph: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGraphText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  graphContainer: {
    flexDirection: 'row',
    height: 120,
  },
  yAxis: {
    width: 26,
    justifyContent: 'space-between',
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  yAxisText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  graphViewport: {
    flex: 1,
    position: 'relative',
  },
  horizontalLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: 8,
    zIndex: 0,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  barsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  graphColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barViewport: {
    height: 80,
    width: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 6,
  },
  graphBar: {
    alignSelf: 'center',
  },
  xAxisText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  /* Text-label pill metric switcher, above the date-range selector.
     flexGrow: 0 keeps the ScrollView itself from stretching to fill the
     column's remaining height (its default with no explicit size); without
     that, and without alignItems: 'center' below, the pills stretch to
     fill whatever height it ends up with instead of sizing to their text. */
  metricPillScroll: {
    flexGrow: 0,
  },
  metricPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  metricPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb76',
  },
  metricPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  /* Log Row list styles */
  listSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  emptyList: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  logList: {
    gap: 6,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb76',
    borderRadius: 12,
    padding: 10,
  },
  logIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logMeta: {
    flex: 1,
    gap: 2,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  logTime: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  logValueRow: {
    alignItems: 'flex-end',
  },
  logValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  logUnit: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '700',
  },
});
