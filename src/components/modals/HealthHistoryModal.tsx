import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Heart, Activity, Weight, X, TrendingUp, Calendar } from 'lucide-react-native';
import { VitalRecord } from '../../redux/slices/vitalsSlice';

interface Props {
  visible: boolean;
  onClose: () => void;
  records: VitalRecord[];
  connectedDeviceHeartRate?: number;
}

type MetricType = 'heart_rate' | 'blood_pressure' | 'weight';

export default function HealthHistoryModal({ visible, onClose, records, connectedDeviceHeartRate }: Props) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('heart_rate');

  // Process data to merge device heart rate if present
  const processedRecords = useMemo(() => {
    let result = [...records];
    
    // Add connected device heart rate as a current entry if device is syncing and we have it
    if (connectedDeviceHeartRate && !records.some(r => {
      const diff = Date.now() - new Date(r.timestamp).getTime();
      return diff < 60 * 1000 && r.heartRate === connectedDeviceHeartRate; // within 1 minute
    })) {
      result.unshift({
        id: 'device_live',
        timestamp: new Date().toISOString(),
        heartRate: connectedDeviceHeartRate,
      });
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [records, connectedDeviceHeartRate]);

  // Filter records that have values for the active metric
  const metricRecords = useMemo(() => {
    return processedRecords.filter(r => {
      if (activeMetric === 'heart_rate') return r.heartRate !== undefined;
      if (activeMetric === 'blood_pressure') return r.systolic !== undefined && r.diastolic !== undefined;
      if (activeMetric === 'weight') return r.weight !== undefined;
      return false;
    });
  }, [processedRecords, activeMetric]);

  // Get graph data (limit to last 7 logged entries for the graph view)
  const graphRecords = useMemo(() => {
    return [...metricRecords].slice(0, 7).reverse();
  }, [metricRecords]);

  // Calculate relative heights for graph bars
  const graphMinMax = useMemo(() => {
    if (graphRecords.length === 0) return { min: 0, max: 100 };

    let values: number[] = [];
    if (activeMetric === 'heart_rate') {
      values = graphRecords.map(r => r.heartRate!);
    } else if (activeMetric === 'blood_pressure') {
      values = graphRecords.flatMap(r => [r.systolic!, r.diastolic!]);
    } else if (activeMetric === 'weight') {
      values = graphRecords.map(r => r.weight!);
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Add margin for visual breathing room
    const padding = (max - min) * 0.15 || 10;
    return {
      min: Math.max(0, Math.floor(min - padding)),
      max: Math.ceil(max + padding)
    };
  }, [graphRecords, activeMetric]);

  const activeColor = useMemo(() => {
    if (activeMetric === 'heart_rate') return '#EF4444';
    if (activeMetric === 'blood_pressure') return '#3B82F6';
    return '#8B5CF6';
  }, [activeMetric]);

  const activeBg = useMemo(() => {
    if (activeMetric === 'heart_rate') return '#FEF2F2';
    if (activeMetric === 'blood_pressure') return '#EFF6FF';
    return '#F5F3FF';
  }, [activeMetric]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Calendar size={18} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.headerTitle}>Vitals History</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Metric Selector Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeMetric === 'heart_rate' && [styles.activeTab, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]
              ]}
              onPress={() => setActiveMetric('heart_rate')}
              activeOpacity={0.7}
            >
              <Heart size={14} color={activeMetric === 'heart_rate' ? '#EF4444' : '#64748B'} style={{ marginBottom: 4 }} />
              <Text style={[styles.tabText, activeMetric === 'heart_rate' && { color: '#EF4444', fontWeight: '700' }]}>Heart Rate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeMetric === 'blood_pressure' && [styles.activeTab, { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }]
              ]}
              onPress={() => setActiveMetric('blood_pressure')}
              activeOpacity={0.7}
            >
              <Activity size={14} color={activeMetric === 'blood_pressure' ? '#3B82F6' : '#64748B'} style={{ marginBottom: 4 }} />
              <Text style={[styles.tabText, activeMetric === 'blood_pressure' && { color: '#3B82F6', fontWeight: '700' }]}>Pressure</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeMetric === 'weight' && [styles.activeTab, { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' }]
              ]}
              onPress={() => setActiveMetric('weight')}
              activeOpacity={0.7}
            >
              <Weight size={14} color={activeMetric === 'weight' ? '#8B5CF6' : '#64748B'} style={{ marginBottom: 4 }} />
              <Text style={[styles.tabText, activeMetric === 'weight' && { color: '#8B5CF6', fontWeight: '700' }]}>Weight</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Graph Visualizer Section */}
            <View style={styles.graphCard}>
              <View style={styles.graphHeader}>
                <Text style={styles.graphTitle}>Weekly Trend</Text>
                <View style={styles.trendRow}>
                  <TrendingUp size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.trendText}>Stable</Text>
                </View>
              </View>

              {graphRecords.length === 0 ? (
                <View style={styles.emptyGraph}>
                  <Text style={styles.emptyGraphText}>No trend data available. Log vitals to generate graphs.</Text>
                </View>
              ) : (
                <View style={styles.graphContainer}>
                  {/* Left Grid Values */}
                  <View style={styles.yAxis}>
                    <Text style={styles.yAxisText}>{graphMinMax.max}</Text>
                    <Text style={styles.yAxisText}>{Math.round((graphMinMax.max + graphMinMax.min) / 2)}</Text>
                    <Text style={styles.yAxisText}>{graphMinMax.min}</Text>
                  </View>

                  {/* Graph Columns */}
                  <View style={styles.graphViewport}>
                    <View style={styles.horizontalLines}>
                      <View style={styles.gridLine} />
                      <View style={styles.gridLine} />
                      <View style={styles.gridLine} />
                    </View>

                    <View style={styles.barsContainer}>
                      {graphRecords.map((record) => {
                        const date = new Date(record.timestamp);
                        const label = date.toLocaleDateString([], { weekday: 'short' });
                        
                        // BP needs two indicators (systolic and diastolic) represented as a bar range
                        let barHeight = 0;
                        let bottomOffset = 0;
                        let secondaryBottomOffset = 0;
                        let secondaryBarHeight = 0;

                        if (activeMetric === 'heart_rate' && record.heartRate) {
                          const val = record.heartRate;
                          const percent = ((val - graphMinMax.min) / (graphMinMax.max - graphMinMax.min)) * 100;
                          barHeight = Math.max(10, percent);
                        } else if (activeMetric === 'weight' && record.weight) {
                          const val = record.weight;
                          const percent = ((val - graphMinMax.min) / (graphMinMax.max - graphMinMax.min)) * 100;
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
                                      backgroundColor: activeColor,
                                      height: `${barHeight}%`,
                                      bottom: `${bottomOffset}%`,
                                      borderRadius: 4,
                                      position: 'absolute',
                                      width: 8,
                                    }
                                  ]}
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.graphBar,
                                    {
                                      backgroundColor: activeColor,
                                      height: `${barHeight}%`,
                                      borderTopLeftRadius: 6,
                                      borderTopRightRadius: 6,
                                      width: 10,
                                    }
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
                </View>
              )}
            </View>

            {/* List Log Section */}
            <Text style={styles.listSectionTitle}>LOGGED RECORDS</Text>

            {metricRecords.length === 0 ? (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>No logs found for this vital metric.</Text>
              </View>
            ) : (
              <View style={styles.logList}>
                {metricRecords.map((item) => {
                  let valText = '';
                  let unitText = '';
                  if (activeMetric === 'heart_rate') {
                    valText = `${item.heartRate}`;
                    unitText = 'BPM';
                  } else if (activeMetric === 'blood_pressure') {
                    valText = `${item.systolic}/${item.diastolic}`;
                    unitText = 'mmHg';
                  } else if (activeMetric === 'weight') {
                    valText = `${item.weight}`;
                    unitText = 'KG';
                  }

                  return (
                    <View key={item.id} style={styles.logRow}>
                      <View style={[styles.logIconWrapper, { backgroundColor: activeBg }]}>
                        {activeMetric === 'heart_rate' && <Heart size={16} color="#EF4444" />}
                        {activeMetric === 'blood_pressure' && <Activity size={16} color="#3B82F6" />}
                        {activeMetric === 'weight' && <Weight size={16} color="#8B5CF6" />}
                      </View>
                      
                      <View style={styles.logMeta}>
                        <Text style={styles.logDate}>{formatDate(item.timestamp)}</Text>
                        <Text style={styles.logTime}>{formatTime(item.timestamp)} {item.id === 'device_live' ? '• Wearable Sync' : '• Manual Input'}</Text>
                      </View>

                      <View style={styles.logValueRow}>
                        <Text style={styles.logValue}>{valText}</Text>
                        <Text style={styles.logUnit}>{unitText}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  activeTab: {
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  /* Graph styles */
  graphCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 28,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  emptyGraph: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGraphText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  graphContainer: {
    flexDirection: 'row',
    height: 160,
  },
  yAxis: {
    width: 32,
    justifyContent: 'space-between',
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  yAxisText: {
    fontSize: 10,
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
    paddingVertical: 12,
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
    height: 112,
    width: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  graphBar: {
    alignSelf: 'center',
  },
  xAxisText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  /* Log Row list styles */
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyList: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  logList: {
    gap: 8,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
  },
  logIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logMeta: {
    flex: 1,
    gap: 2,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  logTime: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  logValueRow: {
    alignItems: 'flex-end',
  },
  logValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  logUnit: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
});
