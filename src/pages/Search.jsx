import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import HomestayCard from '../components/HomestayCard';
import MapView from '../components/MapView';
import './Search.css';

function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);

  const location = searchParams.get('location') || 'Hà Nội';
  const checkIn = searchParams.get('checkin') || '10/11/2025';
  const checkOut = searchParams.get('checkout') || '12/11/2025';
  const guests = searchParams.get('guests') || '2';

  // Mock data - replace with API call
  const homestays = [
    {
      id: 1,
      name: 'The Chill House – Tây Hồ',
      price: '650.000',
      rating: '4.8',
      image: '/images/result-1-252712.png',
      badge: 'Ưu đãi 10%',
      tags: ['Wifi', 'Hồ Tây 300m']
    },
    {
      id: 2,
      name: 'Cozy Studio – Ba Đình',
      price: '550.000',
      rating: '4.7',
      image: '/images/result-2-3d3ee5.png',
      badge: 'Mới',
      tags: ['Wifi', 'Bếp']
    },
    {
      id: 3,
      name: 'Modern Apartment – Hoàn Kiếm',
      price: '750.000',
      rating: '4.9',
      image: '/images/result-3-240397.png',
      badge: 'Hot',
      tags: ['View núi', 'Đỗ xe']
    },
    {
      id: 4,
      name: 'Garden House – Long Biên',
      price: '480.000',
      rating: '4.6',
      image: '/images/result-4-252712.png',
      badge: 'Ưu đãi 10%',
      tags: ['Wifi', 'Khu vườn']
    },
    {
      id: 5,
      name: 'Lake View Villa – Tây Hồ',
      price: '890.000',
      rating: '4.8',
      image: '/images/result-5-252712.png',
      badge: 'Hot',
      tags: ['Hồ Tây', 'Bếp']
    },
    {
      id: 6,
      name: 'Peaceful Bungalow – Đông Anh',
      price: '420.000',
      rating: '4.5',
      image: '/images/result-6-2fdb72.png',
      badge: 'Mới',
      tags: ['Wifi', 'Đỗ xe']
    }
  ];

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Apply filters logic here
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    // Apply sorting logic here
  };

  useEffect(() => {
    // Scroll to top and add entrance animation
    window.scrollTo(0, 0);
    const searchSection = document.querySelector('.search-sticky-section');
    if (searchSection) {
      searchSection.classList.add('search-enter');
    }
  }, []);

  return (
    <div className="search-page">
      <Header />

      {/* Sticky Search Section */}
      <div className="search-sticky-section">
        <div className="search-container">
          {/* Breadcrumb */}
          <div className="breadcrumb-row">
            <div className="breadcrumb">
              <Link to="/" className="breadcrumb-link">Trang chủ</Link>
              <span className="breadcrumb-separator">/</span>
              <strong className="breadcrumb-current">Kết quả tìm kiếm</strong>
            </div>
            <div className="filter-badge">
              <img src="/images/icon-filter.svg" alt="filter" className="badge-icon" />
              <span>Bộ lọc đang áp dụng</span>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar 
            variant="sticky"
            initialData={{
              location,
              checkIn,
              checkOut,
              guests
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="search-main">
        <div className="search-container">
          <div className="search-layout">
            {/* Sidebar */}
            <aside className="search-sidebar">
              <FilterSidebar onFilterChange={handleFilterChange} />
            </aside>

            {/* Results */}
            <main className="search-results">
              {/* Results Header */}
              <div className="results-header">
                <h2 className="results-title">
                  Kết quả cho "{location}", {checkIn}–{checkOut} · {guests} khách
                </h2>
                <div className="results-controls">
                  <button className="map-btn">
                    <img src="/images/icon-map.svg" alt="map" className="map-icon" />
                    <span>Bản đồ</span>
                  </button>
                  <div className="sort-dropdown">
                    <label className="sort-label">Sắp xếp theo</label>
                    <select 
                      className="sort-select" 
                      value={sortBy}
                      onChange={handleSortChange}
                    >
                      <option value="recommended">Gợi ý hàng đầu</option>
                      <option value="price-low">Giá thấp nhất</option>
                      <option value="price-high">Giá cao nhất</option>
                      <option value="rating">Đánh giá cao nhất</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              <div className="results-grid">
                {homestays.map(homestay => (
                  <HomestayCard key={homestay.id} homestay={homestay} />
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button className="page-btn" disabled={currentPage === 1}>
                  Trước
                </button>
                {[1, 2, 3, '...', 10].map((page, index) => (
                  <button
                    key={index}
                    className={`page-btn ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}
                <button className="page-btn" disabled={currentPage === 10}>
                  Sau
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Search;

