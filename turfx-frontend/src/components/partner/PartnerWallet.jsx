import { useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  IndianRupee, ArrowDownCircle, ArrowUpCircle,
  Clock, Plus, Filter,
  ChevronLeft, ChevronRight, MoreVertical, ExternalLink, X
} from 'lucide-react';

import { API_URL as API } from '../../config/api';

export default function PartnerWallet({ data }) {
  const { token } = useAuth();
  const [activeType, setActiveType] = useState('All Transactions');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });
  const [processing, setProcessing] = useState(false);

  const transactions = useMemo(() => {
    const bookings = data?.bookings || [];
    const rows = [];
    bookings.forEach(booking => {
      const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date(booking.date);
      const date = createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const time = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const bookingId = booking._id?.slice(-6)?.toUpperCase() || 'BOOKING';
      const totalAmount = booking.total_price || 0;
      const platformFee = Math.round(totalAmount * 0.05); // 5% platform fee
      const netAmount = totalAmount - platformFee; // Amount partner receives

      if (booking.status === 'confirmed') {
        // Show only net amount (after platform fee deduction)
        rows.push({
          id: `PAY-${bookingId}`,
          date,
          time,
          desc: 'Booking Payment',
          sub: `${booking.turf_id?.name || 'Venue'} | ${booking.time_slot}`,
          type: 'Credit',
          amount: netAmount, // Show net amount only
          status: 'Success',
          createdAt,
        });
      }
    });

    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((transaction, index, all) => ({
        ...transaction,
        balance: all.slice(index).reduce((sum, item) => sum + item.amount, 0),
      }));
  }, [data?.bookings]);

  const filteredTransactions = transactions.filter(t => {
    if (activeType === 'Credits') return t.type === 'Credit';
    if (activeType === 'Debits') return t.type === 'Debit';
    return true;
  });

  const totalAdded = transactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = Math.abs(transactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0));
  const availableBalance = totalAdded - totalWithdrawn;
  const lastTransaction = transactions[0];

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount < 100) {
      alert('Minimum amount is ₹100');
      return;
    }

    setProcessing(true);
    try {
      const orderRes = await axios.post(`${API}/wallet/add/create-order`, 
        { amount }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const options = {
        key: orderRes.data.key,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: 'TurfX',
        description: 'Wallet Top-up',
        order_id: orderRes.data.orderId,
        handler: async function (response) {
          try {
            await axios.post(`${API}/wallet/add/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert('Money added successfully!');
            setShowAddMoney(false);
            setAddAmount('');
            window.location.reload();
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: data?.user?.name || '',
          email: data?.user?.email || '',
          contact: data?.user?.phone || ''
        },
        theme: {
          color: '#CEF17B'
        }
      };

      // Use Razorpay from window object
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert('Payment failed: ' + response.error.description);
        });
        rzp.open();
      } else {
        alert('Razorpay SDK not loaded. Please refresh the page.');
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 500) {
      alert('Minimum withdrawal amount is ₹500');
      return;
    }

    if (amount > availableBalance) {
      alert('Insufficient balance');
      return;
    }

    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      alert('Please fill in all bank details');
      return;
    }

    setProcessing(true);
    try {
      const res = await axios.post(`${API}/wallet/withdraw`, 
        { amount, bankAccount: bankDetails }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.msg);
      setShowWithdraw(false);
      setWithdrawAmount('');
      setBankDetails({ accountNumber: '', ifscCode: '', accountHolderName: '', bankName: '' });
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const stats = [
    { label: 'Available Balance', value: `Rs.${availableBalance.toLocaleString()}`, icon: <IndianRupee size={22} />, color: '#CEF17B', sub: 'After platform fees' },
    { label: 'Total Credits', value: `Rs.${totalAdded.toLocaleString()}`, icon: <ArrowDownCircle size={22} />, color: '#3b82f6', sub: 'Confirmed bookings' },
    { label: 'Total Debits', value: `Rs.${totalWithdrawn.toLocaleString()}`, icon: <ArrowUpCircle size={22} />, color: '#f59e0b', sub: 'Platform fees' },
    { label: 'Last Transaction', value: lastTransaction ? `Rs.${Math.abs(lastTransaction.amount).toLocaleString()}` : 'Rs.0', icon: <Clock size={22} />, color: '#8b5cf6', sub: lastTransaction?.date || 'No transactions yet' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Wallet</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Manage your wallet balance and transactions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowAddMoney(true)} style={btnSecondary}><Plus size={18} /> Add Money</button>
          <button onClick={() => setShowWithdraw(true)} style={btnPrimary}><ExternalLink size={18} /> Withdraw</button>
        </div>
      </div>

      {/* ADD MONEY MODAL */}
      {showAddMoney && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Add Money to Wallet</h3>
              <X size={24} onClick={() => setShowAddMoney(false)} style={{ cursor: 'pointer', color: '#98A2B3' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', display: 'block', marginBottom: '8px' }}>Amount (₹)</label>
              <input 
                type="number" 
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                placeholder="Enter amount (min ₹100)"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleAddMoney} disabled={processing} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
                {processing ? 'Processing...' : 'Pay with Razorpay'}
              </button>
              <button onClick={() => setShowAddMoney(false)} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#98A2B3', marginTop: '1rem', textAlign: 'center' }}>
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdraw && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Withdraw Money</h3>
              <X size={24} onClick={() => setShowWithdraw(false)} style={{ cursor: 'pointer', color: '#98A2B3' }} />
            </div>
            <div style={{ marginBottom: '1rem', padding: '12px', background: '#DCEFB8', borderRadius: '10px', border: '1px solid #DCEFB8' }}>
              <p style={{ fontSize: '0.85rem', color: '#084734', fontWeight: '600' }}>
                Available Balance: <strong>₹{availableBalance.toLocaleString()}</strong>
              </p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', display: 'block', marginBottom: '8px' }}>Amount (₹)</label>
              <input 
                type="number" 
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount (min ₹500)"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', display: 'block', marginBottom: '8px' }}>Account Holder Name</label>
              <input 
                type="text" 
                value={bankDetails.accountHolderName}
                onChange={e => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                placeholder="As per bank records"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', display: 'block', marginBottom: '8px' }}>Account Number</label>
                <input 
                  type="text" 
                  value={bankDetails.accountNumber}
                  onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  placeholder="Account number"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', display: 'block', marginBottom: '8px' }}>IFSC Code</label>
                <input 
                  type="text" 
                  value={bankDetails.ifscCode}
                  onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                  placeholder="IFSC code"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', display: 'block', marginBottom: '8px' }}>Bank Name (Optional)</label>
              <input 
                type="text" 
                value={bankDetails.bankName}
                onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})}
                placeholder="Bank name"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleWithdraw} disabled={processing} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
                {processing ? 'Processing...' : 'Submit Withdrawal Request'}
              </button>
              <button onClick={() => setShowWithdraw(false)} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#98A2B3', marginTop: '1rem', textAlign: 'center' }}>
              Withdrawal will be processed within 3 business days
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={statCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}10`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#161616' }}>{s.value}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1.5px solid #EEF2E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '1rem' }}>
              <select style={filterSelect}>
                <option>All Dates</option>
              </select>
              <select value={activeType} onChange={e => setActiveType(e.target.value)} style={filterSelect}>
                <option>All Transactions</option>
                <option>Credits</option>
                <option>Debits</option>
              </select>
           </div>
           <button style={filterBtn}><Filter size={18} /> Filters</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F8FAF7', borderBottom: '1.5px solid #EEF2E6' }}>
            <tr>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Balance</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? filteredTransactions.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: i < filteredTransactions.length - 1 ? '1px solid #EEF2E6' : 'none' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.date}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>{t.time}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: t.type === 'Credit' ? '#DCEFB8' : '#fff1f2',
                      color: t.type === 'Credit' ? '#CEF17B' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {t.type === 'Credit' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.desc}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.sub}</div>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800',
                    background: t.type === 'Credit' ? '#DCEFB8' : '#fff1f2',
                    color: t.type === 'Credit' ? '#CEF17B' : '#ef4444'
                  }}>{t.type.toUpperCase()}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: t.amount > 0 ? '#CEF17B' : '#ef4444' }}>
                    {t.amount > 0 ? '+' : '-'}Rs.{Math.abs(t.amount).toLocaleString()}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Rs.{t.balance.toLocaleString()}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{ background: '#DCEFB8', color: '#CEF17B', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>{t.status.toUpperCase()}</span>
                </td>
                <td style={tdStyle}>
                  <button style={iconBtn}><MoreVertical size={16} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontWeight: '700' }}>No wallet transactions yet</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAF7' }}>
           <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '600' }}>Showing {filteredTransactions.length} of {transactions.length} transactions</div>
           <div style={{ display: 'flex', gap: '6px' }}>
              <button style={pageBtn}><ChevronLeft size={16} /></button>
              <button style={{ ...pageBtn, background: '#CEF17B', color: '#084734', border: 'none' }}>1</button>
              <button style={pageBtn}><ChevronRight size={16} /></button>
           </div>
        </div>
      </div>
    </div>
  );
}

