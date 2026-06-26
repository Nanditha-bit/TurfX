import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function PartnerVenuesScreen({ navigation }) {
  const { token } = useAuth();
  const [turfs, setTurfs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/owner/turfs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTurfs(Array.isArray(res.data) ? res.data : res.data.turfs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (turf) => {
    const newStatus = turf.status === 'active' ? 'inactive' : 'active';
    Alert.alert(
      `${newStatus === 'active' ? 'Activate' : 'Deactivate'} Venue`,
      `Set "${turf.name}" to ${newStatus}?`,
      [
        { text: 'Cancel' },
        { text: 'Confirm', onPress: async () => {
          try {
            await axios.put(`${API}/owner/turfs/${turf.id}`, { status: newStatus }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setTurfs(prev => prev.map(t => t.id === turf.id ? { ...t, status: newStatus } : t));
          } catch (e) { Alert.alert('Error', e.response?.data?.msg || 'Failed'); }
        }},
      ]
    );
  };

  const renderItem = ({ item: t }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.venueIcon}>
          <Text style={{ fontSize: 22 }}>🏟</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.venueName}>{t.name}</Text>
          <Text style={s.venueMeta}>📍 {t.location}, {t.city}</Text>
          <Text style={s.venueSport}>⚽ {t.sport}  •  ⭐ {t.rating || 0}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: t.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
          <Text style={[s.statusText, { color: t.status === 'active' ? '#065F46' : '#DC2626' }]}>
            {t.status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={s.priceRow}>
        <Text style={s.priceLabel}>₹{t.price_per_hour}<Text style={{ fontWeight: '400', color: COLORS.textMuted, fontSize: 12 }}>/hr</Text></Text>
        <Text style={s.bookingCount}>📋 {t.total_bookings || 0} bookings</Text>
      </View>

      {t.amenities?.length > 0 && (
        <View style={s.amenities}>
          {t.amenities.slice(0, 4).map((a, i) => (
            <View key={i} style={s.amenityTag}>
              <Text style={s.amenityText}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={s.toggleBtn} onPress={() => toggleStatus(t)}>
          <Text style={s.toggleBtnText}>{t.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: COLORS.accent, fontWeight: '700', fontSize: 15 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>My Venues ({turfs.length})</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddVenue')}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={turfs}
          keyExtractor={t => String(t.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🏟</Text>
              <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 15 }}>No venues found</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6 }}>Add venues from the web portal</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bgLight },
  header:  { backgroundColor: COLORS.primary, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  title:   { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  addBtn:  { backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  card:    { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: COLORS.border },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  venueIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center' },
  venueName: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  venueMeta: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', marginBottom: 2 },
  venueSport:{ fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:  { fontSize: 11, fontWeight: '800' },
  priceRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceLabel: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  bookingCount: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  amenityTag: { backgroundColor: COLORS.accentLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  amenityText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  actions:   { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 10, alignItems: 'center' },
  toggleBtnText: { color: COLORS.dark, fontWeight: '700', fontSize: 13 },
});
