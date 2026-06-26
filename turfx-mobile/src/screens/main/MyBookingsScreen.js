import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, Image, RefreshControl,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Calendar, Clock, IndianRupee, Camera, Trophy, CheckCircle } from 'lucide-react-native';

const TABS = ['upcoming', 'completed', 'cancelled'];

const STATUS_COLORS = {
  confirmed: { bg: '#D1FAE5', text: '#065F46' },
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  approved:  { bg: '#DBEAFE', text: '#1E40AF' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  completed: { bg: '#F3F4F6', text: '#6B7280' },
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSlots(slots) {
  if (!slots) return 'N/A';
  if (Array.isArray(slots) && slots.length > 0) {
    const start = slots[0].split(' to ')[0];
    const end   = slots[slots.length - 1].split(' to ')[1];
    return `${start} – ${end}`;
  }
  if (typeof slots === 'string') return slots.replace(' to ', ' – ');
  return 'N/A';
}

export default function MyBookingsScreen({ navigation }) {
  const { token } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]             = useState('upcoming');
  const [qrModal, setQrModal]     = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUri, setQrUri]         = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(Array.isArray(res.data) ? res.data : res.data.bookings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = (id) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await axios.put(`${API}/bookings/cancel/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: 'cancelled' } : b)));
          Alert.alert('Cancelled', 'Your booking has been cancelled.');
        } catch (e) { Alert.alert('Error', e.response?.data?.msg || 'Failed to cancel'); }
      }},
    ]);
  };

  const openQr = (id, turfName) => {
    // Pass token as query param — backend accepts it for image endpoints
    const qrUrl = `${API}/bookings/${id}/qr?token=${encodeURIComponent(token || '')}`;
    setQrModal({ id, turfName });
    setQrUri(qrUrl);
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming  = bookings.filter(b => ['confirmed', 'pending', 'approved'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'completed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');
  const shown = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : cancelled;

  const renderBooking = ({ item: b }) => {
    const sc = STATUS_COLORS[b.status?.toLowerCase()] || STATUS_COLORS.pending;
    const slots = formatSlots(b.time_slots || b.time_slot);
    const turfName = b.turf_name || b.turf_id?.name || 'Venue';
    const location = b.turf_location || b.turf_id?.location || '';
    const city     = b.turf_city    || b.turf_id?.city    || '';
    const isToday  = b.date === today;
    const isUpcomingConfirmed = tab === 'upcoming' && (b.status === 'confirmed' || b.status === 'approved');

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.turfName} numberOfLines={1}>{turfName}</Text>
            <Text style={styles.location} numberOfLines={1}>
              <MapPin size={14} color={COLORS.textMuted} /> {location}{city ? `, ${city}` : ''}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>
              {isToday && tab === 'upcoming' ? 'TODAY' : (b.status || '').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Info chips */}
        <View style={styles.chips}>
          <Chip icon={<Calendar size={14} color={COLORS.dark} />} label="Date" value={formatDate(b.date)} />
          <Chip icon={<Clock size={14} color={COLORS.dark} />} label="Time" value={slots} />
          <Chip icon={<IndianRupee size={14} color={COLORS.dark} />} label="Amount" value={`₹${b.total_price || 0}`} />
        </View>

        {/* Booking ID */}
        <Text style={styles.bookingId}>ID: #{b.booking_id || String(b.id).slice(-6).toUpperCase()}</Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          {isUpcomingConfirmed && (
            <TouchableOpacity style={styles.qrBtn} onPress={() => openQr(b.id, turfName)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Camera size={14} color="#16A34A" />
                <Text style={styles.qrBtnText}>Show QR</Text>
              </View>
            </TouchableOpacity>
          )}
          {tab === 'upcoming' && (b.status === 'confirmed' || b.status === 'approved') && b.date > today && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(b.id)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {(tab === 'completed' || tab === 'cancelled') && (
            <TouchableOpacity style={styles.bookAgainBtn}
              onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.bookAgainText}>Book Again</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Refund info */}
        {tab === 'cancelled' && b.refund_amount > 0 && (
          <View style={styles.refundRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} color="#16A34A" />
              <Text style={styles.refundText}>₹{b.refund_amount} refunded</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const counts = { upcoming: upcoming.length, completed: completed.length, cancelled: cancelled.length };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My <Text style={{ color: COLORS.accent }}>Bookings</Text></Text>
          <View style={styles.statsRow}>
            {TABS.map(t => (
              <TouchableOpacity key={t} style={[styles.statChip, tab === t && styles.statChipActive]} onPress={() => setTab(t)}>
                <Text style={[styles.statNum, tab === t && styles.statNumActive]}>{counts[t]}</Text>
                <Text style={[styles.statLabel, tab === t && styles.statLabelActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab pills */}
        <View style={styles.tabPills}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={[styles.pill, tab === t && styles.pillActive]} onPress={() => setTab(t)}>
              <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
              <View style={[styles.pillBadge, tab === t && styles.pillBadgeActive]}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: tab === t ? COLORS.accent : COLORS.textMuted }}>
                  {counts[t]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={b => String(b.id || b._id)}
          renderItem={renderBooking}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Trophy size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No {tab} bookings</Text>
              {tab === 'upcoming' && (
                <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Explore')}>
                  <Text style={styles.exploreBtnText}>Explore Venues</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* QR Modal */}
      <Modal visible={!!qrModal} animationType="slide" transparent onRequestClose={() => setQrModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Booking QR Code</Text>
            <Text style={styles.modalSub}>{qrModal?.turfName}</Text>
            <Text style={styles.modalHint}>Show this QR at the venue entrance</Text>
            <View style={styles.qrBox}>
              {qrLoading ? <ActivityIndicator size="large" color={COLORS.primary} /> :
               qrUri ? <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" /> :
               <Text style={{ color: COLORS.textMuted }}>Failed to load</Text>}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Chip({ icon, label, value }) {
  return (
    <View style={styles.chip}>
      {icon}
      <View>
        <Text style={styles.chipLabel}>{label}</Text>
        <Text style={styles.chipValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bgLight },
  header:  { backgroundColor: COLORS.primary },
  headerTop: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title:   { fontSize: 28, fontWeight: '900', color: COLORS.white, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statChip: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 80 },
  statChipActive: { backgroundColor: 'rgba(206,241,123,0.15)', borderWidth: 1.5, borderColor: 'rgba(206,241,123,0.4)' },
  statNum:  { fontSize: 22, fontWeight: '900', color: COLORS.white },
  statNumActive: { color: COLORS.accent },
  statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: 2 },
  statLabelActive: { color: 'rgba(206,241,123,0.7)' },
  tabPills: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 999, padding: 5, gap: 4, marginHorizontal: 16, marginBottom: 16 },
  pill:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 999 },
  pillActive: { backgroundColor: COLORS.primary },
  pillText:   { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  pillTextActive: { color: COLORS.accent },
  pillBadge:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#EEF2E6', alignItems: 'center', justifyContent: 'center' },
  pillBadgeActive: { backgroundColor: 'rgba(206,241,123,0.25)' },
  card:    { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  turfName: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 3 },
  location: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', flexDirection: 'row', alignItems: 'center' },
  badge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.bgLight, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: COLORS.border },
  chipLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipValue: { fontSize: 12, fontWeight: '800', color: COLORS.dark, marginTop: 1 },
  bookingId: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  qrBtn:   { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  qrBtnText: { color: '#16A34A', fontWeight: '700', fontSize: 12 },
  cancelBtn: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECDD3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  cancelBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },
  bookAgainBtn: { backgroundColor: COLORS.bgLight, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  bookAgainText: { color: COLORS.dark, fontWeight: '700', fontSize: 12 },
  refundRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  refundText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  empty:   { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted, marginBottom: 16 },
  exploreBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  exploreBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: 'center' },
  modalHandle: { width: 44, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  modalSub:   { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginBottom: 4 },
  modalHint:  { fontSize: 12, color: COLORS.textMuted, marginBottom: 24 },
  qrBox:     { width: 220, height: 220, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden' },
  qrImage:   { width: 200, height: 200 },
  closeBtn:  { backgroundColor: COLORS.primary, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
