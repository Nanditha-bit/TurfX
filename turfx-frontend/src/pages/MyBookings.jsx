import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import {
  MapPin, Calendar, Clock, Users, Tag, Star,
  DollarSign, Info, ExternalLink, CalendarX, X,
  Trophy
} from 'lucide-react';
import { API_URL as API } from '../config/api';

const TIME_SLOTS = [
  '06:00 AM to 07:00 AM', '07:00 AM to 08:00 AM', '08:00 AM to 09:00 AM',
  '09:00 AM to 10:00 AM', '10:00 AM to 11:00 AM', '11:00 AM to 12:00 PM',
  '12:00 PM to 01:00 PM', '01:00 PM to 02:00 PM', '02:00 PM to 03:00 PM',
  '03:00 PM to 04:00 PM', '04:00 PM to 05:00 PM', '05:00 PM to 06:00 PM',
  '06:00 PM to 07:00 PM', '07:00 PM to 08:00 PM', '08:00 PM to 09:00 PM',
  '09:00 PM to 10:00 PM', '10:00 PM to 11:00 PM',
];

const SPORT_BG = {
  football: 'linear-gradient(135deg, #1a5c38 0%, #2d8a55 100%)',
  cricket: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a8a 100%)',
  badminton: 'linear-gradient(135deg, #3a1a5c 0%, #6a2d8a 100%)',
  tennis: 'linear-gradient(135deg, #5c3a1a 0%, #8a6a2d 100%)',
  basketball: 'linear-gradient(135deg, #5c1a1a 0%, #8a3a2d 100%)',
  default: 'linear-gradient(135deg, #1a3a2d 0%, #2d5c45 100%)',
};

