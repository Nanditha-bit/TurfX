import { useLocation, useNavigate } from 'react-router-dom';
import { API_URL as API } from '../config/api';

export default function BookingConfirmed() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const booking = state?.booking;

  // Fallback if navigated directly without state
  if (!booking) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAF7', padding: '2rem', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#DCEFB8', border: '2px solid #CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>✓</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#161616', marginBottom: '0.75rem' }}>Booking Confirmed!</h2>
          <p style={{ color: '#666', fontSize: '1rem', fontWeight: 500, marginBottom: '2rem' }}>Your booking was successful. Check your email for details.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/my-bookings')} style={btnPrimary}>View My Bookings</button>
            <button onClick={() => navigate('/')} style={btnOutline}>Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const { turf, date, slots, totalAmount, bookingId, paymentId } = booking;

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#F8FAF7', padding: '3rem 1.5rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, #084734 0%, #0a5e44 100%)',
            border: '3px solid #CEF17B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.8rem', margin: '0 auto 1.5rem',
            boxShadow: '0 12px 40px rgba(8,71,52,0.3)',
          }}>✓</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#161616', marginBottom: '0.4rem' }}>Booking Confirmed!</h1>
          <p style={{ color: '#666', fontSize: '1rem', fontWeight: 500 }}>
            Your venue has been successfully reserved.
          </p>
        </div>

        {/* Booking ID banner */}
        {bookingId && (
          <div style={{
            background: '#084734', borderRadius: '14px', padding: '1rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1.5rem',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(206,241,123,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Booking ID</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#CEF17B', letterSpacing: '1px' }}>
                #{bookingId.toString().slice(-8).toUpperCase()}
              </div>
            </div>
            <div style={{ background: 'rgba(206,241,123,0.15)', border: '1px solid rgba(206,241,123,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 800, color: '#CEF17B' }}>
              CONFIRMED
            </div>
          </div>
        )}

        {/* Booking details card */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #EEF2E6', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          {turf?.name && (
            <div style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid #EEF2E6' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Venue</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#161616' }}>{turf.name}</div>
              {(turf.location || turf.city) && (
                <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500, marginTop: '3px' }}>
                  📍 {[turf.location, turf.city].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid #EEF2E6' }}>
            {date && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Date</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#161616' }}>📅 {date}</div>
              </div>
            )}
            {slots?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Time Slots</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#161616' }}>⏰ {slots.join(', ')}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>Total Amount Paid</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#084734' }}>₹{(totalAmount || 0).toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>Payment Status</div>
            <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>Paid</span>
          </div>
          {paymentId && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#98A2B3', fontWeight: 500 }}>
              Payment ID: {paymentId}
            </div>
          )}
        </div>

        {/* Email notice */}
        <div style={{
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>📧</span>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e40af', fontWeight: 500, lineHeight: 1.5 }}>
            A confirmation email with your booking details has been sent to your registered email address.
          </p>
        </div>

        {/* Cancellation policy */}
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '2rem',
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400E', marginBottom: '8px' }}>⚠️ Cancellation Policy</div>
          {[
            'Cancel within 1 hour of booking → 100% refund',
            'Cancel 2+ hours before start time → 50% refund',
            'Cancel within 2 hours of start time → No refund',
          ].map((item, i) => (
            <div key={i} style={{ fontSize: '0.82rem', color: '#78350F', fontWeight: 500, marginBottom: '4px' }}>• {item}</div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button onClick={() => navigate('/my-bookings')} style={btnPrimary}>📋 My Bookings</button>
          <button onClick={() => navigate('/')} style={btnOutline}>🏠 Go Home</button>
        </div>

      </div>
    </div>
  );
}

const btnPrimary = {
  background: '#084734', color: '#CEF17B', border: 'none',
  padding: '14px 20px', borderRadius: '12px', cursor: 'pointer',
  fontWeight: 800, fontSize: '0.95rem',
  boxShadow: '0 6px 20px rgba(8,71,52,0.3)',
  transition: 'all 0.2s',
};

const btnOutline = {
  background: 'white', color: '#084734',
  border: '2px solid #084734',
  padding: '14px 20px', borderRadius: '12px', cursor: 'pointer',
  fontWeight: 800, fontSize: '0.95rem',
  transition: 'all 0.2s',
};
