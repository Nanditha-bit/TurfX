import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Zap } from 'lucide-react';

// ── Default fallback images per sport (real turf photos) ─────────────────────
// Using Unsplash — free, no API key, reliable CDN
const SPORT_DEFAULT_IMAGES = {
  football:
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80&fit=crop',
  cricket:
    'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=600&q=80&fit=crop',
  badminton:
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&fit=crop',
  tennis:
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80&fit=crop',
  basketball:
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80&fit=crop',
  volleyball:
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80&fit=crop',
  swimming:
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80&fit=crop',
  'table tennis':
    'https://images.unsplash.com/photo-1611251135345-18c56206b863?w=600&q=80&fit=crop',
  // generic turf fallback
  default:
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80&fit=crop',
};

// Returns the best available image: uploaded first, then sport default
const getDisplayImage = (turf) => {
  if (turf.images && turf.images.length > 0) return turf.images[0];
  const key = (turf.sport || '').toLowerCase();
  return SPORT_DEFAULT_IMAGES[key] || SPORT_DEFAULT_IMAGES.default;
};

export default function TurfCard({ turf, listView }) {
  const navigate = useNavigate();
  const displayImage = getDisplayImage(turf);

  if (listView) {
    return (
      <div
        onClick={() => navigate(`/turf/${turf._id}`)}
        style={{
          background: 'white', borderRadius: '16px', overflow: 'hidden',
          border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex',
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Thumbnail */}
        <div style={{ width: '200px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <img
            src={displayImage}
            alt={turf.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            color: 'white', fontSize: '0.65rem', fontWeight: '800',
            padding: '3px 8px', borderRadius: '5px', textTransform: 'uppercase',
          }}>
            {turf.sport}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#161616', marginBottom: '4px' }}>
              {turf.name}
            </h3>
            <p style={{ color: '#98A2B3', fontSize: '0.85rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} /> {turf.location}, {turf.city}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {turf.amenities?.slice(0, 3).map((a, i) => (
                <span key={i} style={{ background: '#DCEFB8', color: '#084734', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '5px', fontWeight: '700', textTransform: 'uppercase' }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#161616' }}>
              ₹{turf.price_per_hour}
              <span style={{ fontSize: '0.85rem', color: '#98A2B3', fontWeight: '400' }}> / hr</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#98A2B3', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {turf.rating || 0}
            </div>
            <button
              onClick={e => { e.stopPropagation(); navigate(`/turf/${turf._id}`); }}
              style={{ background: '#084734', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
              onMouseEnter={e => { e.target.style.background = '#CEF17B'; e.target.style.color = '#084734'; }}
              onMouseLeave={e => { e.target.style.background = '#084734'; e.target.style.color = 'white'; }}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid card ────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => navigate(`/turf/${turf._id}`)}
      style={{
        background: 'white', borderRadius: '16px', overflow: 'hidden',
        border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Image */}
      <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
        <img
          src={displayImage}
          alt={turf.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        />

        {/* Sport badge — top right */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          color: 'white', fontSize: '0.65rem', fontWeight: '800',
          padding: '4px 10px', borderRadius: '6px',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {turf.sport}
        </div>

        {/* Premium badge — top left */}
        {turf.rating >= 4.5 && (
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            background: '#CEF17B', color: '#084734',
            fontSize: '0.65rem', fontWeight: '800',
            padding: '4px 10px', borderRadius: '6px',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Zap size={10} /> Premium
          </div>
        )}

        {/* Available indicator — bottom left */}
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px',
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'rgba(0,0,0,0.4)', borderRadius: '20px',
          padding: '4px 10px',
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#CEF17B' }} />
          <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: '600' }}>Available</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#161616', marginBottom: '4px' }}>
          {turf.name}
        </h3>
        <p style={{ color: '#98A2B3', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={13} /> {turf.location}, {turf.city}
        </p>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {turf.amenities?.slice(0, 3).map((a, i) => (
            <span key={i} style={{ background: '#DCEFB8', color: '#084734', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
              {a}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#161616' }}>₹{turf.price_per_hour}</span>
            <span style={{ color: '#98A2B3', fontSize: '0.85rem' }}> / hr</span>
            <div style={{ fontSize: '0.8rem', color: '#98A2B3', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {turf.rating || 0}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/turf/${turf._id}`); }}
            style={{
              background: '#084734', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '10px',
              fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = '#CEF17B'; e.target.style.color = '#084734'; }}
            onMouseLeave={e => { e.target.style.background = '#084734'; e.target.style.color = 'white'; }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
