import { useState } from 'react';
import axios from 'axios';
import { 
  ChevronLeft, Search, Filter, Check,
  MapPin, Star,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { API_URL as API } from '../../config/api';

export default function CreateBooking({ turfs = [], onCancel, onComplete }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('6:00 AM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { id: 1, label: 'Select Venue' },
    { id: 2, label: 'Select Date & Time' },
    { id: 3, label: 'Add Extras' },
    { id: 4, label: 'Confirm Booking' }
  ];

  const displayVenues = turfs.length > 0 ? turfs : [];
  const serviceFee = selectedVenue ? Math.round((selectedVenue.price_per_hour || 0) * 0.05) : 0;
  const total = selectedVenue ? (selectedVenue.price_per_hour || 0) + serviceFee : 0;

  const createBooking = async () => {
    if (!selectedVenue) return;
    setSaving(true);
    setError('');
    try {
      // Use /bookings/direct which is the correct endpoint
      await axios.post(`${API}/bookings/direct`, {
        turf_id: selectedVenue._id,
        date,
        time_slots: [timeSlot],
        total_price: total,
        payment_id: `partner_${Date.now()}`,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '100px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
         <button onClick={onCancel} style={backBtn}><ChevronLeft size={20} /> Bookings</button>
         <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>/</span>
         <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Create Booking</h2>
      </div>

      {/* STEPPER */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
         {steps.map(s => (
           <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '28px', height: '28px', borderRadius: '50%',
                background: step >= s.id ? '#CEF17B' : '#DCEFB8',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: '800'
              }}>{step > s.id ? <Check size={16} /> : s.id}</div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: step >= s.id ? '#161616' : '#94a3b8' }}>{s.label}</span>
              {s.id !== 4 && <div style={{ width: '40px', height: '1.5px', background: '#DCEFB8', marginLeft: '10px' }} />}
           </div>
         ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem' }}>
         {/* MAIN CONTENT */}
         <div>
            {step === 1 && (
              <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: '800', fontSize: '1.1rem' }}>Select Venue</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <div style={{ position: 'relative' }}>
                          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input type="text" placeholder="Search venues..." style={{ ...smallInput, paddingLeft: '38px' }} />
                       </div>
                       <button style={filterBtn}><Filter size={18} /> Filters</button>
                    </div>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {displayVenues.length > 0 ? displayVenues.map(v => (
                      <div 
                        key={v._id} 
                        onClick={() => setSelectedVenue(v)}
                        style={{ 
                          ...venueCard, 
                          borderColor: selectedVenue?._id === v._id ? '#CEF17B' : '#EEF2E6',
                          background: selectedVenue?._id === v._id ? '#DCEFB8' : 'white'
                        }}
                      >
                         <div style={{ width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden' }}>
                            <img src={v.images?.[0] || "/images/football.png"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                               <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <span style={{ fontWeight: '800', fontSize: '1rem' }}>{v.name}</span>
                                     <span style={{ fontSize: '0.65rem', fontWeight: '800', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px' }}>{v.sport || 'Turf'}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#98A2B3', marginTop: '4px', fontWeight: '600' }}>
                                     <MapPin size={14} /> {v.location}, {v.city}
                                  </div>
                               </div>
                               <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#CEF17B' }}>₹{v.price_per_hour}/hr</div>
                               </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px', alignItems: 'center' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                                  <Star size={14} fill="#f59e0b" color="#f59e0b" /> {v.rating || '0.0'}
                               </div>
                               <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                               <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#98A2B3' }}>{v.amenities?.join(' • ') || 'Standard Facilities'}</div>
                            </div>
                         </div>
                         {selectedVenue?._id === v._id && (
                           <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                              <Check size={16} strokeWidth={3} />
                           </div>
                         )}
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: '600' }}>No venues available</div>
                    )}
                 </div>
                 <button style={{ width: '100%', marginTop: '1.5rem', padding: '14px', borderRadius: '12px', border: 'none', background: '#F8FAF7', fontWeight: '700', color: '#98A2B3', cursor: 'pointer' }}>View More Venues</button>
              </div>
            )}

            {step === 2 && (
              <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1.5px solid #EEF2E6', textAlign: 'center' }}>
                <h3 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '1rem' }}>Select Date & Time</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '520px', margin: '0 auto' }}>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={smallInput} />
                  <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} style={{ ...smallInput, width: '100%' }}>
                    {['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map(slot => <option key={slot}>{slot}</option>)}
                  </select>
                </div>
                <button onClick={() => setStep(1)} style={{ marginTop: '2rem', padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #EEF2E6', background: 'none', fontWeight: '700', cursor: 'pointer' }}>Back to Venue</button>
              </div>
            )}

            {step >= 3 && (
              <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1.5px solid #EEF2E6', textAlign: 'center' }}>
                <h3 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '1rem' }}>Confirm Booking</h3>
                <p style={{ color: '#98A2B3', fontWeight: '500' }}>Create this booking for {selectedVenue?.name}.</p>
                {error && <p style={{ color: '#ef4444', fontWeight: '700', marginTop: '1rem' }}>{error}</p>}
                <button onClick={createBooking} disabled={saving} style={{ ...btnSecondary, margin: '2rem auto 0', background: '#CEF17B', color: '#084734', border: 'none' }}>
                  {saving ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            )}
         </div>

          {/* RIGHT SUMMARY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={summaryCard}>
               <h4 style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Booking Summary</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <SummaryRow label="Venue" value={selectedVenue?.name || '---'} />
                  <SummaryRow label="Sport" value={selectedVenue?.sport || '---'} />
                  <SummaryRow label="Date" value={date} />
                  <SummaryRow label="Time" value={timeSlot} />
                  <SummaryRow label="Duration" value="1 Hour" />
                  <div style={{ height: '1px', background: '#EEF2E6', margin: '5px 0' }} />
                  <SummaryRow label="Price Details" value={selectedVenue ? `₹${selectedVenue.price_per_hour}` : '---'} />
                  <SummaryRow label="Service Fee" value={`₹${serviceFee}`} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                     <span style={{ fontWeight: '800', fontSize: '1rem' }}>Total Amount</span>
                     <span style={{ fontWeight: '900', fontSize: '1.2rem', color: '#CEF17B' }}>₹ {total.toLocaleString()}</span>
                  </div>
               </div>
               
               <button 
                 disabled={!selectedVenue}
                 onClick={() => step >= 3 ? createBooking() : setStep(step + 1)}
                 style={{ 
                   width: '100%', marginTop: '2rem', padding: '16px', borderRadius: '14px', 
                   border: 'none', background: selectedVenue ? '#CEF17B' : '#DCEFB8', 
                   color: 'white', fontWeight: '800', fontSize: '1rem', cursor: selectedVenue ? 'pointer' : 'not-allowed',
                   boxShadow: selectedVenue ? '0 10px 25px rgba(30,190,116,0.2)' : 'none',
                   transition: '0.3s'
                 }}
               >
                 {step >= 3 ? (saving ? 'Creating...' : 'Create Booking') : `Continue to Step ${step + 1}`}
               </button>
            </div>

            <div style={{ ...summaryCard, background: '#DCEFB8', border: '1.5px solid #DCEFB8', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#DCEFB8', color: '#084734', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>%</div>
               <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#161616' }}>Save More with Offers!</div>
                  <div style={{ fontSize: '0.7rem', color: '#98A2B3', fontWeight: '600' }}>Apply available offers and save</div>
               </div>
               <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
            </div>

            <div style={{ ...summaryCard, background: '#0f172a', border: 'none' }}>
               <h4 style={{ fontWeight: '800', fontSize: '0.9rem', color: 'white', marginBottom: '8px' }}>Need Help?</h4>
               <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.5rem', fontWeight: '500' }}>Our support team is here to help you</p>
               <button style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #334155', background: 'transparent', color: '#CEF17B', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>Contact Support</button>
            </div>
          </div>
       </div>

      {/* FIXED BOTTOM NAVIGATION */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: '260px', right: 0, 
        background: 'white', borderTop: '1.5px solid #EEF2E6', padding: '1rem 3rem',
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', zIndex: 1000,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.03)'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            {selectedVenue && (
              <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: '700', textTransform: 'uppercase' }}>Selected Venue</div>
                 <div style={{ fontSize: '1rem', fontWeight: '800', color: '#161616' }}>{selectedVenue.name}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
               {step > 1 && (
                 <button onClick={() => setStep(step - 1)} style={{ ...btnSecondary, padding: '14px 28px' }}>Back</button>
               )}
               <button 
                 disabled={!selectedVenue}
                 onClick={() => step >= 3 ? createBooking() : setStep(step + 1)}
                 style={{ 
                   background: selectedVenue ? '#CEF17B' : '#DCEFB8', 
                   color: 'white', border: 'none', padding: '14px 40px', borderRadius: '12px',
                   fontWeight: '800', fontSize: '1rem', cursor: selectedVenue ? 'pointer' : 'not-allowed',
                   boxShadow: selectedVenue ? '0 10px 25px rgba(30,190,116,0.2)' : 'none',
                   transition: '0.3s'
                 }}
               >
                 {step >= 3 ? (saving ? 'Creating...' : 'Create Booking') : `Continue to ${steps.find(s => s.id === step + 1)?.label || 'Next Step'}`}
               </button>
            </div>
         </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
   </div>
  );
}

const btnSecondary = {
  background: 'white', color: '#161616', border: '1.5px solid #EEF2E6', padding: '10px 20px',
  borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', display: 'flex',
  alignItems: 'center', gap: '8px', cursor: 'pointer'
};

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
       <span style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '600' }}>{label}</span>
       <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#161616' }}>{value}</span>
    </div>
  );
}

const backBtn = {
  background: 'none', border: 'none', color: '#98A2B3', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.9rem'
};

const smallInput = {
  padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E9EDE8',
  fontSize: '0.85rem', outline: 'none', width: '220px', boxSizing: 'border-box',
};

const filterBtn = {
  display: 'flex', alignItems: 'center', gap: '8px', padding: '0 15px',
  borderRadius: '10px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem',
  fontWeight: '600', color: '#98A2B3', cursor: 'pointer'
};

const venueCard = {
  display: 'flex', gap: '20px', padding: '1.2rem', borderRadius: '16px',
  border: '1.5px solid #EEF2E6', cursor: 'pointer', transition: '0.2s',
  alignItems: 'center'
};

const summaryCard = {
  background: 'white', padding: '1.8rem', borderRadius: '16px', border: '1.5px solid #EEF2E6'
};
