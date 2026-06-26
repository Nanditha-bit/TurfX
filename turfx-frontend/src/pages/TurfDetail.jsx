import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReviewCard from '../components/ReviewCard';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';

import { API_URL as API } from '../config/api';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

export default function TurfDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useWindowWidth() < 768;
  const [turf, setTurf] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    axios.get(`${API}/turfs/${id}`).then(res => setTurf(res.data)).catch(console.error);
    axios.get(`${API}/reviews/${id}`).then(res => {
      const reviewData = Array.isArray(res.data) ? res.data : (res.data.reviews || []);
      setReviews(reviewData);
    }).catch(console.error);
  }, [id]);

  const handleReview = async () => {
    if (!token) return navigate('/login');
    if (!comment.trim()) { setReviewError('Please write a comment before submitting.'); return; }
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess(false);
    try {
      await axios.post(
        `${API}/reviews`,
        { turf_id: id, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment('');
      setRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      // Refresh reviews list
      const res = await axios.get(`${API}/reviews/${id}`);
      const reviewData = Array.isArray(res.data) ? res.data : (res.data.reviews || []);
      setReviews(reviewData);
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.detail || 'Failed to submit review. Please try again.';
      setReviewError(msg);
    } finally {
      setReviewLoading(false);
    }
  };

  if (!turf) return <div style={{ textAlign:'center', padding:'10rem', color:'#94a3b8', fontWeight: '700', fontSize: '1.2rem' }}>LOADING...</div>;

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'4rem 2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <BackButton />
      </div>
      {/* Hero Banner with Image Gallery */}
      <div style={{ marginBottom:'3.5rem' }}>
        {/* Main Image */}
        <div style={{
          borderRadius:'32px', height:'450px',
          marginBottom:'1.5rem', position:'relative', overflow:'hidden',
          background: '#F8FAF7',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        }}>
          {turf.images && turf.images.length > 0 ? (
            <img 
              src={turf.images[selectedImage]} 
              alt={turf.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '2rem', fontWeight: '900' }}>
              PREMIUM VENUE
            </div>
          )}
          <div style={{
            position:'absolute', bottom:'32px', left:'32px',
            background:'rgba(255,255,255,0.98)', backdropFilter:'blur(12px)',
            borderRadius:'20px', padding:'14px 32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          }}>
            <span style={{ color:'#084734', fontWeight:'900', fontSize:'1.1rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {turf.sport}
            </span>
          </div>
        </div>

        {/* Image Thumbnails */}
        {turf.images && turf.images.length > 1 && (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {turf.images.map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(index)}
                style={{
                  width: '120px',
                  height: '80px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedImage === index ? '3px solid #CEF17B' : '2px solid #EEF2E6',
                  flexShrink: 0,
                  transition: 'all 0.3s',
                  opacity: selectedImage === index ? 1 : 0.6,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = selectedImage === index ? '1' : '0.6'}
              >
                <img
                  src={img}
                  alt={`${turf.name} ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Videos Section */}
        {turf.videos && turf.videos.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '900', color: '#161616', letterSpacing: '-0.5px' }}>
              Venue Videos ({turf.videos.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {turf.videos.map((video, index) => (
                <div
                  key={index}
                  style={{
                    aspectRatio: '16/9',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#000',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  }}
                >
                  <video
                    src={video}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    controls
                    muted
                    loop
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => e.target.pause()}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: isMobile ? '2rem' : '5rem', alignItems:'start' }}>
        {/* LEFT — Info */}
        <div>
          <h1 style={{ fontSize:'3.5rem', fontWeight:'900', marginBottom:'16px', color:'#161616', letterSpacing: '-1.5px', lineHeight: 1.1 }}>{turf.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#98A2B3', fontSize: '1.15rem', marginBottom: '3rem', fontWeight: '500' }}>
             <span>{turf.location}, {turf.city}</span>
          </div>

          {turf.amenities?.length > 0 && (
            <div style={{ marginBottom:'4rem' }}>
              <h3 style={{ marginBottom:'1.75rem', fontSize:'1.5rem', fontWeight:'900', color: '#161616', letterSpacing: '-0.5px' }}>Top Amenities</h3>
              <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                {turf.amenities.map((a,i) => (
                  <span key={i} style={{ background:'#F8FAF7', color:'#161616', border:'1.5px solid #EEF2E6', padding:'12px 24px', borderRadius:'16px', fontSize:'1rem', fontWeight:'700' }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div style={{ marginTop:'2rem' }}>
            <h3 style={{ marginBottom:'2rem', fontSize:'1.5rem', fontWeight:'900', color: '#161616', letterSpacing: '-0.5px' }}>Player Experiences ({Array.isArray(reviews) ? reviews.length : 0})</h3>
            {(!Array.isArray(reviews) || reviews.length === 0) && <p style={{ color:'#94a3b8', fontSize: '1.1rem', fontWeight: '500' }}>No reviews yet. Be the first to share your experience!</p>}
            {Array.isArray(reviews) && reviews.map(r => <ReviewCard key={r._id} review={r} />)}
            {user && (
              <div style={{ marginTop:'4rem', background:'white', borderRadius:'32px', padding:'3rem', border:'1.5px solid #EEF2E6', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <h4 style={{ marginBottom:'2rem', fontSize:'1.4rem', fontWeight:'900', color: '#161616' }}>Write a Review</h4>

                {reviewSuccess && (
                  <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:'12px', padding:'12px 16px', marginBottom:'1.5rem', color:'#16a34a', fontWeight:'700', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'8px' }}>
                    ✓ Review submitted successfully!
                  </div>
                )}

                {reviewError && (
                  <div style={{ background:'#fff1f2', border:'1.5px solid #fecdd3', borderRadius:'12px', padding:'12px 16px', marginBottom:'1.5rem', color:'#be123c', fontWeight:'700', fontSize:'0.9rem' }}>
                    {reviewError}
                  </div>
                )}

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: '#98A2B3', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Rate your experience</label>
                  <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ padding:'16px', borderRadius:'16px', border:'1.5px solid #EEF2E6', width:'100%', fontSize:'1.1rem', outline: 'none', background: '#F8FAF7', fontWeight: '700', cursor: 'pointer' }}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} / 5 Rating</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '2.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: '#98A2B3', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Feedback</label>
                  <textarea
                    placeholder="Tell us about the turf quality, lighting, and service..."
                    value={comment}
                    onChange={e => { setComment(e.target.value); setReviewError(''); }}
                    rows={5}
                    style={{ width:'100%', padding:'18px', borderRadius:'16px', border:'1.5px solid #EEF2E6', fontSize:'1.1rem', resize:'none', boxSizing:'border-box', outline: 'none', background: '#F8FAF7', fontWeight: '600', lineHeight: 1.6 }}
                  />
                </div>
                <button
                  onClick={handleReview}
                  disabled={reviewLoading}
                  style={{
                    background: reviewLoading ? '#b5d96a' : '#084734',
                    color: '#CEF17B', border: 'none', padding: '18px 48px',
                    borderRadius: '18px', cursor: reviewLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '900', fontSize: '1.1rem',
                    boxShadow: reviewLoading ? 'none' : '0 8px 25px rgba(8,71,52,0.3)',
                    transition: 'all 0.3s', opacity: reviewLoading ? 0.7 : 1,
                  }}
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Booking Card */}
        <div style={{ position: isMobile ? 'static' : 'sticky', top:'120px' }}>
          <div style={{ background:'white', borderRadius:'32px', padding:'3rem', border:'1.5px solid #EEF2E6', boxShadow:'0 30px 60px rgba(0,0,0,0.1)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.5rem' }}>
              <div>
                <span style={{ fontSize:'2.8rem', fontWeight:'900', color:'#161616', letterSpacing: '-1px' }}>₹{turf.price_per_hour}</span>
                <span style={{ fontSize:'1.1rem', color:'#98A2B3', fontWeight:'600' }}> / hr</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#DCEFB8', padding: '8px 16px', borderRadius: '12px', border: '1px solid #DCEFB8' }}>
                 <span style={{ color: '#084734', fontWeight: '900', fontSize: '1.2rem' }}>{turf.rating}</span>
                 <span style={{ color: '#084734', fontSize: '0.85rem', fontWeight: '800' }}>RATING</span>
              </div>
            </div>
            <p style={{ fontSize:'0.8rem', color:'#94a3b8', fontWeight:'600', marginBottom:'2.5rem' }}>
              + Platform Fee &amp; Turf Fee applicable at checkout
            </p>

            <div style={{ borderTop:'1.5px solid #EEF2E6', borderBottom: '1.5px solid #EEF2E6', padding:'1.5rem 0', marginBottom:'2.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'14px', fontSize:'1rem' }}>
                <span style={{ color:'#98A2B3', fontWeight: '600' }}>Sport</span><span style={{ fontWeight:'800', color: '#161616' }}>{turf.sport}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'14px', fontSize:'1rem' }}>
                <span style={{ color:'#98A2B3', fontWeight: '600' }}>Location</span><span style={{ fontWeight:'800', color: '#161616' }}>{turf.city}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1rem' }}>
                <span style={{ color:'#98A2B3', fontWeight: '600' }}>Availability</span>
                <span style={{ fontWeight:'900', color: turf.isActive !== false ? '#CEF17B' : '#ef4444' }}>
                  {turf.isActive !== false ? 'OPEN TODAY' : 'TEMPORARILY CLOSED'}
                </span>
              </div>
            </div>

            <button onClick={() => navigate(`/checkout/${turf._id}`, { state:{ turf } })} style={{
              width:'100%', background:'#CEF17B', color:'#084734',
              border:'none', padding:'20px', borderRadius:'20px',
              cursor:'pointer', fontWeight:'900', fontSize:'1.25rem',
              boxShadow:'0 10px 30px rgba(8,71,52,0.2)', transition:'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 15px 40px rgba(30,190,116,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 30px rgba(30,190,116,0.4)'; }}
            >
              Reserve Now
            </button>
            <div style={{ textAlign:'center', marginTop:'20px', fontSize:'0.9rem', color:'#94a3b8', fontWeight: '600' }}>
              Instant Booking Confirmation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
