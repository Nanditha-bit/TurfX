import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, FileText, 
  Phone, Mail, MessageCircle, ChevronRight,
  Ticket, Clock, CheckCircle, Plus, Send
} from 'lucide-react';

import { API_URL as API } from '../../config/api';

// Tawk.to Live Chat Integration
const initTawkTo = () => {
  if (window.Tawk_API) return; // Already loaded

  var s1 = document.createElement("script");
  var s0 = document.getElementsByTagName("script")[0];
  s1.async = true;
  s1.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID'; // Replace with your Tawk.to IDs
  s1.charset = 'UTF-8';
  s1.setAttribute('crossorigin','*');
  s0.parentNode.insertBefore(s1,s0);
};

const FAQS = [
  { q: 'How to create a booking?', a: 'Go to Bookings tab and click "New Booking". Select your venue, date, and time slot, then confirm.' },
  { q: 'How to manage bookings?', a: 'In the Bookings tab you can view all bookings, filter by status, and cancel confirmed bookings.' },
  { q: 'How do payouts work?', a: 'Payouts are processed weekly every Friday. 95% of confirmed booking revenue is transferred to your registered bank account.' },
  { q: 'How to update venue listing?', a: 'Go to Venues tab, find your venue, and click the Edit button to update name, price, description, and more.' },
  { q: 'How to create offers and promotions?', a: 'Go to the Offers tab and click "Create New Offer". Fill in the title, discount, and validity date.' },
];

