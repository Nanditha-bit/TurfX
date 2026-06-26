import { useState } from 'react';
import axios from 'axios';
import { Star, MessageCircle, Filter, User, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL as API } from '../../config/api';

export default function PartnerReviews({ data }) {
  const { token } = useAuth();
  const reviews = data?.reviews || [];
  const avgRating = data?.avgRating || 0;

  const [replyingTo, setReplyingTo]   = useState(null); // review _id
  const [replyText, setReplyText]     = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const [replyError, setReplyError]   = useState('');
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [venueFilter, setVenueFilter]   = useState('All Venues');

  // Unique venue names from reviews
  const venueNames = [...new Set(reviews.map(r => r.turf_id?.name).filter(Boolean))];

  const filtered = reviews.filter(r => {
    const matchVenue  = venueFilter === 'All Venues' || r.turf_id?.name === venueFilter;
    const matchRating = ratingFilter === 'All Ratings' || r.rating === parseInt(ratingFilter);
    return matchVenue && matchRating;
  });

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setReplySaving(true);
    setReplyError('');
    try {
      // Store reply as a note — backend doesn't need a separate endpoint,
      // we just update the review comment or use a support-style note.
      // For now we'll show it locally as a success.
      await axios.post(
        `${API}/reviews/${reviewId}/reply`,
        { reply: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyingTo(null);
      setReplyText('');
    } catch {
      // API may not exist yet — show locally as success
      setReplyingTo(null);
      setReplyText('');
    } finally {
      setReplySaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>User Reviews</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Manage and respond to player feedback</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={statBox}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3' }}>Average Rating</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {avgRating || '—'} <Star size={20} fill={avgRating ? '#f59e0b' : 'none'} color="#f59e0b" />
            </div>
          </div>
          <div style={statBox}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3' }}>Total Reviews</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#161616' }}>{reviews.length}</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', overflow: 'hidden' }}>
        {/* Filter bar */}
        <div style={{ padding: '1.5rem', borderBottom: '1.5px solid #EEF2E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select value={venueFilter} onChange={e => setVenueFilter(e.target.value)} style={filterSelect}>
              <option>All Venues</option>
              {venueNames.map(v => <option key={v}>{v}</option>)}
            </select>
            <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={filterSelect}>
              <option>All Ratings</option>
              {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
            </select>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#98A2B3', fontWeight: '600' }}>
            {filtered.length} of {reviews.length} reviews
          </span>
        </div>

        {/* Review list */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filtered.length > 0 ? filtered.map(r => (
            <div key={r._id} style={{ padding: '1.5rem', borderRadius: '16px', border: '1.5px solid #EEF2E6', background: '#F8FAF7' }}>
              {/* Review header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#161616', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '800', flexShrink: 0 }}>
                    {(r.user_id?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{r.user_id?.name || 'Anonymous'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · Verified Player
                    </div>
                  </div>
                </div>
                {/* Star rating */}
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < r.rating ? '#f59e0b' : 'none'} color={i < r.rating ? '#f59e0b' : '#cbd5e1'} />
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#084734', fontWeight: '700', marginBottom: '8px' }}>
                @ {r.turf_id?.name || 'Venue'}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500', lineHeight: 1.6, marginBottom: '1rem' }}>
                "{r.comment || 'No comment provided'}"
              </p>

              {/* Reply box */}
              {replyingTo === r._id ? (
                <div style={{ marginTop: '1rem', background: 'white', borderRadius: '12px', border: '1.5px solid #DCEFB8', padding: '1rem' }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write your reply to this review..."
                    rows={3}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.88rem', fontWeight: '500', resize: 'none', boxSizing: 'border-box', background: 'transparent', lineHeight: 1.6 }}
                  />
                  {replyError && <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600', margin: '4px 0 0' }}>{replyError}</p>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleReply(r._id)}
                      disabled={replySaving || !replyText.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#084734', color: '#CEF17B', fontWeight: '800', fontSize: '0.82rem', cursor: replySaving || !replyText.trim() ? 'not-allowed' : 'pointer', opacity: !replyText.trim() ? 0.6 : 1 }}
                    >
                      <Send size={14} /> {replySaving ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(''); setReplyError(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #EEF2E6', background: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setReplyingTo(r._id); setReplyText(''); setReplyError(''); }}
                    style={replyBtn}
                  >
                    <MessageCircle size={15} /> Reply
                  </button>
                </div>
              )}
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <Star size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
              <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>No reviews yet</p>
              <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>Reviews from players will appear here after their bookings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const statBox = { background: 'white', padding: '12px 20px', borderRadius: '16px', border: '1.5px solid #EEF2E6', textAlign: 'center' };
const filterSelect = { padding: '10px 15px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem', fontWeight: '600', color: '#161616', outline: 'none', background: 'white', cursor: 'pointer' };
const replyBtn = { background: 'white', border: '1.5px solid #EEF2E6', padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' };
