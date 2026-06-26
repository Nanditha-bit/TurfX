import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function PartnerEarningsScreen({ navigation }) {
  const { token } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const bookings          = data?.bookings || [];
  const confirmed         = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const cancelled         = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue      = confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const avgBookingValue   = confirmed.length ? Math.round(totalRevenue / confirmed.length) : 0;
  const platformFees      = Math.round(totalRevenue * 0.05);
  const netPayout         = Math.max(totalRevenue - platformFees, 0);
  const uniquePlayers     = new Set(confirmed.map(b => b.user_id || b.user_name).filter(Boolean)).size;
  const cancelledValue    = cancelled.reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Weekly chart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), key: d.toISOString().split('T')[0], rev: 0 };
  });
  confirmed.forEach(b => {
    const day = weekDays.find(d => d.key === b.date);
    if (day) day.rev += b.total_price || 0;
  });
  const maxRev = Math.max(...weekDays.map(d => d.rev), 1);

  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(nextPayoutDate.getDate() + ((5 - nextPayoutDate.getDay() + 7) % 7 || 7));

  const stats = [
    { icon: '📈', label: 'Total Revenue',     value: `₹${totalRevenue.toLocaleString()}`,    color: '#D1FAE5', sub: `${confirmed.length} paid bookings` },
    { icon: '💳', label: 'Avg Booking Value',  value: `₹${avgBookingValue.toLocaleString()}`, color: '#DBEAFE', sub: `${confirmed.length} bookings` },
    { icon: '👥', label: 'Unique Players',     value: uniquePlayers,                          color: '#F3E8FF', sub: `${bookings.length} total bookings` },
    { icon: '📉', label: 'Platform Fees (5%)', value: `₹${platformFees.toLocaleString()}`,   color: '#FEE2E2', sub: 'estimated' },
  ];

  const breakdown = [
    { label: 'Booking Payments', value: totalRevenue,   color: COLORS.accent },
    { label: 'Platform Fees',    value: platformFees,   color: '#3B82F6' },
    { label: 'Cancelled',        value: cancelledValue, color: '#8B5CF6' },
  ];
  const maxBreakdown = Math.max(...breakdown.map(b => b.value), 1);

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Earnings & Analytics</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        {/* Net payout highlight */}
        <View style={s.payoutCard}>
          <Text style={s.payoutLabel}>Net Payout</Text>
          <Text style={s.payoutAmount}>₹{netPayout.toLocaleString()}</Text>
          <Text style={s.payoutDate}>
            Next payout: {nextPayoutDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          {stats.map((st, i) => (
            <View key={i} style={[s.statCard, { backgroundColor: st.color }]}>
              <Text style={s.statIcon}>{st.icon}</Text>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
              <Text style={s.statSub}>{st.sub}</Text>
            </View>
          ))}
        </View>

        {/* Weekly revenue chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Weekly Revenue Trend</Text>
          <View style={s.chart}>
            {weekDays.map((d, i) => (
              <View key={i} style={s.barCol}>
                {d.rev > 0 && (
                  <Text style={s.barVal}>₹{Math.round(d.rev / 1000)}k</Text>
                )}
                <View style={s.barTrack}>
                  <View style={[s.bar, { height: `${Math.max((d.rev / maxRev) * 100, 5)}%` }]} />
                </View>
                <Text style={s.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue breakdown */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Revenue Breakdown</Text>
          {breakdown.map((b, i) => (
            <View key={i} style={s.breakdownRow}>
              <View style={s.breakdownHeader}>
                <Text style={s.breakdownLabel}>{b.label}</Text>
                <Text style={s.breakdownValue}>₹{b.value.toLocaleString()}</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${Math.round((b.value / maxBreakdown) * 100)}%`, backgroundColor: b.color }]} />
              </View>
            </View>
          ))}

          {/* Payout cycle */}
          <View style={s.payoutCycle}>
            <Text style={s.payoutCycleTitle}>Payout Cycle</Text>
            <Text style={s.payoutCycleText}>
              Next estimated payout of{' '}
              <Text style={{ fontWeight: '800', color: COLORS.dark }}>₹{netPayout.toLocaleString()}</Text>
              {' '}is scheduled for{' '}
              <Text style={{ fontWeight: '800', color: COLORS.dark }}>
                {nextPayoutDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </Text>
          </View>
        </View>

        {/* Recent confirmed bookings */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Confirmed Bookings</Text>
          {confirmed.slice(0, 5).length === 0 ? (
            <Text style={{ color: COLORS.textMuted, fontWeight: '600', textAlign: 'center', padding: 16 }}>No confirmed bookings yet</Text>
          ) : (
            confirmed.slice(0, 5).map((b, i) => (
              <View key={i} style={s.bookingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.bName}>{b.user_name || 'Customer'}</Text>
                  <Text style={s.bMeta}>{b.turf_name || '—'}  •  {b.date}</Text>
                </View>
                <Text style={s.bAmount}>₹{b.total_price || 0}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bgLight },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:  { backgroundColor: COLORS.primary },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { color: COLORS.accent, fontWeight: '700', fontSize: 14 },
  title:   { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 80, gap: 14 },
  payoutCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center' },
  payoutLabel:  { color: 'rgba(255,255,255,0.65)', fontWeight: '700', fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  payoutAmount: { color: COLORS.accent, fontSize: 36, fontWeight: '900', marginBottom: 8 },
  payoutDate:   { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:  { width: '47%', borderRadius: 16, padding: 14, flexGrow: 1 },
  statIcon:  { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginTop: 2 },
  statSub:   { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  card:    { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 16 },
  chart:   { flexDirection: 'row', height: 130, alignItems: 'flex-end', gap: 8 },
  barCol:  { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barVal:  { fontSize: 8, fontWeight: '700', color: COLORS.textMuted },
  barTrack:{ width: '100%', height: 90, justifyContent: 'flex-end' },
  bar:     { width: '100%', backgroundColor: COLORS.accent, borderRadius: 6 },
  barLabel:{ fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  breakdownRow: { marginBottom: 14 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  breakdownValue: { fontSize: 13, fontWeight: '800', color: COLORS.dark },
  barBg:   { height: 8, backgroundColor: '#EEF2E6', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  payoutCycle: { marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bgLight },
  payoutCycleTitle: { fontSize: 13, fontWeight: '800', color: COLORS.dark, marginBottom: 8 },
  payoutCycleText:  { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', lineHeight: 18 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bName:   { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  bMeta:   { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  bAmount: { fontSize: 15, fontWeight: '900', color: COLORS.primary },
});
