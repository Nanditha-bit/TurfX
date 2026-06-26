import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Switch, Modal, FlatList,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { INDIA_DATA, INDIA_STATES } from '../../data/indiaData';

const SPORTS = ['Football', 'Cricket', 'Tennis', 'Badminton', 'Basketball', 'Volleyball'];
const STEPS  = ['Basic Details', 'Venue Info', 'Slots & Pricing', 'Amenities', 'Photos', 'Review & Submit'];
const AMENITIES = ['Floodlights','Changing Rooms','Parking','Drinking Water',
                   'Washrooms','First Aid','Cafeteria','Wi-Fi','Seating Area','AC Pavilion'];

// ── Location Picker Modal ──────────────────────────────────────────────────────
function LocationPicker({ visible, onClose, onSelect, title, items, selected }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.backdrop}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.pickerHeader}>
            <TouchableOpacity onPress={onClose} style={m.backCircle}>
              <Text style={{ fontSize: 16, color: COLORS.dark }}>‹</Text>
            </TouchableOpacity>
            <Text style={m.pickerTitle}>{title}</Text>
          </View>
          <TextInput style={m.search} placeholder="Search..." placeholderTextColor={COLORS.textMuted}
            value={search} onChangeText={setSearch} />
          <FlatList
            data={filtered}
            keyExtractor={i => i}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[m.item, selected === item && m.itemActive]}
                onPress={() => { onSelect(item); onClose(); setSearch(''); }}
              >
                <Text style={[m.itemText, selected === item && m.itemTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
  handle:   { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  pickerTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
  search:   { margin: 12, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.dark, backgroundColor: COLORS.bgLight },
  item:     { flex: 1, margin: 4, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  itemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  itemText: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  itemTextActive: { color: '#fff', fontWeight: '700' },
});

export default function AddVenueScreen({ navigation }) {
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker]   = useState(false);

  const [form, setForm] = useState({
    name:'', sports:[], type:'Outdoor',
    state:'', city:'', location:'', pincode:'',
    description:'', shortDescription:'',
    price:'', bookingType:'Hourly',
    venueSize:'Medium (8,000 - 12,000 sq.ft)',
    surfaceType:'Artificial Turf',
    amenities:[],
    outsideFood:false, petsAllowed:false, changingRooms:false,
    images:[], videos:[],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - form.images.length,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => ({
        url: `data:${asset.mimeType};base64,${asset.base64}`,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: 'image',
      }));
      set('images', [...form.images, ...newImages]);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      selectionLimit: 3 - form.videos.length,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const newVideos = result.assets.map(asset => ({
        url: `data:${asset.mimeType};base64,${asset.base64}`,
        name: asset.fileName || `video_${Date.now()}.mp4`,
        type: 'video',
      }));
      set('videos', [...form.videos, ...newVideos]);
    }
  };

  const removeFile = (index, type) => {
    if (type === 'image') {
      set('images', form.images.filter((_, i) => i !== index));
    } else {
      set('videos', form.videos.filter((_, i) => i !== index));
    }
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name || !form.state || !form.city || !form.location || form.sports.length === 0) {
        Alert.alert('Missing Fields', 'Please fill Venue Name, State, City, Location and select at least one Sport.'); return false;
      }
    }
    if (step === 2) {
      const price = parseFloat(form.price);
      if (!form.price || isNaN(price) || price < 500) {
        Alert.alert('Invalid Price', 'Minimum base price is ₹500/hr.'); return false;
      }
    }
    if (step === 4) {
      if (form.images.length === 0) {
        Alert.alert('Missing Photos', 'Please upload at least one photo of your venue.'); return false;
      }
    }
    return true;
  };

  const handleNext   = () => { if (validateStep()) setStep(s => s + 1); };
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const sport  = form.sports[0] || 'Football';
      const images = form.images.map(img => img.url);
      const videos = form.videos.map(vid => vid.url);
      
      await axios.post(`${API}/turfs`, {
        name:form.name, location:form.location, city:form.city, state:form.state,
        pincode:form.pincode, price_per_hour:parseFloat(form.price),
        sport, sports:form.sports, type:form.type,
        venueSize:form.venueSize, surfaceType:form.surfaceType,
        bookingType:form.bookingType, description:form.description,
        shortDescription:form.shortDescription, amenities:form.amenities, images, videos,
      }, { headers:{ Authorization:`Bearer ${token}` } });
      Alert.alert('✅ Venue Added', `"${form.name}" submitted successfully!`, [
        { text:'Go to Venues', onPress:()=>navigation.replace('PartnerApp') },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.msg || 'Failed to submit venue.');
    } finally { setSubmitting(false); }
  };

  const platformFee = form.price ? Math.round(parseFloat(form.price||0)*0.05) : 0;
  const youReceive  = form.price ? Math.round(parseFloat(form.price||0)*0.95) : 0;
  const cities      = form.state ? (INDIA_DATA[form.state] || []) : [];

  return (
    <KeyboardAvoidingView 
      style={s.root} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
    >
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : setStep(p=>p-1)}>
            <Text style={s.backBtn}>{step===0?'✕ Cancel':'← Back'}</Text>
          </TouchableOpacity>
          <Text style={s.title}>Add Venue</Text>
          <Text style={s.stepCount}>{step+1}/{STEPS.length}</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill,{width:`${((step+1)/STEPS.length)*100}%`}]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stepLabels}>
          {STEPS.map((label,i) => (
            <View key={i} style={s.stepItem}>
              <View style={[s.stepDot, i<=step && s.stepDotActive]}>
                <Text style={[s.stepDotText, i<=step && s.stepDotTextActive]}>{i<step?'✓':i+1}</Text>
              </View>
              <Text style={[s.stepLabel, i===step && s.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── STEP 0: Basic Details ── */}
        {step === 0 && (
          <View style={s.formSection}>
            <Text style={s.sectionTitle}>Basic Details</Text>
            <Text style={s.sectionSub}>Core information about your sports venue</Text>

            <Label text="Venue Name *" />
            <TextInput style={s.input} placeholder="e.g. Green Turf Arena" value={form.name}
              onChangeText={v=>set('name',v)} placeholderTextColor={COLORS.textMuted} />

            <Label text="Sports Offered *" />
            <View style={s.chipRow}>
              {SPORTS.map(sp => (
                <TouchableOpacity key={sp} style={[s.chip, form.sports.includes(sp)&&s.chipActive]}
                  onPress={()=>toggleArr('sports',sp)}>
                  <Text style={[s.chipText, form.sports.includes(sp)&&s.chipTextActive]}>{sp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="Venue Type *" />
            <View style={s.chipRow}>
              {['Outdoor','Indoor','Indoor + Outdoor'].map(t=>(
                <TouchableOpacity key={t} style={[s.chip, form.type===t&&s.chipActive]} onPress={()=>set('type',t)}>
                  <Text style={[s.chipText, form.type===t&&s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="State *" />
            <TouchableOpacity style={s.pickerBtn} onPress={()=>setShowStatePicker(true)}>
              <Text style={[s.pickerBtnText, !form.state && s.pickerPlaceholder]}>
                {form.state || 'Select State'}
              </Text>
              <Text style={s.pickerArrow}>▼</Text>
            </TouchableOpacity>

            <Label text="City *" />
            <TouchableOpacity
              style={[s.pickerBtn, !form.state && s.pickerBtnDisabled]}
              onPress={()=>{ if(form.state) setShowCityPicker(true); }}
            >
              <Text style={[s.pickerBtnText, !form.city && s.pickerPlaceholder]}>
                {form.city || (form.state ? 'Select City' : 'Select State first')}
              </Text>
              <Text style={s.pickerArrow}>▼</Text>
            </TouchableOpacity>

            <Label text="Location / Landmark *" />
            <TextInput style={s.input} placeholder="Enter locality or nearby landmark"
              value={form.location} onChangeText={v=>set('location',v)} placeholderTextColor={COLORS.textMuted} />

            <Label text="Pincode" />
            <TextInput style={s.input} placeholder="e.g. 560001" keyboardType="numeric"
              value={form.pincode} onChangeText={v=>set('pincode',v)} placeholderTextColor={COLORS.textMuted} />
          </View>
        )}

        {/* ── STEP 1: Venue Info ── */}
        {step === 1 && (
          <View style={s.formSection}>
            <Text style={s.sectionTitle}>Venue Information</Text>
            <Text style={s.sectionSub}>Technical and descriptive details</Text>

            <Label text="Venue Size" />
            {['Small (Below 8,000 sq.ft)','Medium (8,000 - 12,000 sq.ft)','Large (Above 12,000 sq.ft)'].map(sz=>(
              <TouchableOpacity key={sz} style={[s.radioRow, form.venueSize===sz&&s.radioRowActive]} onPress={()=>set('venueSize',sz)}>
                <View style={[s.radio, form.venueSize===sz&&s.radioActive]}>{form.venueSize===sz&&<View style={s.radioDot}/>}</View>
                <Text style={s.radioText}>{sz}</Text>
              </TouchableOpacity>
            ))}

            <Label text="Surface Type" />
            {['Artificial Turf','Natural Grass','Wooden Court','Synthetic Court','Concrete'].map(sf=>(
              <TouchableOpacity key={sf} style={[s.radioRow, form.surfaceType===sf&&s.radioRowActive]} onPress={()=>set('surfaceType',sf)}>
                <View style={[s.radio, form.surfaceType===sf&&s.radioActive]}>{form.surfaceType===sf&&<View style={s.radioDot}/>}</View>
                <Text style={s.radioText}>{sf}</Text>
              </TouchableOpacity>
            ))}

            <Label text="Short Description (max 150 chars)" />
            <TextInput style={[s.input,s.textarea]} multiline numberOfLines={3} maxLength={150}
              placeholder="Briefly describe your venue..." value={form.shortDescription}
              onChangeText={v=>set('shortDescription',v)} placeholderTextColor={COLORS.textMuted} />
            <Text style={s.charCount}>{form.shortDescription.length}/150</Text>

            <Label text="Detailed Description" />
            <TextInput style={[s.input,s.textareaLg]} multiline numberOfLines={5} maxLength={1000}
              placeholder="Facilities, parking, accessibility..." value={form.description}
              onChangeText={v=>set('description',v)} placeholderTextColor={COLORS.textMuted} />

            <Label text="Policies" />
            {[{key:'outsideFood',label:'Outside Food Allowed'},{key:'petsAllowed',label:'Pets Allowed'},{key:'changingRooms',label:'Changing Rooms Available'}].map(p=>(
              <View key={p.key} style={s.switchRow}>
                <Text style={s.switchLabel}>{p.label}</Text>
                <Switch value={form[p.key]} onValueChange={v=>set(p.key,v)}
                  trackColor={{false:'#E5E7EB',true:COLORS.accent}} thumbColor={form[p.key]?COLORS.primary:'#fff'} />
              </View>
            ))}
          </View>
        )}

        {/* ── STEP 2: Slots & Pricing ── */}
        {step === 2 && (
          <View style={s.formSection}>
            <Text style={s.sectionTitle}>Slots & Pricing</Text>
            <Text style={s.sectionSub}>Set your operational hours and rates</Text>

            <Label text="Base Price per Hour (₹) * — Minimum ₹500" />
            <TextInput style={s.input} keyboardType="numeric" placeholder="e.g. 800"
              value={form.price} onChangeText={v=>set('price',v)} placeholderTextColor={COLORS.textMuted} />

            <Label text="Booking Type" />
            <View style={s.chipRow}>
              {['Hourly','Full Day'].map(bt=>(
                <TouchableOpacity key={bt} style={[s.chip, form.bookingType===bt&&s.chipActive]} onPress={()=>set('bookingType',bt)}>
                  <Text style={[s.chipText, form.bookingType===bt&&s.chipTextActive]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.previewCard}>
              <Text style={s.previewTitle}>Pricing Preview</Text>
              <View style={s.previewRow}>
                <Text style={s.previewLabel}>Hourly Rate</Text>
                <Text style={s.previewValue}>₹{form.price||'0'}</Text>
              </View>
              <View style={s.previewRow}>
                <Text style={s.previewLabel}>Platform Fee (5%)</Text>
                <Text style={[s.previewValue,{color:'#EF4444'}]}>− ₹{platformFee}</Text>
              </View>
              <View style={[s.previewRow,s.previewTotal]}>
                <Text style={s.previewTotalLabel}>You Receive</Text>
                <Text style={s.previewTotalValue}>₹{youReceive}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 3: Amenities ── */}
        {step === 3 && (
          <View style={s.formSection}>
            <Text style={s.sectionTitle}>Amenities</Text>
            <Text style={s.sectionSub}>Select all facilities available at your venue</Text>
            <View style={s.amenitiesGrid}>
              {AMENITIES.map(a => {
                const sel = form.amenities.includes(a);
                return (
                  <TouchableOpacity key={a} style={[s.amenityCard, sel&&s.amenityCardActive]} onPress={()=>toggleArr('amenities',a)}>
                    <Text style={s.amenityIcon}>{aIcon(a)}</Text>
                    <Text style={[s.amenityLabel, sel&&s.amenityLabelActive]}>{a}</Text>
                    {sel&&<Text style={s.amenityCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.selectedCount}>{form.amenities.length} selected</Text>
          </View>
        )}

        {/* ── STEP 4: Photos & Videos ── */}
        {step === 4 && (
          <View style={s.formSection}>
            <Text style={s.sectionTitle}>Photos & Videos</Text>
            <Text style={s.sectionSub}>Upload high quality photos and videos to showcase your venue</Text>

            {/* Photos Section */}
            <View style={{ marginBottom: 24 }}>
              <Text style={s.subSectionTitle}>Photos (Max 5)</Text>
              <View style={s.mediaGrid}>
                <TouchableOpacity style={s.uploadCard} onPress={pickImage} disabled={form.images.length >= 5}>
                  <Text style={s.uploadIcon}>📷</Text>
                  <Text style={s.uploadText}>
                    {form.images.length >= 5 ? 'Max reached' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
                {form.images.map((img, i) => (
                  <View key={i} style={s.mediaItem}>
                    <Image source={{ uri: img.url }} style={s.mediaImage} />
                    <TouchableOpacity style={s.removeBtn} onPress={() => removeFile(i, 'image')}>
                      <Text style={s.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Videos Section */}
            <View>
              <Text style={s.subSectionTitle}>Videos (Optional, Max 3)</Text>
              <View style={s.mediaGrid}>
                <TouchableOpacity style={s.uploadCard} onPress={pickVideo} disabled={form.videos.length >= 3}>
                  <Text style={s.uploadIcon}>🎬</Text>
                  <Text style={s.uploadText}>
                    {form.videos.length >= 3 ? 'Max reached' : 'Add Video'}
                  </Text>
                </TouchableOpacity>
                {form.videos.map((vid, i) => (
                  <View key={i} style={s.mediaItem}>
                    <View style={s.videoPlaceholder}>
                      <Text style={s.videoIcon}>🎥</Text>
                      <Text style={s.videoLabel} numberOfLines={1}>{vid.name}</Text>
                    </View>
                    <TouchableOpacity style={s.removeBtn} onPress={() => removeFile(i, 'video')}>
                      <Text style={s.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 5: Review & Submit ── */}
        {step === 5 && (
          <View style={s.formSection}>
            <Text style={s.sectionTitle}>Review & Submit</Text>
            <Text style={s.sectionSub}>Review your venue details before submitting</Text>
            <RRow label="Venue Name"  value={form.name} />
            <RRow label="Sports"      value={form.sports.join(', ')} />
            <RRow label="Type"        value={form.type} />
            <RRow label="State"       value={form.state} />
            <RRow label="City"        value={form.city} />
            <RRow label="Location"    value={form.location} />
            <RRow label="Price"       value={`₹${form.price}/hr`} />
            <RRow label="Surface"     value={form.surfaceType} />
            <RRow label="Photos"      value={`${form.images.length} uploaded`} />
            <RRow label="Amenities"   value={form.amenities.length>0?form.amenities.join(', '):'None'} />
            <View style={s.submitNote}>
              <Text style={s.submitNoteText}>✅ Your venue will be reviewed and activated within 24 hours.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {step===STEPS.length-1
          ? <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting?<ActivityIndicator color={COLORS.primary}/>:<Text style={s.submitBtnText}>Submit Venue →</Text>}
            </TouchableOpacity>
          : <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
              <Text style={s.nextBtnText}>Save & Continue →</Text>
            </TouchableOpacity>
        }
      </View>

      {/* State Picker Modal */}
      <LocationPicker visible={showStatePicker} onClose={()=>setShowStatePicker(false)}
        title="SELECT STATE · INDIA" items={INDIA_STATES} selected={form.state}
        onSelect={v=>{ set('state',v); set('city',''); }} />

      {/* City Picker Modal */}
      <LocationPicker visible={showCityPicker} onClose={()=>setShowCityPicker(false)}
        title={`SELECT CITY · ${form.state.toUpperCase()}`} items={cities} selected={form.city}
        onSelect={v=>set('city',v)} />
    </KeyboardAvoidingView>
  );
}

function Label({text}){return <Text style={s.label}>{text}</Text>;}
function RRow({label,value}){return(
  <View style={s.reviewRow}>
    <Text style={s.reviewLabel}>{label}</Text>
    <Text style={s.reviewValue}>{value||'—'}</Text>
  </View>
);}
function aIcon(a){
  return {'Floodlights':'💡','Changing Rooms':'🚿','Parking':'🅿️','Drinking Water':'💧',
          'Washrooms':'🚻','First Aid':'🩺','Cafeteria':'☕','Wi-Fi':'📶',
          'Seating Area':'💺','AC Pavilion':'❄️'}[a]||'✓';
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:COLORS.bgLight},
  header:{backgroundColor:COLORS.primary,paddingBottom:12},
  headerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12},
  backBtn:{color:COLORS.accent,fontWeight:'700',fontSize:13},
  title:{color:COLORS.white,fontSize:16,fontWeight:'800'},
  stepCount:{color:'rgba(255,255,255,0.65)',fontSize:12,fontWeight:'700'},
  progressBg:{height:3,backgroundColor:'rgba(255,255,255,0.2)',marginHorizontal:16},
  progressFill:{height:'100%',backgroundColor:COLORS.accent,borderRadius:2},
  stepLabels:{paddingHorizontal:12,paddingVertical:8,gap:4},
  stepItem:{alignItems:'center',gap:4,marginHorizontal:6,width:68},
  stepDot:{width:26,height:26,borderRadius:13,backgroundColor:'rgba(255,255,255,0.2)',alignItems:'center',justifyContent:'center'},
  stepDotActive:{backgroundColor:COLORS.accent},
  stepDotText:{color:'rgba(255,255,255,0.7)',fontSize:10,fontWeight:'800'},
  stepDotTextActive:{color:COLORS.primary},
  stepLabel:{color:'rgba(255,255,255,0.5)',fontSize:9,fontWeight:'600',textAlign:'center'},
  stepLabelActive:{color:COLORS.accent},
  content:{padding:16,paddingBottom:140},
  formSection:{gap:2},
  sectionTitle:{fontSize:20,fontWeight:'900',color:COLORS.dark,marginBottom:4},
  sectionSub:{fontSize:13,color:COLORS.textMuted,fontWeight:'500',marginBottom:16},
  subSectionTitle:{fontSize:14,fontWeight:'800',color:COLORS.dark,marginBottom:12,marginTop:8},
  mediaGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},
  uploadCard:{width:'30%',flexGrow:1,minWidth:100,aspectRatio:1,backgroundColor:COLORS.white,borderWidth:2,borderColor:COLORS.border,borderStyle:'dashed',borderRadius:16,alignItems:'center',justifyContent:'center',gap:8},
  uploadIcon:{fontSize:28},
  uploadText:{fontSize:11,fontWeight:'700',color:COLORS.textMuted,textAlign:'center'},
  mediaItem:{width:'30%',flexGrow:1,minWidth:100,aspectRatio:1,borderRadius:16,overflow:'hidden',position:'relative'},
  mediaImage:{width:'100%',height:'100%'},
  videoPlaceholder:{width:'100%',height:'100%',backgroundColor:'#FEF3C7',alignItems:'center',justifyContent:'center',gap:6,padding:8},
  videoIcon:{fontSize:24},
  videoLabel:{fontSize:9,fontWeight:'700',color:'#92400E',textAlign:'center'},
  removeBtn:{position:'absolute',top:8,right:8,width:28,height:28,borderRadius:14,backgroundColor:'#EF4444',alignItems:'center',justifyContent:'center'},
  removeBtnText:{color:'#fff',fontSize:14,fontWeight:'800'},
  label:{fontSize:11,fontWeight:'800',color:COLORS.dark,textTransform:'uppercase',letterSpacing:0.5,marginTop:14,marginBottom:6},
  input:{backgroundColor:COLORS.white,borderWidth:1.5,borderColor:COLORS.border,borderRadius:12,padding:14,fontSize:14,color:COLORS.dark,fontWeight:'500'},
  textarea:{height:80,textAlignVertical:'top'},
  textareaLg:{height:120,textAlignVertical:'top'},
  charCount:{fontSize:11,color:COLORS.textMuted,fontWeight:'600',textAlign:'right',marginTop:4},
  chipRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:4},
  chip:{paddingHorizontal:14,paddingVertical:10,borderRadius:10,borderWidth:1.5,borderColor:COLORS.border,backgroundColor:COLORS.white},
  chipActive:{backgroundColor:COLORS.accentLight,borderColor:COLORS.accent},
  chipText:{fontSize:13,fontWeight:'600',color:COLORS.textMuted},
  chipTextActive:{color:COLORS.primary,fontWeight:'700'},
  pickerBtn:{backgroundColor:COLORS.white,borderWidth:1.5,borderColor:COLORS.border,borderRadius:12,padding:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  pickerBtnDisabled:{opacity:0.5},
  pickerBtnText:{fontSize:14,fontWeight:'600',color:COLORS.dark},
  pickerPlaceholder:{color:COLORS.textMuted},
  pickerArrow:{color:COLORS.textMuted,fontSize:12},
  radioRow:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:12,borderWidth:1.5,borderColor:COLORS.border,backgroundColor:COLORS.white,marginBottom:8},
  radioRowActive:{borderColor:COLORS.accent,backgroundColor:COLORS.accentLight},
  radio:{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},
  radioActive:{borderColor:COLORS.primary},
  radioDot:{width:10,height:10,borderRadius:5,backgroundColor:COLORS.primary},
  radioText:{fontSize:13,fontWeight:'600',color:COLORS.dark},
  switchRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:14,borderBottomWidth:1,borderBottomColor:COLORS.border},
  switchLabel:{fontSize:14,fontWeight:'600',color:COLORS.dark},
  previewCard:{backgroundColor:COLORS.white,borderRadius:16,padding:18,borderWidth:1.5,borderColor:COLORS.border,marginTop:16},
  previewTitle:{fontSize:15,fontWeight:'800',color:COLORS.dark,marginBottom:14},
  previewRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderBottomWidth:1,borderBottomColor:COLORS.border},
  previewLabel:{fontSize:13,color:COLORS.textMuted,fontWeight:'600'},
  previewValue:{fontSize:14,fontWeight:'800',color:COLORS.dark},
  previewTotal:{borderBottomWidth:0,backgroundColor:COLORS.accentLight,borderRadius:10,padding:12,marginTop:8},
  previewTotalLabel:{fontSize:14,fontWeight:'800',color:COLORS.dark},
  previewTotalValue:{fontSize:18,fontWeight:'900',color:COLORS.primary},
  amenitiesGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:8},
  amenityCard:{width:'30%',flexGrow:1,backgroundColor:COLORS.white,borderRadius:14,padding:14,alignItems:'center',borderWidth:1.5,borderColor:COLORS.border,position:'relative'},
  amenityCardActive:{backgroundColor:COLORS.accentLight,borderColor:COLORS.accent},
  amenityIcon:{fontSize:22,marginBottom:6},
  amenityLabel:{fontSize:11,fontWeight:'700',color:COLORS.textMuted,textAlign:'center'},
  amenityLabelActive:{color:COLORS.primary},
  amenityCheck:{position:'absolute',top:6,right:8,fontSize:11,fontWeight:'900',color:COLORS.primary},
  selectedCount:{fontSize:12,color:COLORS.textMuted,fontWeight:'600',marginTop:12,textAlign:'center'},
  reviewRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:1,borderBottomColor:COLORS.border},
  reviewLabel:{fontSize:13,color:COLORS.textMuted,fontWeight:'700'},
  reviewValue:{fontSize:13,color:COLORS.dark,fontWeight:'700',flex:1,textAlign:'right',marginLeft:16},
  submitNote:{backgroundColor:'#F0FDF4',borderRadius:12,padding:14,borderWidth:1.5,borderColor:'#86EFAC',marginTop:20},
  submitNoteText:{color:'#166534',fontSize:13,fontWeight:'600'},
  footer:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:COLORS.white,padding:16,borderTopWidth:1.5,borderTopColor:COLORS.border},
  nextBtn:{backgroundColor:COLORS.accent,borderRadius:14,padding:16,alignItems:'center'},
  nextBtnText:{color:COLORS.primary,fontWeight:'900',fontSize:16},
  submitBtn:{backgroundColor:COLORS.primary,borderRadius:14,padding:16,alignItems:'center'},
  submitBtnText:{color:COLORS.accent,fontWeight:'900',fontSize:16},
});
