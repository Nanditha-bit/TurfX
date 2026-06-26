import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <footer style={{ background: '#161616', padding: '4rem 2rem 2rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
        gap: '3rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Logo + Description */}
        <div>
          <img src={logo} alt="TurfX" style={{ height: '60px', objectFit: 'contain', marginBottom: '1rem' }} />
          <p style={{ color: '#98A2B3', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '240px' }}>
            India's premier sports turf booking platform. Find, book, and play at premium venues near you.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ color: '#98A2B3', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            Company
          </h4>
          {['About Us', 'Blogs', 'Contact', 'Careers', 'Partner with Us'].map(item => (
            <div key={item} style={{ marginBottom: '12px' }}>
              <Link to="/" style={{ color: '#98A2B3', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#CEF17B'}
                onMouseLeave={e => e.target.style.color = '#98A2B3'}
              >{item}</Link>
            </div>
          ))}
        </div>

        {/* Social */}
        <div>
          <h4 style={{ color: '#98A2B3', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            Social
          </h4>
          {['Instagram', 'Facebook', 'LinkedIn', 'Twitter'].map(item => (
            <div key={item} style={{ marginBottom: '12px' }}>
              <Link to="/" style={{ color: '#98A2B3', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#CEF17B'}
                onMouseLeave={e => e.target.style.color = '#98A2B3'}
              >{item}</Link>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ color: '#98A2B3', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            Privacy & Terms
          </h4>
          {['FAQs', 'Privacy Policy', 'Terms of Service', 'Cancellation Policy'].map(item => (
            <div key={item} style={{ marginBottom: '12px' }}>
              <Link to="/" style={{ color: '#98A2B3', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#CEF17B'}
                onMouseLeave={e => e.target.style.color = '#98A2B3'}
              >{item}</Link>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        marginTop: '3rem', paddingTop: '1.5rem',
        maxWidth: '1200px', margin: '3rem auto 0',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <p style={{ color: '#98A2B3', fontSize: '0.82rem' }}>
          © 2024 MetaQode Technologies Pvt. Ltd. All Rights Reserved. Powered by{' '}
          <span style={{ color: '#CEF17B', fontWeight: '600' }}>MetaQode Technologies Pvt. Ltd.</span>
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Book', 'Play', 'Enjoy'].map(w => (
            <span key={w} style={{ color: '#98A2B3', fontSize: '0.82rem', fontWeight: '600' }}>{w}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
