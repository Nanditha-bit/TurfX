import { useMemo, useState } from 'react';
import { IndianRupee, TrendingUp, DollarSign, Wallet, ArrowDownCircle } from 'lucide-react';

export default function AdminWallet({ bookings = [] }) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });
  const [processing, setProcessing] = useState(false);

  const walletData = useMemo(() => {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    const transactions = confirmedBookings.map(booking => {
      const totalAmount = booking.total_price || 0;
      const platformFee = Math.round(totalAmount * 0.05); // 5% platform fee
      const gst = Math.round(platformFee * 0.18); // 18% GST on platform fee
      const netPlatformRevenue = platformFee + gst;
      
      return {
        id: booking._id,
        date: new Date(booking.createdAt || booking.date),
        bookingId: booking._id?.slice(-6)?.toUpperCase(),
        venueName: booking.turf_id?.name || 'Venue',
        partnerName: booking.turf_id?.owner_id?.name || 'Partner',
        totalAmount,
        platformFee,
        gst,
        netRevenue: netPlatformRevenue,
      };
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.netRevenue, 0);
    const totalPlatformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0);
    const totalGST = transactions.reduce((sum, t) => sum + t.gst, 0);
    const totalBookings = transactions.length;

    return {
      transactions: transactions.sort((a, b) => b.date - a.date),
      totalRevenue,
      totalPlatformFees,
      totalGST,
      totalBookings,
    };
  }, [bookings]);

  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid #EEF2E6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };

  const statCardStyle = {
    ...cardStyle,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const btnPrimary = {
    background: '#CEF17B',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (parseFloat(withdrawAmount) > walletData.totalRevenue) {
      alert('Insufficient balance');
      return;
    }
    setProcessing(true);
    // Simulate withdrawal
    setTimeout(() => {
      alert(`Withdrawal of ₹${withdrawAmount} initiated successfully!`);
      setShowWithdraw(false);
      setWithdrawAmount('');
      setProcessing(false);
    }, 1500);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#161616', marginBottom: '0.5rem' }}>
            Platform Wallet
          </h2>
          <p style={{ color: '#98A2B3', fontSize: '0.95rem' }}>
            Track platform fees and revenue collected from bookings
          </p>
        </div>
        <button onClick={() => setShowWithdraw(true)} style={btnPrimary}>
          <ArrowDownCircle size={18} />
          Withdraw Funds
        </button>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            width: '500px',
            maxWidth: '90%',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>
              Withdraw Platform Funds
            </h3>
            <p style={{ color: '#98A2B3', marginBottom: '1.5rem' }}>
              Available Balance: ₹{walletData.totalRevenue.toLocaleString('en-IN')}
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Withdrawal Amount
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #DCEFB8',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Bank Account Number
              </label>
              <input
                type="text"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                placeholder="Enter account number"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #DCEFB8',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                IFSC Code
              </label>
              <input
                type="text"
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                placeholder="Enter IFSC code"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #DCEFB8',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
              <button
                onClick={handleWithdraw}
                disabled={processing}
                style={{
                  ...btnPrimary,
                  flex: 1,
                  justifyContent: 'center',
                  opacity: processing ? 0.6 : 1,
                }}
              >
                {processing ? 'Processing...' : 'Withdraw'}
              </button>
              <button
                onClick={() => setShowWithdraw(false)}
                style={{
                  ...btnPrimary,
                  background: '#EEF2E6',
                  color: '#98A2B3',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#98A2B3', fontSize: '0.85rem', fontWeight: '600' }}>Total Revenue</span>
            <div style={{ background: '#DCEFB8', padding: '8px', borderRadius: '8px' }}>
              <Wallet size={18} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#161616' }}>
            ₹{walletData.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>
            From {walletData.totalBookings} bookings
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#98A2B3', fontSize: '0.85rem', fontWeight: '600' }}>Platform Fees</span>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
              <DollarSign size={18} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#161616' }}>
            ₹{walletData.totalPlatformFees.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }}>
            5% of bookings
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#98A2B3', fontSize: '0.85rem', fontWeight: '600' }}>GST Collected</span>
            <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px' }}>
              <TrendingUp size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#161616' }}>
            ₹{walletData.totalGST.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: '600' }}>
            18% on fees
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#98A2B3', fontSize: '0.85rem', fontWeight: '600' }}>Avg per Booking</span>
            <div style={{ background: '#f3e8ff', padding: '8px', borderRadius: '8px' }}>
              <IndianRupee size={18} color="#9333ea" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#161616' }}>
            ₹{walletData.totalBookings > 0 ? Math.round(walletData.totalRevenue / walletData.totalBookings) : 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9333ea', fontWeight: '600' }}>
            Per transaction
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#161616', marginBottom: '1.5rem' }}>
          Recent Transactions
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #EEF2E6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>Booking ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>Venue</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>Partner</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>Booking Amount</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>Platform Fee</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>GST</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' }}>Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {walletData.transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No transactions yet
                  </td>
                </tr>
              ) : (
                walletData.transactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #F8FAF7' }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#475569' }}>
                      {transaction.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', color: '#161616' }}>
                      #{transaction.bookingId}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#475569' }}>
                      {transaction.venueName}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#475569' }}>
                      {transaction.partnerName}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', color: '#161616', textAlign: 'right' }}>
                      ₹{transaction.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', color: '#2563eb', textAlign: 'right' }}>
                      ₹{transaction.platformFee.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', color: '#d97706', textAlign: 'right' }}>
                      ₹{transaction.gst.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '700', color: '#16a34a', textAlign: 'right' }}>
                      ₹{transaction.netRevenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
