import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const SPORT_IMAGES = {
  Football:  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80&fit=crop',
  Cricket:   'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&q=80&fit=crop',
  Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&q=80&fit=crop',
  Tennis:    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=80&fit=crop',
  Basketball:'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80&fit=crop',
};

export default function TurfCard({ turf, onPress }) {
  const imageUri = (turf.images && turf.images.length > 0)
    ? turf.images[0]
    : SPORT_IMAGES[turf.sport] || SPORT_IMAGES.Football;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

      {/* Sport badge */}
      <View style={styles.sportBadge}>
        <Text style={styles.sportBadgeText}>{turf.sport || 'Sport'}</Text>
      </View>

      {/* Premium badge */}
      {turf.rating >= 4.5 && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>⚡ PREMIUM</Text>
        </View>
      )}

      {/* Available dot */}
      <View style={styles.available}>
        <View style={styles.dot} />
        <Text style={styles.availableText}>Available</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{turf.name}</Text>
        <Text style={styles.location} numberOfLines={1}>📍 {turf.location}, {turf.city}</Text>

        {/* Amenities */}
        {turf.amenities && turf.amenities.length > 0 && (
          <View style={styles.amenities}>
            {turf.amenities.slice(0, 3).map((a, i) => (
              <View key={i} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Price + Rating + Book */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{turf.price_per_hour}<Text style={styles.perHr}> /hr</Text></Text>
            <Text style={styles.rating}>⭐ {turf.rating || 0}</Text>
          </View>
          <TouchableOpacity style={styles.bookBtn} onPress={onPress}>
            <Text style={styles.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:          { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  image:         { width: '100%', height: 180 },
  sportBadge:    { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  sportBadgeText:{ color: COLORS.white, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  premiumBadge:  { position: 'absolute', top: 12, left: 12, backgroundColor: COLORS.accent, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  premiumText:   { color: COLORS.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  available:     { position: 'absolute', bottom: 12 + 165, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  availableText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  info:          { padding: 14 },
  name:          { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  location:      { fontSize: 13, color: COLORS.textMuted, marginBottom: 10, fontWeight: '500' },
  amenities:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  amenityTag:    { backgroundColor: COLORS.accentLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  amenityText:   { color: COLORS.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  footer:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  price:         { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  perHr:         { fontSize: 13, color: COLORS.textMuted, fontWeight: '400' },
  rating:        { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  bookBtn:       { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  bookBtnText:   { color: COLORS.white, fontSize: 14, fontWeight: '700' },
});
