import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import './PromoCodeModal.css';

function PromoCodeModal({ isOpen, onClose, onSelectPromo, bookingInfo }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch promo codes from API
  useEffect(() => {
    if (isOpen) {
      fetchPromoCodes();
    }
  }, [isOpen]);

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/promo-codes/active`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch promo codes');
      }
      
      const result = await response.json();
      const promoCodes = result.data || [];

      // Transform to display format
      const transformedPromotions = promoCodes.map(promo => ({
        code: promo.code,
        name: promo.name,
        discount: promo.discountValue,
        discountType: promo.discountType,
        icon: getIconForPromo(promo.code),
        color: getColorForPromo(promo.code),
        conditions: promo.conditions ? promo.conditions.split('\n').filter(c => c.trim()) : [],
        minOrderAmount: promo.minOrderAmount || 0,
        maxDiscount: promo.maxDiscount || 0,
      }));

      setPromotions(transformedPromotions);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      setPromotions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getColorForPromo = (code) => {
    if (code.includes('FIRST')) return '#E11D48';
    if (code.includes('EARLY')) return '#0891B2';
    if (code.includes('MONTH')) return '#7C3AED';
    if (code.includes('WEEKEND')) return '#EA580C';
    return '#E11D48';
  };

  const getIconForPromo = (code) => {
    if (code.includes('FIRST')) return '🎉';
    if (code.includes('EARLY')) return '🐦';
    if (code.includes('MONTH')) return '🎁';
    if (code.includes('WEEKEND')) return '🎊';
    return '🎁';
  };

  const checkPromoAvailability = (promo) => {
    // Check minimum order amount
    if (promo.minOrderAmount && bookingInfo.totalPrice < promo.minOrderAmount) {
      return { 
        available: false, 
        reason: `Đơn tối thiểu ${promo.minOrderAmount.toLocaleString('vi-VN')}đ` 
      };
    }

    return { available: true, reason: '' };
  };

  const handleSelectPromo = (promo) => {
    const availability = checkPromoAvailability(promo);
    if (availability.available) {
      setSelectedCode(promo.code);
    }
  };

  const handleApply = () => {
    if (selectedCode) {
      const promo = promotions.find(p => p.code === selectedCode);
      onSelectPromo(promo);
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('promo-code-modal-overlay')) {
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
    <div className="promo-code-modal-overlay" onClick={handleOverlayClick}>
      <div className="promo-code-modal">
        <div className="promo-modal-header-simple">
          <h2 className="promo-modal-title">🎁 Chọn mã giảm giá</h2>
          <button className="promo-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="promo-codes-list">
          {isLoading ? (
            <div className="promo-loading">
              <div className="loading-spinner"></div>
              <p>Đang tải mã giảm giá...</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="promo-empty">
              <p>Hiện tại chưa có mã giảm giá nào</p>
            </div>
          ) : (
            promotions.map((promo) => {
              const availability = checkPromoAvailability(promo);
              const isSelected = selectedCode === promo.code;
              const isDisabled = !availability.available;

              return (
                <div 
                  key={promo.code}
                  className={`promo-code-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleSelectPromo(promo)}
                  style={{ borderLeftColor: promo.color }}
                >
                  <div className="promo-code-header">
                    <div className="promo-code-icon">{promo.icon}</div>
                    <div className="promo-code-info">
                      <h3 className="promo-code-name">{promo.name}</h3>
                      <p className="promo-code-code">{promo.code}</p>
                    </div>
                    <div className="promo-code-discount" style={{ background: isDisabled ? '#9CA3AF' : promo.color }}>
                      {promo.discountType === 'percentage' 
                        ? `-${promo.discount}%` 
                        : `-${promo.discount.toLocaleString('vi-VN')}đ`}
                    </div>
                  </div>

                  {promo.conditions.length > 0 && (
                    <div className="promo-code-conditions">
                      <ul className="promo-conditions-list">
                        {promo.conditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {isDisabled && (
                    <div className="promo-unavailable-badge">
                      ⚠️ {availability.reason}
                    </div>
                  )}

                  {isSelected && !isDisabled && (
                    <div className="promo-selected-badge">
                      ✓ Đã chọn
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="promo-modal-footer">
          <button 
            className="btn-apply-selected" 
            onClick={handleApply}
            disabled={!selectedCode}
          >
            {selectedCode ? 'Áp dụng mã' : 'Chọn một mã'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromoCodeModal;
