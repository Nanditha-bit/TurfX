import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function BookingConfirmedScreen({ route, navigation }) {
  const { booking } = route.params || {};
  const { turf, date, slots, totalAmount } = booking || {};

  return (
    <ScrollView contentContainerStyle={s.root}>
      <View style={s.successIcon}><Text style={{fontSize:40}}>✓</Text></View>
      <Text style={s.title}>Booking Confirmed!</Text>
      <Text style={s.sub}>Your venue has been successfully reserved.</Text>

      {turf && (
        <View style={s.card}>
          <Row label="Venue"    value={turf.name} />
          <Row label="Location" value={`${turf.location}, ${turf.city}`} />
          <Row label="Date"     value={date} />
          <Row label="Slots"    value={(slots||[]).join(', ')} />
          <View style={[s.totalRow]}>
            <Text style={s.totalLabel}>Total Paid</Text>
            <Text style={s.totalVal}>₹{(totalAmount||0).toLocaleString()}</Text>
          </View>
        </View>
      )}

      <View style={s.notice}>
        <Text style={{fontSize:13,color:'#1e40af',fontWeight:'500'}}>📧 A confirmation has been sent to your registered email.</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={()=>navigation.navigate('MyBookings')}>
        <Text style={s.btnText}>View My Bookings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.outlineBtn} onPress={()=>navigation.navigate('Home')}>
        <Text style={s.outlineBtnText}>Go Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({label,value}) {
  return (
    <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:10}}>
      <Text style={{color:COLORS.textMuted,fontWeight:'600',fontSize:13}}>{label}</Text>
      <Text style={{color:COLORS.dark,fontWeight:'700',fontSize:13,flex:1,textAlign:'right'}}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flexGrow:1,backgroundColor:COLORS.bgLight,alignItems:'center',padding:24,paddingTop:80},
  successIcon:{width:96,height:96,borderRadius:48,backgroundColor:COLORS.accentLight,borderWidth:2,borderColor:COLORS.accent,alignItems:'center',justifyContent:'center',marginBottom:20},
  title:{fontSize:28,fontWeight:'900',color:COLORS.dark,marginBottom:8},
  sub:{color:COLORS.textMuted,fontSize:14,fontWeight:'500',marginBottom:24,textAlign:'center'},
  card:{backgroundColor:COLORS.white,borderRadius:16,padding:18,borderWidth:1.5,borderColor:COLORS.border,width:'100%',marginBottom:16},
  totalRow:{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1.5,borderTopColor:COLORS.border,paddingTop:12,marginTop:4},
  totalLabel:{fontWeight:'700',fontSize:14,color:COLORS.textMuted},
  totalVal:{fontWeight:'900',fontSize:20,color:COLORS.primary},
  notice:{backgroundColor:'#eff6ff',borderWidth:1,borderColor:'#bfdbfe',borderRadius:12,padding:14,marginBottom:20,width:'100%'},
  btn:{backgroundColor:COLORS.primary,borderRadius:14,padding:16,alignItems:'center',width:'100%',marginBottom:12},
  btnText:{color:COLORS.accent,fontWeight:'800',fontSize:15},
  outlineBtn:{borderWidth:2,borderColor:COLORS.primary,borderRadius:14,padding:16,alignItems:'center',width:'100%'},
  outlineBtnText:{color:COLORS.primary,fontWeight:'800',fontSize:15},
});
