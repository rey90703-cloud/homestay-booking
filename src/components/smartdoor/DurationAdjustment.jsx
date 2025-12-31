import React, { useState } from 'react';
import './DurationAdjustment.css';

// SVG Icons
const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

/**
 * DurationAdjustment Component
 * Input field để điều chỉnh thời gian hiệu lực mật khẩu
 */
const DurationAdjustment = ({ currentDuration, onSetDuration, disabled }) => {
  const [duration, setDuration] = useState(currentDuration || 60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setDuration(value);
    setError(null);
    setSuccess(false);
  };

  const validateDuration = () => {
    if (duration < 0) {
      setError('Thời gian không thể âm');
      return false;
    }
    if (duration > 1440) {
      setError('Thời gian tối đa là 1440 phút (24 giờ)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDuration()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await onSetDuration(duration);
      
      if (result && result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result?.message || 'Không thể cập nhật thời gian');
      }
    } catch (err) {
      console.error('Error setting duration:', err);
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (minutes) => {
    setDuration(minutes);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="duration-adjustment">
      <div className="duration-header">
        <h4>Điều chỉnh thời gian hiệu lực</h4>
        <p>Thời gian mật khẩu có hiệu lực (0-1440 phút)</p>
      </div>

      <form onSubmit={handleSubmit} className="duration-form">
        <div className="duration-input-group">
          <input
            type="number"
            className="duration-input"
            value={duration}
            onChange={handleDurationChange}
            min="0"
            max="1440"
            step="1"
            disabled={disabled || loading}
            placeholder="Nhập số phút"
          />
          <span className="duration-unit">phút</span>
        </div>

        <div className="duration-presets">
          <button
            type="button"
            className="btn-preset"
            onClick={() => handlePresetClick(60)}
            disabled={disabled || loading}
          >
            1 giờ
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => handlePresetClick(180)}
            disabled={disabled || loading}
          >
            3 giờ
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => handlePresetClick(360)}
            disabled={disabled || loading}
          >
            6 giờ
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => handlePresetClick(720)}
            disabled={disabled || loading}
          >
            12 giờ
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => handlePresetClick(1440)}
            disabled={disabled || loading}
          >
            24 giờ
          </button>
        </div>

        {error && (
          <div className="duration-error">
            <IconWarning />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="duration-success">
            <IconCheck />
            <span>Đã cập nhật thời gian hiệu lực</span>
          </div>
        )}

        <button
          type="submit"
          className="btn-submit-duration"
          disabled={disabled || loading || duration === currentDuration}
        >
          {loading ? (
            <>
              <span className="spinner-small"></span>
              <span>Đang cập nhật...</span>
            </>
          ) : (
            'Cập nhật'
          )}
        </button>
      </form>

      <div className="duration-info">
        <p className="info-text">
          <IconInfo />
          <span><strong>Lưu ý:</strong> Đặt thời gian = 0 để vô hiệu hóa mật khẩu ngay lập tức.</span>
        </p>
      </div>
    </div>
  );
};

export default DurationAdjustment;
