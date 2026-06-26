import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import API from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const SCAN_BOX = width * 0.72;

export default function QRScannerScreen({ navigation }) {
  const { token } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [result, setResult] = useState(null);      // booking object
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Animated scan line
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_BOX - 4],
  });

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // QR data format: "TURFX:BOOKING:<booking_id>" or just a booking id
      let bookingId = data;
      if (data.startsWith('TURFX:BOOKING:')) {
        bookingId = data.replace('TURFX:BOOKING:', '');
      }

      // Fetch booking details
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await API.get(`/bookings/${bookingId}`, { headers });
      setResult(res.data);
      setShowModal(true);
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Could not find this booking. Make sure the QR is valid.';
      Alert.alert('Scan Failed', msg, [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setResult(null);
    setScanned(false);
  };

  // ── Permission states ─────────────────────────────────────────────────────
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permText}>
          Please enable camera permissions in your device settings to scan QR codes.
        </Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main scanner UI ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top dark */}
        <View style={styles.overlayTop} />

        {/* Middle row */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />

          {/* Scan box */}
          <View style={styles.scanBox}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
            {!scanned && (
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
              />
            )}

            {/* Loading overlay inside box */}
            {loading && (
              <View style={styles.loadingBox}>
                <Text style={styles.loadingText}>Verifying…</Text>
              </View>
            )}
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* Bottom dark */}
        <View style={styles.overlayBottom}>
          <Text style={styles.hintText}>
            {scanned && !loading ? '✅ Scanned!' : 'Point camera at a TurfX booking QR code'}
          </Text>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            {/* Torch */}
            <TouchableOpacity
              style={[styles.iconBtn, torchOn && styles.iconBtnActive]}
              onPress={() => setTorchOn(p => !p)}
            >
              <Text style={styles.iconBtnEmoji}>{torchOn ? '🔦' : '💡'}</Text>
              <Text style={styles.iconBtnLabel}>{torchOn ? 'Flash On' : 'Flash'}</Text>
            </TouchableOpacity>

            {/* Scan again */}
            {scanned && !loading && (
              <TouchableOpacity
                style={[styles.iconBtn, styles.iconBtnPrimary]}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.iconBtnEmoji}>🔄</Text>
                <Text style={[styles.iconBtnLabel, { color: COLORS.white }]}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <Text style={styles.headerSub}>Verify your booking at the venue</Text>
      </SafeAreaView>

      {/* Result Modal */}
      <BookingResultModal
        visible={showModal}
        booking={result}
        onClose={closeModal}
        onNavigate={() => {
          closeModal();
          if (result) navigation.navigate('MyBookings');
        }}
      />
    </View>
  );
}

// ── Booking result modal ──────────────────────────────────────────────────────
function BookingResultModal({ visible, booking, onClose, onNavigate }) {
  if (!booking) return null;

  const statusColor = {
    confirmed: '#16a34a',
    pending: '#d97706',
    cancelled: '#dc2626',
    completed: '#2563eb',
  }[booking.status?.toLowerCase()] || COLORS.primary;

  const statusIcon = {
    confirmed: '✅',
    pending: '⏳',
    cancelled: '❌',
    completed: '🏆',
  }[booking.status?.toLowerCase()] || '📋';

  const slots = Array.isArray(booking.time_slots)
    ? booking.time_slots.join(', ')
    : booking.time_slot || '—';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={modal.backdrop}>
        <View style={modal.sheet}>
          {/* Handle */}
          <View style={modal.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Status badge */}
            <View style={[modal.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
              <Text style={modal.statusIcon}>{statusIcon}</Text>
              <Text style={[modal.statusText, { color: statusColor }]}>
                {booking.status?.toUpperCase()}
              </Text>
            </View>

            {/* Turf name */}
            <Text style={modal.turfName}>{booking.turf_name || 'Turf Booking'}</Text>
            <Text style={modal.bookingId}>Booking ID: #{booking.id}</Text>

            <View style={modal.divider} />

            {/* Details */}
            <Row label="📅 Date"    value={booking.booking_date} />
            <Row label="⏰ Slots"   value={slots} />
            <Row label="👤 Name"    value={booking.user_name || booking.customer_name || '—'} />
            <Row label="📍 Venue"   value={booking.turf_location || booking.location || '—'} />
            <Row label="💰 Amount"  value={`₹${booking.total_price || booking.amount || '—'}`} />

            <View style={modal.divider} />

            {/* CTA buttons */}
            <TouchableOpacity style={modal.primaryBtn} onPress={onNavigate}>
              <Text style={modal.primaryBtnText}>View My Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modal.secondaryBtn} onPress={onClose}>
              <Text style={modal.secondaryBtnText}>Scan Another</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <View style={modal.row}>
      <Text style={modal.rowLabel}>{label}</Text>
      <Text style={modal.rowValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgLight,
    padding: 32,
  },
  permIcon:  { fontSize: 48, marginBottom: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark, marginBottom: 8, textAlign: 'center' },
  permText:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  permBtn:   {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Overlay
  overlay:       { ...StyleSheet.absoluteFillObject },
  overlayTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  overlayMiddle: { flexDirection: 'row', height: SCAN_BOX },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  overlayBottom: {
    flex: 1.4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },

  // Scan box
  scanBox: {
    width: SCAN_BOX,
    height: SCAN_BOX,
    position: 'relative',
    overflow: 'hidden',
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.accent,
    borderWidth: 3,
  },
  cornerTL: { top: 0,    left: 0,  borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0,    right: 0, borderLeftWidth: 0,  borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0,    borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0,  borderTopWidth: 0,    borderBottomRightRadius: 4 },

  // Scan line
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2.5,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },

  loadingBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Bottom controls
  hintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  btnRow: { flexDirection: 'row', gap: 16 },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconBtnActive:   { backgroundColor: 'rgba(253,224,71,0.2)', borderColor: COLORS.accent },
  iconBtnPrimary:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  iconBtnEmoji:    { fontSize: 22, marginBottom: 4 },
  iconBtnLabel:    { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(8,71,52,0.85)',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  headerSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
});

const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 8,
  },
  statusIcon: { fontSize: 18 },
  statusText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  turfName:  { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center' },
  bookingId: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 16 },

  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#111', fontWeight: '700', maxWidth: '58%', textAlign: 'right' },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
