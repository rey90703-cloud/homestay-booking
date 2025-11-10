import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AddHomestay.css';

const AddHomestay = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    maxGuests: '',
    description: '',
    amenities: {
      wifi: false,
      ac: false,
      kitchen: false,
      parking: false,
      garden: false,
      mountain: false,
    },
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);

  // Redirect if not authenticated or not owner
  React.useEffect(() => {
    if (!isAuthenticated || user?.role !== 'owner') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('amenities.')) {
      const amenityName = name.split('.')[1];
      setFormData({
        ...formData,
        amenities: {
          ...formData.amenities,
          [amenityName]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      images: files,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên homestay';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Vui lòng chọn khu vực';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Vui lòng nhập giá hợp lệ';
    }

    if (!formData.bedrooms || formData.bedrooms <= 0) {
      newErrors.bedrooms = 'Vui lòng nhập số phòng ngủ';
    }

    if (!formData.bathrooms || formData.bathrooms <= 0) {
      newErrors.bathrooms = 'Vui lòng nhập số phòng tắm';
    }

    if (!formData.maxGuests || formData.maxGuests <= 0) {
      newErrors.maxGuests = 'Vui lòng nhập số khách tối đa';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('Homestay data:', formData);
    setSubmitStatus('success');

    // Reset form after 2 seconds and redirect
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (!isAuthenticated || user?.role !== 'owner') {
    return null;
  }

  return (
    <div className="add-homestay-page">
      <div className="add-homestay-container">
        <div className="add-homestay-header">
          <h1 className="add-homestay-title">Đăng homestay mới</h1>
          <p className="add-homestay-subtitle">
            Điền thông tin chi tiết về homestay của bạn để bắt đầu cho thuê
          </p>
        </div>

        <form className="add-homestay-form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Thông tin cơ bản</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tên homestay *</label>
                <input
                  type="text"
                  name="name"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="VD: The Chill House – Tây Hồ"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Khu vực *</label>
                <select
                  name="location"
                  className={`form-input ${errors.location ? 'error' : ''}`}
                  value={formData.location}
                  onChange={handleChange}
                >
                  <option value="">Chọn khu vực</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Lào Cai">Lào Cai (Sa Pa)</option>
                  <option value="Hạ Long">Hạ Long</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Nha Trang">Nha Trang</option>
                  <option value="Đà Lạt">Đà Lạt</option>
                  <option value="TP.HCM">TP. Hồ Chí Minh</option>
                </select>
                {errors.location && <span className="error-message">{errors.location}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ chi tiết *</label>
              <input
                type="text"
                name="address"
                className={`form-input ${errors.address ? 'error' : ''}`}
                placeholder="Số nhà, tên đường, phường/xã"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Giá thuê (VNĐ/đêm) *</label>
                <input
                  type="number"
                  name="price"
                  className={`form-input ${errors.price ? 'error' : ''}`}
                  placeholder="650000"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Số khách tối đa *</label>
                <input
                  type="number"
                  name="maxGuests"
                  className={`form-input ${errors.maxGuests ? 'error' : ''}`}
                  placeholder="4"
                  min="1"
                  value={formData.maxGuests}
                  onChange={handleChange}
                />
                {errors.maxGuests && <span className="error-message">{errors.maxGuests}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Số phòng ngủ *</label>
                <input
                  type="number"
                  name="bedrooms"
                  className={`form-input ${errors.bedrooms ? 'error' : ''}`}
                  placeholder="2"
                  min="1"
                  value={formData.bedrooms}
                  onChange={handleChange}
                />
                {errors.bedrooms && <span className="error-message">{errors.bedrooms}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Số phòng tắm *</label>
                <input
                  type="number"
                  name="bathrooms"
                  className={`form-input ${errors.bathrooms ? 'error' : ''}`}
                  placeholder="1"
                  min="1"
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
                {errors.bathrooms && <span className="error-message">{errors.bathrooms}</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-section">
            <h2 className="section-title">Mô tả</h2>
            <div className="form-group">
              <label className="form-label">Mô tả chi tiết *</label>
              <textarea
                name="description"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Mô tả về homestay của bạn, vị trí, tiện nghi, điểm nổi bật..."
                rows="6"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>
          </div>

          {/* Amenities */}
          <div className="form-section">
            <h2 className="section-title">Tiện nghi</h2>
            <div className="amenities-grid">
              <label className="amenity-item">
                <input
                  type="checkbox"
                  name="amenities.wifi"
                  checked={formData.amenities.wifi}
                  onChange={handleChange}
                />
                <span>📶 WiFi</span>
              </label>
              <label className="amenity-item">
                <input
                  type="checkbox"
                  name="amenities.ac"
                  checked={formData.amenities.ac}
                  onChange={handleChange}
                />
                <span>❄️ Điều hòa</span>
              </label>
              <label className="amenity-item">
                <input
                  type="checkbox"
                  name="amenities.kitchen"
                  checked={formData.amenities.kitchen}
                  onChange={handleChange}
                />
                <span>🍳 Bếp</span>
              </label>
              <label className="amenity-item">
                <input
                  type="checkbox"
                  name="amenities.parking"
                  checked={formData.amenities.parking}
                  onChange={handleChange}
                />
                <span>🚗 Chỗ đậu xe</span>
              </label>
              <label className="amenity-item">
                <input
                  type="checkbox"
                  name="amenities.garden"
                  checked={formData.amenities.garden}
                  onChange={handleChange}
                />
                <span>🌳 Sân vườn</span>
              </label>
              <label className="amenity-item">
                <input
                  type="checkbox"
                  name="amenities.mountain"
                  checked={formData.amenities.mountain}
                  onChange={handleChange}
                />
                <span>⛰️ View núi</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h2 className="section-title">Hình ảnh</h2>
            <div className="form-group">
              <label className="form-label">Tải lên hình ảnh</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file-input"
              />
              <p className="form-hint">Tải lên tối đa 10 hình ảnh (JPG, PNG)</p>
              {formData.images.length > 0 && (
                <p className="file-count">Đã chọn {formData.images.length} hình ảnh</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/')}>
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              Đăng homestay
            </button>
          </div>

          {submitStatus === 'success' && (
            <div className="submit-success">
              ✓ Homestay đã được đăng thành công! Đang chuyển hướng...
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddHomestay;

