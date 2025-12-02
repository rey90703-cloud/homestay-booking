import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('homestay_wishlist');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('homestay_wishlist', JSON.stringify(wishlist));
      } catch (error) {
        console.error('Error saving wishlist:', error);
      }
    }
  }, [wishlist, isLoading]);

  // Check if homestay is in wishlist
  const isInWishlist = (homestayId) => {
    return wishlist.includes(homestayId);
  };

  // Add homestay to wishlist
  const addToWishlist = (homestayId) => {
    if (!isInWishlist(homestayId)) {
      setWishlist(prev => [...prev, homestayId]);
      return true;
    }
    return false;
  };

  // Remove homestay from wishlist
  const removeFromWishlist = (homestayId) => {
    setWishlist(prev => prev.filter(id => id !== homestayId));
    return true;
  };

  // Toggle homestay in wishlist
  const toggleWishlist = (homestayId) => {
    if (isInWishlist(homestayId)) {
      removeFromWishlist(homestayId);
      return false; // Removed
    } else {
      addToWishlist(homestayId);
      return true; // Added
    }
  };

  // Clear all wishlist
  const clearWishlist = () => {
    setWishlist([]);
  };

  // Get wishlist count
  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    getWishlistCount,
    isLoading,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

WishlistProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default WishlistContext;
