import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

import { API_URL as API } from '../../config/api';

export default function BookingApprovals() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingBookings();
  }, [token]);

  const fetchPendingBookings = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/bookings/partner/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await axios.put(`${API}/bookings/approve/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Booking approved! User will be notified to complete payment.');
      fetchPendingBookings();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to approve booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Enter rejection reason (optional):');
    setActionLoading(bookingId);
    try {
      await axios.put(`${API}/bookings/reject/${bookingId}`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Booking rejected. User will be notified.');
      fetchPendingBookings();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#98A2B3', fontWeight: '600' }}>Loading pending bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'white', borderRadius: '20px', border: '1.5px solid #EEF2E6' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h3 style={{ color: '#161616', fontWeight: '800', marginBottom: '0.5rem' }}>No Pending Requests</h3>
        <p style={{ color: '#98A2B3', fontWeight: '600' }}>All booking requests have been reviewed.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#161616', marginBottom: '0.5rem' }}>
          Booking Requests
        </h2>
        <p style={{ color: '#98A2B3', fontWeight: '600' }}>
          {bookings.length} pending {bookings.length === 1 ? 'request' : 'requests'}
        </p>
      </div>

      {bookings.map(booking => (
        <div
          key={booking._id}
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '2px solid #fef3c7',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#161616' }}>
                  {booking.turf_id?.name}
                </h3>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  background: '#fff7ed',
                  color: '#c2410c',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #fed7aa'
                }}>
                  PENDING
                </span>
              </div>
              <p style={{ color: '#98A2B3', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
                👤 {booking.user_id?.name} ({booking.user_id?.phone})
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b' }}>
                ₹{booking.total_price}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginTop: '4px' }}>
                {new Date(booking.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#F8FAF7', padding: '10px 14px', borderRadius: '12px', border: '1px solid #EEF2E6' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                Date
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#161616' }}>
                {booking.date}
              </div>
            </div>
            <div style={{ background: '#F8FAF7', padding: '10px 14px', borderRadius: '12px', border: '1px solid #EEF2E6', flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                Time Slots
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616' }}>
                {booking.time_slots.join(', ')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleApprove(booking._id)}
              disabled={actionLoading === booking._id}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: actionLoading === booking._id ? '#94d3b2' : '#CEF17B',
                color: 'white',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: actionLoading === booking._id ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {actionLoading === booking._id ? 'Processing...' : '✓ Approve'}
            </button>
            <button
              onClick={() => handleReject(booking._id)}
              disabled={actionLoading === booking._id}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '2px solid #fee2e2',
                background: 'white',
                color: '#ef4444',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: actionLoading === booking._id ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {actionLoading === booking._id ? 'Processing...' : '✕ Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
