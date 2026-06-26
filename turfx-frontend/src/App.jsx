import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import TurfDetail from './pages/TurfDetail';
import MyBookings from './pages/MyBookings';
import Checkout from './pages/Checkout';
import BookingConfirmed from './pages/BookingConfirmed';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import indiaLocations from './data/indiaLocations';
import PartnerLogin from './pages/partner/PartnerLogin';
import PartnerRegister from './pages/partner/PartnerRegister';
import PartnerForgotPassword from './pages/partner/PartnerForgotPassword';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';

function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: '4rem' }}>🏟</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#161616', margin: 0 }}>Page Not Found</h1>
      <p style={{ color: '#98A2B3', fontSize: '1rem', margin: 0 }}>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ marginTop: '0.5rem', background: '#084734', color: '#CEF17B', padding: '12px 28px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Go Home</a>
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Partner Portal — No Navbar/Footer */}
            <Route path="/partner" element={<PartnerLogin />} />
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route path="/partner/register" element={<PartnerRegister />} />
            <Route path="/partner/forgot-password" element={<PartnerForgotPassword />} />
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Main Site — With Navbar/Footer */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/explore" element={<MainLayout><Explore /></MainLayout>} />
            <Route path="/turf/:id" element={<MainLayout><TurfDetail /></MainLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" replace state={{ tab: 'register' }} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/checkout" element={
              <MainLayout><ProtectedRoute><Checkout /></ProtectedRoute></MainLayout>
            } />
            <Route path="/checkout/:id" element={
              <MainLayout><ProtectedRoute><Checkout /></ProtectedRoute></MainLayout>
            } />
            <Route path="/my-bookings" element={
              <MainLayout><ProtectedRoute><MyBookings /></ProtectedRoute></MainLayout>
            } />
            <Route path="/booking/confirmed" element={
              <MainLayout><ProtectedRoute><BookingConfirmed /></ProtectedRoute></MainLayout>
            } />
            <Route path="/profile" element={
              <MainLayout><ProtectedRoute><Profile /></ProtectedRoute></MainLayout>
            } />
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
