import { useEffect, useState } from 'react';
import axios from 'axios';

import { API_URL as API } from '../config/api';

// Fallback offers if API returns empty
const FALLBACK_OFFERS = [
  {
    _id: '1',
    discount: '15% OFF',
    title: 'Morning Saver',
    description: 'Discount for early morning football bookings. Get on the field before the crowd does.',
    color: '#084734',
  },
  {
    _id: '2',
    discount: '10% OFF',
    title: 'Cricket Weekday Deal',
    description: 'Special weekday discount for cricket slots. More savings for your practice sessions.',
    color: '#161616',
  },
];

export default function OffersSection() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    axios.get(`${API}/offers`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setOffers(data.length > 0 ? data : FALLBACK_OFFERS);
      })
      .catch(() => setOffers(FALLBACK_OFFERS));
  }, []);

  const displayOffers = offers.length > 0 ? offers : FALLBACK_OFFERS;

  return (
    <section style={{ padding: '4rem 0' }}>
      {/* Section Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ display: 'inline-block', width: '28px', height: '2px', background: '#CEF17B' }}></span>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#084734', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Save more
          </span>
        </div>
        <h2 style={{
          fontSize: '2.2rem', fontWeight: '800', color: '#161616', marginBottom: '8px',
          fontFamily: "'Sora', sans-serif",
        }}>
          Exclusive <span style={{ color: '#084734' }}>Offers</span>
        </h2>
        <p style={{ color: '#98A2B3', fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>
          Limited time deals for our regular players
        </p>
      </div>

      {/* Offer Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
        gap: '1.5rem',
      }}>
        {displayOffers.map((offer, index) => (
          <div key={offer._id || index} style={{
            background: index % 2 === 0 ? '#084734' : '#161616',
            borderRadius: '20px',
            padding: '2.5rem',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '200px',
          }}>
            {/* Decorative circle */}
            <div style={{
              position: 'absolute', bottom: '-40px', right: '-40px',
              width: '180px', height: '180px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }} />
            <div style={{
              position: 'absolute', bottom: '20px', right: '20px',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
            }} />

            {/* Discount badge */}
            <div style={{
              display: 'inline-block',
              background: '#CEF17B', color: '#084734',
              borderRadius: '20px', padding: '5px 14px',
              fontWeight: '800', fontSize: '0.78rem',
              marginBottom: '1.25rem',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {offer.discount || offer.discount_value || '15% OFF'}
            </div>

            <h3 style={{
              fontSize: '1.5rem', fontWeight: '800', color: 'white',
              marginBottom: '10px', fontFamily: "'Sora', sans-serif",
            }}>
              {offer.title}
            </h3>

            <p style={{
              fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.6, marginBottom: '1.75rem',
              maxWidth: '380px', fontFamily: "'DM Sans', sans-serif",
            }}>
              {offer.description}
            </p>

            <button style={{
              background: 'transparent',
              color: '#CEF17B',
              border: '1.5px solid #CEF17B',
              padding: '10px 24px', borderRadius: '50px',
              cursor: 'pointer', fontWeight: '700',
              fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#CEF17B'; e.currentTarget.style.color = '#084734'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#CEF17B'; }}
            >
              Claim Offer →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
