import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, ImagePlus, Minus, Plus, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Eligibility, getEligibility, submitReturn, uploadReturnPhoto } from '../../../../services/api/returns.api';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';

// The "problem with my items" steps, inside the order support chat:
//   1. which items, and what is wrong with each (expired, damaged, wrong item, fewer units, something else)
//   2. photos (up to six)
//   3. sent to our team, who check it and reply right here in the chat
// Nothing here promises a refund: it captures what the team needs to look into it.

const GREEN = '#10B981';
const SHORT: Record<string, string> = { expired: 'Expired', damaged: 'Damaged / broken', wrong_item: 'Wrong item', short_quantity: 'Fewer units', other: 'Something else' };
type Pick = { quantity: number; reason: string };
type Photo = { uri: string; id?: string; failed?: boolean };

interface Props {
  orderId: string;
  onCancel: () => void;
  onSent: () => void;
}

export default function ItemIssueFlow({ orderId, onCancel, onSent }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [elig, setElig] = useState<Eligibility | null>(null);
  const [step, setStep] = useState<'items' | 'photos'>('items');
  const [picks, setPicks] = useState<Record<number, Pick>>({});
  const [condition, setCondition] = useState<'sealed' | 'opened' | ''>('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getEligibility(orderId).then(setElig).catch(() => setError("We couldn't load your order. Please try again."));
  }, [orderId]);

  const maxPhotos = elig?.policy.maxPhotos ?? 6;
  const minPhotos = elig?.policy.minPhotos ?? 1;
  const selected = Object.entries(picks).map(([i, p]) => ({ itemIndex: Number(i), ...p }));
  const needsPhotos = selected.some((p) => p.reason !== 'other');
  const needsNote = selected.some((p) => p.reason === 'other');
  const uploaded = photos.filter((p) => p.id).length;
  const uploading = photos.some((p) => !p.id && !p.failed);

  const itemsReady = selected.length > 0 && selected.every((p) => p.reason) && !!condition && (!needsNote || note.trim().length > 0);
  const canSend = !sending && !uploading && (!needsPhotos || uploaded >= minPhotos);

  const toggle = (index: number) =>
    setPicks((prev) => {
      const next = { ...prev };
      if (next[index]) delete next[index];
      else next[index] = { quantity: 1, reason: '' };
      return next;
    });

  const addPhoto = async (source: 'camera' | 'library') => {
    if (photos.length >= maxPhotos) return;
    try {
      const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Permission is needed to add a photo.');
        return;
      }
      const picked =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: maxPhotos - photos.length });
      if (picked.canceled) return;
      for (const asset of picked.assets.slice(0, maxPhotos - photos.length)) {
        const uri = asset.uri;
        setPhotos((prev) => [...prev, { uri }]);
        // eslint-disable-next-line no-await-in-loop
        uploadReturnPhoto(orderId, uri)
          .then((id) => setPhotos((prev) => prev.map((p) => (p.uri === uri ? { ...p, id } : p))))
          .catch(() => setPhotos((prev) => prev.map((p) => (p.uri === uri ? { ...p, failed: true } : p))));
      }
      setError('');
    } catch {
      setError("That photo couldn't be added.");
    }
  };

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setError('');
    try {
      await submitReturn(orderId, {
        items: selected.map((p) => ({ itemIndex: p.itemIndex, quantity: p.quantity, reason: p.reason, condition: condition === 'opened' ? 'opened' : 'sealed', notes: p.reason === 'other' ? note.trim() : undefined })),
        evidenceIds: photos.filter((p) => p.id).map((p) => p.id as string),
        note: note.trim() || undefined,
      });
      onSent();
    } catch (e: any) {
      setError(e?.response?.data?.message || "We couldn't send this. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!elig) {
    return (
      <View style={styles.card}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={GREEN} />}
        {!!error && (
          <TouchableOpacity onPress={onCancel}><Text style={styles.link}>Close</Text></TouchableOpacity>
        )}
      </View>
    );
  }

  if (step === 'items') {
    const anyClaimable = elig.items.some((i) => i.claimable);
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Which items have a problem?</Text>
        <Text style={styles.sub}>Check the batch and expiry against your pack, then tell us what is wrong.</Text>

        {!anyClaimable && <Text style={styles.muted}>Nothing in this order can be reported any more.</Text>}

        {elig.items.map((item) => {
          const pick = picks[item.itemIndex];
          const open = item.claimable;
          return (
            <View key={item.itemIndex} style={[styles.itemBox, !open && { opacity: 0.55 }]}>
              <TouchableOpacity style={styles.itemRow} activeOpacity={open ? 0.7 : 1} onPress={() => open && toggle(item.itemIndex)}>
                <View style={[styles.check, !!pick && styles.checkOn]}>{!!pick && <Check size={13} color="#fff" />}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                    {item.batchNum ? ` · Batch ${item.batchNum}` : ''}
                    {item.expiry ? ` · Exp ${item.expiry}` : ''}
                  </Text>
                  {!open && <Text style={[styles.itemMeta, { color: '#B91C1C' }]}>{item.remaining <= 0 ? 'Already reported.' : 'The period for reporting this item has ended.'}</Text>}
                </View>
              </TouchableOpacity>

              {!!pick && (
                <View style={styles.pickBody}>
                  {item.remaining > 1 && (
                    <View style={styles.qtyRow}>
                      <Text style={styles.itemMeta}>How many units?</Text>
                      <View style={styles.stepper}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setPicks((p) => ({ ...p, [item.itemIndex]: { ...p[item.itemIndex], quantity: Math.max(1, pick.quantity - 1) } }))}><Minus size={14} color={theme.text} /></TouchableOpacity>
                        <Text style={styles.stepValue}>{pick.quantity}</Text>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setPicks((p) => ({ ...p, [item.itemIndex]: { ...p[item.itemIndex], quantity: Math.min(item.remaining, pick.quantity + 1) } }))}><Plus size={14} color={theme.text} /></TouchableOpacity>
                      </View>
                    </View>
                  )}
                  <View style={styles.chips}>
                    {elig.policy.reasons.map((r) => (
                      <TouchableOpacity key={r.code} style={[styles.chip, pick.reason === r.code && styles.chipOn]} activeOpacity={0.8} onPress={() => setPicks((p) => ({ ...p, [item.itemIndex]: { ...p[item.itemIndex], reason: r.code } }))}>
                        <Text style={[styles.chipText, pick.reason === r.code && styles.chipTextOn]}>{SHORT[r.code] || r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {selected.length > 0 && (
          <>
            <Text style={styles.label}>Is the medicine still sealed and unused?</Text>
            <View style={styles.chips}>
              <TouchableOpacity style={[styles.chip, condition === 'sealed' && styles.chipOn]} onPress={() => setCondition('sealed')}><Text style={[styles.chipText, condition === 'sealed' && styles.chipTextOn]}>Yes, sealed</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.chip, condition === 'opened' && styles.chipOn]} onPress={() => setCondition('opened')}><Text style={[styles.chipText, condition === 'opened' && styles.chipTextOn]}>No, opened or used</Text></TouchableOpacity>
            </View>
            {condition === 'opened' && <Text style={styles.warn}>Medicines that have been opened or used cannot be returned. You can still send this to our team.</Text>}

            <Text style={styles.label}>{needsNote ? 'Tell us what happened' : 'Anything else we should know? (optional)'}</Text>
            <TextInput style={styles.input} value={note} onChangeText={setNote} multiline placeholder="Write here" placeholderTextColor={theme.textMuted} maxLength={1000} />
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onCancel}><Text style={styles.link}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.primary, !itemsReady && { opacity: 0.4 }]} disabled={!itemsReady} onPress={() => setStep('photos')} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // photos
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Add photos</Text>
      <Text style={styles.sub}>
        {needsPhotos ? `Please add at least ${minPhotos} clear photo${minPhotos === 1 ? '' : 's'} showing the medicine and its batch and expiry label. ` : 'Photos help us, but are optional for this. '}
        You can add up to {maxPhotos}.
      </Text>
      <View style={styles.photoRow}>
        {photos.map((p) => (
          <View key={p.uri} style={styles.thumbWrap}>
            <Image source={{ uri: p.uri }} style={styles.thumb} />
            {!p.id && !p.failed && <View style={styles.thumbOverlay}><ActivityIndicator color="#fff" /></View>}
            {p.failed && <View style={[styles.thumbOverlay, { backgroundColor: 'rgba(185,28,28,0.7)' }]}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>Failed</Text></View>}
            <TouchableOpacity style={styles.thumbRemove} onPress={() => setPhotos((prev) => prev.filter((x) => x.uri !== p.uri))}><X size={12} color="#fff" /></TouchableOpacity>
          </View>
        ))}
        {photos.length < maxPhotos && (
          <>
            <TouchableOpacity style={styles.addPhoto} onPress={() => addPhoto('camera')} activeOpacity={0.7}><Camera size={20} color={theme.textSecondary} /><Text style={styles.addPhotoText}>Camera</Text></TouchableOpacity>
            <TouchableOpacity style={styles.addPhoto} onPress={() => addPhoto('library')} activeOpacity={0.7}><ImagePlus size={20} color={theme.textSecondary} /><Text style={styles.addPhotoText}>Gallery</Text></TouchableOpacity>
          </>
        )}
      </View>
      <Text style={styles.itemMeta}>{photos.length}/{maxPhotos} photos</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setStep('items')}><Text style={styles.link}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.primary, !canSend && { opacity: 0.4 }]} disabled={!canSend} onPress={send} activeOpacity={0.85}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send to our team</Text>}
        </TouchableOpacity>
      </View>
      <Text style={[styles.itemMeta, { marginTop: 10 }]}>Sending this does not guarantee a refund. Our team checks it and replies here in the chat.</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.borderLight, padding: 14, marginHorizontal: 16, marginTop: 6, marginBottom: 12 },
    title: { fontSize: 15, fontWeight: '800', color: c.text },
    sub: { fontSize: 12, color: c.textSecondary, lineHeight: 17, marginTop: 3, marginBottom: 10 },
    muted: { fontSize: 13, color: c.textSecondary, marginVertical: 10 },
    itemBox: { borderWidth: 1, borderColor: c.borderLight, borderRadius: 12, padding: 10, marginTop: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    check: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: c.textMuted, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    checkOn: { backgroundColor: GREEN, borderColor: GREEN },
    itemName: { fontSize: 14, fontWeight: '800', color: c.text },
    itemMeta: { fontSize: 12, color: c.textSecondary, lineHeight: 17, marginTop: 1 },
    pickBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.borderLight },
    qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    stepValue: { fontSize: 14, fontWeight: '800', color: c.text, minWidth: 16, textAlign: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.cardSecondary },
    chipOn: { backgroundColor: GREEN, borderColor: GREEN },
    chipText: { fontSize: 12, fontWeight: '700', color: c.text },
    chipTextOn: { color: '#FFFFFF' },
    label: { fontSize: 13, fontWeight: '800', color: c.text, marginTop: 14, marginBottom: 8 },
    warn: { fontSize: 12, color: '#B91C1C', lineHeight: 17, marginTop: 8, fontWeight: '600' },
    input: { minHeight: 64, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 10, color: c.text, textAlignVertical: 'top', fontSize: 14 },
    error: { color: '#B91C1C', fontSize: 13, fontWeight: '600', marginTop: 10 },
    actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
    link: { fontSize: 14, fontWeight: '700', color: c.textSecondary, padding: 6 },
    primary: { minWidth: 140, height: 44, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
    thumbWrap: { width: 70, height: 70, borderRadius: 10, overflow: 'hidden' },
    thumb: { width: 70, height: 70 },
    thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    thumbRemove: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    addPhoto: { width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center', gap: 3 },
    addPhotoText: { fontSize: 10, fontWeight: '700', color: c.textSecondary },
  });
