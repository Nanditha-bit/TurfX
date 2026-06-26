import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, ScrollView, TextInput,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

const TABS = ['All Bookings', 'Upcoming', 'Today', 'Completed', 'Cancelled'];

const STATUS_COLORS = {
  confirmed: { bg: '#D1FAE5', text: '#065F46', border: '#86EFAC' },
  pending:   { bg: '#FEF3C7', text: '#92400E', border: '#FED7AA' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  completed: { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  'checked-in': { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
};

export default function PartnerBookingsScreen({ navigation }) {
  const { token } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]             = useState('All Bookings');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 10;

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data?.bookings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().split('T')[0];

  const filtered = bookings.filter(b => {
    if (tab === 'Upcoming')  return b.date >= today && b.status === 'confirmed';
    if (tab === 'Today')     return b.date === today;
    if (tab === 'Completed') return b.status === 'completed';
    if (tab === 'Cancelled') return b.status === 'cancelled';
    return true;
  }).filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (b.user_name || '').toLowerCase().includes(q) ||
           (b.turf_name || '').toLowerCase().includes(q) ||
           String(b.id || '').includes(q);
  });

  const tabCounts = {
    'All Bookings': bookings.length,
    'Upcoming':     bookings.filter(b => b.date >= today && b.status === 'confirmed').length,
    'Today':        bookings.filter(b => b.date === today).length,
    'Completed':    bookings.filter(b => b.status === 'completed').length,
    'Cancelled':    bookings.filter(b => b.status === 'cancelled').length,
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API}/bookings/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      Alert.alert('✅ Approved', 'Booking has been confirmed.');
    } catch (e) { Alert.alert('Error', e.response?.data?.msg || 'Failed'); }
  };

  const handleReject = (id) => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await axios.put(`${API}/bookings/reject/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
          setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
        } catch (e) { Alert.alert('Error', e.response?.data?.msg || 'Failed'); }
      }},
    ]);
  };

  const handleCheckin = async (id) => {
    Alert.alert('Check-in', 'Mark this booking as checked-in?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Check-in', onPress: async () => {
        try {
          await axios.post(`${API}/bookings/checkin/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
          setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'checked-in' } : b));
          Alert.alert('✅', 'Check-in successful.');
        } catch (e) { Alert.alert('Error', e.response?.data?.msg || 'Failed'); }
      }},
    ]);
  };

  const renderItem = ({ item: b }) => {
    const sc = STATUS_COLORS[b.status?.toLowerCase()] || STATUS_COLORS.pending;
    const slots = Array.isArray(b.time_slots) ? b.time_slots.join(', ') : b.time_slot || '—';
    const isToday = b.date === today;

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.customerContainer}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {(b.user_name || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.customerName} numberOfLines={1}>{b.user_name || 'Customer'}</Text>
              <Text style={s.customerPhone}>{b.user_phone || ''}</Text>
              <Text style={s.turfName} numberOfLines={1}>📍 {b.turf_name || '—'}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {isToday && (
              <View style={s.todayBadge}>
                <View style={s.todayDot} />
                <Text style={s.todayText}>TODAY</Text>
              </View>
            )}
            <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border, marginTop: isToday ? 8 : 0 }]}>
              <Text style={[s.statusBadgeText, { color: sc.text }]}>{(b.status || '').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.detailsGrid}>
          <InfoTag label="Date"   value={b.date} icon="📅" />
          <InfoTag label="Slots"  value={slots} icon="⏰" />
          <InfoTag label="Amount" value={`₹${b.total_price || 0}`} icon="💰" />
        </View>

        <Text style={s.bookingId}>Booking ID: #{b.booking_id || String(b.id || '').slice(-6).toUpperCase()}</Text>

        {/* Action buttons */}
        <View style={s.actionsContainer}>
          {b.status === 'pending' && (
            <>
              <TouchableOpacity style={[s.actionBtn, s.approveBtn]} onPress={() => handleApprove(b.id)}>
                <Text style={s.approveBtnText}>✓ Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} onPress={() => handleReject(b.id)}>
                <Text style={s.rejectBtnText}>✗ Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {b.status === 'confirmed' && (
            <TouchableOpacity style={[s.actionBtn, s.checkinBtn]} onPress={() => handleCheckin(b.id)}>
              <Text style={s.checkinBtnText}>📍 Check-in</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Bookings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tab strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabStrip} style={{ flexGrow: 0 }}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]}
              onPress={() => { setTab(t); setPage(1); }}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
              <View style={[s.tabBadge, tab === t && s.tabBadgeActive]}>
                <Text style={[s.tabBadgeText, { color: tab === t ? COLORS.accent : COLORS.textMuted }]}>
                  {tabCounts[t]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Search */}
      <View style={s.searchBoxContainer}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by customer, venue, ID..."
            value={search}
            onChangeText={t => { setSearch(t); setPage(1); }}
            placeholderTextColor={COLORS.textMuted}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={s.clearSearchBtn}>
              <Text style={s.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Stats row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
        {[
          { icon: '📅', label: 'Total', val: bookings.length, color: '#DBEAFE', textColor: '#1E40AF' },
          { icon: '🕐', label: 'Upcoming', val: tabCounts['Upcoming'], color: '#FEF3C7', textColor: '#92400E' },
          { icon: '📆', label: 'Today', val: tabCounts['Today'], color: '#D1FAE5', textColor: '#065F46' },
          { icon: '✓',  label: 'Done', val: tabCounts['Completed'], color: '#EDE9FE', textColor: '#7C3AED' },
          { icon: '✕',  label: 'Cancelled', val: tabCounts['Cancelled'], color: '#FEE2E2', textColor: '#DC2626' },
        ].map((st, i) => (
          <View key={i} style={[s.statChip, { backgroundColor: st.color }]}>
            <Text style={s.statIcon}>{st.icon}</Text>
            <Text style={[s.statVal, { color: st.textColor }]}>{st.val}</Text>
            <Text style={[s.statLbl, { color: st.textColor }]}>{st.label}</Text>
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={s.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={paged}
          keyExtractor={b => String(b.id)}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>No bookings found</Text>
              <Text style={s.emptySubtitle}>Your bookings will appear here</Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={s.paginationContainer}>
                <TouchableOpacity style={s.paginationBtn} onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <Text style={[s.paginationBtnText, page === 1 && s.paginationBtnDisabled]}>‹</Text>
                </TouchableOpacity>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <TouchableOpacity key={p} style={[s.paginationBtn, page === p && s.paginationBtnActive]} onPress={() => setPage(p)}>
                    <Text style={[s.paginationBtnText, page === p && s.paginationBtnTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={s.paginationBtn} onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <Text style={[s.paginationBtnText, page === totalPages && s.paginationBtnDisabled]}>›</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

function InfoTag({ label, value, icon }) {
  return (
    <View style={s.infoTag}>
      <View style={s.infoTagIconContainer}>
        <Text style={s.infoTagIcon}>{icon}</Text>
      </View>
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={s.infoTagLabel}>{label}</Text>
        <Text style={s.infoTagValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#F8FAF5' 
  },
  header: { 
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16 
  },
  backBtn: { 
    color: COLORS.accent, 
    fontWeight: '700', 
    fontSize: 16,
  },
  title: { 
    color: COLORS.white, 
    fontSize: 24, 
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tabStrip: { 
    paddingHorizontal: 12, 
    gap: 4,
  },
  tab: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabActive: { 
    backgroundColor: 'rgba(206,241,123,0.2)', 
  },
  tabText: { 
    color: 'rgba(255,255,255,0.6)', 
    fontWeight: '700', 
    fontSize: 13,
  },
  tabTextActive: { 
    color: COLORS.accent,
    fontWeight: '800',
  },
  tabBadge: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 12, 
    paddingHorizontal: 8, 
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeActive: { 
    backgroundColor: 'rgba(206,241,123,0.3)',
  },
  tabBadgeText: {
    fontSize: 10, 
    fontWeight: '900',
  },
  searchBoxContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 4, 
    borderWidth: 1.5, 
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { 
    fontSize: 18, 
    marginRight: 10,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    color: COLORS.dark, 
    paddingVertical: 12, 
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 8,
  },
  clearSearchText: {
    color: COLORS.textMuted, 
    fontSize: 18, 
    fontWeight: '700',
  },
  statsRow: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    gap: 12,
  },
  statChip: { 
    borderRadius: 16, 
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center', 
    minWidth: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: { 
    fontSize: 20, 
    marginBottom: 6,
  },
  statVal: { 
    fontSize: 24, 
    fontWeight: '900', 
    marginBottom: 2,
  },
  statLbl: { 
    fontSize: 11, 
    fontWeight: '700', 
    opacity: 0.7,
  },
  listContent: {
    padding: 16, 
    gap: 16, 
    paddingBottom: 120,
  },
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1.5, 
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
  },
  customerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  customerName: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: COLORS.dark, 
    marginBottom: 4,
  },
  customerPhone: { 
    fontSize: 13, 
    color: COLORS.textMuted, 
    fontWeight: '500', 
    marginBottom: 2,
  },
  turfName: { 
    fontSize: 13, 
    color: COLORS.primary, 
    fontWeight: '700',
  },
  todayBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: '#D1FAE5', 
    borderWidth: 1.5, 
    borderColor: '#86EFAC', 
    borderRadius: 20, 
    paddingHorizontal: 10, 
    paddingVertical: 4,
  },
  todayDot: { 
    width: 7, 
    height: 7, 
    borderRadius: 4, 
    backgroundColor: '#22C55E',
  },
  todayText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#065F46',
    letterSpacing: 0.5,
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 20, 
    alignSelf: 'flex-end',
    borderWidth: 1.5,
  },
  statusBadgeText: { 
    fontSize: 10, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  infoTag: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF5', 
    borderRadius: 12, 
    padding: 12, 
    borderWidth: 1.5, 
    borderColor: COLORS.border,
  },
  infoTagIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTagIcon: {
    fontSize: 16,
  },
  infoTagLabel: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: COLORS.textMuted, 
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoTagValue: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: COLORS.dark,
  },
  bookingId: { 
    fontSize: 11, 
    color: COLORS.textMuted, 
    fontWeight: '600', 
    marginTop: 12,
  },
  actionsContainer: { 
    flexDirection: 'row', 
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14, 
    padding: 12, 
    alignItems: 'center', 
    borderWidth: 1.5,
  },
  approveBtn: { 
    backgroundColor: '#D1FAE5', 
    borderColor: '#86EFAC',
  },
  approveBtnText: { 
    color: '#065F46', 
    fontWeight: '800', 
    fontSize: 14,
  },
  rejectBtn: { 
    backgroundColor: '#FEE2E2', 
    borderColor: '#FECACA',
  },
  rejectBtnText: { 
    color: '#DC2626', 
    fontWeight: '800', 
    fontSize: 14,
  },
  checkinBtn: { 
    backgroundColor: '#DBEAFE', 
    borderColor: '#BFDBFE',
  },
  checkinBtnText: { 
    color: '#1E40AF', 
    fontWeight: '800', 
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8, 
    paddingVertical: 24,
  },
  paginationBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: COLORS.white, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5, 
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paginationBtnActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
  },
  paginationBtnText: { 
    fontWeight: '800', 
    color: COLORS.dark, 
    fontSize: 16,
  },
  paginationBtnTextActive: {
    color: COLORS.accent,
  },
  paginationBtnDisabled: {
    opacity: 0.3,
  },
});
