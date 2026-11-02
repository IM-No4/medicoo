import { Minus, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';

// The phone's built-in crop screen can only crop INSIDE the photo, so a close-up selfie could never be made to fit: the head was taller than the
// biggest square the photo allows. This one lets the photo be moved and zoomed - including zoomed OUT past the edges, where the empty space is
// filled white - and saves exactly what the square shows (what you see is what you get), sized for a profile picture.
const OUTPUT_SIZE = 1024;
const FILL = '#FFFFFF';
const MIN_SCALE = 0.6; // relative to the photo fitting entirely inside the square
const MAX_ZOOM_FACTOR = 5; // relative to the photo filling the square
const BUTTON_STEP = 1.2;

interface Props {
  uri: string;
  onCancel: () => void;
  onDone: (uri: string) => void;
}

const touchDistance = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

export default function ImageCropperModal({ uri, onCancel, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const frame = Math.min(screenWidth - 32, 380);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const shotRef = useRef<ViewShot>(null);

  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => { if (alive) setNatural({ w, h }); },
      // a photo whose size cannot be read is passed on as it is rather than blocking the upload
      () => { if (alive) onDone(uri); },
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  // The photo is laid out at the size where it fits entirely inside the square ("contain"); everything else is a scale relative to that.
  const geometry = useMemo(() => {
    if (!natural) return null;
    const contain = Math.min(frame / natural.w, frame / natural.h);
    const cover = Math.max(frame / natural.w, frame / natural.h);
    return {
      baseW: natural.w * contain,
      baseH: natural.h * contain,
      startScale: cover / contain,
      maxScale: (cover / contain) * MAX_ZOOM_FACTOR,
    };
  }, [natural, frame]);

  const scaleAV = useRef(new Animated.Value(1)).current;
  const txAV = useRef(new Animated.Value(0)).current;
  const tyAV = useRef(new Animated.Value(0)).current;
  const state = useRef({ scale: 1, tx: 0, ty: 0 });
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;

  // Sets the position, keeping the photo from being dragged right out of the square: how far it may move on an axis is half the difference
  // between the photo's size there and the square's - so a zoomed-in photo always covers the square, a zoomed-out one stays inside it.
  const apply = useCallback((scale: number, tx: number, ty: number) => {
    const g = geometryRef.current;
    if (!g) return;
    const s = Math.min(g.maxScale, Math.max(MIN_SCALE, scale));
    const limitX = Math.abs(g.baseW * s - frame) / 2;
    const limitY = Math.abs(g.baseH * s - frame) / 2;
    const x = Math.min(limitX, Math.max(-limitX, tx));
    const y = Math.min(limitY, Math.max(-limitY, ty));
    state.current = { scale: s, tx: x, ty: y };
    scaleAV.setValue(s);
    txAV.setValue(x);
    tyAV.setValue(y);
  }, [frame, scaleAV, txAV, tyAV]);

  // the photo starts the way the system cropper showed it: filling the square
  useEffect(() => {
    if (geometry) apply(geometry.startScale, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  const gesture = useRef({ baseTx: 0, baseTy: 0, baseDx: 0, baseDy: 0, pinchDistance: 0, pinchScale: 1 });
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          gesture.current = { baseTx: state.current.tx, baseTy: state.current.ty, baseDx: 0, baseDy: 0, pinchDistance: 0, pinchScale: state.current.scale };
        },
        onPanResponderMove: (e, g) => {
          const gs = gesture.current;
          if (e.nativeEvent.touches.length >= 2) {
            const distance = touchDistance(e);
            if (!gs.pinchDistance) {
              gs.pinchDistance = distance;
              gs.pinchScale = state.current.scale;
            } else {
              apply(gs.pinchScale * (distance / gs.pinchDistance), state.current.tx, state.current.ty);
            }
            // when one finger lifts, dragging carries on from here instead of jumping
            gs.baseTx = state.current.tx;
            gs.baseTy = state.current.ty;
            gs.baseDx = g.dx;
            gs.baseDy = g.dy;
          } else {
            gs.pinchDistance = 0;
            apply(state.current.scale, gs.baseTx + (g.dx - gs.baseDx), gs.baseTy + (g.dy - gs.baseDy));
          }
        },
      }),
    [apply],
  );

  const zoomBy = (factor: number) => apply(state.current.scale * factor, state.current.tx, state.current.ty);

  const save = async () => {
    if (saving || !shotRef.current) return;
    setSaving(true);
    try {
      const saved = await captureRef(shotRef, { format: 'jpg', quality: 0.9, result: 'tmpfile', width: OUTPUT_SIZE, height: OUTPUT_SIZE });
      onDone(saved);
    } catch (error) {
      console.warn('[ImageCropperModal] Could not save the cropped photo', error);
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>Move and zoom</Text>
        <Text style={styles.subtitle}>Drag to move, pinch or use the buttons to zoom. Zoom out to fit your whole face.</Text>

        <View style={styles.stage}>
          {!geometry ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={{ width: frame, height: frame }} {...panResponder.panHandlers}>
              {/* only this is saved: the square and the photo in it */}
              <ViewShot ref={shotRef} style={{ width: frame, height: frame, backgroundColor: FILL, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <Animated.Image
                  source={{ uri }}
                  style={{
                    width: geometry.baseW,
                    height: geometry.baseH,
                    transform: [{ translateX: txAV }, { translateY: tyAV }, { scale: scaleAV }],
                  }}
                />
              </ViewShot>
              {/* guide for the round profile picture; not part of the saved image */}
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.guide, { borderRadius: frame / 2 }]} />
            </View>
          )}
        </View>

        <View style={styles.zoomRow}>
          <TouchableOpacity style={styles.zoomButton} onPress={() => zoomBy(1 / BUTTON_STEP)} activeOpacity={0.8} accessibilityLabel="Zoom out">
            <Minus size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={() => zoomBy(BUTTON_STEP)} activeOpacity={0.8} accessibilityLabel="Zoom in">
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onCancel} activeOpacity={0.8} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.doneButton]} onPress={save} activeOpacity={0.85} disabled={saving || !geometry}>
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.doneText}>Use photo</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 16 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guide: { borderWidth: 2, borderColor: '#10B981' },
  zoomRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  zoomButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: 'rgba(255,255,255,0.16)' },
  cancelText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  doneButton: { backgroundColor: '#10B981' },
  doneText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
