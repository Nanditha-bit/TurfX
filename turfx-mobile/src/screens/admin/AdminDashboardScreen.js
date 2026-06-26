import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [turfsRes, revenueRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/turfs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/revenue`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      const turfs    = Array.isArray(turfsRes.data)    ? turfsRes.data    : [];
      const users    = Array.isArray(usersRes.data)    ? usersRes.data    : [];
      const allBookings = Array.isArray(revenueRes.data?.allBookings) ? revenueRes.data.allBookings : [];

      setStats({
        totalTurfs:    turfs.length,
        totalBookings: allBookings.length,
        totalUsers:    users.length,
        totalRevenue:  revenueRes.data?.summary?.totalRevenue || 0,
        activeTurfs:   turfs.filter(t => t.isActive !== false).length,
        pendingBooks:  allBookings.filter(b => b.status === 'pending').length,
        recentBookings: allBookings.slice(0, 8),
        recentTurfs:    turfs.slice(0, 5),
      });
    } catch (e) {
      console.error('Admin dashboard error:', e.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Login');
      }},
    ]);
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ color: COLORS.textMuted, marginTop: 12, fontWeight: '600' }}>Loading admin panel...</Text>
    </View>
  );

  const STATS = [
    { icon: '🏟', label: 'Total Venues',    value: stats?.totalTurfs    || 0, color: '#DBEAFE' },
    { icon: '📋', label: 'Total Bookings',  value: stats?.totalBookings || 0, color: '#D1FAE5' },
    { icon: '👥', label: 'Total Users',     value: stats?.totalUsers    || 0, color: '#F3E8FF' },
    { icon: '💰', label: 'Total Revenue',   value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, color: '#FEF3C7' },
    { icon: '✅', label: 'Active Venues',   value: stats?.activeTurfs   || 0, color: '#DCFCE7' },
    { icon: '⏳', label: 'Pending',         value: stats?.pendingBooks  || 0, color: '#FEE2E2' },
  ];

  const STATUS_COLORS = {
    confirmed: { bg: '#D1FAE5', text: '#065F46' },
    pending:   { bg: '#FEF3C7', text: '#92400E' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    completed: { bg: '#F3F4F6', text: '#6B7280' },
  };

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>🛡️ Admin Panel</Text>
            <Text style={s.name}>{user?.name || 'Administrator'}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        {/* Stats grid */}
        <View style={s.statsGrid}>
          {STATS.map((st, i) => (
            <View key={i} style={[s.statCard, { backgroundColor: st.color }]}>
              <Text style={s.statIcon}>{st.icon}</Text>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Bookings */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Bookings</Text>
          {(stats?.recentBookings || []).length === 0 ? (
            <View style={s.emptyCard}><Text style={s.emptyText}>No bookings yet</Text></View>
          ) : (
            (stats?.recentBookings || []).map((b, i) => {
              const sc = STATUS_COLORS[b.status?.toLowerCase()] || STATUS_COLORS.pending;
              return (
                <View key={b.id || i} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{b.user_name || 'User'}</Text>
                    <Text style={s.rowSub}>{b.turf_name || '—'}  •  {b.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.badgeText, { color: sc.text }]}>{(b.status || '').toUpperCase()}</Text>
                    </View>
                    <Text style={s.rowPrice}>₹{b.total_price || 0}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Recent Venues */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Venues</Text>
          {(stats?.recentTurfs || []).length === 0 ? (
            <View style={s.emptyCard}><Text style={s.emptyText}>No venues yet</Text></View>
          ) : (
            (stats?.recentTurfs || []).map((t, i) => (
              <View key={t.id || i} style={s.row}>
                <View style={s.venueIcon}><Text style={{ fontSize: 18 }}>🏟</Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.rowTitle}>{t.name}</Text>
                  <Text style={s.rowSub}>{t.city}  •  {t.sport}  •  ₹{t.price_per_hour}/hr</Text>
                </View>
                <View style={[s.badge, { backgroundColor: t.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[s.badgeText, { color: t.status === 'active' ? '#065F46' : '#DC2626' }]}>
                    {t.status === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </View>
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
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgLight },
  header:  { backgroundColor: '#0D1F0F' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greeting:  { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  name:      { color: COLORS.white, fontSize: 20, fontWeight: '900' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText:{ color: COLORS.white, fontWeight: '700', fontSize: 13 },
  content: { padding: 16, paddingBottom: 80 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:  { width: '47%', borderRadius: 14, padding: 14, flexGrow: 1 },
  statIcon:  { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  section:   { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  emptyText: { color: COLORS.textMuted, fontWeight: '600' },
  row:     { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  rowTitle:{ fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  rowSub:  { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  rowPrice:{ fontSize: 13, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  badge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  venueIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center' },
});
