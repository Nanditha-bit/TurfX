import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

// Slots: 6 AM – 10 PM  (short label matching screenshot: "6-7 AM", "11 AM-12 PM", "1-2 PM" etc.)
const SLOTS = Array.from({ length: 16 }, (_, i) => {
  const startH = i + 6;   // 6..21
  const endH   = startH + 1;

  const fmt = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12    = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12} ${period}`;
  };

  // Full label used for API (matches web)
  const startFull = fmt(startH);
  const endFull   = fmt(endH);
  const apiLabel  = `${startFull.replace(' ', ':00 ')} to ${endFull.replace(' ', ':00 ')}`;

  // Short display label matching screenshot
  const s12 = startH > 12 ? startH - 12 : startH;
  const e12 = endH   > 12 ? endH   - 12 : endH === 12 ? 12 : endH;
  const sp  = startH >= 12 ? 'PM' : 'AM';
  const ep  = endH   >= 12 ? 'PM' : 'AM';

  let display;
  if (sp === ep) {
    display = `${s12}-${e12} ${ep}`;          // "6-7 AM"
  } else {
    display = `${s12} ${sp}-${e12} ${ep}`;    // "11 AM-12 PM"
  }

  return { display, apiLabel, hour: startH };
});

// Generate next 8 days starting from TODAY (no past dates)
function getDateStrip() {
  const days = [];
  for (let i = 0; i < 8; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      key: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      num: d.getDate(),
    });
  }
  return days;
}

export default function CheckoutScreen({ route, navigation }) {
  const { turf } = route.params;
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const DATE_STRIP = getDateStrip();
  const [date, setDate]                 = useState(DATE_STRIP[0].key);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookedSlots, setBookedSlots]     = useState([]);
  const [loading, setLoading]             = useState(false);

  const MIN_SLOT_PRICE = 500;
  const PLATFORM_FEE   = 25;
  const GST            = Math.ceil(PLATFORM_FEE * 0.18); // ₹5
  const CONVENIENCE    = PLATFORM_FEE + GST;              // ₹30

  const slotPrice  = Math.max(turf.price_per_hour || 0, MIN_SLOT_PRICE);
  const courtTotal = selectedSlots.length * slotPrice;
  const total      = courtTotal + (selectedSlots.length > 0 ? CONVENIENCE : 0);

  // Fetch booked slots whenever date changes
  useEffect(() => {
    const id = turf.id || turf._id;
    if (!id || !date) return;
    axios.get(`${API}/bookings/booked-slots/${id}/${date}`)
      .then(r => setBookedSlots(r.data.bookedSlots || []))
      .catch(() => setBookedSlots([]));
  }, [date, turf]);

  const toggle = (apiLabel) => {
    setSelectedSlots(prev =>
      prev.includes(apiLabel)
        ? prev.filter(s => s !== apiLabel)
        : [...prev, apiLabel]
    );
  };

  const isToday = (key) => key === DATE_STRIP[0].key;
  const nowHour = new Date().getHours();

  const isPast = (slot) =>
    isToday(date) && slot.hour <= nowHour;

  const isBooked = (slot) =>
    bookedSlots.includes(slot.apiLabel) ||
    bookedSlots.includes(slot.display);

  const handlePay = async () => {
    if (!token) { navigation.navigate('Login'); return; }
    if (selectedSlots.length === 0) {
      Alert.alert('Select Slots', 'Please select at least one time slot.'); return;
    }
    setLoading(true);
    try {
      const orderRes = await axios.post(
        `${API}/bookings/razorpay-order`,
        { amount: total },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (orderRes.data.demo) {
        await axios.post(
          `${API}/bookings/direct`,
          {
            turf_id:    turf.id || turf._id,
            date,
            time_slots: selectedSlots,
            total_price: total,
            payment_id:  `demo_${Date.now()}`,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        navigation.navigate('BookingConfirmed', {
          booking: { turf, date, slots: selectedSlots, totalAmount: total },
        });
      } else {
        Alert.alert('Payment', 'Configure react-native-razorpay for live payments.');
      }
    } catch (e) {
      Alert.alert('Booking Failed', e.response?.data?.msg || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.turfName} numberOfLines={2}>{turf.name}</Text>
        <Text style={s.turfLoc}>{turf.location}{turf.city ? `, ${turf.city}` : ''}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Date strip ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Select Date</Text>
          <View style={s.dateRow}>
            {DATE_STRIP.map(d => {
              const active = d.key === date;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[s.dateChip, active && s.dateChipActive]}
                  onPress={() => { setDate(d.key); setSelectedSlots([]); }}
                >
                  <Text style={[s.dateDay, active && s.dateDayActive]}>{d.day}</Text>
                  <Text style={[s.dateNum, active && s.dateNumActive]}>{d.num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Time slots ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Select Time Slots</Text>
          <View style={s.slotsGrid}>
            {SLOTS.map(slot => {
              const booked   = isBooked(slot);
              const past     = isPast(slot);
              const selected = selectedSlots.includes(slot.apiLabel);
              const disabled = booked || past;

              return (
                <TouchableOpacity
                  key={slot.apiLabel}
                  disabled={disabled}
                  onPress={() => toggle(slot.apiLabel)}
                  style={[
                    s.slot,
                    selected  && s.slotSelected,
                    disabled  && s.slotDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    s.slotText,
                    selected && s.slotTextSelected,
                    disabled && s.slotTextDisabled,
                  ]}>
                    {slot.display}
                  </Text>
                  {booked && <Text style={s.slotSubText}>Booked</Text>}
                  {past && !booked && <Text style={s.slotSubText}>Past</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Price breakdown ── */}
        {selectedSlots.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Price Breakdown</Text>
            <PriceRow label={`Turf Fee (${selectedSlots.length} slot${selectedSlots.length > 1 ? 's' : ''})`} value={`₹${courtTotal.toLocaleString()}`} />
            <PriceRow label="Platform Fee" value={`₹${PLATFORM_FEE}`} />
            <PriceRow label="GST (18%)" value={`₹${GST}`} />
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>₹{total.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Pay button ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.payBtn, selectedSlots.length === 0 && s.payBtnDisabled]}
          onPress={handlePay}
          disabled={loading || selectedSlots.length === 0}
        >
          {loading
            ? <ActivityIndicator color={COLORS.primary} />
            : <Text style={s.payBtnText}>
                {selectedSlots.length === 0 ? 'Select Slots' : `Pay ₹${total.toLocaleString()}`}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PriceRow({ label, value }) {
  return (
    <View style={s.priceRow}>
      <Text style={s.priceLabel}>{label}</Text>
      <Text style={s.priceValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bgLight },

  // Header
  header:  { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 20 },
  back:    { color: COLORS.accent, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  turfName:{ fontSize: 22, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
  turfLoc: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  // Cards
  content: { padding: 16, paddingBottom: 110, gap: 14 },
  card:    { backgroundColor: COLORS.white, borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 16 },

  // Date strip
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white, minWidth: 56,
  },
  dateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateDay: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  dateDayActive: { color: COLORS.accent },
  dateNum: { fontSize: 18, fontWeight: '900', color: COLORS.dark, marginTop: 2 },
  dateNumActive: { color: COLORS.accent },

  // Slots grid — 3 columns like screenshot
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    width: '30%', flexGrow: 1,
    paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white, alignItems: 'center',
  },
  slotSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotDisabled: { backgroundColor: '#F5F5F5', borderColor: '#EEEEEE' },
  slotText:     { fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  slotTextSelected: { color: COLORS.accent, fontWeight: '800' },
  slotTextDisabled: { color: '#BBBBBB' },
  slotSubText: { fontSize: 9, color: '#BBBBBB', fontWeight: '600', marginTop: 2 },

  // Price
  priceRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  priceLabel:{ color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
  priceValue:{ fontWeight: '800', color: COLORS.dark, fontSize: 14 },
  totalRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  totalLabel:{ fontWeight: '900', fontSize: 16, color: COLORS.dark },
  totalValue:{ fontWeight: '900', fontSize: 20, color: COLORS.primary },

  // Footer
  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopWidth: 1.5, borderTopColor: COLORS.border, padding: 16 },
  payBtn:    { backgroundColor: COLORS.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText:{ color: COLORS.primary, fontWeight: '900', fontSize: 16 },
});
