import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../../config/api';
import PaymentStatistics from '../../components/admin/PaymentStatistics';
import PaymentFilters from '../../components/admin/PaymentFilters';
import UnmatchedTransactionTable from '../../components/admin/UnmatchedTransactionTable';
import MatchTransactionModal from '../../components/admin/MatchTransactionModal';
import DetailsModal from '../../components/admin/DetailsModal';
import Pagination from '../../components/admin/Pagination';
import './AdminPayments.css';

const AdminPayments = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'unmatched'
  
  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalHostPayouts: 0,
    totalPlatformCommission: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    paymentStatus: '',
    payoutStatus: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    limit: 20,
  });

  // Unmatched transactions state
  const [unmatchedTransactions, setUnmatchedTransactions] = useState([]);
  const [unmatchedFilters, setUnmatchedFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [unmatchedPagination, setUnmatchedPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [unmatchedLoading, setUnmatchedLoading] = useState(false);

  // Modal state
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsType, setDetailsType] = useState('booking'); // 'booking' | 'transaction'

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
      fetchStatistics();
    } else if (activeTab === 'unmatched') {
      fetchUnmatchedTransactions();
    }
  }, [activeTab, filters, pagination.currentPage, unmatchedFilters, unmatchedPagination.currentPage]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/bookings/statistics/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setStatistics(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/bookings?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
        if (data.meta?.pagination) {
          setPagination(data.meta.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    if (activeTab === 'bookings') {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      setUnmatchedFilters((prev) => ({ ...prev, [key]: value }));
      setUnmatchedPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [activeTab]);

  // Fetch unmatched transactions
  const fetchUnmatchedTransactions = async () => {
    try {
      setUnmatchedLoading(true);
      const queryParams = new URLSearchParams({
        page: unmatchedPagination.currentPage,
        limit: unmatchedPagination.limit,
        ...(unmatchedFilters.status && { status: unmatchedFilters.status }),
        ...(unmatchedFilters.startDate && { startDate: unmatchedFilters.startDate }),
        ...(unmatchedFilters.endDate && { endDate: unmatchedFilters.endDate }),
      });

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/payments/unmatched?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUnmatchedTransactions(data.data?.transactions || []);
        if (data.meta?.pagination) {
          setUnmatchedPagination(data.meta.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching unmatched transactions:', error);
    } finally {
      setUnmatchedLoading(false);
    }
  };

  // Handle match transaction
  const handleMatchTransaction = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setMatchModalOpen(true);
  }, []);

  // Handle match success
  const handleMatchSuccess = useCallback(() => {
    fetchUnmatchedTransactions();
    fetchStatistics();
  }, []);

  // Handle view transaction details
  const handleViewDetails = useCallback((transaction) => {
    setSelectedItem(transaction);
    setDetailsType('transaction');
    setDetailsModalOpen(true);
  }, []);

  // Handle view booking details
  const handleViewBookingDetails = useCallback((booking) => {
    setSelectedItem(booking);
    setDetailsType('booking');
    setDetailsModalOpen(true);
  }, []);

  const handleProcessPayout = async (bookingId) => {
    if (!confirm('Xác nhận thanh toán cho chủ nhà?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Đã thanh toán cho chủ nhà thành công!');
        fetchBookings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Có lỗi xảy ra khi thanh toán!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getPaymentStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-info',
    };
    return classes[status] || 'badge-warning';
  };

  const getPayoutStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      processing: 'badge-info',
      completed: 'badge-success',
      failed: 'badge-danger',
    };
    return classes[status] || 'badge-warning';
  };

  return (
    <div className="admin-payments">
      <div className="admin-header">
        <h1>Quản lý Thanh toán</h1>
      </div>

      {/* Tabs */}
      <div className="payment-tabs">
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings & Payouts
        </button>
        <button
          className={`tab-button ${activeTab === 'unmatched' ? 'active' : ''}`}
          onClick={() => setActiveTab('unmatched')}
        >
          Giao dịch chưa khớp
          {unmatchedTransactions.filter(t => t.status === 'unmatched').length > 0 && (
            <span className="tab-badge">
              {unmatchedTransactions.filter(t => t.status === 'unmatched').length}
            </span>
          )}
        </button>
      </div>

      {/* Statistics Cards */}
      {activeTab === 'bookings' && (
        <PaymentStatistics statistics={statistics} loading={loading} />
      )}

      {/* Filters */}
      <PaymentFilters
        filters={activeTab === 'bookings' ? filters : unmatchedFilters}
        onFilterChange={handleFilterChange}
        type={activeTab}
      />

      {/* Content based on active tab */}
      {activeTab === 'bookings' ? (
        <>
          {/* Bookings Table */}
          <div className="table-container">
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã booking</th>
                    <th>Homestay</th>
                    <th>Khách hàng</th>
                    <th>Ngày check-in</th>
                    <th>Tổng tiền</th>
                    <th>Chủ nhà (90%)</th>
                    <th>Nền tảng (10%)</th>
                    <th>TT thanh toán</th>
                    <th>TT chi trả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="booking-id">{booking._id.slice(-8)}</td>
                      <td>{booking.homestayId?.title || 'N/A'}</td>
                      <td>{booking.guestId?.email || 'N/A'}</td>
                      <td>{formatDate(booking.checkInDate)}</td>
                      <td className="price-cell">
                        {formatPrice(booking.pricing.totalAmount)}
                      </td>
                      <td className="price-cell host-amount">
                        {formatPrice(booking.pricing.hostAmount)}
                      </td>
                      <td className="price-cell commission-amount">
                        {formatPrice(booking.pricing.platformCommission)}
                      </td>
                      <td>
                        <span
                          className={`badge ${getPaymentStatusBadgeClass(
                            booking.payment.status,
                          )}`}
                        >
                          {booking.payment.status === 'pending'
                            ? 'Chờ TT'
                            : booking.payment.status === 'completed'
                            ? 'Đã TT'
                            : booking.payment.status === 'failed'
                            ? 'Thất bại'
                            : 'Hoàn tiền'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${getPayoutStatusBadgeClass(
                            booking.hostPayout?.status || 'pending',
                          )}`}
                        >
                          {booking.hostPayout?.status === 'completed'
                            ? 'Đã chi trả'
                            : booking.hostPayout?.status === 'processing'
                            ? 'Đang xử lý'
                            : booking.hostPayout?.status === 'failed'
                            ? 'Thất bại'
                            : 'Chờ chi trả'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {booking.payment.status === 'completed' &&
                            booking.hostPayout?.status === 'pending' && (
                              <button
                                className="btn-action btn-success"
                                onClick={() => handleProcessPayout(booking._id)}
                              >
                                Chi trả
                              </button>
                            )}
                          <button 
                            className="btn-action btn-info"
                            onClick={() => handleViewBookingDetails(booking)}
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalBookings}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, currentPage: page }))
            }
          />
        </>
      ) : (
        <>
          {/* Unmatched Transactions Table */}
          <UnmatchedTransactionTable
            transactions={unmatchedTransactions}
            loading={unmatchedLoading}
            onMatch={handleMatchTransaction}
            onViewDetails={handleViewDetails}
          />

          {/* Pagination */}
          <Pagination
            currentPage={unmatchedPagination.currentPage}
            totalPages={unmatchedPagination.totalPages}
            totalItems={unmatchedPagination.total}
            onPageChange={(page) =>
              setUnmatchedPagination((prev) => ({ ...prev, currentPage: page }))
            }
          />
        </>
      )}

      {/* Match Transaction Modal */}
      <MatchTransactionModal
        transaction={selectedTransaction}
        isOpen={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        onSuccess={handleMatchSuccess}
      />

      {/* Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={detailsType === 'booking' ? 'Chi tiết Booking' : 'Chi tiết Giao dịch'}
        data={selectedItem}
        type={detailsType}
      />
    </div>
  );
};

export default AdminPayments;