export default function PartnerSupport() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Other', description: '', priority: 'Medium' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTickets();
    // Initialize Tawk.to on component mount
    initTawkTo();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API}/support/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      alert('Please fill in subject and description');
      return;
    }
    setCreating(true);
    try {
      await axios.post(`${API}/support/tickets`, newTicket, { headers: { Authorization: `Bearer ${token}` } });
      alert('Support ticket created successfully!');
      setShowCreateTicket(false);
      setNewTicket({ subject: '', category: 'Other', description: '', priority: 'Medium' });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleStartChat = () => {
    // Open Tawk.to chat widget
    if (window.Tawk_API && window.Tawk_API.maximize) {
      window.Tawk_API.maximize();
    } else {
      alert('Live chat is loading... Please try again in a moment or contact us via phone/email.');
    }
  };

  const filteredFaqs = FAQS.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cards = [
    { label: 'FAQs', sub: 'Quick answers to common questions', icon: <FileText size={24} />, color: '#8b5cf6', action: () => setExpandedFaq(0) },
    { label: 'My Tickets', sub: `${tickets.length} support tickets`, icon: <Ticket size={24} />, color: '#3b82f6', action: () => {} },
    { label: 'Contact Us', sub: 'Get in touch with our support team', icon: <Phone size={24} />, color: '#f59e0b', action: () => window.location.href = 'tel:+918045678900' },
    { label: 'Live Chat', sub: 'Chat with support (8 AM - 10 PM)', icon: <MessageCircle size={24} />, color: '#CEF17B', action: handleStartChat },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>How can we help you today?</h2>
        <p style={{ color: '#98A2B3', fontWeight: '500' }}>Our support team is here to assist you, anytime you need us.</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input 
          type="text" 
          placeholder="Search for help articles..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '18px 20px 18px 60px', borderRadius: '16px', border: '1.5px solid #EEF2E6', fontSize: '1rem', fontWeight: '500', outline: 'none', boxSizing: 'border-box' }} 
        />
      </div>

      {/* TOP CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {cards.map((c, i) => (
          <div key={i} onClick={c.action} style={supportCard}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${c.color}10`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {c.icon}
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px' }}>{c.label}</h3>
            <p style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500', lineHeight: 1.5, marginBottom: '1.5rem' }}>{c.sub}</p>
            <ChevronRight size={18} style={{ color: '#94a3b8' }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* FAQ TOPICS */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Frequently Asked Questions</h3>
           {filteredFaqs.length > 0 ? filteredFaqs.map((faq, i) => (
             <div key={i} style={{ borderBottom: i < filteredFaqs.length - 1 ? '1px solid #EEF2E6' : 'none' }}>
               <div 
                 onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', cursor: 'pointer' }}
               >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DCEFB8', color: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={16} />
                     </div>
                     <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#161616' }}>{faq.q}</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#94a3b8', transform: expandedFaq === i ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
               </div>
               {expandedFaq === i && (
                 <div style={{ padding: '0 0 14px 44px', fontSize: '0.85rem', color: '#98A2B3', fontWeight: '500', lineHeight: 1.6 }}>
                   {faq.a}
                 </div>
               )}
             </div>
           )) : (
             <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontWeight: '600' }}>No results found for "{searchQuery}"</div>
           )}
        </div>

        {/* IMMEDIATE HELP */}
        <div style={{ background: '#DCEFB8', padding: '2rem', borderRadius: '24px', border: '1.5px solid #DCEFB8' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>Need Immediate Help?</h3>
           <p style={{ fontSize: '0.85rem', color: '#084734', fontWeight: '500', marginBottom: '2rem' }}>We're here for you! Reach out to our support team directly.</p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', color: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={20} />
                 </div>
                 <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800' }}>Call Us</div>
                    <a href="tel:+918045678900" style={{ fontSize: '0.9rem', fontWeight: '800', color: '#084734', textDecoration: 'none' }}>+91 80 4567 8900</a>
                    <div style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: '500' }}>Mon–Sat, 9 AM – 7 PM</div>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', color: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={20} />
                 </div>
                 <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800' }}>Email Us</div>
                    <a href="mailto:partner-support@turfx.in" style={{ fontSize: '0.9rem', fontWeight: '800', color: '#084734', textDecoration: 'none' }}>partner-support@turfx.in</a>
                    <div style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: '500' }}>Response within 24 hours</div>
                 </div>
              </div>
           </div>

           <button onClick={handleStartChat} style={{ width: '100%', marginTop: '2rem', padding: '16px', borderRadius: '14px', border: 'none', background: '#CEF17B', color: '#084734', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
              <MessageCircle size={20} /> Chat with Support
           </button>
           <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: '#084734', fontWeight: '600' }}>Live chat available from 8 AM to 10 PM</div>
        </div>
      </div>

      {/* MY TICKETS */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6', marginBottom: '3rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>My Support Tickets</h3>
            <button onClick={() => setShowCreateTicket(!showCreateTicket)} style={{ background: '#CEF17B', color: '#084734', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Plus size={18} /> Create Ticket
            </button>
         </div>

         {showCreateTicket && (
           <div style={{ background: '#F8FAF7', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
             <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem' }}>Create New Support Ticket</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <input 
                 placeholder="Subject" 
                 value={newTicket.subject}
                 onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                 style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none' }}
               />
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                 <select value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none' }}>
                   <option>Booking Issues</option>
                   <option>Venue Management</option>
                   <option>Payouts & Wallet</option>
                   <option>Technical</option>
                   <option>Other</option>
                 </select>
                 <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none' }}>
                   <option>Low</option>
                   <option>Medium</option>
                   <option>High</option>
                   <option>Urgent</option>
                 </select>
               </div>
               <textarea 
                 placeholder="Describe your issue in detail..." 
                 value={newTicket.description}
                 onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                 style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #DCEFB8', fontSize: '0.9rem', outline: 'none', minHeight: '100px', resize: 'vertical' }}
               />
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={handleCreateTicket} disabled={creating} style={{ background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Send size={16} /> {creating ? 'Creating...' : 'Submit Ticket'}
                 </button>
                 <button onClick={() => setShowCreateTicket(false)} style={{ background: 'white', color: '#161616', border: '1.5px solid #DCEFB8', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         )}

         {tickets.length > 0 ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {tickets.map(ticket => (
               <div key={ticket._id} style={{ padding: '1.5rem', borderRadius: '12px', border: '1.5px solid #EEF2E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DCEFB8', color: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Ticket size={20} />
                   </div>
                   <div>
                     <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#161616' }}>{ticket.subject}</div>
                     <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500' }}>{ticket.category} • Created {new Date(ticket.createdAt).toLocaleDateString()}</div>
                   </div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                   <span style={{ 
                     padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800',
                     background: ticket.status === 'Resolved' ? '#DCEFB8' : ticket.status === 'In Progress' ? '#eff6ff' : '#fff7ed',
                     color: ticket.status === 'Resolved' ? '#CEF17B' : ticket.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                   }}>{ticket.status}</span>
                   <ChevronRight size={18} style={{ color: '#94a3b8', cursor: 'pointer' }} />
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
             <Ticket size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
             <p style={{ fontWeight: '600' }}>No support tickets yet</p>
             <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Create a ticket if you need help with anything</p>
           </div>
         )}
      </div>

      {/* SUPPORT ACTIVITY */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Quick Help Topics</h3>
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            <ActivityItem icon={<Ticket size={20} />} label="Booking Issues" sub="Cancellations, rescheduling, payment problems" color="#CEF17B" />
            <ActivityItem icon={<Clock size={20} />} label="Venue Management" sub="Listing updates, slot configuration, pricing" color="#f59e0b" />
            <ActivityItem icon={<CheckCircle size={20} />} label="Payouts & Wallet" sub="Settlement queries, bank account issues" color="#3b82f6" />
         </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, label, sub, color }) {
  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
       <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
       </div>
       <div>
          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616' }}>{label}</div>
          <p style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500' }}>{sub}</p>
       </div>
    </div>
  );
}

const supportCard = { background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6', cursor: 'pointer', transition: '0.3s' };
