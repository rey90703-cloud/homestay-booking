import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WishlistProvider } from './contexts/WishlistContext';
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
import Wishlist from './pages/Wishlist';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import HostDashboard from './pages/host/HostDashboard';
import HostHomestays from './pages/host/HostHomestays';
import HostBookingDetail from './pages/host/HostBookingDetail';
import HostLayout from './components/layout/HostLayout';
import AddHomestay from './pages/AddHomestay';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import './App.css';
import './styles/responsive-fixes.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <ChatProvider>
            <Router>
          <ScrollToTop />
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
            <Route path="/host/dashboard" element={<HostDashboard />} />
            <Route path="/host/bookings/:id" element={
              <HostLayout activeTab="bookings">
                <HostBookingDetail />
              </HostLayout>
            } />
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
            <Route path="/add-homestay" element={
              <AddHomestay onSuccess={() => window.location.href = '/host/dashboard'} />
            } />
            <Route path="/profile" element={
              <>
                <Header />
                <Profile />
                <Footer />
              </>
            } />
            <Route path="/host/homestays" element={
              <HostLayout activeTab="homestays">
                <HostHomestays />
              </HostLayout>
            } />
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
            <Route path="/wishlist" element={
              <>
                <Header />
                <Wishlist />
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
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
