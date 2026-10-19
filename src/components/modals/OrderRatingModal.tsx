import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../../services/api/client';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import StarRating, { RATING_WORDS } from '../StarRating';
import { Modal } from '../ThemedModal';

export type OrderReviewState = { storeRating: number | null; deliveryRating: number | null };

interface Props {
  visible: boolean;
  onClose: () => void;
  /** The order's database id. */
  orderId: string;
  storeName: string;
  deliveryMode?: 'self' | 'partner';
  review?: OrderReviewState | null;
  onSaved: (review: OrderReviewState) => void;
}

/** Bottom sheet to rate the pharmacy and the delivery of a delivered order. Parts already rated stay locked. */
export default function OrderRatingModal({ visible, onClose, orderId, storeName, deliveryMode, review, onSaved }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [storeRating, setStoreRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const storeDone = !!review?.storeRating;
  const deliveryDone = !!review?.deliveryRating;

  useEffect(() => {
    if (!visible) return;
    setStoreRating(review?.storeRating || 0);
    setDeliveryRating(review?.deliveryRating || 0);
    setError('');
  }, [visible, review?.storeRating, review?.deliveryRating]);

  const pending = (storeRating > 0 && !storeDone) || (deliveryRating > 0 && !deliveryDone);

  const submit = async () => {
    if (!pending || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiClient.post(`/api/orders/${orderId}/review`, {
        ...(storeRating > 0 && !storeDone ? { storeRating } : {}),
        ...(deliveryRating > 0 && !deliveryDone ? { deliveryRating } : {}),
      });
      onSaved(res.data?.review || { storeRating: storeRating || null, deliveryRating: deliveryRating || null });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Couldn't send your rating. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deliveryLabel = deliveryMode === 'self' ? `Delivery by ${storeName}` : 'Delivery partner';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Rate your order</Text>

          <View style={styles.block}>
            <Text style={styles.blockTitle} numberOfLines={1}>{storeName}</Text>
            <Text style={styles.blockSub}>Packing, medicines and service</Text>
            <View style={{ height: 10 }} />
            <StarRating value={storeRating} onChange={setStoreRating} disabled={storeDone} size={34} />
            <Text style={styles.word}>{storeDone ? 'Thanks for rating!' : RATING_WORDS[storeRating] || ' '}</Text>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle} numberOfLines={1}>{deliveryLabel}</Text>
            <Text style={styles.blockSub}>How was the delivery?</Text>
            <View style={{ height: 10 }} />
            <StarRating value={deliveryRating} onChange={setDeliveryRating} disabled={deliveryDone} size={34} />
            <Text style={styles.word}>{deliveryDone ? 'Thanks for rating!' : RATING_WORDS[deliveryRating] || ' '}</Text>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={[styles.submit, !pending && styles.submitDisabled]} onPress={submit} disabled={!pending || saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit rating</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: c.text, textAlign: 'center', marginBottom: 14 },
    block: { backgroundColor: c.cardSecondary, borderRadius: 16, padding: 16, marginBottom: 12 },
    blockTitle: { fontSize: 15, fontWeight: '800', color: c.text, textAlign: 'center' },
    blockSub: { fontSize: 12, fontWeight: '500', color: c.textSecondary, textAlign: 'center', marginTop: 2 },
    word: { fontSize: 13, fontWeight: '700', color: c.textSecondary, textAlign: 'center', marginTop: 10, minHeight: 18 },
    error: { color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
    submit: { height: 50, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    submitDisabled: { opacity: 0.4 },
    submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  });
