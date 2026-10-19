import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Clock, Package, Store, Truck } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Easing, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StarRating, { RATING_WORDS as WORDS } from '../../components/StarRating';
import { AdaptiveStatusBar } from '../../components/ThemedStatusBar';
import { apiClient } from '../../services/api/client';
import { getReturnPolicy } from '../../services/api/returns.api';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

const GREEN = '#10B981';

type Summary = {
  itemCount: number;
  totalMinutes: number | null;
  committedMinutes: number | null;
  review: { storeRating: number | null; deliveryRating: number | null } | null;
};

const duration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

export default function OrderDeliveredScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { orderId, orderNumber, storeName, itemCount: itemCountParam, deliveryMode: modeParam, partnerName: partnerParam } = (useRoute().params as any) || {};

  const [summary, setSummary] = useState<Summary | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'partner'>(modeParam === 'self' ? 'self' : 'partner');
  const [partnerName, setPartnerName] = useState<string | undefined>(partnerParam);
  const [storeRating, setStoreRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [saved, setSaved] = useState<{ store: boolean; delivery: boolean }>({ store: false, delivery: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [claimHours, setClaimHours] = useState<number | null>(null);
  useEffect(() => {
    getReturnPolicy().then((p) => setClaimHours(p.returnWindowHours)).catch(() => undefined);
  }, []);

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [pop]);
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 450, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [rise]);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await apiClient.get(`/api/orders/get-order-status/${orderId}`);
        if (!res.data?.success) return;
        setSummary(res.data.summary || null);
        if (res.data.deliveryMode) setDeliveryMode(res.data.deliveryMode);
        if (res.data.deliveryPartner?.name) setPartnerName(res.data.deliveryPartner.name);
        const done = res.data.summary?.review;
        if (done) {
          if (done.storeRating) { setStoreRating(done.storeRating); }
          if (done.deliveryRating) { setDeliveryRating(done.deliveryRating); }
          setSaved({ store: !!done.storeRating, delivery: !!done.deliveryRating });
        }
      } catch {
        // The screen still works without the numbers.
      }
    })();
  }, [orderId]);

  const goHome = useCallback(() => navigation.navigate('Tabs', { screen: 'Home' }), [navigation]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [goHome]);

  const items = summary?.itemCount ?? itemCountParam ?? 0;
  const total = summary?.totalMinutes ?? null;
  const promised = summary?.committedMinutes ?? null;
  const ahead = total !== null && promised !== null ? promised - total : null;
  const early = ahead !== null && ahead >= 2;
  const onTime = ahead !== null && ahead > -2 && !early;

  const headline = early ? 'Delivered early 🎉' : 'Order delivered';
  const subline = early
    ? `${ahead} min ahead of schedule - that's a quick one!`
    : onTime
      ? 'Right on time. Take care of yourself!'
      : 'Thank you for waiting. Hope you feel better soon.';

  const pending = (storeRating > 0 && !saved.store) || (deliveryRating > 0 && !saved.delivery);
  const allSaved = saved.store && saved.delivery;

  const submit = async () => {
    if (!pending || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/api/orders/${orderId}/review`, {
        ...(storeRating > 0 && !saved.store ? { storeRating } : {}),
        ...(deliveryRating > 0 && !saved.delivery ? { deliveryRating } : {}),
      });
      setSaved({ store: saved.store || storeRating > 0, delivery: saved.delivery || deliveryRating > 0 });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Couldn't send your rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deliveryTitle = deliveryMode === 'self' ? 'Rate the delivery' : partnerName ? `Rate ${partnerName.split(' ')[0]}` : 'Rate your delivery partner';
  const deliverySub = deliveryMode === 'self' ? `Delivered by ${storeName || 'the pharmacy'}'s own delivery person` : 'How was the delivery experience?';

  return (
    <View style={styles.container}>
      <AdaptiveStatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false} bounces={false}>
        <LinearGradient
          colors={['#10B981', '#007C69']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + (Platform.OS === 'android' ? 36 : 28) }]}
        >
          <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
            <Check size={38} color={GREEN} strokeWidth={3.2} />
          </Animated.View>
          <Text style={styles.heroTitle}>{headline}</Text>
          <Text style={styles.heroSub}>{subline}</Text>
        </LinearGradient>

        <Animated.View style={{ opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.storeRow}>
              <View style={styles.storeIcon}>
                <Store size={18} color={GREEN} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.storeLabel}>Delivered from</Text>
                <Text style={styles.storeName} numberOfLines={1}>{storeName || 'Your pharmacy'}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Package size={16} color={theme.textSecondary} />
                <Text style={styles.statValue}>{items || '-'}</Text>
                <Text style={styles.statLabel}>{items === 1 ? 'Item' : 'Items'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Clock size={16} color={theme.textSecondary} />
                <Text style={styles.statValue}>{total !== null ? duration(total) : '-'}</Text>
                <Text style={styles.statLabel}>Time taken</Text>
              </View>
              {promised !== null && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Truck size={16} color={theme.textSecondary} />
                    <Text style={styles.statValue}>{duration(promised)}</Text>
                    <Text style={styles.statLabel}>Promised</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={[styles.card, styles.checkCard]}>
            <Text style={styles.checkTitle}>Please check your medicines</Text>
            <Text style={styles.checkText}>
              Before you use anything, check its name, batch number, expiry date and seal against your invoice.
              {claimHours ? ` If something is wrong, tell us in the order chat within ${claimHours} hours of delivery.` : ''} Opened or used medicines cannot be returned.
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Profile', params: { screen: 'OrderSupport', params: { orderId: orderNumber || orderId } } })} activeOpacity={0.7}>
              <Text style={styles.checkLink}>Need help with this order?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.rateTitle}>{`How was ${storeName || 'the pharmacy'}?`}</Text>
            <Text style={styles.rateSub}>Packing, medicines and service</Text>
            <View style={{ height: 14 }} />
            <StarRating value={storeRating} onChange={setStoreRating} disabled={saved.store} />
            <Text style={styles.word}>{saved.store ? 'Thanks for rating!' : WORDS[storeRating] || ' '}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.rateTitle}>{deliveryTitle}</Text>
            <Text style={styles.rateSub}>{deliverySub}</Text>
            <View style={{ height: 14 }} />
            <StarRating value={deliveryRating} onChange={setDeliveryRating} disabled={saved.delivery} />
            <Text style={styles.word}>{saved.delivery ? 'Thanks for rating!' : WORDS[deliveryRating] || ' '}</Text>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            {!allSaved && (
              <TouchableOpacity
                style={[styles.primaryBtn, !pending && styles.primaryBtnDisabled]}
                onPress={submit}
                disabled={!pending || submitting}
                activeOpacity={0.85}
              >
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Submit rating</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={allSaved ? styles.primaryBtn : styles.linkBtn} onPress={goHome} activeOpacity={0.8}>
              <Text style={allSaved ? styles.primaryText : styles.linkText}>{allSaved ? 'Back to home' : 'Maybe later'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 64, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    badge: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
    heroSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginTop: 6, textAlign: 'center' },
    card: { backgroundColor: c.card, borderRadius: 18, borderWidth: 1, borderColor: c.borderLight, marginHorizontal: 16, marginTop: 14, padding: 18 },
    summaryCard: { marginTop: -40 },
    storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    storeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.successBg, alignItems: 'center', justifyContent: 'center' },
    storeLabel: { fontSize: 11, fontWeight: '600', color: c.textSecondary },
    storeName: { fontSize: 16, fontWeight: '800', color: c.text, marginTop: 1 },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.borderLight },
    stat: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 16, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 11, fontWeight: '600', color: c.textSecondary },
    statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: c.borderLight },
    checkCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    checkTitle: { fontSize: 14, fontWeight: '800', color: '#92400E' },
    checkText: { fontSize: 12, color: '#92400E', lineHeight: 18, marginTop: 4 },
    checkLink: { fontSize: 13, fontWeight: '800', color: '#B45309', marginTop: 10 },
    rateTitle: { fontSize: 16, fontWeight: '800', color: c.text, textAlign: 'center' },
    rateSub: { fontSize: 12, fontWeight: '500', color: c.textSecondary, textAlign: 'center', marginTop: 3 },
    word: { fontSize: 13, fontWeight: '700', color: c.textSecondary, textAlign: 'center', marginTop: 12, minHeight: 18 },
    error: { color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 14, marginHorizontal: 24 },
    actions: { marginHorizontal: 16, marginTop: 20, gap: 8 },
    primaryBtn: { height: 50, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
    primaryBtnDisabled: { opacity: 0.4 },
    primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
    linkBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
    linkText: { color: c.textSecondary, fontSize: 14, fontWeight: '700' },
  });