function getSportKey(sport) {
  return (sport || '').toLowerCase();
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return `Today, ${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeSlot(slots) {
  if (!slots) return 'N/A';
  if (Array.isArray(slots) && slots.length > 0) {
    // Convert "06:00 AM to 07:00 AM" → "6:00 AM – 7:00 AM"
    const first = slots[0];
    const last = slots[slots.length - 1];
    const startTime = first.split(' to ')[0];
    const endTime = last.split(' to ')[1];
    return `${startTime} – ${endTime}`;
  }
  if (typeof slots === 'string') {
    return slots.replace(' to ', ' – ');
  }
  return 'N/A';
}

function getDuration(slots) {
  const count = Array.isArray(slots) ? slots.length : 1;
  return count === 1 ? '1 Hour' : `${count} Hours`;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.toDateString() === new Date().toDateString();
}

export default function MyBookings() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('06:00 AM to 07:00 AM');
  const [qrModalBooking, setQrModalBooking] = useState(null);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/bookings/mine`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : (res.data.bookings || []);
          setBookings(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [token]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.put(`${API}/bookings/cancel/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch {
      alert('Failed to cancel booking');
    }
  };

  const handleReschedule = async (id) => {
    try {
      const res = await axios.put(`${API}/bookings/reschedule/${id}`,
        { newDate, newTimeSlot: newSlot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(prev => prev.map(b => b._id === id ? { ...res.data, turf_id: b.turf_id } : b));
      setRescheduleId(null);
      alert('Rescheduled successfully! ✅');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to reschedule');
    }
  };

  // Categorise bookings
  const upcoming = bookings.filter(b => ['confirmed', 'pending', 'approved'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'completed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  const tabData = { upcoming, completed, cancelled };
  const shown = tabData[activeTab] || [];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#F4F6F3' }}>

      {/* ── DARK GREEN HEADER ── */}
      <div style={{
        background: '#084734',
        padding: '3rem 2rem 2.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* grid overlay - same as home page */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <BackButton variant="dark" />
          </div>
          {/* YOUR ACTIVITY label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.6rem' }}>
            <div style={{ width: 28, height: 2, background: '#CEF17B' }} />
            <span style={{ color: '#CEF17B', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Your activity
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
                <span style={{ color: 'white' }}>My </span>
                <span style={{ color: '#CEF17B' }}>Bookings</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: '0.5rem', fontWeight: 500, fontSize: '1rem' }}>
                Manage your upcoming and past turf experiences
              </p>
            </div>

            {/* Stats cards */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { label: 'Upcoming', count: upcoming.length, active: activeTab === 'upcoming' },
                { label: 'Completed', count: completed.length, active: activeTab === 'completed' },
                { label: 'Cancelled', count: cancelled.length, active: activeTab === 'cancelled' },
              ].map(s => (
                <div
                  key={s.label}
                  onClick={() => setActiveTab(s.label.toLowerCase())}
                  style={{
                    background: s.active ? 'rgba(206,241,123,0.15)' : 'rgba(255,255,255,0.07)',
                    border: s.active ? '1.5px solid rgba(206,241,123,0.4)' : '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px', padding: '16px 24px', textAlign: 'center',
                    cursor: 'pointer', minWidth: 90, transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: s.active ? '#CEF17B' : 'white', lineHeight: 1 }}>
                    {s.count}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── pill style */}
      <div style={{ background: '#084734', padding: '0 2rem 1.8rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'white', borderRadius: '999px',
            padding: '6px', gap: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}>
            {['upcoming', 'completed', 'cancelled'].map(t => {
              const counts = { upcoming: upcoming.length, completed: completed.length, cancelled: cancelled.length };
              const isActive = activeTab === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 22px', borderRadius: '999px', border: 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: isActive ? '#084734' : 'transparent',
                    color: isActive ? '#CEF17B' : '#98A2B3',
                    fontSize: '0.92rem', fontWeight: 800,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  <span style={{
                    background: isActive ? 'rgba(206,241,123,0.25)' : '#EEF2E6',
                    color: isActive ? '#CEF17B' : '#6b7280',
                    borderRadius: '999px',
                    width: '22px', height: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 900,
                  }}>
                    {counts[t]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BOOKING CARDS ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#98A2B3', fontWeight: 700 }}>
            Loading your bookings...
          </div>
        )}

        {!loading && shown.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'white', borderRadius: '20px',
            border: '1.5px solid #EEF2E6',
          }}>
            <CalendarX size={52} style={{ margin: '0 auto 1rem', display: 'block', color: '#cbd5e1' }} />
            <p style={{ color: '#98A2B3', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              No {activeTab} bookings yet.
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/explore')}
                style={{
                  padding: '12px 28px', borderRadius: '12px', border: 'none',
                  background: '#084734', color: 'white', fontWeight: 800,
                  cursor: 'pointer', fontSize: '0.95rem',
                }}
              >
                Explore Venues
              </button>
            )}
          </div>
        )}

        {shown.map(b => (
          <BookingCard
            key={b._id}
            booking={b}
            activeTab={activeTab}
            rescheduleId={rescheduleId}
            newDate={newDate}
            newSlot={newSlot}
            setRescheduleId={setRescheduleId}
            setNewDate={setNewDate}
            setNewSlot={setNewSlot}
            handleCancel={handleCancel}
            handleReschedule={handleReschedule}
            setQrModalBooking={setQrModalBooking}
          />
        ))}
      </div>

      {/* QR Modal */}
      {qrModalBooking && (
        <QRModal booking={qrModalBooking} token={token} onClose={() => setQrModalBooking(null)} />
      )}
    </div>
  );
}

function BookingCard({
  booking: b, activeTab, rescheduleId, newDate, newSlot,
  setRescheduleId, setNewDate, setNewSlot, handleCancel, handleReschedule,
  setQrModalBooking,
}) {
  const navigate = useNavigate();
  const sportKey = getSportKey(b.turf_id?.sport);
  const bg = SPORT_BG[sportKey] || SPORT_BG.default;
  const todayBooking = isToday(b.date);
  const timeStr = formatTimeSlot(Array.isArray(b.time_slots) ? b.time_slots : b.time_slot ? [b.time_slot] : []);
  const duration = getDuration(Array.isArray(b.time_slots) ? b.time_slots : b.time_slot ? [b.time_slot] : []);

  return (
    <div style={{
      background: 'white', borderRadius: '20px', marginBottom: '1.2rem',
      border: '1.5px solid #EEF2E6', overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      display: 'flex',
    }}>
      {/* Sport thumbnail */}
      <div style={{
        width: 200, minHeight: 160, background: bg, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        padding: '1rem',
        position: 'relative',
      }}>
        <div style={{ marginBottom: '0.5rem', lineHeight: 1 }}>
          <Trophy size={48} color="white" />
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.45)', borderRadius: '8px',
          padding: '4px 12px', color: 'white',
          fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>
          {b.turf_id?.sport || 'Sport'}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '1.4rem 1.6rem', display: 'flex', gap: '1rem' }}>
        {/* Left: details */}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: '#161616' }}>
            {b.turf_id?.name || 'Turf'}
          </h3>
          <p style={{ margin: '0 0 1rem', color: '#98A2B3', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} /> {b.turf_id?.location}{b.turf_id?.city ? `, ${b.turf_id.city}` : ''}
          </p>

          {/* Info grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <InfoChip icon={<Calendar size={14} />} label="Date" value={formatDate(b.date)} />
            <InfoChip icon={<Clock size={14} />} label="Time" value={timeStr} />
            <InfoChip icon={<Clock size={14} />} label="Duration" value={duration} />
            {activeTab === 'upcoming' && b.turf_id?.players && (
              <InfoChip icon={<Users size={14} />} label="Players" value={b.turf_id.players} />
            )}
            {activeTab === 'upcoming' && b.turf_id?.amenities?.length > 0 && (
              <InfoChip icon={<Tag size={14} />} label="Amenities" value={b.turf_id.amenities.slice(0, 2).join(', ')} />
            )}
            {activeTab === 'completed' && b.rating && (
              <InfoChip icon={<Star size={14} />} label="Your Rating" value={`${b.rating} / 5`} />
            )}
            {activeTab === 'completed' && !b.rating && (
              <InfoChip icon={<Star size={14} />} label="Your Rating" value="Not rated" />
            )}
            {activeTab === 'cancelled' && b.refund_amount && (
              <InfoChip icon={<DollarSign size={14} />} label="Refund" value={`₹${b.refund_amount} refunded`} />
            )}
            {activeTab === 'cancelled' && (
              <InfoChip icon={<Info size={14} />} label="Reason" value={b.cancel_reason || 'Cancelled by user'} />
            )}
          </div>
        </div>

        {/* Right: price + status + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 160 }}>
          <div style={{ textAlign: 'right' }}>
            {/* Status badge */}
            {todayBooking && activeTab === 'upcoming' ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#F0FDF4', border: '1.5px solid #86efac',
                borderRadius: '999px', padding: '4px 12px',
                fontSize: '0.75rem', fontWeight: 800, color: '#16a34a',
                marginBottom: '6px',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                TODAY
              </div>
            ) : (
              <StatusBadge status={b.status} />
            )}

            <div style={{ fontSize: '0.72rem', color: '#98A2B3', fontWeight: 700, marginBottom: '4px', marginTop: '4px' }}>
              ID: #{b.booking_id || b._id?.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#161616' }}>
              ₹{b.total_price}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: 600 }}>
              {activeTab === 'cancelled' ? `₹${b.refund_amount || 0} refunded` : 'paid'}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {activeTab === 'upcoming' && (
              <>
                {(b.status === 'confirmed' || b.status === 'approved') && (
                  <ActionBtn onClick={() => setQrModalBooking(b)}>
                    Show QR
                  </ActionBtn>
                )}
                {todayBooking && (
                  <ActionBtn primary onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(b.turf_id?.name || '')}`, '_blank')}>
                    Get Directions
                  </ActionBtn>
                )}
                <ActionBtn onClick={() => navigate(`/turf/${b.turf_id?._id}`)}>
                  View Details
                </ActionBtn>
                {(b.status === 'confirmed' || b.status === 'approved') && !todayBooking && (
                  <ActionBtn danger onClick={() => handleCancel(b._id)}>
                    Cancel Booking
                  </ActionBtn>
                )}
              </>
            )}
            {activeTab === 'completed' && (
              <>
                <ActionBtn onClick={() => navigate(`/checkout/${b.turf_id?._id}`)}>
                  Book Again
                </ActionBtn>
                {!b.rating && (
                  <ActionBtn onClick={() => navigate(`/turf/${b.turf_id?._id}`)}>
                    Rate &amp; Review
                  </ActionBtn>
                )}
                {b.rating && (
                  <ActionBtn onClick={() => alert('Receipt download coming soon')}>
                    Download Receipt
                  </ActionBtn>
                )}
              </>
            )}
            {activeTab === 'cancelled' && (
              <ActionBtn onClick={() => navigate(`/checkout/${b.turf_id?._id}`)}>
                Book Again
              </ActionBtn>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule panel */}
      {rescheduleId === b._id && (
        <div style={{
          borderTop: '1.5px dashed #EEF2E6', padding: '1.5rem',
          background: '#FAFCF8',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '15px', maxWidth: 600 }}>
            <div>
              <label style={labelStyle}>New Date</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                style={inputStyle} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label style={labelStyle}>New Time Slot</label>
              <select value={newSlot} onChange={e => setNewSlot(e.target.value)} style={inputStyle}>
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
            <button onClick={() => handleReschedule(b._id)} style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
              background: '#084734', color: 'white', fontWeight: 800, cursor: 'pointer',
            }}>
              Confirm Reschedule
            </button>
            <button onClick={() => setRescheduleId(null)} style={{
              padding: '12px 20px', borderRadius: '10px',
              border: '1.5px solid #EEF2E6', background: 'white',
              fontWeight: 700, cursor: 'pointer',
            }}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoChip({ icon, label, value }) {
  return (
    <div style={{
      background: '#F8FAF7', border: '1px solid #EEF2E6',
      borderRadius: '10px', padding: '8px 12px',
      display: 'flex', alignItems: 'flex-start', gap: '8px',
    }}>
      <span style={{ marginTop: '1px', color: '#6b7280', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.65rem', color: '#98A2B3', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#161616', marginTop: '1px' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { bg: '#F0FDF4', color: '#16a34a', border: '#86efac', label: 'Confirmed' },
    pending:   { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: 'Pending' },
    approved:  { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: 'Upcoming' },
    completed: { bg: '#F0FDF4', color: '#16a34a', border: '#86efac', label: 'Completed' },
    cancelled: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label: 'Cancelled' },
  };
  const s = map[status] || { bg: '#F8FAF7', color: '#98A2B3', border: '#EEF2E6', label: status };
  return (
    <div style={{
      display: 'inline-block', background: s.bg, color: s.color,
      border: `1.5px solid ${s.border}`, borderRadius: '999px',
      padding: '4px 12px', fontSize: '0.72rem', fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
    }}>
      {s.label}
    </div>
  );
}

function QRModal({ booking, token, onClose }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQr = async () => {
      try {
        const res = await fetch(`${API}/bookings/${booking._id}/qr`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setQrUrl(url);
      } catch (err) {
        console.error('Failed to load QR code:', err);
      } finally {
        setLoading(false);
      }
    };
    loadQr();
    return () => {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
    };
  }, [booking._id, token]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '2rem',
        maxWidth: '400px', width: '100%', position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          <X size={24} color="#666" />
        </button>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#161616' }}>
          Booking QR Code
        </h2>
        <p style={{ textAlign: 'center', color: '#98A2B3', marginBottom: '1.5rem' }}>
          Show this QR at the venue entrance
        </p>
        <div style={{
          display: 'flex', justifyContent: 'center',
          background: '#F9FAFB', padding: '1rem', borderRadius: '12px',
          border: '2px solid #EEF2E6', minHeight: '250px', alignItems: 'center',
        }}>
          {loading ? (
            <div>Loading QR...</div>
          ) : qrUrl ? (
            <img
              src={qrUrl}
              alt="Booking QR"
              style={{ width: '250px', height: '250px' }}
            />
          ) : (
            <div>Failed to load QR</div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontWeight: 600 }}>
          {booking.turf_id?.name}
        </p>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, primary, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer',
        fontSize: '0.82rem', fontWeight: 800, transition: 'all 0.2s',
        border: primary ? 'none' : danger ? '1.5px solid #fecdd3' : '1.5px solid #EEF2E6',
        background: primary ? '#084734' : 'white',
        color: primary ? 'white' : danger ? '#be123c' : '#161616',
        boxShadow: primary ? '0 4px 12px rgba(8,71,52,0.2)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 800,
  color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase',
};
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1.5px solid #EEF2E6', fontSize: '0.9rem',
  fontWeight: 700, outline: 'none', boxSizing: 'border-box',
};
