import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import {
  IndianRupee, BookOpen, Clock, Calendar, CheckCircle,
  Hourglass, Hand
} from 'lucide-react-native';

const STATUS_COLORS = {
  confirmed: { bg: '#D1FAE5', text: '#065F46' },
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  completed: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function PartnerDashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (e) {
      console.error('Dashboard load error:', e.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('Dashboard');
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Login');
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontWeight: '600' }}>Loading dashboard...</Text>
      </View>
    );
  }

  const bookings = data?.bookings || data?.recentBookings || [];
  const turfs    = data?.turfs || [];
  const today    = new Date().toISOString().split('T')[0];

  const totalBookings  = bookings.length;
  const upcoming       = bookings.filter(b => b.date >= today && b.status === 'confirmed');
  const todayBookings  = bookings.filter(b => b.date === today);
  const completed      = bookings.filter(b => b.status === 'completed');
  const cancelled      = bookings.filter(b => b.status === 'cancelled');
  const pending        = bookings.filter(b => b.status === 'pending');
  const totalRevenue   = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
                                 .reduce((s, b) => s + (b.total_price || 0), 0);

  const stats = [
    { icon: IndianRupee, label: 'Total Revenue',   value: `₹${totalRevenue.toLocaleString()}`, color: '#D1FAE5' },
    { icon: BookOpen, label: 'Total Bookings',  value: totalBookings,                        color: '#DBEAFE' },
    { icon: Clock, label: 'Upcoming',        value: upcoming.length,                      color: '#FEF3C7' },
    { icon: Calendar, label: 'Today',           value: todayBookings.length,                 color: '#F0FDF4' },
    { icon: CheckCircle,  label: 'Completed',       value: completed.length,                     color: '#F3E8FF' },
    { icon: Hourglass, label: 'Pending',         value: pending.length,                       color: '#FFF7ED' },
  ];

  return (
    <View style={s.root}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>Welcome back,</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <Text style={s.name}>{user?.name || 'Partner'}</Text>
              <Hand size={18} color={COLORS.accent} />
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {['Dashboard', 'Bookings', 'Earnings', 'Venues'].map(t => (
            <TouchableOpacity key={t}
              style={[s.tab, activeTab === t && s.tabActive]}
              onPress={() => {
                setActiveTab(t);
                if (t === 'Bookings') navigation.navigate('PartnerBookings');
                if (t === 'Venues')   navigation.navigate('PartnerVenues');
                if (t === 'Earnings') navigation.navigate('PartnerEarnings');
              }}
            >
              <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        {/* Stats grid */}
      <View style={s.statsGrid}>
        {stats.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <View key={i} style={[s.statCard, { backgroundColor: stat.color }]}>
              <IconComponent size={26} color={COLORS.dark} />
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          )
        })}
      </View>

        {/* Weekly revenue bar chart */}
        <WeeklyChart bookings={bookings} />

        {/* Recent bookings */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PartnerBookings')}>
              <Text style={s.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {bookings.slice(0, 5).length === 0 ? (
            <EmptyCard text="No bookings yet" />
          ) : (
            bookings.slice(0, 5).map((b, i) => <BookingRow key={b.id || i} booking={b} />)
          )}
        </View>

        {/* Venues */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Your Venues ({turfs.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PartnerVenues')}>
              <Text style={s.seeAll}>Manage →</Text>
            </TouchableOpacity>
          </View>
          {turfs.slice(0, 3).length === 0 ? (
            <View>
              <EmptyCard text="No venues found" />
              <TouchableOpacity style={s.addVenueBtn} onPress={() => navigation.navigate('AddVenue')}>
                <Text style={s.addVenueBtnText}>+ Add Your First Venue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            turfs.slice(0, 3).map((t, i) => <VenueRow key={t.id || i} turf={t} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────
function WeeklyChart({ bookings }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      key:   d.toISOString().split('T')[0],
      rev:   0,
    };
  });
  bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').forEach(b => {
    const day = days.find(d => d.key === b.date);
    if (day) day.rev += b.total_price || 0;
  });
  const max = Math.max(...days.map(d => d.rev), 1);

  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>Weekly Revenue</Text>
      <View style={s.chart}>
        {days.map((d, i) => (
          <View key={i} style={s.barCol}>
            <Text style={s.barVal}>{d.rev > 0 ? `₹${Math.round(d.rev/1000)}k` : ''}</Text>
            <View style={s.barTrack}>
              <View style={[s.bar, { height: `${Math.max((d.rev / max) * 100, 5)}%` }]} />
            </View>
            <Text style={s.barLabel}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BookingRow({ booking: b }) {
  const sc = STATUS_COLORS[b.status?.toLowerCase()] || STATUS_COLORS.pending;
  return (
    <View style={s.bookingRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.bName}>{b.user_name || 'Customer'}</Text>
        <Text style={s.bMeta}>{b.turf_name || '—'}  •  {b.date}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[s.badge, { backgroundColor: sc.bg }]}>
          <Text style={[s.badgeText, { color: sc.text }]}>{(b.status || '').toUpperCase()}</Text>
        </View>
        <Text style={s.bPrice}>₹{b.total_price || 0}</Text>
      </View>
    </View>
  );
}

function VenueRow({ turf: t }) {
  return (
    <View style={s.venueRow}>
      <View style={s.venueIcon}>
        <Text style={{ fontSize: 18 }}>🏟</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.vName}>{t.name}</Text>
        <Text style={s.vMeta}>{t.location}  •  {t.sport}</Text>
      </View>
      <Text style={s.vPrice}>₹{t.price_per_hour}/hr</Text>
    </View>
  );
}

function EmptyCard({ text }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bgLight },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgLight },
  header:  { backgroundColor: COLORS.primary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  greeting:  { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500' },
  name:      { color: COLORS.white, fontSize: 18, fontWeight: '900' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText:{ color: COLORS.white, fontWeight: '700', fontSize: 13 },
  tabs:    { paddingHorizontal: 16, paddingBottom: 0, gap: 4 },
  tab:     { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.accent },
  tabText:   { color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: COLORS.accent },
  content: { padding: 16, paddingBottom: 80 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:  { width: '48%', borderRadius: 14, padding: 14, flexGrow: 1 },
  statIcon:  { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: COLORS.border },
  chartTitle:{ fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 16 },
  chart:   { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 8 },
  barCol:  { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barVal:  { fontSize: 8, fontWeight: '700', color: COLORS.textMuted },
  barTrack:{ width: '100%', height: 80, justifyContent: 'flex-end' },
  bar:     { width: '100%', backgroundColor: COLORS.accent, borderRadius: 6, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  barLabel:{ fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  seeAll:        { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  bookingRow:  { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  bName:       { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 3 },
  bMeta:       { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  bPrice:      { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:   { fontSize: 9, fontWeight: '800' },
  venueRow:    { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  venueIcon:   { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center' },
  vName:       { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 3 },
  vMeta:       { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  vPrice:      { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  emptyCard:   { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  emptyText:   { color: COLORS.textMuted, fontWeight: '600' },
  addVenueBtn: { backgroundColor: COLORS.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  addVenueBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
});
