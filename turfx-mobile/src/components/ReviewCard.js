import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function ReviewCard({ review }) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(review.user_id?.name||'A').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{review.user_id?.name || 'Anonymous'}</Text>
          <Text style={s.date}>
            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN') : ''}
          </Text>
        </View>
        <Text style={s.stars}>{'⭐'.repeat(review.rating || 5)}</Text>
      </View>
      {review.comment ? <Text style={s.comment}>"{review.comment}"</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card:    { backgroundColor: COLORS.bgLight, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 10 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  name:    { fontWeight: '700', fontSize: 14, color: COLORS.dark },
  date:    { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  stars:   { fontSize: 13 },
  comment: { fontSize: 13, color: '#475569', fontWeight: '500', lineHeight: 20 },
});
