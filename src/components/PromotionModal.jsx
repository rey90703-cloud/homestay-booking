import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import './PromotionModal.css';

function PromotionModal({ isOpen, onClose }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get current month name
  const getCurrentMonthName = () => {
    const currentMonth = new Date().getMonth() + 1;
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return monthNames[currentMonth - 1];
  };

  // Fetch promo codes from API
  useEffect(() => {
    if (isOpen) {
      fetchPromoCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true);
      
      // Fetch active promo codes from public API
      const response = await fetch(`${API_BASE_URL}/promo-codes/active`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch promo codes');
      }
      
      const result = await response.json();
      const promoCodes = result.data || [];

      // Transform data to display format
      const transformedPromotions = promoCodes
        .filter(promo => promo.isActive)
        .map(promo => ({
          id: promo._id,
          code: promo.code,
          title: promo.name,
          discount: promo.discountType === 'percentage' 
            ? `${promo.discountValue}%` 
            : `${promo.discountValue.toLocaleString('vi-VN')}đ`,
          description: promo.description,
          conditions: promo.conditions ? promo.conditions.split('\n').filter(c => c.trim()) : [],
          color: getColorForPromo(promo.code),
          icon: getIconForPromo(promo.code),
          validUntil: promo.validUntil ? new Date(promo.validUntil).toLocaleDateString('vi-VN') : '',
        }));

      setPromotions(transformedPromotions);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      // Fallback to empty array on error
      setPromotions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to assign colors based on promo code
  const getColorForPromo = (code) => {
    if (code.includes('FIRST')) return '#E11D48';
    if (code.includes('EARLY')) return '#0891B2';
    if (code.includes('MONTH')) return '#7C3AED';
    if (code.includes('WEEKEND')) return '#EA580C';
    return '#E11D48'; // Default color
  };

  // Helper function to assign icons based on promo code
  const getIconForPromo = (code) => {
    if (code.includes('FIRST')) return '🎉';
    if (code.includes('EARLY')) return '🐦';
    if (code.includes('MONTH')) return '🎁';
    if (code.includes('WEEKEND')) return '🎊';
    return '🎁'; // Default icon
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('promotion-modal-overlay')) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="promotion-modal-overlay" onClick={handleOverlayClick}>
      <div className="promotion-modal">
        <button className="modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="modal-header">
          <h2 className="modal-title">🎉 Mã giảm giá {getCurrentMonthName()}</h2>
          <p className="modal-subtitle">Sao chép mã và áp dụng khi thanh toán</p>
        </div>

        {isLoading ? (
          <div className="promotions-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải mã giảm giá...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="promotions-empty">
            <p>Hiện tại chưa có mã giảm giá nào</p>
          </div>
        ) : (
          <div className="promotions-list">
            {promotions.map((promo) => (
            <div key={promo.id} className="promo-card" style={{ borderLeftColor: promo.color }}>
              <div className="promo-header">
                <div className="promo-icon">{promo.icon}</div>
                <div className="promo-info">
                  <h3 className="promo-title">{promo.title}</h3>
                  <p className="promo-description">{promo.description}</p>
                </div>
                <div className="promo-discount" style={{ background: promo.color }}>
                  {promo.discount}
                </div>
              </div>

              <div className="promo-code-section">
                <div className="promo-code-box">
                  <span className="promo-code">{promo.code}</span>
                  <button 
                    className={`btn-copy ${copiedCode === promo.code ? 'copied' : ''}`}
                    onClick={() => handleCopyCode(promo.code)}
                  >
                    {copiedCode === promo.code ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="promo-conditions">
                <p className="conditions-title">Điều kiện áp dụng:</p>
                <ul className="conditions-list">
                  {promo.conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
                <p className="promo-valid">Có hiệu lực đến: {promo.validUntil}</p>
              </div>
            </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <p className="modal-note">
            💡 <strong>Lưu ý:</strong> Mỗi mã chỉ áp dụng một lần cho mỗi đơn hàng. 
            Không áp dụng đồng thời nhiều mã giảm giá.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PromotionModal;
