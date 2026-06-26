import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import TurfCard from '../../components/TurfCard';
import IndiaLocationPicker from '../../components/IndiaLocationPicker';

const SPORTS = ['All', 'Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball'];

export default function ExploreScreen({ navigation, route }) {
  const [turfs, setTurfs]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [sport, setSport]           = useState(route?.params?.sport || 'All');
  const [sort, setSort]             = useState('Top Rated');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity]             = useState(route?.params?.city || 'All Cities');

  const loadTurfs = useCallback(() => {
    axios.get(`${API}/turfs`)
      .then(r => setTurfs(Array.isArray(r.data) ? r.data : (r.data.turfs || [])))
      .catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useFocusEffect(useCallback(() => { loadTurfs(); }, [loadTurfs]));

  // Pill label
  const locationLabel = city !== 'All Cities' ? city
    : selectedState ? selectedState : 'India';

  let filtered = turfs.filter(t => {
    const mSport  = sport === 'All' || (t.sport || '').toLowerCase() === sport.toLowerCase();
    const mState  = !selectedState || (t.state || '').toLowerCase() === selectedState.toLowerCase();
    const mCity   = city === 'All Cities' || (t.city || '').toLowerCase().includes(city.toLowerCase());
    const mSearch = !search ||
      (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.city || '').toLowerCase().includes(search.toLowerCase());
    return mSport && mState && mCity && mSearch;
  });

  if (sort === 'Top Rated')          filtered = [...filtered].sort((a, b) => (b.rating||0)-(a.rating||0));
  if (sort === 'Price: Low to High') filtered = [...filtered].sort((a, b) => a.price_per_hour-b.price_per_hour);
  if (sort === 'Price: High to Low') filtered = [...filtered].sort((a, b) => b.price_per_hour-a.price_per_hour);

  const clearLocation = () => { setSelectedState(''); setCity('All Cities'); };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Find Your <Text style={{ color: COLORS.accent }}>Arena</Text></Text>

          {/* Location pill */}
          <TouchableOpacity style={s.cityPill} onPress={() => setShowPicker(true)}>
            <Text style={s.cityPillIcon}>📍</Text>
            <Text style={s.cityPillText} numberOfLines={1}>{locationLabel}</Text>
            <Text style={s.cityPillArrow}>▲</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput style={s.searchBox} placeholder="Search venues, city..."
          value={search} onChangeText={setSearch} placeholderTextColor={COLORS.textMuted} />
      </SafeAreaView>

      {/* Sport filter */}
      <View style={s.sportRow}>
        <FlatList horizontal data={SPORTS} keyExtractor={i=>i} showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity style={[s.chip, sport===item&&s.chipActive]} onPress={()=>setSport(item)}>
              <Text style={[s.chipText, sport===item&&s.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{gap:8,paddingHorizontal:16,paddingVertical:10}} />
      </View>

      {/* Results bar */}
      <View style={s.resultsRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.resultsCount}>{filtered.length} venues</Text>
          {(selectedState || city !== 'All Cities') && (
            <TouchableOpacity onPress={clearLocation} style={s.clearBtn}>
              <Text style={s.clearBtnText}>✕ {city !== 'All Cities' ? city : selectedState}</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList horizontal data={['Top Rated','Price: Low to High','Price: High to Low']}
          keyExtractor={i=>i} showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity style={[s.sortChip, sort===item&&s.sortChipActive]} onPress={()=>setSort(item)}>
              <Text style={[s.sortChipText, sort===item&&s.sortChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )} contentContainerStyle={{gap:6}} />
      </View>

      {/* Venue list */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{marginTop:40}} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t=>String(t.id||t._id)}
          contentContainerStyle={{padding:16,gap:16,paddingBottom:100}}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadTurfs();}} tintColor={COLORS.primary}/>}
          renderItem={({item})=><TurfCard turf={item} onPress={()=>navigation.navigate('TurfDetail',{turf:item})}/>}
          ListEmptyComponent={
            <View style={{alignItems:'center',marginTop:60}}>
              <Text style={{fontSize:40,marginBottom:12}}>🏟️</Text>
              <Text style={{color:COLORS.textMuted,fontWeight:'600',fontSize:15}}>No venues found</Text>
              {(selectedState||city!=='All Cities') && (
                <TouchableOpacity style={s.showAllBtn} onPress={clearLocation}>
                  <Text style={s.showAllBtnText}>Show All India</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

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

const s = StyleSheet.create({
  root:       { flex:1, backgroundColor:COLORS.bgLight },
  header:     { backgroundColor:COLORS.primary, paddingHorizontal:16, paddingBottom:16 },
  headerTop:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  headerTitle:{ fontSize:22, fontWeight:'900', color:COLORS.white },
  cityPill:   { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:999, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'rgba(255,255,255,0.25)' },
  cityPillIcon:  { fontSize:13 },
  cityPillText:  { color:COLORS.white, fontWeight:'700', fontSize:13, maxWidth:90 },
  cityPillArrow: { color:COLORS.accent, fontSize:10, fontWeight:'700' },
  searchBox:  { backgroundColor:COLORS.white, borderRadius:12, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:COLORS.dark },
  sportRow:   { backgroundColor:COLORS.white, borderBottomWidth:1, borderBottomColor:COLORS.border },
  chip:       { backgroundColor:'#F0F0F0', borderRadius:50, paddingHorizontal:16, paddingVertical:8, borderWidth:1.5, borderColor:'#E5E5E5' },
  chipActive: { backgroundColor:COLORS.dark, borderColor:COLORS.dark },
  chipText:   { fontSize:13, fontWeight:'600', color:COLORS.dark },
  chipTextActive: { color:COLORS.white },
  resultsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingLeft:16, paddingRight:8, paddingVertical:8 },
  resultsCount: { color:COLORS.textMuted, fontWeight:'600', fontSize:12 },
  clearBtn:   { backgroundColor:COLORS.accentLight, borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
  clearBtnText: { color:COLORS.primary, fontSize:11, fontWeight:'800' },
  sortChip:   { backgroundColor:COLORS.white, borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1.5, borderColor:COLORS.border },
  sortChipActive:   { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  sortChipText:     { fontSize:11, fontWeight:'700', color:COLORS.textMuted },
  sortChipTextActive: { color:COLORS.white },
  showAllBtn:     { marginTop:14, backgroundColor:COLORS.primary, borderRadius:12, paddingHorizontal:20, paddingVertical:10 },
  showAllBtnText: { color:COLORS.white, fontWeight:'700', fontSize:13 },
});
