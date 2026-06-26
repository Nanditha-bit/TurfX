import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import TurfCard from '../../components/TurfCard';
import IndiaLocationPicker from '../../components/IndiaLocationPicker';

const SPORTS = ['All', 'Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball'];
const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Jaipur'];

export default function HomeScreen({ navigation }) {
  const [turfs, setTurfs]       = useState([]);
  const [sport, setSport]       = useState('All');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity]         = useState('All Cities');
  const [showPicker, setShowPicker] = useState(false);

  const loadTurfs = useCallback(() => {
    axios.get(`${API}/turfs`)
      .then(res => setTurfs(Array.isArray(res.data) ? res.data : (res.data.turfs || [])))
      .catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useFocusEffect(useCallback(() => { loadTurfs(); }, [loadTurfs]));

  const locationLabel = city !== 'All Cities' ? city
    : selectedState ? selectedState : 'India';

  const filtered = turfs.filter(t => {
    const matchSport  = sport === 'All' || (t.sport || '').toLowerCase() === sport.toLowerCase();
    const matchState  = !selectedState || (t.state || '').toLowerCase() === selectedState.toLowerCase();
    const matchCity   = city === 'All Cities' || (t.city || '').toLowerCase().includes(city.toLowerCase());
    const matchSearch = !search || (t.name || '').toLowerCase().includes(search.toLowerCase())
      || (t.city || '').toLowerCase().includes(search.toLowerCase());
    return matchSport && matchState && matchCity && matchSearch;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadTurfs(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* HERO */}
        <View style={styles.hero}>
          {/* City pill in hero top-right */}
          <TouchableOpacity style={styles.cityPill} onPress={() => setShowPicker(true)}>
            <Text style={styles.cityPillIcon}>📍</Text>
            <Text style={styles.cityPillText}>{locationLabel}</Text>
            <Text style={styles.cityPillArrow}>▲</Text>
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>🏟 India's #1 Sports Booking Platform</Text>
          </View>
          <Text style={styles.heroTitle}>Book. Play.</Text>
          <Text style={[styles.heroTitle, { color: COLORS.accent }]}>Enjoy.</Text>
          <Text style={styles.heroSub}>Find and reserve premium sports turfs near you</Text>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search venues, city..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* STATS BAR */}
        <View style={styles.statsBar}>
          {[
            { value: '10K+', label: 'Players' },
            { value: '500+', label: 'Turfs' },
            { value: '50K+', label: 'Bookings' },
            { value: '4.8', label: 'Rating' },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* POPULAR CITIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Cities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CITIES.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => navigation.navigate('Explore', { city: c })}
                style={styles.cityChip}
              >
                <Text style={styles.cityChipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SPORT FILTER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Venues</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {SPORTS.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setSport(s)}
                style={[styles.sportChip, sport === s && styles.sportChipActive]}
              >
                <Text style={[styles.sportChipText, sport === s && styles.sportChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>No venues found</Text>
          ) : (
            <View style={{ gap: 16 }}>
              {filtered.slice(0, 8).map(turf => (
                <TurfCard
                  key={turf.id || turf._id}
                  turf={turf}
                  onPress={() => navigation.navigate('TurfDetail', { turf })}
                />
              ))}
            </View>
          )}

          {filtered.length > 8 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.viewAllText}>View All Venues →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Two-level India Location Picker */}
      <IndiaLocationPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        selectedState={selectedState}
        selectedCity={city}
        onSelect={({ state, city: c }) => {
          setSelectedState(state);
          setCity(c);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bgLight },
  hero:    { backgroundColor: COLORS.primary, padding: 24, paddingTop: 56, paddingBottom: 32 },
  heroBadge: { backgroundColor: 'rgba(206,241,123,0.15)', borderWidth: 1, borderColor: 'rgba(206,241,123,0.3)', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  heroBadgeText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  heroTitle: { fontSize: 40, fontWeight: '900', color: COLORS.white, letterSpacing: -1, lineHeight: 44 },
  heroSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8, marginBottom: 20, fontWeight: '400' },
  searchBox: { backgroundColor: COLORS.white, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 2 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark, paddingVertical: 12, fontWeight: '500' },
  statsBar:  { backgroundColor: COLORS.dark, flexDirection: 'row', padding: 16 },
  statItem:  { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.accent },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  section:   { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginBottom: 14 },
  cityChip:  { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 8 },
  cityChipText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  sportChip: { backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  sportChipActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  sportChipText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  sportChipTextActive: { color: COLORS.white },
  empty:     { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginTop: 32, fontWeight: '600' },
  viewAllBtn:{ marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center' },
  viewAllText:{ color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  // City pill
  cityPill:  { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:999, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'rgba(255,255,255,0.25)', alignSelf:'flex-end', marginBottom:12 },
  cityPillIcon: { fontSize:13 },
  cityPillText: { color:COLORS.white, fontWeight:'700', fontSize:13, maxWidth:100 },
  cityPillArrow:{ color:COLORS.accent, fontSize:10, fontWeight:'700' },
});
