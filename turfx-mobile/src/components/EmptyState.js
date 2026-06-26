import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function EmptyState({ icon = '🏟️', title, subtitle, btnLabel, onBtnPress }) {
  return (
    <View style={s.root}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      {btnLabel && onBtnPress && (
        <TouchableOpacity style={s.btn} onPress={onBtnPress}>
          <Text style={s.btnText}>{btnLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  icon:  { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.dark, marginBottom: 6, textAlign: 'center' },
  sub:   { fontSize: 14, color: COLORS.textMuted, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  btn:   { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText:{ color: COLORS.accent, fontWeight: '800', fontSize: 14 },
});
