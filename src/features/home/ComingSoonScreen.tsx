import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Sparkles, MapPin, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ComingSoonScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const featureName = route.params?.featureName || 'Service';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{featureName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Large visual graphic indicator */}
        <View style={styles.graphicContainer}>
          <View style={styles.outerGlow}>
            <View style={styles.innerGlow}>
              <Sparkles size={48} color="#10B981" />
            </View>
          </View>
          <View style={styles.badge}>
            <MapPin size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>{t('coming_soon')}</Text>
          </View>
        </View>

        {/* Title & Status */}
        <Text style={styles.mainTitle}>{featureName} Service</Text>
        <Text style={styles.statusSubtitle}>{t('under_launch')}</Text>
        
        {/* Description */}
        <Text style={styles.messageDescription}>
          We are currently building partnerships with diagnostic centers, clinic networks, and hospital partners to launch <Text style={styles.boldText}>{featureName}</Text> {t('in_your_neighborhood_soon')}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background, // Full-screen white background, no card/modal aesthetic!
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  outerGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: c.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  innerGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: c.text,
    textAlign: 'center',
    marginTop: 16,
  },
  statusSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  messageDescription: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
    color: c.text,
  },
});
