import AppIcon from '@/src/components/icons/AppIcon';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDoctorName } from '../../utils/formatters';

interface Prescription {
  id: string;
  doctorName: string;
  prescriptionDate: string;
  items: number;
  diagnosis?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onImageSelected?: (image: any) => void;
  onPrescriptionSelected?: (prescriptionId: string) => void;
  existingPrescriptions?: Prescription[];
}

export default function PrescriptionUploadModal({
  visible,
  onClose,
  isLoading = false,
  onImageSelected,
  onPrescriptionSelected,
  existingPrescriptions = [],
}: Props) {
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useState(new Animated.Value(0))[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to downward gestures
      return gestureState.dy > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        // If dragged down more than 100px, close the modal
        Animated.timing(translateY, {
          toValue: 1000,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose();
          // Reset after a short delay to prevent flash
          setTimeout(() => {
            translateY.setValue(0);
          }, 100);
        });
      } else {
        // Otherwise, snap back
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleCameraUpload = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && onImageSelected) {
        onImageSelected(result.assets[0]);
        onClose();
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && onImageSelected) {
        onImageSelected(result.assets[0]);
        onClose();
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  const handleSelectPrescription = (prescriptionId: string) => {
    setSelectedPrescription(prescriptionId);
  };

  const handleConfirm = () => {
    if (selectedPrescription && onPrescriptionSelected) {
      onPrescriptionSelected(selectedPrescription);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-IN', options);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.dragIndicator} />
            <View style={styles.headerContent}>
              <Text style={styles.title}>Select Prescription</Text>
              <Text style={styles.subtitle}>
                Choose an existing prescription or upload a new one
              </Text>
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Upload Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload New</Text>
              
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={styles.uploadOption}
                  onPress={handleCameraUpload}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadIconContainer}
                  >
                    <AppIcon name="camera" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.uploadTextContainer}>
                    <Text style={styles.uploadTitle}>Scan using Camera</Text>
                    <Text style={styles.uploadDescription}>
                      Take a photo of your prescription
                    </Text>
                  </View>
                  <AppIcon name="chevron-right" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.uploadOption}
                  onPress={handleGalleryUpload}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#0E7439', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadIconContainer}
                  >
                    <AppIcon name="image" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.uploadTextContainer}>
                    <Text style={styles.uploadTitle}>Upload from Gallery</Text>
                    <Text style={styles.uploadDescription}>
                      Choose from your photo library
                    </Text>
                  </View>
                  <AppIcon name="chevron-right" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Existing Prescriptions */}
            {existingPrescriptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
                
                <View style={styles.prescriptionsList}>
                  {existingPrescriptions.map((prescription, index) => (
                    <React.Fragment key={prescription.id}>
                      <TouchableOpacity
                        style={[
                          styles.prescriptionCard,
                          selectedPrescription === prescription.id && styles.prescriptionCardSelected,
                        ]}
                        onPress={() => handleSelectPrescription(prescription.id)}
                        disabled={isLoading}
                      >
                        <View style={styles.prescriptionHeader}>
                          <View style={styles.prescriptionIdContainer}>
                            <Text style={styles.prescriptionId}>#{prescription.id}</Text>
                          </View>
                          <View
                            style={[
                              styles.radioButton,
                              selectedPrescription === prescription.id && styles.radioButtonSelected,
                            ]}
                          >
                            {selectedPrescription === prescription.id && (
                              <View style={styles.radioButtonInner} />
                            )}
                          </View>
                        </View>

                        <View style={styles.prescriptionBody}>
                          <View style={styles.prescriptionRow}>
                            <AppIcon name="stethoscope" size={16} color="#6B7280" />
                            <Text style={styles.prescriptionLabel}>Doctor:</Text>
                            <Text style={styles.prescriptionValue}>
                              {formatDoctorName(prescription.doctorName)}
                            </Text>
                          </View>

                          <View style={styles.prescriptionRow}>
                            <AppIcon name="calendar" size={16} color="#6B7280" />
                            <Text style={styles.prescriptionLabel}>Date:</Text>
                            <Text style={styles.prescriptionValue}>
                              {formatDate(prescription.prescriptionDate)}
                            </Text>
                          </View>

                          <View style={styles.prescriptionRow}>
                            <AppIcon name="pill" size={16} color="#6B7280" />
                            <Text style={styles.prescriptionLabel}>Items:</Text>
                            <Text style={styles.prescriptionValue}>
                              {prescription.items} {prescription.items === 1 ? 'medicine' : 'medicines'}
                            </Text>
                          </View>

                          {prescription.diagnosis && (
                            <View style={styles.diagnosisContainer}>
                              <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
                              <Text style={styles.diagnosisText}>
                                {prescription.diagnosis}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                      
                      {index < existingPrescriptions.length - 1 && (
                        <View style={styles.prescriptionDivider} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Footer Actions */}
          {selectedPrescription && (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.confirmButtonText}>Use Prescription</Text>
                    <AppIcon name="arrow-right" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  uploadOptions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 4,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTextContainer: {
    flex: 1,
    gap: 2,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: 0.2,
  },
  uploadDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  prescriptionsList: {
    gap: 0,
  },
  prescriptionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  prescriptionCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prescriptionIdContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prescriptionId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#10B981',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  prescriptionBody: {
    gap: 6,
  },
  prescriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescriptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  prescriptionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: 0.1,
    flex: 1,
  },
  diagnosisContainer: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  diagnosisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  diagnosisText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#1C1C1E',
    letterSpacing: 0.1,
  },
  prescriptionDivider: {
    height: 12,
  },
  bottomSpacing: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: 0.2,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});