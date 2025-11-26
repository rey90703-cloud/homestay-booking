import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import HomestayCard from '../components/HomestayCard';
import MapView from '../components/MapView';
import searchService from '../services/searchService';
import './Search.css';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [homestays, setHomestays] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = searchParams.get('location') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = searchParams.get('guests') || '';

  // Search homestays function
  const searchHomestays = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchData = {
        location,
        checkIn,
        checkOut,
        guests,
        ...filters,
        sortBy,
        page,
        limit: 12
      };

      const result = await searchService.searchHomestays(searchData);
      
      if (result.success) {
        setHomestays(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tìm kiếm');
        setHomestays([]);
      }
    } catch (err) {
      setError('Không thể kết nối đến server');
      setHomestays([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search when params or filters change
  useEffect(() => {
    searchHomestays(currentPage);
  }, [location, checkIn, checkOut, guests, filters, sortBy, currentPage]);

  // Initial setup
  useEffect(() => {
    window.scrollTo(0, 0);
    const searchSection = document.querySelector('.search-sticky-section');
    if (searchSection) {
      searchSection.classList.add('search-enter');
    }
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Generate pagination numbers
  const generatePaginationNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = pagination.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }

    return pages;
  };

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
                  {location && (
                    <>Kết quả cho "{location}"</>
                  )}
                  {checkIn && checkOut && (
                    <>, {formatDate(checkIn)}–{formatDate(checkOut)}</>
                  )}
                  {guests && (
                    <> · {guests} khách</>
                  )}
                  {!location && !checkIn && !checkOut && !guests && (
                    <>Tất cả homestay</>
                  )}

                </h2>
                <div className="results-controls">
                  
                  <div className="sort-dropdown">
                    <label className="sort-label">Sắp xếp theo</label>
                    <select 
                      className="sort-select" 
                      value={sortBy}
                      onChange={handleSortChange}
                      disabled={isLoading}
                    >
                      <option value="recommended">Gợi ý hàng đầu</option>
                      <option value="price">Giá thấp nhất</option>
                      <option value="-price">Giá cao nhất</option>
                      <option value="-averageRating">Đánh giá cao nhất</option>
                      <option value="createdAt">Mới nhất</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Đang tìm kiếm homestay...</p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="error-state">
                  <img src="/images/icon-error.svg" alt="error" className="error-icon" />
                  <h3>Có lỗi xảy ra</h3>
                  <p>{error}</p>
                  <button 
                    className="retry-btn"
                    onClick={() => searchHomestays(currentPage)}
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* No Results */}
              {!isLoading && !error && homestays.length === 0 && (
                <div className="no-results">
                  <img src="/images/icon-no-results.svg" alt="no results" className="no-results-icon" />
                  <h3>Không tìm thấy homestay phù hợp</h3>
                  <p>Hãy thử thay đổi bộ lọc hoặc tìm kiếm khu vực khác</p>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setFilters({});
                      setSearchParams({});
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}

              {/* Results Grid */}
              {!isLoading && !error && homestays.length > 0 && (
                <div className="results-grid">
                  {homestays.map(homestay => (
                    <HomestayCard key={homestay.id} homestay={homestay} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && !error && homestays.length > 0 && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="page-btn" 
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    Trước
                  </button>
                  {generatePaginationNumbers().map((page, index) => (
                    <button
                      key={index}
                      className={`page-btn ${pagination.currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    className="page-btn" 
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Search;

