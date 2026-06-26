export default function ReviewCard({ review }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #eee',
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong>{review.User?.name || 'Player'}</strong>
        <span style={{ color: '#f59e0b' }}>
          {'⭐'.repeat(review.rating)}
        </span>
      </div>
      <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.6 }}>
        {review.comment}
      </p>
    </div>
  );
}
