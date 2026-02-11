import React, { useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddMedication: () => void;
  onAddGoal: () => void;
}

export default function AddActionModal({
  visible,
  onClose,
  onAddMedication,
  onAddGoal,
}: Props) {
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

  const handleAddMedication = () => {
    onAddMedication();
    onClose();
  };

  const handleAddGoal = () => {
    onAddGoal();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.dragIndicator} />
            <Text style={styles.title}>Add</Text>
          </View>

          <View style={styles.content}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleAddMedication}
            >
              <Text style={styles.actionTitle}>💊 Add medication</Text>
              <Text style={styles.actionSubtitle}>
                Track medicines and reminders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleAddGoal}
            >
              <Text style={styles.actionTitle}>🎯 Add goal</Text>
              <Text style={styles.actionSubtitle}>
                Set health goals and habits
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
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
    paddingBottom: 20,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  actionCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: 0.2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 0.1,
  },
});