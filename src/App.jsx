import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Contact from './pages/Contact';
import AddHomestay from './pages/AddHomestay';
import HomestayDetail from './pages/HomestayDetail';
import Profile from './pages/Profile';
import HomestayHanoi from './pages/HomestayHanoi';
import HomestayLaoCai from './pages/HomestayLaoCai';
import AdminDashboard from './pages/admin/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<Search />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/homestay/:id" element={
              <>
                <Header />
                <HomestayDetail />
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
              <>
                <Header />
                <AddHomestay />
                <Footer />
              </>
            } />
            <Route path="/profile" element={
              <>
                <Header />
                <Profile />
                <Footer />
              </>
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
            <Route path="/" element={
              <>
                <Header />
                <Home />
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
