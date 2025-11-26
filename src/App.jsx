import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordNew from './pages/ResetPasswordNew';
import Search from './pages/Search';
import Contact from './pages/Contact';
import Reviews from './pages/Reviews';

import HomestayDetail from './pages/HomestayDetail';
import BookingCheckout from './pages/BookingCheckout';
import PaymentSuccess from './pages/PaymentSuccess';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import HomestayHanoi from './pages/HomestayHanoi';
import HomestayLaoCai from './pages/HomestayLaoCai';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import HostHomestays from './pages/host/HostHomestays';
import AddHomestay from './pages/AddHomestay';
import ChatWidget from './components/ChatWidget';
import './App.css';
import './styles/responsive-fixes.css';

// Component to save and restore scroll position
function ScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    // Save scroll position before unload
    const saveScrollPosition = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
      sessionStorage.setItem('scrollPath', location.pathname);
    };

    window.addEventListener('beforeunload', saveScrollPosition);

    // Restore scroll position on mount
    const savedPath = sessionStorage.getItem('scrollPath');
    const savedPosition = sessionStorage.getItem('scrollPosition');
    
    if (savedPath === location.pathname && savedPosition) {
      // Use setTimeout to ensure DOM is fully loaded
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition, 10));
      }, 0);
    }

    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <ScrollRestoration />
          <div className="app">
          <Routes>
            <Route path="/login" element={
              <>
                <Header />
                <Login />
                <Footer />
              </>
            } />
            <Route path="/register" element={
              <>
                <Header />
                <Register />
                <Footer />
              </>
            } />
            <Route path="/forgot-password" element={
              <>
                <Header />
                <ForgotPassword />
                <Footer />
              </>
            } />
            <Route path="/reset-password" element={
              <>
                <Header />
                <ResetPasswordNew />
                <Footer />
              </>
            } />
            <Route path="/search" element={<Search />} />
            <Route path="/admin/login" element={
              <>
                <Header />
                <AdminLogin />
                <Footer />
              </>
            } />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/homestay/:id" element={
              <>
                <Header />
                <HomestayDetail />
                <Footer />
              </>
            } />
            <Route path="/homestay/:id/reviews" element={
              <>
                <Header />
                <Reviews />
                <Footer />
              </>
            } />
            <Route path="/booking/:id" element={
              <>
                <Header />
                <BookingCheckout />
                <Footer />
              </>
            } />
            <Route path="/payment-success/:bookingId" element={
              <>
                <Header />
                <PaymentSuccess />
                <Footer />
              </>
            } />
            <Route path="/my-bookings" element={
              <>
                <Header />
                <MyBookings />
                <Footer />
              </>
            } />
            <Route path="/contact" element={
              <>
                <Header />
                <Contact />
                <Footer />
              </>
            } />
            <Route path="/add-homestay" element={<AddHomestay />} />
            <Route path="/profile" element={
              <>
                <Header />
                <Profile />
                <Footer />
              </>
            } />
            <Route path="/host/homestays" element={<HostHomestays />} />
            <Route path="/homestay-ha-noi" element={
              <>
                <Header />
                <HomestayHanoi />
                <Footer />
              </>
            } />
            <Route path="/homestay-lao-cai" element={
              <>
                <Header />
                <HomestayLaoCai />
                <Footer />
              </>
            } />
            <Route path="/" element={
              <>
                <Header />
                <Home />
                <Footer />
              </>
            } />
          </Routes>
          
          {/* Chat Widget - Available on all pages */}
          <ChatWidget />
        </div>
      </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
