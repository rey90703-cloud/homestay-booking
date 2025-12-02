import React, { useState, useEffect } from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import HomestayCard from '../components/HomestayCard';
import API_BASE_URL from '../config/api';
import './Wishlist.css';

function Wishlist() {
  const { wishlist, clearWishlist } = useWishlist();
  const { user } = useAuth();
  const [homestays, setHomestays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWishlistHomestays = async () => {
      if (wishlist.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch all homestays in wishlist
        const promises = wishlist.map(id =>
          fetch(`${API_BASE_URL}/homestays/${id}`)
            .then(res => res.json())
            .then(data => data.success ? data.data.homestay : null)
            .catch(() => null)
        );

        const results = await Promise.all(promises);
        const validHomestays = results.filter(h => h !== null);
        setHomestays(validHomestays);
      } catch (err) {
        setError('Không thể tải danh sách yêu thích');
        console.error('Error fetching wishlist:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlistHomestays();
  }, [wishlist]);

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả homestay yêu thích?')) {
      clearWishlist();
    }
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1 className="wishlist-title">
            Danh sách yêu thích
          </h1>
          {wishlist.length > 0 && (
            <button className="btn-clear-all" onClick={handleClearAll}>
              Xóa tất cả
            </button>
          )}
        </div>

        {user && (
          <p className="wishlist-subtitle">
            Xin chào <strong>{user.profile?.firstName || user.email}</strong>, 
            bạn có {wishlist.length} homestay yêu thích
          </p>
        )}

        {isLoading && (
          <div className="wishlist-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        )}

        {error && (
          <div className="wishlist-error">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && wishlist.length === 0 && (
          <div className="wishlist-empty">
            <div className="empty-icon">📋</div>
            <h2>Chưa có homestay yêu thích</h2>
            <p>Hãy khám phá và thêm những homestay bạn thích vào danh sách!</p>
            <a href="/search" className="btn-explore">
              Khám phá homestay
            </a>
          </div>
        )}

        {!isLoading && !error && homestays.length > 0 && (
          <div className="wishlist-grid">
            {homestays.map(homestay => (
              <HomestayCard key={homestay._id} homestay={homestay} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
