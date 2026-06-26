import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';

import { API_URL as API } from '../config/api';
const SPORTS = ['Football', 'Cricket', 'Tennis'];

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

export default function Checkout() {
  const { state } = useLocation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { id: turfIdFromUrl } = useParams();
  const isMobile = useWindowWidth() < 768;
  const [turf, setTurf] = useState(state?.turf || null);
  const [turfLoading, setTurfLoading] = useState(!state?.turf);
  const [turfError, setTurfError] = useState(false);
  const [date, setDate] = useState(state?.date || new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [sport, setSport] = useState(state?.turf?.sport || 'Football');
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);

  // If turf wasn't passed via state (e.g. page refresh), turfIdFromUrl comes from useParams above
  useEffect(() => {
    if (!turf && turfIdFromUrl) {
      setTurfLoading(true);
      setTurfError(false);
      axios.get(`${API}/turfs/${turfIdFromUrl}`)
        .then(res => { setTurf(res.data); setSport(res.data.sport || 'Football'); })
        .catch(() => setTurfError(true))
        .finally(() => setTurfLoading(false));
    } else {
      setTurfLoading(false);
    }
  }, [turfIdFromUrl]);

  const turfId = turf?._id || turf?.id;

  // ── PEAK HOUR PRICING ──
  // Returns the correct price for a slot — minimum ₹800 enforced
  const MIN_TURF_FEE = 800;
  const getPriceForSlot = (slotHour) => {
    const rules = turf?.pricingRules;
    let price;

    if (!rules || rules.length === 0) {
      price = turf?.price_per_hour || 0;
    } else {
      const bookingDate = new Date(date);
      const dayOfWeek = bookingDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const slotTime = `${String(slotHour).padStart(2, '0')}:00`;

      const matchingRules = rules.filter(r => {
        if (!r.active) return false;
        const typeMatch =
          r.type === 'All Days' ||
          (r.type === 'Weekend' && isWeekend) ||
          (r.type === 'Weekday' && !isWeekend);
        if (!typeMatch) return false;
        return slotTime >= r.startTime && slotTime < r.endTime;
      });

      if (matchingRules.length === 0) {
        price = turf?.price_per_hour || 0;
      } else {
        const priority = { Weekend: 3, Weekday: 2, 'All Days': 1 };
        matchingRules.sort((a, b) => (priority[b.type] || 0) - (priority[a.type] || 0));
        price = matchingRules[0].price;
      }
    }

    // Enforce minimum ₹800 per slot
    return Math.max(price, MIN_TURF_FEE);
  };

  // Generate hourly slots (6 AM to 11 PM)
  const generateHourlySlots = () => {
    const slots = [];
    for (let hour = 6; hour < 23; hour++) {
      const startHour = hour > 12 ? hour - 12 : (hour === 12 ? 12 : hour);
      const endHour = (hour + 1) > 12 ? (hour + 1) - 12 : (hour + 1 === 12 ? 12 : hour + 1);
      const startPeriod = hour >= 12 ? 'PM' : 'AM';
      const endPeriod = (hour + 1) >= 12 ? 'PM' : 'AM';

      // Format: "6-7 AM" or "11-12 PM" or "11 AM-12 PM"
      let slotLabel;
      if (startPeriod === endPeriod) {
        slotLabel = `${startHour}-${endHour} ${endPeriod}`;
      } else {
        slotLabel = `${startHour} ${startPeriod}-${endHour} ${endPeriod}`;
      }

      slots.push({
        label: slotLabel,
        value: slotLabel,
        hour: hour
      });
    }
    return slots;
  };

  const hourlySlots = generateHourlySlots();

  // PRICE CALCULATIONS
  // Turf Fee (min ₹800) + Platform Fee ₹25 + GST 18% on ₹25 = ₹5 → Total fees ₹30
  const platformFee = 25;
  const turfFee = 0;                                              // no convenient fee
  const gstOnFee = Math.ceil(platformFee * 0.18);               // 18% of ₹25 = ₹4.5 → ₹5
  const totalConvenientFee = platformFee + gstOnFee;             // ₹30

  const slotPrices = selectedSlots.map(label => {
    const slot = hourlySlots.find(s => s.label === label);
    return slot ? getPriceForSlot(slot.hour) : (turf?.price_per_hour || 0);
  });
  const courtPrice = slotPrices.reduce((sum, p) => sum + p, 0);
  const numberOfSlots = selectedSlots.length;
  const totalAmount = courtPrice + (numberOfSlots > 0 ? totalConvenientFee : 0);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!turfId || !date) return;

    setSlotsLoading(true);
    axios.get(`${API}/bookings/booked-slots/${turfId}/${date}`)
      .then(res => {
        const slots = res.data.bookedSlots || [];
        setBookedSlots(slots);
      })
      .catch(err => {
        console.error(err);
        setBookedSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [turfId, date]);

  // ── PAST SLOT DETECTION ──────────────────────────────────────────────────
  // Returns true if this slot hour is in the past (only relevant for today)
  const isSlotInPast = (slotHour) => {
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) return false;           // future date → nothing is past
    const nowHour = new Date().getHours();      // e.g. 14 for 2 PM
    // Slot "14-15" starts at hour 14; disable it once the clock passes 14:00
    return slotHour <= nowHour;
  };

  const isSlotBooked = (slotLabel) => {
    return bookedSlots.includes(slotLabel);
  };

  const toggleSlotSelection = (slotLabel) => {
    if (selectedSlots.includes(slotLabel)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotLabel));
    } else {
      setSelectedSlots([...selectedSlots, slotLabel]);
    }
  };

  const handleSendRequest = async () => {
    if (!token) return navigate('/login');
    if (selectedSlots.length === 0) return alert('Please select at least one time slot');
    
    setLoading(true);
    try {
      // Create Razorpay order
      const orderRes = await axios.post(`${API}/bookings/razorpay-order`, 
        { amount: totalAmount }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { id: order_id, amount, currency, demo } = orderRes.data;

      if (demo) {
        // Bypass Razorpay for demo - direct booking
        await axios.post(`${API}/bookings/direct`, {
          turf_id: turfId,
          date,
          time_slots: selectedSlots,
          total_price: totalAmount,
          payment_id: "demo_payment_" + Date.now(),
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setRequestSent(true);
        setLoading(false);
        return;
      }

      // Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_live_Ssj5gmcgaYP9HB',
        amount,
        currency,
        name: 'TurfX',
        description: `Booking for ${turf.name}`,
        order_id,
        handler: async (response) => {
          try {
            await axios.post(`${API}/bookings/direct`, {
              turf_id:              turfId,
              date,
              time_slots:           selectedSlots,
              total_price:          totalAmount,
              razorpay_order_id:    response.razorpay_order_id,
              razorpay_payment_id:  response.razorpay_payment_id,
              razorpay_signature:   response.razorpay_signature,
            }, { headers: { Authorization: `Bearer ${token}` } });
            navigate('/booking/confirmed', {
              state: {
                booking: {
                  turf,
                  date,
                  slots: selectedSlots,
                  totalAmount,
                  paymentId: response.razorpay_payment_id,
                },
              },
            });
          } catch (err) {
            alert('Payment received but booking failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        },
        modal: {
          ondismiss: () => { setLoading(false); },
        },
        prefill: {
          name:    user?.name || '',
          contact: user?.phone?.replace('+91', '') || '',
          email:   user?.email || '',
        },
        theme: { color: '#084734' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      // Don't call setLoading(false) here — loading stays true until
      // payment succeeds (handler sets requestSent) or modal is dismissed (ondismiss)
      return;
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.msg || err.message;
      alert(`Failed to create booking: ${errorMsg}`);
    }
    setLoading(false);
  };

  if (turfLoading) return (
    <div style={{ textAlign:'center', padding:'6rem 2rem', minHeight:'calc(100vh - 72px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'48px', height:'48px', border:'4px solid #EEF2E6', borderTop:'4px solid #084734', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 1rem' }} />
      <p style={{ color:'#98A2B3', fontSize:'1.1rem', fontWeight:'600' }}>Loading venue details...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (turfError || !turf) return (
    <div style={{ textAlign:'center', padding:'6rem 2rem', minHeight:'calc(100vh - 72px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🏟️</div>
      <h2 style={{ color:'#161616', marginBottom:'1rem', fontSize: '2rem', fontWeight: '900' }}>Venue Not Found</h2>
      <p style={{ color:'#666', marginBottom:'2rem', fontWeight: '500' }}>The venue you're looking for doesn't exist or the link is invalid.</p>
      <button onClick={() => navigate('/explore')} style={{ background:'#084734', color:'#CEF17B', border:'none', padding:'14px 40px', borderRadius:'14px', cursor:'pointer', fontWeight:'800', fontSize: '1rem' }}>Browse Venues</button>
    </div>
  );

  if (requestSent) return (
    <div style={{ textAlign:'center', padding:'4rem 2rem', maxWidth:'500px', margin:'0 auto', minHeight:'calc(100vh - 72px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'#DCEFB8', border: '2px solid #CEF17B', display:'flex', alignItems:'center', justifyContent:'center', color:'#CEF17B', fontSize:'2.5rem', marginBottom:'1.5rem', fontWeight: '900' }}>✓</div>
      <h2 style={{ color:'#161616', marginBottom:'0.75rem', fontSize:'2.2rem', fontWeight: '900' }}>Booking Confirmed!</h2>
      <p style={{ color:'#161616', fontWeight: '700', fontSize: '1.1rem', marginBottom:'0.5rem' }}>{turf.name}</p>
      <p style={{ color:'#666', marginBottom:'1.5rem', fontWeight: '500' }}>{date} | {selectedSlots.join(', ')}</p>
      <div style={{ background:'#f8f9fa', borderRadius:'20px', padding:'1.5rem 2.5rem', marginTop:'1rem', marginBottom:'2.5rem', border:'1.5px solid #eee' }}>
        <div style={{ fontSize:'0.9rem', color:'#888', fontWeight: '600', marginBottom: '4px' }}>Total Amount Paid</div>
        <div style={{ fontSize:'1.8rem', fontWeight:'900', color:'#CEF17B' }}>INR {totalAmount.toLocaleString()}</div>
      </div>
      <button onClick={() => navigate('/my-bookings')} style={{ background:'#CEF17B', color:'#084734', border:'none', padding:'16px 48px', borderRadius:'16px', cursor:'pointer', fontWeight:'800', fontSize: '1.05rem', boxShadow: '0 8px 25px rgba(8,71,52,0.2)' }}>View My Bookings</button>
    </div>
  );

  const inputStyle = { padding:'12px 16px', borderRadius:'12px', border:'1.5px solid #eee', fontSize:'0.95rem', fontWeight:'700', cursor:'pointer', minWidth:'180px', outline:'none', background: 'white' };
  const rowStyle = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' };

  return (
    <div style={{ background:'#F8FAF7', minHeight:'calc(100vh - 72px)' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding: isMobile ? '1.5rem 1rem 0' : '3rem 2rem 0' }}>
        <BackButton />
      </div>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding: isMobile ? '1rem 1rem 1.5rem' : '1.5rem 2rem 3rem', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: isMobile ? '1.5rem' : '3rem', alignItems:'start' }}>
        {/* LEFT */}
        <div>
          <div style={{ background:'white', borderRadius:'24px', padding:'2rem', border:'1px solid #eee', marginBottom:'2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <h2 style={{ fontSize:'1.8rem', fontWeight:'900', color:'#161616', marginBottom:'8px', letterSpacing: '-0.5px' }}>{turf.name}</h2>
                <p style={{ color:'#98A2B3', fontSize:'1rem', fontWeight: '500' }}>{turf.location}, {turf.city}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8f9fa', padding: '6px 14px', borderRadius: '12px', border: '1px solid #eee' }}>
                 <span style={{ fontWeight: '800', fontSize: '1rem', color: '#161616' }}>{turf.rating} Rating</span>
              </div>
            </div>
          </div>

          <div style={{ background:'white', borderRadius:'24px', padding:'2rem', border:'1px solid #eee', marginBottom:'2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={rowStyle}>
              <label style={{ fontWeight:'800', color:'#161616', fontSize: '1rem' }}>Activity</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {SPORTS.map(s => (
                  <button 
                    key={s}
                    onClick={() => setSport(s)}
                    style={{
                      padding: '10px 18px', borderRadius: '12px',
                      border: `1.5px solid ${sport === s ? '#CEF17B' : '#eee'}`,
                      background: sport === s ? '#CEF17B' : 'white',
                      color: sport === s ? '#084734' : '#98A2B3',
                      fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer',
                      transition: '0.2s all', outline: 'none'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={rowStyle}>
              <label style={{ fontWeight:'800', color:'#161616', fontSize: '1rem' }}>Date</label>
              <input type="date" value={date} onChange={e => {
                const newDate = e.target.value;
                setDate(newDate);
                // Clear slots that are now in the past when switching to today
                const today = new Date().toISOString().split('T')[0];
                if (newDate === today) {
                  const nowHour = new Date().getHours();
                  setSelectedSlots(prev =>
                    prev.filter(label => {
                      const slot = hourlySlots.find(s => s.label === label);
                      return slot ? slot.hour > nowHour : true;
                    })
                  );
                } else {
                  setSelectedSlots([]);
                }
              }} min={new Date().toISOString().split('T')[0]} style={inputStyle} />
            </div>
            <div style={rowStyle}>
              <label style={{ fontWeight:'800', color:'#161616', fontSize: '1rem' }}>Select Time Slot</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
              {slotsLoading ? (
                <div style={{ gridColumn: '1 / -1', color: '#94a3b8', fontWeight: '700', textAlign: 'center', padding: '1rem' }}>Loading slots...</div>
              ) : (
                hourlySlots.map((slot) => {
                  const isBooked = isSlotBooked(slot.label);
                  const isPast   = isSlotInPast(slot.hour);
                  const isUnavailable = isBooked || isPast;
                  const isSelected = selectedSlots.includes(slot.label);
                  return (
                    <button
                      key={slot.value}
                      disabled={isUnavailable}
                      onClick={() => {
                        if (!isUnavailable) toggleSlotSelection(slot.label);
                      }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: `2px solid ${isSelected ? '#CEF17B' : isUnavailable ? '#f5f5f5' : '#eee'}`,
                        background: isSelected ? '#CEF17B' : isUnavailable ? '#f5f5f5' : 'white',
                        color: isSelected ? '#084734' : isUnavailable ? '#ccc' : '#161616',
                        cursor: isUnavailable ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? '800' : '600',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1,
                        outline: 'none',
                        userSelect: 'none',
                        opacity: isPast && !isBooked ? 0.45 : 1,
                      }}
                    >
                      {isSelected && <span style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '0.9rem' }}>✓</span>}
                      {slot.label}
                      {isBooked && (
                        <div style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '600' }}>
                          Booked
                        </div>
                      )}
                      {isPast && !isBooked && (
                        <div style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '600' }}>
                          Past
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {selectedSlots.length > 0 && (
              <div style={{ background: '#DCEFB8', border: '1.5px solid #DCEFB8', borderRadius: '12px', padding: '12px 16px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#084734', marginBottom: '6px' }}>
                  Selected Slots ({selectedSlots.length})
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#15803d' }}>
                  {selectedSlots.join(', ')}
                </div>
              </div>
            )}
          </div>

          <div style={{ background:'white', borderRadius:'24px', padding:'2rem', border:'1px solid #eee' }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'800', marginBottom:'1rem', color: '#161616' }}>Policies</h3>
            <p style={{ fontSize:'0.9rem', color:'#666', lineHeight:1.7, marginBottom:'1.5rem', fontWeight: '500' }}>Cancellations allowed up to 2 hours before the slot. A 15% fee applies for late cancellations.</p>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'800', marginBottom:'1rem', color: '#161616' }}>Venue Rules</h3>
            <ul style={{ fontSize:'0.9rem', color:'#666', lineHeight:2, paddingLeft:'1.25rem', margin:0, fontWeight: '500' }}>
              <li>Please wear appropriate sports gear.</li>
              <li>Outside food and drinks are not allowed.</li>
              <li>Arrive 10 minutes early for check-in.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ position: isMobile ? 'static' : 'sticky', top:'100px' }}>
          <div style={{ background:'white', borderRadius:'24px', padding:'2rem', border:'1px solid #eee', marginBottom:'1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize:'1.2rem', fontWeight:'900', color: '#161616', marginBottom: '1.5rem' }}>Booking Summary</h3>
            <div style={{ background:'#F8FAF7', borderRadius:'16px', padding:'1.25rem', border:'1.5px solid #EEF2E6' }}>
              <div style={{ fontWeight:'800', fontSize:'1rem', marginBottom:'8px', color: '#161616' }}>{turf.name}</div>
              <div style={{ fontSize:'0.9rem', color:'#98A2B3', fontWeight: '600' }}>{date}</div>
              {selectedSlots.length > 0 && (
                <div style={{ fontSize:'0.85rem', color:'#CEF17B', fontWeight: '700', marginTop: '8px' }}>
                  {selectedSlots.join(', ')}
                </div>
              )}
            </div>
          </div>

          <div style={{ background:'white', borderRadius:'24px', padding:'2rem', border:'1px solid #eee', marginBottom:'1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize:'1.2rem', fontWeight:'900', marginBottom:'1.5rem', color: '#161616' }}>Price Breakdown</h3>

            {/* ── Turf Fee (court rental) ── */}
            {selectedSlots.length > 0 && slotPrices.some((p, i, arr) => p !== arr[0]) ? (
              /* Peak-hour per-slot breakdown */
              selectedSlots.map((label, i) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'0.88rem' }}>
                  <span style={{ color:'#98A2B3', fontWeight:'600' }}>{label}</span>
                  <span style={{ fontWeight:'800', color:'#161616' }}>INR {slotPrices[i].toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'0.95rem' }}>
                <span style={{ color:'#98A2B3', fontWeight:'600' }}>
                  Turf Fee ({numberOfSlots} {numberOfSlots === 1 ? 'Slot' : 'Slots'})
                </span>
                <span style={{ fontWeight:'800', color:'#161616' }}>
                  INR {courtPrice.toLocaleString()}
                </span>
              </div>
            )}

            {/* ── Total row with expandable convenient fee ── */}
            <div style={{ borderTop:'1.5px solid #EEF2E6', marginTop:'14px', paddingTop:'14px' }}>

              {/* Total clickable row */}
              <button
                onClick={() => numberOfSlots > 0 && setShowFeeBreakdown(p => !p)}
                style={{
                  width:'100%', background:'none', border:'none', padding:'0',
                  cursor: numberOfSlots > 0 ? 'pointer' : 'default',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontWeight:'900', fontSize:'1.15rem', color:'#161616' }}>Total</span>
                  {numberOfSlots > 0 && (
                    <span style={{
                      fontSize:'0.7rem', color:'#084734', fontWeight:'700',
                      background:'#DCEFB8', borderRadius:'20px', padding:'2px 8px',
                      display:'flex', alignItems:'center', gap:'3px',
                    }}>
                      incl. fees
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showFeeBreakdown ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s' }}>
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="#084734" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
                <span style={{ fontWeight:'900', fontSize:'1.25rem', color:'#084734' }}>
                  INR {totalAmount.toLocaleString()}
                </span>
              </button>

              {/* ── Expandable breakdown ── */}
              {showFeeBreakdown && numberOfSlots > 0 && (
                <div style={{
                  marginTop:'12px', background:'#F8FAF7', borderRadius:'14px',
                  border:'1.5px solid #EEF2E6', overflow:'hidden',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid #EEF2E6' }}>
                    <p style={{ fontSize:'0.72rem', fontWeight:'800', color:'#98A2B3', textTransform:'uppercase', letterSpacing:'1px', margin:0 }}>
                      Fee Breakdown
                    </p>
                  </div>

                  {/* Platform fee row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:'1px solid #EEF2E6' }}>
                    <div>
                      <span style={{ fontSize:'0.88rem', color:'#374151', fontWeight:'600' }}>Platform Fee</span>
                      <span style={{ fontSize:'0.72rem', color:'#98A2B3', marginLeft:'6px' }}>service charge</span>
                    </div>
                    <span style={{ fontSize:'0.9rem', fontWeight:'800', color:'#161616' }}>INR {platformFee}</span>
                  </div>

                  {/* GST row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px' }}>
                    <div>
                      <span style={{ fontSize:'0.88rem', color:'#374151', fontWeight:'600' }}>GST</span>
                      <span style={{ fontSize:'0.72rem', color:'#98A2B3', marginLeft:'6px' }}>18% on platform fee</span>
                    </div>
                    <span style={{ fontSize:'0.9rem', fontWeight:'800', color:'#161616' }}>INR {gstOnFee}</span>
                  </div>

                  {/* Subtotal of fees */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#DCEFB8', borderTop:'1.5px solid #CEF17B' }}>
                    <span style={{ fontSize:'0.85rem', fontWeight:'800', color:'#084734' }}>Total Fees</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:'900', color:'#084734' }}>
                      INR {totalConvenientFee.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleSendRequest} disabled={loading || selectedSlots.length === 0} style={{
            width:'100%', background: loading || selectedSlots.length === 0 ? '#DCEFB8' : '#CEF17B',
            color:'#084734', border:'none', padding:'20px', borderRadius:'20px',
            cursor: loading || selectedSlots.length === 0 ? 'not-allowed' : 'pointer', fontWeight:'900', fontSize:'1.15rem',
            boxShadow: selectedSlots.length > 0 ? '0 10px 30px rgba(8,71,52,0.2)' : 'none', transition:'all 0.3s',
          }}>{loading ? 'Processing...' : selectedSlots.length === 0 ? 'Select Slots' : `Pay INR ${totalAmount.toLocaleString()}`}</button>
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
             <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700' }}>Secure Transaction via Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
