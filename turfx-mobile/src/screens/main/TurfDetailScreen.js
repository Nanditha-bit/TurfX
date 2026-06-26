import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function TurfDetailScreen({ route, navigation }) {
  const { turf: initialTurf } = route.params;
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [turf, setTurf]       = useState(initialTurf);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  const SPORT_IMAGES = {
    Football:'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80',
    Cricket:'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=600&q=80',
    Badminton:'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80',
    Tennis:'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
  };

  useEffect(() => {
    const id = initialTurf.id || initialTurf._id;
    if (!id) return;
    axios.get(`${API}/turfs/${id}`).then(r => setTurf(r.data)).catch(()=>{});
    axios.get(`${API}/reviews/${id}`).then(r => {
      setReviews(Array.isArray(r.data) ? r.data : (r.data.reviews || []));
    }).catch(()=>{});
  }, []);

  const handleReview = async () => {
    if (!token) { navigation.navigate('Login'); return; }
    if (!comment.trim()) { Alert.alert('Error','Please write a comment'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/reviews`, { turf_id: turf.id || turf._id, rating, comment }, { headers:{Authorization:`Bearer ${token}`} });
      setComment(''); setRating(5);
      const r = await axios.get(`${API}/reviews/${turf.id || turf._id}`);
      setReviews(Array.isArray(r.data) ? r.data : (r.data.reviews || []));
      Alert.alert('Success','Review submitted!');
    } catch(e) { Alert.alert('Error', e.response?.data?.msg || 'Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  const images = turf.images?.length > 0 ? turf.images : [SPORT_IMAGES[turf.sport] || SPORT_IMAGES.Football];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View style={s.imageContainer}>
          <Image source={{uri: images[selectedImg]}} style={s.mainImage} resizeMode="cover" />
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Text style={{color:COLORS.white,fontWeight:'800',fontSize:16}}>←</Text>
          </TouchableOpacity>
          <View style={s.sportBadge}><Text style={s.sportBadgeText}>{turf.sport}</Text></View>
        </View>
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingHorizontal:16,marginTop:8}}>
            {images.map((img,i) => (
              <TouchableOpacity key={i} onPress={()=>setSelectedImg(i)} style={{marginRight:8,borderRadius:8,borderWidth:2,borderColor:selectedImg===i?COLORS.accent:'transparent',overflow:'hidden'}}>
                <Image source={{uri:img}} style={{width:64,height:44}} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={s.content}>
          {/* Title */}
          <Text style={s.name}>{turf.name}</Text>
          <Text style={s.location}>📍 {turf.location}, {turf.city}</Text>

          {/* Price + Rating */}
          <View style={s.priceRow}>
            <View>
              <Text style={s.price}>₹{turf.price_per_hour}<Text style={s.perHr}> / hr</Text></Text>
              <Text style={s.rating}>⭐ {turf.rating || 4.5} Rating</Text>
            </View>
            <View style={s.ratingBadge}><Text style={{color:COLORS.primary,fontWeight:'900',fontSize:18}}>{turf.rating || 4.5}</Text><Text style={{color:COLORS.primary,fontWeight:'700',fontSize:11}}> RATING</Text></View>
          </View>

          {/* Amenities */}
          {turf.amenities?.length > 0 && (
            <View style={s.amenitiesSection}>
              <Text style={s.sectionTitle}>Amenities</Text>
              <View style={s.amenitiesGrid}>
                {turf.amenities.map((a,i) => (
                  <View key={i} style={s.amenityTag}><Text style={s.amenityText}>{a}</Text></View>
                ))}
              </View>
            </View>
          )}

          {/* Policies */}
          <View style={s.policiesBox}>
            <Text style={s.sectionTitle}>Policies</Text>
            <Text style={s.policyText}>• Cancellations allowed up to 2 hours before the slot.</Text>
            <Text style={s.policyText}>• Please wear appropriate sports gear.</Text>
            <Text style={s.policyText}>• Arrive 10 minutes early for check-in.</Text>
          </View>

          {/* Reviews */}
          <Text style={s.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.map(r => (
            <View key={r._id} style={s.reviewCard}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <Text style={{fontWeight:'700',fontSize:14,color:COLORS.dark}}>{r.user_id?.name || 'Player'}</Text>
                <Text style={{color:'#f59e0b',fontWeight:'800'}}>{'⭐'.repeat(r.rating)}</Text>
              </View>
              <Text style={{color:COLORS.textMuted,fontSize:13,fontWeight:'500'}}>{r.comment}</Text>
            </View>
          ))}

          {/* Write review */}
          {user && (
            <View style={s.reviewForm}>
              <Text style={s.sectionTitle}>Write a Review</Text>
              <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
                {[1,2,3,4,5].map(n => (
                  <TouchableOpacity key={n} onPress={()=>setRating(n)}>
                    <Text style={{fontSize:24,opacity:n<=rating?1:0.3}}>⭐</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={s.reviewInput}
                placeholder="Share your experience..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity style={s.submitBtn} onPress={handleReview} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.primary} /> : <Text style={s.submitBtnText}>Submit Review</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Book Button */}
      <View style={[s.stickyBook, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={{color:COLORS.textMuted,fontSize:12,fontWeight:'600'}}>Starting from</Text>
          <Text style={{fontSize:20,fontWeight:'900',color:COLORS.dark}}>₹{turf.price_per_hour}<Text style={{fontSize:13,fontWeight:'400'}}>/hr</Text></Text>
        </View>
        <TouchableOpacity style={s.bookBtn} onPress={()=>navigation.navigate('Checkout',{turf})}>
          <Text style={s.bookBtnText}>Reserve Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:COLORS.bgLight},
  imageContainer:{position:'relative'},
  mainImage:{width:'100%',height:260},
  backBtn:{position:'absolute',top:48,left:16,width:36,height:36,borderRadius:18,backgroundColor:'rgba(0,0,0,0.5)',alignItems:'center',justifyContent:'center'},
  sportBadge:{position:'absolute',bottom:12,right:12,backgroundColor:'rgba(0,0,0,0.55)',borderRadius:6,paddingHorizontal:10,paddingVertical:4},
  sportBadgeText:{color:COLORS.white,fontSize:10,fontWeight:'800',textTransform:'uppercase'},
  content:{padding:20,paddingBottom:100},
  name:{fontSize:26,fontWeight:'900',color:COLORS.dark,marginBottom:4},
  location:{fontSize:14,color:COLORS.textMuted,marginBottom:16,fontWeight:'500'},
  priceRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20,padding:16,backgroundColor:COLORS.white,borderRadius:16,borderWidth:1.5,borderColor:COLORS.border},
  price:{fontSize:28,fontWeight:'900',color:COLORS.dark},
  perHr:{fontSize:14,color:COLORS.textMuted,fontWeight:'400'},
  rating:{fontSize:13,color:COLORS.textMuted,marginTop:2},
  ratingBadge:{backgroundColor:COLORS.accentLight,flexDirection:'row',alignItems:'center',paddingHorizontal:12,paddingVertical:8,borderRadius:12},
  amenitiesSection:{marginBottom:20},
  amenitiesGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8},
  amenityTag:{backgroundColor:COLORS.bgLight,borderWidth:1.5,borderColor:COLORS.border,borderRadius:10,paddingHorizontal:12,paddingVertical:6},
  amenityText:{color:COLORS.dark,fontSize:13,fontWeight:'700'},
  sectionTitle:{fontSize:18,fontWeight:'900',color:COLORS.dark,marginBottom:12,marginTop:8},
  policiesBox:{backgroundColor:COLORS.white,borderRadius:16,padding:16,borderWidth:1.5,borderColor:COLORS.border,marginBottom:20},
  policyText:{color:COLORS.textMuted,fontSize:13,fontWeight:'500',marginBottom:4},
  reviewCard:{backgroundColor:COLORS.white,borderRadius:14,padding:14,borderWidth:1.5,borderColor:COLORS.border,marginBottom:12},
  reviewForm:{backgroundColor:COLORS.white,borderRadius:16,padding:16,borderWidth:1.5,borderColor:COLORS.border,marginTop:8},
  reviewInput:{borderWidth:1.5,borderColor:COLORS.border,borderRadius:12,padding:12,fontSize:14,color:COLORS.dark,height:100,textAlignVertical:'top',marginBottom:12},
  submitBtn:{backgroundColor:COLORS.primary,borderRadius:12,padding:14,alignItems:'center'},
  submitBtnText:{color:COLORS.accent,fontWeight:'800',fontSize:15},
  stickyBook:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:COLORS.white,borderTopWidth:1,borderTopColor:COLORS.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,paddingBottom:28},
  bookBtn:{backgroundColor:COLORS.accent,borderRadius:14,paddingHorizontal:28,paddingVertical:14},
  bookBtnText:{color:COLORS.primary,fontWeight:'900',fontSize:16},
});
