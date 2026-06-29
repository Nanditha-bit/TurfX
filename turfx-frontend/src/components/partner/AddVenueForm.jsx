import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ChevronLeft, ChevronRight, Check, Upload, MapPin, Info, 
  Clock, ShieldCheck, User as UserIcon, Users, 
  Star, Wifi, Music, Coffee, Wind, Trash2 
} from 'lucide-react';

import { API_URL as API } from '../../config/api';
const SPORTS_LIST = ['Football', 'Cricket', 'Tennis', 'Volleyball', 'Table Tennis', 'Swimming'];

const LOCATION_DATA = {
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Chitradurga'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur']
};

export default function AddVenueForm({ onCancel, onComplete }) {
  const { token } = useAuth();
  const { colors, theme } = useTheme();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sports: [],
    type: 'Outdoor',
    location: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    shortDescription: '',
    price: '',
    amenities: [],
    images: [],
    videos: [],
    venueSize: 'Medium (8,000 - 12,000 sq.ft)',
    surfaceType: 'Artificial Turf',
    bookingType: 'Hourly',
    customAmenity: '',
  });

  const steps = [
    { id: 1, label: 'Basic Details' },
    { id: 2, label: 'Venue Info' },
    { id: 3, label: 'Slots & Pricing' },
    { id: 4, label: 'Amenities' },
    { id: 5, label: 'Photos' },
    { id: 6, label: 'Review & Submit' }
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.state || !formData.city || !formData.location || formData.sports.length === 0) {
        alert('Please fill all required fields marked with *');
        return;
      }
    }
    if (step === 3) {
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        alert('Please enter a valid base price per hour');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 6));
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      // Validate images before sending
      if (formData.images.length === 0) {
        setSubmitError('Please upload at least one image');
        setSubmitting(false);
        return;
      }

      // Check if images are properly formatted
      const imageUrls = formData.images.map(img => {
        if (typeof img === 'object' && img.url) {
          return img.url;
        } else if (typeof img === 'string') {
          return img;
        } else {
          throw new Error('Invalid image format');
        }
      });

      console.log('Submitting venue with', imageUrls.length, 'images');

      // Extract video URLs
      const videoUrls = formData.videos.map(video => {
        if (typeof video === 'object' && video.url) {
          return video.url;
        } else if (typeof video === 'string') {
          return video;
        } else {
          throw new Error('Invalid video format');
        }
      });

      console.log('Submitting venue with', videoUrls.length, 'videos');

      await axios.post(`${API}/turfs`, {
        name: formData.name,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        price_per_hour: parseFloat(formData.price),
        sport: formData.sports[0] || 'Football',
        sports: formData.sports,
        type: formData.type,
        venueSize: formData.venueSize,
        surfaceType: formData.surfaceType,
        bookingType: formData.bookingType,
        description: formData.description,
        shortDescription: formData.shortDescription,
        amenities: formData.amenities,
        images: imageUrls,
        videos: videoUrls,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onComplete?.();
    } catch (err) {
      console.error('❌ Submit venue error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMsg = 'Failed to submit venue. Please try again.';
      
      if (err.response?.data?.msg) {
        errorMsg = err.response.data.msg;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setSubmitError(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3rem' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#98A2B3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
          <ChevronLeft size={20} /> Back to Venues
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginLeft: '1.5rem' }}>Add New Venue</h2>
      </div>

      {/* STEPPER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '4rem', padding: '0 20px' }}>
        <div style={{ position: 'absolute', top: '15px', left: '40px', right: '40px', height: '2px', background: '#EEF2E6', zIndex: 1 }}></div>
        {steps.map((s, i) => (
          <div key={s.id} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: step > s.id ? '#CEF17B' : step === s.id ? '#CEF17B' : 'white',
              border: `2px solid ${step >= s.id ? '#CEF17B' : '#EEF2E6'}`,
              color: step > s.id ? 'white' : step === s.id ? 'white' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '0.85rem', transition: '0.3s'
            }}>
              {step > s.id ? <Check size={18} /> : s.id}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: step >= s.id ? '#161616' : '#94a3b8' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* FORM CONTENT */}
      <div style={{ background: 'white', borderRadius: '24px', padding: '3.5rem', border: '1.5px solid #EEF2E6', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        {step === 1 && <BasicDetails formData={formData} setFormData={setFormData} />}
        {step === 2 && <VenueInfo formData={formData} setFormData={setFormData} />}
        {step === 3 && <SlotsPricing formData={formData} setFormData={setFormData} />}
        {step === 4 && <AmenitiesSection formData={formData} setFormData={setFormData} />}
        {step === 5 && <PhotosUpload formData={formData} setFormData={setFormData} />}
        {step === 6 && <ReviewSubmit formData={formData} onEdit={(s) => setStep(s)} />}

        {submitError && (
          <div style={{ marginTop: '1.5rem', padding: '14px 18px', borderRadius: '12px', background: '#fff1f2', border: '1.5px solid #fecdd3', color: '#be123c', fontWeight: '700', fontSize: '0.9rem' }}>
            {submitError}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3.5rem', borderTop: '1.5px solid #EEF2E6', paddingTop: '2.5rem' }}>
           <button 
             onClick={handlePrev} 
             style={{ visibility: step === 1 ? 'hidden' : 'visible', padding: '14px 32px', borderRadius: '12px', border: '1.5px solid #EEF2E6', background: 'white', fontWeight: '700', cursor: 'pointer', color: '#98A2B3' }}
           >
             Previous Step
           </button>
           <button 
             onClick={step === 6 ? handleSubmit : handleNext}
             disabled={submitting}
             style={{ padding: '14px 45px', borderRadius: '12px', border: 'none', background: submitting ? '#CEF17B' : '#CEF17B', color: '#084734', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(30,190,116,0.2)' }}
           >
             {step === 6 ? (submitting ? 'Submitting...' : 'Submit Venue') : 'Save & Continue'} {!submitting && <ChevronRight size={18} />}
           </button>
        </div>
      </div>
    </div>
  );
}

function BasicDetails({ formData, setFormData }) {
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Use a reverse geocoding API to get address from coordinates
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => {
            const address = data.address;
            const city = address.city || address.town || address.village || '';
            const state = address.state || '';
            
            // Try to match state and city to our LOCATION_DATA
            let matchedState = '';
            let matchedCity = '';
            
            // Find state match
            for (const s of Object.keys(LOCATION_DATA)) {
              if (state.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(state.toLowerCase())) {
                matchedState = s;
                break;
              }
            }
            
            // Find city match if state is found
            if (matchedState && LOCATION_DATA[matchedState]) {
              for (const c of LOCATION_DATA[matchedState]) {
                if (city.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(city.toLowerCase())) {
                  matchedCity = c;
                  break;
                }
              }
            }

            setFormData({
              ...formData,
              location: address.road || address.neighbourhood || address.suburb || '',
              city: matchedCity || city,
              state: matchedState || state,
              pincode: address.postcode || ''
            });
            
            setGettingLocation(false);
          })
          .catch(err => {
            console.error('Error getting address:', err);
            alert('Could not get address from location');
            setGettingLocation(false);
          });
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert(`Error getting location: ${error.message}`);
        setGettingLocation(false);
      }
    );
  };

  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    if (formData.state) {
      setAvailableCities(LOCATION_DATA[formData.state] || []);
    }
  }, [formData.state]);

  const handleSportToggle = (sport) => {
    const sports = formData.sports.includes(sport)
      ? formData.sports.filter(s => s !== sport)
      : [...formData.sports, sport];
    setFormData({ ...formData, sports });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SectionHeader icon={<Info size={20} />} title="Basic Details" subtitle="Enter the core information about your sports venue" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Field label="Venue Name *">
          <input 
            type="text" 
            placeholder="e.g. Green Turf Arena" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={inputStyle} 
          />
        </Field>

        <Field label="Sports Offered *">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {SPORTS_LIST.map(sport => (
              <div 
                key={sport}
                onClick={() => handleSportToggle(sport)}
                style={{ 
                  padding: '10px 18px', borderRadius: '10px', border: '1.5px solid',
                  borderColor: formData.sports.includes(sport) ? '#CEF17B' : '#DCEFB8',
                  background: formData.sports.includes(sport) ? '#DCEFB8' : 'white',
                  color: formData.sports.includes(sport) ? '#CEF17B' : '#98A2B3',
                  fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: '0.2s'
                }}
              >
                {sport}
              </div>
            ))}
          </div>
        </Field>

        <Field label="Venue Type *">
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            {['Outdoor', 'Indoor', 'Indoor + Outdoor'].map(t => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', color: '#161616' }}>
                <input 
                  type="radio" 
                  name="type" 
                  checked={formData.type === t} 
                  onChange={() => setFormData({...formData, type: t})} 
                  style={{ accentColor: '#CEF17B', width: '18px', height: '18px' }} 
                /> {t}
              </label>
            ))}
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <Field label="State *">
            <select 
              style={inputStyle}
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value, city: ''})}
            >
              <option value="">Select State</option>
              {Object.keys(LOCATION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="City *">
            <select 
              style={inputStyle}
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              disabled={!formData.state}
            >
              <option value="">Select City</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Pincode">
          <input 
            type="text" 
            placeholder="Enter pincode" 
            value={formData.pincode}
            onChange={(e) => setFormData({...formData, pincode: e.target.value})}
            style={inputStyle} 
          />
        </Field>

        <Field label="Location / Landmark *">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Enter locality or nearby landmark" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                style={{ ...inputStyle, paddingLeft: '48px' }} 
              />
            </div>
            <button
              onClick={handleGetLocation}
              disabled={gettingLocation}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: '#CEF17B',
                color: '#084734',
                border: 'none',
                fontWeight: '700',
                cursor: gettingLocation ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              {gettingLocation ? 'Getting...' : 'Use My Location'}
            </button>
          </div>
        </Field>
      </div>
      <div style={{ background: '#F8FAF7', borderRadius: '24px', border: '1.5px solid #EEF2E6', padding: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem', color: '#161616' }}>Pro Tip</h4>
        <p style={{ fontSize: '0.85rem', color: '#98A2B3', lineHeight: 1.6, fontWeight: '500' }}>
          Venues with accurate location details and landmarks get **30% more bookings** as it helps players find you easily.
        </p>
      </div>
    </div>
  );
}

function VenueInfo({ formData, setFormData }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '4.5rem' }}>
       <div>
          <SectionHeader icon={<Info size={20} />} title="Venue Information" subtitle="Provide technical and descriptive details about your facility" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
             <Field label="Venue Size *">
               <select 
                 style={inputStyle}
                 value={formData.venueSize}
                 onChange={(e) => setFormData({...formData, venueSize: e.target.value})}
               >
                 <option>Small (Below 8,000 sq.ft)</option>
                 <option>Medium (8,000 - 12,000 sq.ft)</option>
                 <option>Large (Above 12,000 sq.ft)</option>
               </select>
             </Field>
             <Field label="Surface Type *">
                <select 
                  style={inputStyle}
                  value={formData.surfaceType}
                  onChange={(e) => setFormData({...formData, surfaceType: e.target.value})}
                >
                  <option>Artificial Turf</option>
                  <option>Natural Grass</option>
                  <option>Wooden Court</option>
                  <option>Synthetic Court</option>
                  <option>Concrete</option>
                </select>
             </Field>
          </div>

          <Field label="Short Description (Max 150 chars) *">
             <textarea 
               style={{ ...inputStyle, height: '90px', resize: 'none' }} 
               maxLength={150} 
               placeholder="Briefly describe your venue to catch attention..."
               value={formData.shortDescription}
               onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
             ></textarea>
             <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>{formData.shortDescription.length}/150</div>
          </Field>

          <Field label="Detailed Description">
             <textarea 
               style={{ ...inputStyle, height: '180px', resize: 'none', marginTop: '1.5rem' }} 
               maxLength={1000}
               placeholder="Describe your facilities, parking, accessibility, and unique features..."
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
             ></textarea>
             <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>{formData.description.length}/1000</div>
          </Field>
       </div>

       <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', padding: '2rem' }}>
             <SectionHeader icon={<ShieldCheck size={20} />} title="Operational Policies" small />
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {[
                  { key: 'outsideFood', label: 'Outside Food Allowed' },
                  { key: 'petsAllowed', label: 'Pets Allowed' },
                  { key: 'changingRooms', label: 'Changing Rooms Available' }
                ].map(policy => {
                  const isEnabled = formData[policy.key] || false;
                  return (
                    <div key={policy.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#98A2B3' }}>{policy.label}</span>
                       <div 
                         onClick={() => setFormData({...formData, [policy.key]: !isEnabled})}
                         style={{ 
                           width: '40px', 
                           height: '22px', 
                           background: isEnabled ? '#CEF17B' : '#DCEFB8', 
                           borderRadius: '20px', 
                           padding: '2px', 
                           cursor: 'pointer', 
                           position: 'relative',
                           transition: 'background 0.3s'
                         }}
                       >
                          <div style={{ 
                            width: '18px', 
                            height: '18px', 
                            background: 'white', 
                            borderRadius: '50%', 
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            transform: isEnabled ? 'translateX(18px)' : 'translateX(0)',
                            transition: 'transform 0.3s'
                          }}></div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
          
          <div style={{ background: '#DCEFB8', borderRadius: '24px', padding: '2rem', border: '1.5px solid #DCEFB8' }}>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1rem', color: '#084734' }}>
                <Star size={20} />
                <h4 style={{ fontWeight: '800', fontSize: '1rem' }}>Success Rating</h4>
             </div>
             <p style={{ fontSize: '0.85rem', color: '#084734', fontWeight: '600', lineHeight: 1.6 }}>
               Venues with detailed descriptions and clear policies get **45% fewer cancellations**.
             </p>
          </div>
       </div>
    </div>
  );
}

function SlotsPricing({ formData, setFormData }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '4.5rem' }}>
       <div>
          <SectionHeader icon={<Clock size={20} />} title="Slots & Pricing" subtitle="Set your operational hours and hourly rates" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
             <Field label="Base Price per Hour (₹) *">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#161616' }}>₹</span>
                  <input 
                    type="number" 
                    placeholder="e.g. 1200" 
                    style={{ ...inputStyle, paddingLeft: '35px' }}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
             </Field>
             <Field label="Booking Type">
                <select style={inputStyle} value={formData.bookingType} onChange={(e) => setFormData({...formData, bookingType: e.target.value})}>
                  <option>Hourly</option>
                  <option>Full Day</option>
                </select>
             </Field>
          </div>

          <div style={{ marginBottom: '2rem' }}>
             <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#161616', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Operational Hours</div>
             <div style={{ background: '#F8FAF7', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid #EEF2E6' }}>
                {['Monday - Friday', 'Saturday - Sunday'].map(days => (
                  <div key={days} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: days === 'Monday - Friday' ? '1rem' : '0' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#161616' }}>{days}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <select style={{ ...inputSmallStyle }}>
                          <option>06:00 AM</option>
                          <option>07:00 AM</option>
                          <option>08:00 AM</option>
                       </select>
                       <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>to</span>
                       <select style={{ ...inputSmallStyle }}>
                          <option>10:00 PM</option>
                          <option>11:00 PM</option>
                          <option>12:00 AM</option>
                       </select>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div style={{ background: '#fff9eb', border: '1.5px solid #fef3c7', padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '15px', alignItems: 'center' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Info size={20} />
             </div>
             <p style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600', margin: 0 }}>
               You can set different prices for peak hours and weekends later in the **Pricing** section.
             </p>
          </div>
       </div>

       <div>
          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', padding: '2rem' }}>
             <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Pricing Preview</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px dashed #DCEFB8' }}>
                   <span style={{ fontSize: '0.9rem', color: '#98A2B3', fontWeight: '600' }}>Hourly Rate</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#161616' }}>₹ {formData.price || '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px dashed #DCEFB8' }}>
                   <span style={{ fontSize: '0.9rem', color: '#98A2B3', fontWeight: '600' }}>Platform Fee (5%)</span>
                   <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ef4444' }}>- ₹ {formData.price ? Math.round(parseFloat(formData.price) * 0.05) : '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#DCEFB8', padding: '1rem', borderRadius: '12px', border: '1.5px solid #DCEFB8' }}>
                   <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#161616' }}>You Receive</span>
                   <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#CEF17B' }}>₹ {formData.price ? Math.round(parseFloat(formData.price) * 0.95) : '0'}</span>
                </div>
             </div>
             <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
               Platform fee helps us maintain and improve our services.
             </p>
          </div>
       </div>
    </div>
  );
}

function AmenitiesSection({ formData, setFormData }) {
  const popular = [
    { id: 'floodlights', label: 'Floodlights', icon: <Clock size={20} /> },
    { id: 'changing', label: 'Changing Rooms', icon: <UserIcon size={20} /> },
    { id: 'parking', label: 'Parking', icon: <MapPin size={20} /> },
    { id: 'water', label: 'Drinking Water', icon: <Info size={20} /> },
    { id: 'seating', label: 'Seating Area', icon: <Users size={20} /> },
    { id: 'washrooms', label: 'Washrooms', icon: <ShieldCheck size={20} /> },
    { id: 'firstaid', label: 'First Aid', icon: <ShieldCheck size={20} /> },
    { id: 'cafeteria', label: 'Cafeteria', icon: <Coffee size={20} /> },
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi size={20} /> },
    { id: 'music', label: 'Music System', icon: <Music size={20} /> },
    { id: 'ac', label: 'AC Pavilion', icon: <Wind size={20} /> },
  ];

  const toggleAmenity = (id) => {
    const amenities = formData.amenities.includes(id) 
      ? formData.amenities.filter(a => a !== id)
      : [...formData.amenities, id];
    setFormData({ ...formData, amenities });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '4.5rem' }}>
       <div>
          <SectionHeader icon={<ShieldCheck size={20} />} title="Amenities" subtitle="Select the amenities available at your venue" />
          
          <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#161616', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Popular Amenities</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '2.5rem' }}>
             {popular.map(a => (
               <div 
                 key={a.id} 
                 onClick={() => toggleAmenity(a.id)}
                 style={{ 
                   padding: '1.5rem 10px', borderRadius: '16px', border: '1.5px solid',
                   borderColor: formData.amenities.includes(a.id) ? '#CEF17B' : '#DCEFB8',
                   background: formData.amenities.includes(a.id) ? '#DCEFB8' : 'white',
                   cursor: 'pointer', textAlign: 'center', transition: '0.2s',
                   position: 'relative'
                 }}
               >
                 <div style={{ color: formData.amenities.includes(a.id) ? '#CEF17B' : '#94a3b8', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{a.icon}</div>
                 <div style={{ fontSize: '0.75rem', fontWeight: '800', color: formData.amenities.includes(a.id) ? '#CEF17B' : '#98A2B3' }}>{a.label}</div>
                 <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid #DCEFB8', background: formData.amenities.includes(a.id) ? '#CEF17B' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {formData.amenities.includes(a.id) && <Check size={12} color="white" strokeWidth={4} />}
                 </div>
               </div>
             ))}
          </div>

          <Field label="Additional Amenities (Optional)">
             <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Enter amenity and press Add"
                  value={formData.customAmenity || ''}
                  onChange={(e) => setFormData({ ...formData, customAmenity: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && formData.customAmenity?.trim()) {
                      const val = formData.customAmenity.trim();
                      if (!formData.amenities.includes(val)) {
                        setFormData({ ...formData, amenities: [...formData.amenities, val], customAmenity: '' });
                      }
                    }
                  }}
                  style={inputStyle}
                />
                <button
                  onClick={() => {
                    const val = (formData.customAmenity || '').trim();
                    if (!val) return;
                    if (!formData.amenities.includes(val)) {
                      setFormData({ ...formData, amenities: [...formData.amenities, val], customAmenity: '' });
                    } else {
                      setFormData({ ...formData, customAmenity: '' });
                    }
                  }}
                  style={{ padding: '0 25px', borderRadius: '12px', border: 'none', background: '#CEF17B', color: '#084734', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + Add
                </button>
             </div>
             {/* Show added custom amenities as removable chips */}
             {formData.amenities.filter(a => !['floodlights','changing','parking','water','seating','washrooms','firstaid','cafeteria','wifi','music','ac'].includes(a)).length > 0 && (
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                 {formData.amenities
                   .filter(a => !['floodlights','changing','parking','water','seating','washrooms','firstaid','cafeteria','wifi','music','ac'].includes(a))
                   .map((a, i) => (
                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#DCEFB8', borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: '700', color: '#084734' }}>
                       {a}
                       <button
                         onClick={() => setFormData({ ...formData, amenities: formData.amenities.filter(x => x !== a) })}
                         style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#084734', display: 'flex', alignItems: 'center', padding: 0, marginLeft: '2px' }}
                       >
                         <Trash2 size={13} />
                       </button>
                     </div>
                   ))
                 }
               </div>
             )}
          </Field>
       </div>

       <div>
          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', padding: '2rem', marginBottom: '2rem' }}>
             <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Amenities Preview</h4>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {formData.amenities.length > 0 ? formData.amenities.map(id => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CEF17B', fontSize: '0.85rem', fontWeight: '700' }}>
                     <Check size={16} /> {popular.find(p => p.id === id)?.label}
                  </div>
                )) : <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No amenities selected</div>}
             </div>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', padding: '2rem' }}>
             <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Star size={18} color="#CEF17B" /> Why Amenities Matter?
             </h4>
             <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={whyItemStyle}><Check size={16} color="#CEF17B" /> Helps players filter by facilities</li>
                <li style={whyItemStyle}><Check size={16} color="#CEF17B" /> Increases trust and professional image</li>
                <li style={whyItemStyle}><Check size={16} color="#CEF17B" /> Justifies higher pricing for better facilities</li>
             </ul>
          </div>
       </div>
    </div>
  );
}

function PhotosUpload({ formData, setFormData }) {
  const [uploading, setUploading] = useState(false);
  
  // Compress image before converting to base64
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if image is too large (max 1200px width)
          const maxWidth = 1200;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (0.7 quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          resolve({
            url: compressedBase64,
            name: file.name,
            type: 'image',
            size: Math.round(compressedBase64.length * 0.75) // Approximate size
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleFileUpload = async (e, type = 'image') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limit to 5 images max
    if (type === 'image' && (formData.images || []).length + files.length > 5) {
      alert('Maximum 5 images allowed. Please remove some images first.');
      return;
    }
    
    setUploading(true);
    
    try {
      let uploadedFiles;
      
      if (type === 'image') {
        // Compress images before uploading
        uploadedFiles = await Promise.all(files.map(file => compressImage(file)));
      } else {
        // For videos, just convert to base64 (no compression)
        uploadedFiles = await Promise.all(files.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                url: reader.result,
                name: file.name,
                type: type,
                size: file.size
              });
            };
            reader.readAsDataURL(file);
          });
        }));
      }
      
      if (type === 'image') {
        setFormData({
          ...formData,
          images: [...(formData.images || []), ...uploadedFiles]
        });
      } else {
        setFormData({
          ...formData,
          videos: [...(formData.videos || []), ...uploadedFiles]
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    }
    
    setUploading(false);
  };
  
  const removeFile = (index, type = 'image') => {
    if (type === 'image') {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData({ ...formData, images: newImages });
    } else {
      const newVideos = formData.videos.filter((_, i) => i !== index);
      setFormData({ ...formData, videos: newVideos });
    }
  };
  
  return (
    <div>
       <SectionHeader icon={<Upload size={20} />} title="Photos & Videos" subtitle="Upload high quality photos and videos to showcase your venue" />
       
       {/* PHOTOS SECTION */}
       <div style={{ marginBottom: '3rem' }}>
         <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#161616' }}>Photos</h4>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Upload Button */}
            <label style={{ 
              aspectRatio: '1', borderRadius: '24px', border: '2.5px dashed #DCEFB8', background: '#F8FAF7',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px',
              cursor: 'pointer', transition: '0.2s', padding: '2rem'
            }}>
               <input 
                 type="file" 
                 accept="image/*" 
                 multiple 
                 onChange={(e) => handleFileUpload(e, 'image')}
                 style={{ display: 'none' }}
               />
               <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CEF17B', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
                  <Upload size={24} />
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#CEF17B' }}>
                    {uploading ? 'Uploading...' : 'Click to upload'}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginTop: '6px' }}>JPG, PNG up to 5MB</div>
               </div>
            </label>
            
            {/* Uploaded Images */}
            {(formData.images || []).map((img, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: '24px', overflow: 'hidden', border: '1.5px solid #EEF2E6', position: 'relative' }}>
                 <img src={img.url} alt={`Venue ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 <div 
                   onClick={() => removeFile(i, 'image')}
                   style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239,68,68,0.9)', color: 'white', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                 >
                    <Trash2 size={16} />
                 </div>
              </div>
            ))}
         </div>
       </div>
       
       {/* VIDEOS SECTION */}
       <div style={{ marginBottom: '2.5rem' }}>
         <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#161616' }}>Videos (Optional)</h4>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Upload Button */}
            <label style={{ 
              aspectRatio: '16/9', borderRadius: '24px', border: '2.5px dashed #DCEFB8', background: '#F8FAF7',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px',
              cursor: 'pointer', transition: '0.2s', padding: '2rem'
            }}>
               <input 
                 type="file" 
                 accept="video/*" 
                 multiple 
                 onChange={(e) => handleFileUpload(e, 'video')}
                 style={{ display: 'none' }}
               />
               <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
                  <Upload size={24} />
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#3b82f6' }}>
                    {uploading ? 'Uploading...' : 'Upload Video'}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginTop: '6px' }}>MP4, MOV up to 50MB</div>
               </div>
            </label>
            
            {/* Uploaded Videos */}
            {(formData.videos || []).map((video, i) => (
              <div key={i} style={{ aspectRatio: '16/9', borderRadius: '24px', overflow: 'hidden', border: '1.5px solid #EEF2E6', position: 'relative', background: '#000' }}>
                 <video 
                   src={video.url} 
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                   muted
                   loop
                   onMouseEnter={(e) => e.target.play()}
                   onMouseLeave={(e) => e.target.pause()}
                 />
                 <div 
                   onClick={() => removeFile(i, 'video')}
                   style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239,68,68,0.9)', color: 'white', padding: '8px', borderRadius: '10px', cursor: 'pointer', zIndex: 10 }}
                 >
                    <Trash2 size={16} />
                 </div>
              </div>
            ))}
         </div>
       </div>

       <div style={{ background: '#F8FAF7', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
          <h4 style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '1rem', color: '#161616' }}>Upload Guidelines</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
             <GuideItem text="Upload 3-5 photos (max 5)" />
             <GuideItem text="Include photos of the turf, entrance & amenities" />
             <GuideItem text="Photos should be well-lit and clear" />
             <GuideItem text="Images are auto-compressed for faster loading" />
             <GuideItem text="Show actual playing area" />
             <GuideItem text="Avoid blurry or dark photos" />
          </div>
       </div>
    </div>
  );
}

function GuideItem({ text }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#98A2B3', fontSize: '0.85rem', fontWeight: '600' }}>
       <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CEF17B' }}></div> {text}
    </div>
  );
}

function ReviewSubmit({ formData, onEdit }) {
  const popular = {
    floodlights: 'Floodlights', changing: 'Changing Rooms', parking: 'Parking',
    water: 'Drinking Water', seating: 'Seating Area', washrooms: 'Washrooms',
    firstaid: 'First Aid', cafeteria: 'Cafeteria', wifi: 'Wi-Fi', music: 'Music System', ac: 'AC Pavilion'
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
       <SectionHeader icon={<ShieldCheck size={20} />} title="Review & Submit" subtitle="Please check all the details before final submission" />
       
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          <ReviewCard title="Basic Details" step={1} onEdit={onEdit}>
             <InfoItem label="Venue Name" value={formData.name} />
             <InfoItem label="Sports" value={formData.sports.join(', ')} />
             <InfoItem label="Location" value={`${formData.location}, ${formData.city}, ${formData.state}`} />
          </ReviewCard>

          <ReviewCard title="Pricing & Info" step={3} onEdit={onEdit}>
             <InfoItem label="Base Price" value={`₹ ${formData.price} / hr`} />
             <InfoItem label="Venue Size" value={formData.venueSize} />
             <InfoItem label="Surface" value={formData.surfaceType} />
          </ReviewCard>

          <ReviewCard title="Amenities" step={4} onEdit={onEdit}>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.amenities.map(a => (
                  <span key={a} style={{ background: '#EEF2E6', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#98A2B3' }}>
                    {popular[a]}
                  </span>
                ))}
             </div>
          </ReviewCard>

          <div style={{ background: '#DCEFB8', borderRadius: '24px', padding: '2rem', border: '1.5px solid #DCEFB8', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
             <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#CEF17B', color: '#084734', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Check size={32} strokeWidth={3} />
             </div>
             <h4 style={{ fontWeight: '900', fontSize: '1.2rem', marginBottom: '8px' }}>Ready to Go Live!</h4>
             <p style={{ fontSize: '0.85rem', color: '#084734', fontWeight: '600' }}>
                Once submitted, our team will review and approve your venue within 24 hours.
             </p>
          </div>
       </div>
    </div>
  );
}

function ReviewCard({ title, children, step, onEdit }) {
  return (
    <div style={{ background: '#F8FAF7', borderRadius: '24px', padding: '2rem', border: '1.5px solid #EEF2E6' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: '800', fontSize: '1rem', color: '#161616' }}>{title}</h4>
          <button onClick={() => onEdit(step)} style={{ background: 'none', border: 'none', color: '#CEF17B', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>Edit</button>
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>{children}</div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, small }) {
  return (
    <div style={{ marginBottom: small ? '1.5rem' : '3rem' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '6px' }}>
          <div style={{ color: '#CEF17B' }}>{icon}</div>
          <h3 style={{ fontSize: small ? '1.1rem' : '1.5rem', fontWeight: '900', color: '#161616' }}>{title}</h3>
       </div>
       {subtitle && <p style={{ fontSize: '0.95rem', color: '#98A2B3', fontWeight: '600' }}>{subtitle}</p>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ width: '100%' }}>
       <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#98A2B3', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
       {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
       <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
       <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#161616' }}>{value || '--'}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '16px 20px', borderRadius: '14px', border: '1.5px solid #DCEFB8',
  fontSize: '1rem', fontWeight: '600', outline: 'none', background: 'white',
  boxSizing: 'border-box', color: '#161616', transition: '0.2s border-color'
};

const inputSmallStyle = {
  padding: '10px 15px', borderRadius: '10px', border: '1.5px solid #DCEFB8',
  fontSize: '0.85rem', fontWeight: '700', outline: 'none', background: 'white',
  cursor: 'pointer'
};

const whyItemStyle = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#98A2B3', fontWeight: '500' };
