import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Reusable "Back" button.
 * - By default goes back one step in browser history (navigate(-1)).
 * - Pass `to="/some-path"` to navigate to a fixed route instead
 *   (useful on pages that can be opened directly with no history, e.g. via a shared link).
 * - `variant="dark"` is for use on dark green hero/header backgrounds,
 *   `variant="light"` (default) is for use on white/light backgrounds.
 */
export default function BackButton({ to, variant = 'light', label = 'Back', style = {} }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  const variants = {
    light: {
      color: '#084734',
      background: 'white',
      border: '1.5px solid #EEF2E6',
    },
    dark: {
      color: 'white',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.25)',
    },
  };

  const theme = variants[variant] || variants.light;

  return (
    <button
      onClick={handleClick}
      aria-label="Go back"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 16px',
        borderRadius: '10px',
        fontSize: '0.88rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: "'DM Sans', sans-serif",
        ...theme,
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