const statCard = {
  background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid #EEF2E6'
};

const btnPrimary = {
  background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px',
  borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex',
  alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,190,116,0.2)'
};

const btnSecondary = {
  background: 'white', color: '#161616', border: '1.5px solid #EEF2E6', padding: '12px 24px',
  borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', display: 'flex',
  alignItems: 'center', gap: '8px', cursor: 'pointer'
};

const filterSelect = {
  padding: '10px 15px', borderRadius: '12px', border: '1.5px solid #EEF2E6',
  fontSize: '0.85rem', fontWeight: '600', color: '#161616', outline: 'none', background: 'white'
};

const filterBtn = {
  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px',
  borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem',
  fontWeight: '600', color: '#98A2B3', cursor: 'pointer', background: 'white'
};

const thStyle = {
  textAlign: 'left', padding: '1.2rem', fontSize: '0.75rem', fontWeight: '800',
  color: '#94a3b8', textTransform: 'uppercase'
};

const tdStyle = {
  padding: '1.2rem', verticalAlign: 'middle'
};

const iconBtn = {
  background: 'none', border: '1.5px solid #EEF2E6', padding: '6px',
  borderRadius: '8px', color: '#98A2B3', cursor: 'pointer'
};

const pageBtn = {
  width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #EEF2E6',
  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer'
};

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 9999
};

const modalContent = {
  background: 'white', borderRadius: '24px', padding: '2rem',
  maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
};
