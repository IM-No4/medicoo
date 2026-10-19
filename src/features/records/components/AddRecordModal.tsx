import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Image, Info } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  Animated,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';
import { AdaptiveStatusBar } from '../../../components/ThemedStatusBar';
import { Modal } from '../../../components/ThemedModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onScan: () => void;
    onUpload: () => void;
    uploadCount: number;
    maxUploads: number;
}

export default function AddRecordModal({
    visible,
    onClose,
    onScan,
    onUpload,
    uploadCount,
    maxUploads,
}: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const insets = useSafeAreaInsets();
    const translateY = useState(new Animated.Value(0))[0];
    const isLimitReached = uploadCount >= maxUploads;

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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <AdaptiveStatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
                        <Text style={styles.title}>{t('add_record')}</Text>
                        <Text style={styles.subtitle}>
                            {isLimitReached
                                ? 'Upload limit reached'
                                : `You keep ${uploadCount}/${maxUploads} personal uploads`
                            }
                        </Text>
                    </View>

                    <View style={styles.content}>
                        {isLimitReached ? (
                            <View style={styles.limitContainer}>
                                <View style={styles.limitIconBox}>
                                    <Info color="#F59E0B" size={32} />
                                </View>
                                <Text style={styles.limitTitle}>
                                    Limit of {maxUploads} uploads reached
                                </Text>
                                <Text style={styles.limitText}>
                                    {t('you_can_still_view_all_system_generate')}
                                </Text>
                                <TouchableOpacity style={styles.gotItButton} onPress={onClose}>
                                    <Text style={styles.gotItText}>{t('got_it')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.actionCard}
                                    onPress={() => {
                                        onScan();
                                        onClose();
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#FF6B35', '#FF8C61']}
                                        style={styles.iconContainer}
                                    >
                                        <Camera color="#fff" size={24} />
                                    </LinearGradient>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.actionTitle}>{t('scan_document')}</Text>
                                        <Text style={styles.actionSubtitle}>
                                            {t('use_camera_to_scan_report_or_prescript')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionCard}
                                    onPress={() => {
                                        onUpload();
                                        onClose();
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#4F46E5', '#6366F1']}
                                        style={styles.iconContainer}
                                    >
                                        <Image color="#fff" size={24} />
                                    </LinearGradient>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.actionTitle}>{t('upload_from_gallery')}</Text>
                                        <Text style={styles.actionSubtitle}>
                                            {t('select_image_or_pdf_from_device')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backdropTouchable: {
        flex: 1,
    },
    container: {
        backgroundColor: c.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 20,
    },
    header: {
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
        alignItems: 'center',
    },
    dragIndicator: {
        width: 36,
        height: 4,
        backgroundColor: '#D1D1D6',
        borderRadius: 2,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: c.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: c.textSecondary,
    },
    content: {
        padding: 24,
        gap: 16,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.cardSecondary,
        padding: 16,
        borderRadius: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: c.text,
    },
    actionSubtitle: {
        fontSize: 13,
        color: c.textSecondary,
        marginTop: 2,
    },
    // Limit styles
    limitContainer: {
        alignItems: 'center',
        padding: 8,
    },
    limitIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: c.warningBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    limitTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    limitText: {
        fontSize: 15,
        color: c.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    gotItButton: {
        backgroundColor: c.cardSecondary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    gotItText: {
        fontSize: 16,
        fontWeight: '600',
        color: c.text,
    },
});
