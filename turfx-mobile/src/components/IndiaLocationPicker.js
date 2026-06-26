/**
 * IndiaLocationPicker — matches the web screenshot exactly:
 * - "📍 India ▲" pill opens a slide-up sheet
 * - First screen: "< SELECT STATE · INDIA" with 2-col state grid + search + scrollbar
 * - After selecting state: "< SELECT DISTRICT · STATE" with district grid
 * - Breadcrumb: India › Karnataka
 * - Back arrow goes back to state picker
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, FlatList, TextInput,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { INDIA_DATA, INDIA_STATES } from '../data/indiaData';

export default function IndiaLocationPicker({
  visible, onClose, selectedState, selectedCity, onSelect,
}) {
  const [view, setView]     = useState('state');   // 'state' | 'district'
  const [stateQ, setStateQ] = useState('');
  const [distQ, setDistQ]   = useState('');
  const [localState, setLocalState] = useState(selectedState || '');

  const reset = () => { setView('state'); setStateQ(''); setDistQ(''); setLocalState(selectedState || ''); };

  const filteredStates = INDIA_STATES.filter(s =>
    s.toLowerCase().includes(stateQ.toLowerCase())
  );

  const districts = localState ? (INDIA_DATA[localState] || []) : [];
  const filteredDistricts = ['All Districts', ...districts].filter(d =>
    d.toLowerCase().includes(distQ.toLowerCase())
  );

  const handleStatePress = (state) => {
    setLocalState(state);
    setDistQ('');
    setView('district');
    // When state is selected, reset city filter but keep state
    onSelect({ state, city: 'All Cities' });
  };

  const handleDistrictPress = (district) => {
    const city = district === 'All Districts' ? 'All Cities' : district;
    onSelect({ state: localState, city });
    onClose();
  };

  const handleBack = () => {
    if (view === 'district') {
      setView('state');
      setDistQ('');
    } else {
      onClose();
    }
  };

  const isStateView = view === 'state';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleBack}
      onShow={reset}
    >
      <View style={s.backdrop}>
        <View style={s.sheet}>
          {/* Drag handle */}
          <View style={s.handle} />

          {/* Header — matches screenshot: "< SELECT STATE · INDIA" */}
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}>
              <View style={s.backCircle}>
                <Text style={s.backArrow}>‹</Text>
              </View>
              <Text style={s.headerLabel}>
                {isStateView
                  ? 'SELECT STATE · INDIA'
                  : `SELECT DISTRICT · ${localState.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Breadcrumb (district view only) */}
          {!isStateView && (
            <View style={s.breadcrumb}>
              <TouchableOpacity onPress={() => { setView('state'); setDistQ(''); }}>
                <Text style={s.breadcrumbLink}>India</Text>
              </TouchableOpacity>
              <Text style={s.breadcrumbSep}> › </Text>
              <Text style={s.breadcrumbCurrent}>{localState}</Text>
            </View>
          )}

          {/* Search */}
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder={isStateView ? 'Search state...' : 'Search district...'}
              placeholderTextColor={COLORS.textMuted}
              value={isStateView ? stateQ : distQ}
              onChangeText={isStateView ? setStateQ : setDistQ}
            />
            {(isStateView ? stateQ : distQ) ? (
              <TouchableOpacity onPress={() => isStateView ? setStateQ('') : setDistQ('')}>
                <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* State grid */}
          {isStateView && (
            <FlatList
              data={filteredStates}
              keyExtractor={i => i}
              numColumns={2}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle="black"
              renderItem={({ item }) => {
                const active = item === localState;
                return (
                  <TouchableOpacity
                    style={[s.item, active && s.itemActive]}
                    onPress={() => handleStatePress(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.itemText, active && s.itemTextActive]} numberOfLines={2}>
                      {item}
                    </Text>
                    {active && <View style={s.itemDot} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* District grid */}
          {!isStateView && (
            <FlatList
              data={filteredDistricts}
              keyExtractor={i => i}
              numColumns={2}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle="black"
              renderItem={({ item }) => {
                const effectiveCity = item === 'All Districts' ? 'All Cities' : item;
                const active = effectiveCity === selectedCity && localState === selectedState;
                const isAllDistricts = item === 'All Districts';
                return (
                  <TouchableOpacity
                    style={[s.item, active && s.itemActive, isAllDistricts && s.itemAllDist]}
                    onPress={() => handleDistrictPress(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.itemText, active && s.itemTextActive, isAllDistricts && s.itemAllDistText]} numberOfLines={2}>
                      {item}
                    </Text>
                    {active && <View style={s.itemDot} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '88%',
    paddingBottom: 20,
  },
  handle: {
    width: 44, height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 2,
  },

  // Header — "< SELECT STATE · INDIA"
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backCircle: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '700',
    lineHeight: 22,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breadcrumbLink:    { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  breadcrumbSep:     { fontSize: 13, color: '#9CA3AF' },
  breadcrumbCurrent: { fontSize: 13, color: '#111827', fontWeight: '800' },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchIcon:  { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 10, fontWeight: '500' },

  // Grid items
  listContent: { paddingHorizontal: 12, paddingBottom: 40 },
  item: {
    flex: 1,
    margin: 5,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 0,              // flat, no border — matches screenshot
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
    position: 'relative',
    minHeight: 56,
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: COLORS.primary,
  },
  itemAllDist: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 4,
  },
  itemText:         { fontSize: 15, fontWeight: '500', color: '#111827', lineHeight: 22 },
  itemTextActive:   { color: COLORS.primary, fontWeight: '700' },
  itemAllDistText:  { color: COLORS.primary, fontWeight: '700', fontStyle: 'italic' },
  itemDot: {
    position: 'absolute',
    top: 8, right: 10,
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
