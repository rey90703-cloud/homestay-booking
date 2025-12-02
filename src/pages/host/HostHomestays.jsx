import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './HostHomestays.css';
import { 
  FaWifi, 
  FaTv, 
  FaKitchenSet, 
  FaSnowflake, 
  FaFire, 
  FaBriefcase, 
  FaPersonSwimming, 
  FaDumbbell, 
  FaSquareParking, 
  FaBuilding, 
  FaSeedling 
} from "react-icons/fa6";
import { MdLocalLaundryService } from "react-icons/md";

const HostHomestays = ({ onAddClick }) => {
  const navigate = useNavigate();
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedHomestay, setSelectedHomestay] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    googleMapsUrl: '',
    contactPhone: '',
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    basePrice: '',
    coverImage: null,
    images: [],
    amenities: []
  });
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [imagesPreview, setImagesPreview] = useState([]);

  const AMENITIES = [
    { id: 'wifi', name: 'WiFi', icon: FaWifi, color: '#4285F4' },
    { id: 'tv', name: 'TV', icon: FaTv, color: '#FF6B6B' },
    { id: 'kitchen', name: 'Bếp', icon: FaKitchenSet, color: '#4ECDC4' },
    { id: 'washing_machine', name: 'Máy giặt', icon: MdLocalLaundryService, color: '#45B7D1' },
    { id: 'air_conditioning', name: 'Điều hòa', icon: FaSnowflake, color: '#74C0FC' },
    { id: 'heating', name: 'Sưởi ấm', icon: FaFire, color: '#FF8E53' },
    { id: 'workspace', name: 'Không gian làm việc', icon: FaBriefcase, color: '#6C5CE7' },
    { id: 'pool', name: 'Hồ bơi', icon: FaPersonSwimming, color: '#00B894' },
    { id: 'gym', name: 'Phòng gym', icon: FaDumbbell, color: '#E17055' },
    { id: 'parking', name: 'Đỗ xe miễn phí', icon: FaSquareParking, color: '#636E72' },
    { id: 'balcony', name: 'Ban công', icon: FaBuilding, color: '#A29BFE' },
    { id: 'garden', name: 'Vườn', icon: FaSeedling, color: '#00B894' },
  ];

  useEffect(() => {
    fetchHomestays();
  }, []);

  const fetchHomestays = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching homestays from:', `${API_BASE_URL}/homestays/my-listings`);
      const response = await fetch(`${API_BASE_URL}/homestays/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📦 Response data:', data);
      const homestaysList = data.data?.homestays || data.data?.listings || data.data || [];
      console.log('🏠 Homestays:', homestaysList);
      setHomestays(homestaysList);
    } catch (error) {
      console.error('Error fetching homestays:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (homestay) => {
    setSelectedHomestay(homestay);
    
    // Convert amenityNames (tên tiếng Việt) sang amenity ids
    const amenityIds = (homestay.amenityNames || []).map(name => {
      const found = AMENITIES.find(a => a.name === name || a.id === name);
      return found ? found.id : name;
    }).filter(Boolean);
    
    setFormData({
      title: homestay.title || '',
      description: homestay.description || '',
      city: homestay.location?.city || '',
      address: homestay.location?.address || '',
      googleMapsUrl: homestay.location?.googleMapsUrl || '',
      contactPhone: homestay.contactPhone || '',
      maxGuests: homestay.capacity?.guests || '',
      bedrooms: homestay.capacity?.bedrooms || '',
      bathrooms: homestay.capacity?.bathrooms || '',
      basePrice: homestay.pricing?.basePrice || '',
      coverImage: null,
      images: [],
      amenities: amenityIds
    });
    setCoverImagePreview(homestay.coverImage || '');
    setImagesPreview(homestay.images?.map(img => img.url) || []);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedHomestay(null);
    setFormData({
      title: '',
      description: '',
      city: '',
      address: '',
      googleMapsUrl: '',
      contactPhone: '',
      maxGuests: '',
      bedrooms: '',
      bathrooms: '',
      basePrice: '',
      coverImage: null,
      images: [],
      amenities: []
    });
    setCoverImagePreview('');
    setImagesPreview([]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // If it's googleMapsUrl, extract URL from iframe if needed
    if (name === 'googleMapsUrl') {
      let extractedUrl = value;
      
      // Check if user pasted iframe code
      if (value.includes('<iframe') && value.includes('src=')) {
        const srcMatch = value.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
          extractedUrl = srcMatch[1];
        }
      }
      
      setFormData({ ...formData, [name]: extractedUrl });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => {
      const amenities = prev.amenities || [];
      if (amenities.includes(amenityId)) {
        return { ...prev, amenities: amenities.filter((id) => id !== amenityId) };
      } else {
        return { ...prev, amenities: [...amenities, amenityId] };
      }
    });
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, coverImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const existingImages = formData.images || [];
      setFormData({ ...formData, images: [...existingImages, ...files] });

      const previews = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === files.length) {
            setImagesPreview([...imagesPreview, ...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('contactPhone', formData.contactPhone);
      formDataToSend.append('propertyType', 'entire_place');
      formDataToSend.append('location[city]', formData.city);
      formDataToSend.append('location[address]', formData.address);
      if (formData.googleMapsUrl) {
        formDataToSend.append('location[googleMapsUrl]', formData.googleMapsUrl);
      }
      formDataToSend.append('location[country]', 'Việt Nam');
      formDataToSend.append('capacity[guests]', formData.maxGuests);
      formDataToSend.append('capacity[bedrooms]', formData.bedrooms);
      formDataToSend.append('capacity[beds]', formData.bedrooms);
      formDataToSend.append('capacity[bathrooms]', formData.bathrooms);
      formDataToSend.append('pricing[basePrice]', formData.basePrice);

      // Thêm amenities - convert id sang tên tiếng Việt để lưu vào DB
      if (formData.amenities && formData.amenities.length > 0) {
        formData.amenities.forEach((amenityId) => {
          const found = AMENITIES.find(a => a.id === amenityId);
          const amenityName = found ? found.name : amenityId;
          formDataToSend.append('amenities[]', amenityName);
        });
      }

      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }

      if (formData.images && formData.images.length > 0) {
        Array.from(formData.images).forEach((file) => {
          formDataToSend.append('images', file);
        });
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/homestays/${selectedHomestay._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        alert('Cập nhật homestay thành công!');
        closeEditModal();
        fetchHomestays();
      } else {
        alert(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật homestay');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa homestay này?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/homestays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Xóa homestay thành công!');
      fetchHomestays();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa homestay');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Đang hoạt động', class: 'status-active' },
      'pending': { label: 'Chờ duyệt', class: 'status-pending' },
      'inactive': { label: 'Tạm ngưng', class: 'status-inactive' }
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="host-homestays-wrapper">
      <div className="page-header">
        <h1 className="page-title">Homestay của tôi</h1>
        <button 
          className="btn-add-homestay"
          onClick={onAddClick}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm homestay
        </button>
      </div>

      {homestays.length === 0 ? (
        <div className="no-homestays">
          <p>Bạn chưa có homestay nào</p>
          <button onClick={onAddClick}>Đăng homestay đầu tiên</button>
        </div>
      ) : (
        <div className="homestays-grid">
          {homestays.map((homestay) => (
            <div key={homestay._id} className="homestay-card">
              <div className="homestay-image">
                <img src={homestay.coverImage} alt={homestay.title} />
                {getStatusBadge(homestay.status)}
              </div>
              <div className="homestay-content">
                <h3 className="homestay-title">{homestay.title}</h3>
                <p className="homestay-location">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {homestay.location.city}
                </p>
                <p className="homestay-price">{formatPrice(homestay.pricing.basePrice)}/đêm</p>
                <div className="homestay-actions">
                  <button 
                    className="btn-view"
                    onClick={() => window.open(`/homestay/${homestay._id}`, '_blank')}
                  >
                    Xem
                  </button>
                  <button 
                    className="btn-edit"
                    onClick={() => openEditModal(homestay)}
                  >
                    Sửa
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(homestay._id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa Homestay</h2>
              <button className="btn-close" onClick={closeEditModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitEdit} className="edit-form">
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thành phố *</label>
                  <select name="city" value={formData.city} onChange={handleFormChange} required>
                    <option value="">Chọn thành phố</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Lào Cai">Lào Cai</option>
                    <option value="Hạ Long">Hạ Long</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Nha Trang">Nha Trang</option>
                    <option value="Đà Lạt">Đà Lạt</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="TP.HCM">TP.HCM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Link Google Maps hoặc Iframe Embed</label>
                <textarea
                  name="googleMapsUrl"
                  value={formData.googleMapsUrl}
                  onChange={handleFormChange}
                  placeholder="Dán link Google Maps hoặc toàn bộ iframe embed code từ Google Maps"
                  rows="3"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  📍 Bạn có thể dán link hoặc iframe embed code. 
                  <button 
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#e91e63', 
                      textDecoration: 'underline', 
                      cursor: 'pointer',
                      padding: '0 4px',
                      fontSize: '12px'
                    }}
                  >
                    Xem hướng dẫn
                  </button>
                </small>
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleFormChange}
                  pattern="[0-9]{10,11}"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số khách *</label>
                  <input
                    type="number"
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleFormChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phòng ngủ *</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleFormChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phòng tắm *</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleFormChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Giá/đêm (VNĐ) *</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleFormChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tiện nghi</label>
                <div className="amenities-grid">
                  {AMENITIES.map((amenity) => {
                    const IconComponent = amenity.icon;
                    const isSelected = formData.amenities?.includes(amenity.id) || false;
                    
                    return (
                      <label 
                        key={amenity.id} 
                        className={`amenity-checkbox ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleAmenityToggle(amenity.id)}
                        />
                        <div className="amenity-content">
                          <div 
                            className="amenity-icon-wrapper"
                            style={{ 
                              backgroundColor: isSelected ? amenity.color : '#f3f4f6',
                              color: isSelected ? 'white' : amenity.color
                            }}
                          >
                            <IconComponent className="amenity-icon" />
                          </div>
                          <span className="amenity-name">{amenity.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Ảnh bìa</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                />
                {coverImagePreview && (
                  <div className="image-preview">
                    <img src={coverImagePreview} alt="Cover preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Ảnh bổ sung</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                />
                {imagesPreview.length > 0 && (
                  <div className="images-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
                    {imagesPreview.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={preview} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeEditModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-save">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>📍 Hướng dẫn lấy link nhúng Google Maps</h2>
              <button className="btn-close" onClick={() => setShowGuideModal(false)}>×</button>
            </div>
            
            <div className="guide-content" style={{ padding: '24px' }}>
              <div className="guide-step">
                <h3 style={{ color: '#e91e63', marginBottom: '12px' }}>Bước 1: Mở Google Maps</h3>
                <p style={{ marginBottom: '8px' }}>Truy cập <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={{ color: '#e91e63' }}>Google Maps</a> và tìm kiếm địa chỉ homestay của bạn.</p>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#e91e63', marginBottom: '12px' }}>Bước 2: Nhấn nút "Chia sẻ"</h3>
                <p style={{ marginBottom: '8px' }}>Sau khi tìm thấy địa chỉ, nhấn vào nút <strong>"Chia sẻ"</strong> hoặc <strong>"Share"</strong> ở bên trái màn hình.</p>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                  <img 
                    src="https://i.imgur.com/placeholder.png" 
                    alt="Share button"
                    style={{ width: '100%', maxWidth: '400px', display: 'block', margin: '0 auto', borderRadius: '4px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#e91e63', marginBottom: '12px' }}>Bước 3: Chọn tab "Nhúng bản đồ"</h3>
                <p style={{ marginBottom: '8px' }}>Trong popup hiện ra, chọn tab <strong>"Nhúng bản đồ"</strong> hoặc <strong>"Embed a map"</strong>.</p>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#e91e63', marginBottom: '12px' }}>Bước 4: Sao chép mã nhúng</h3>
                <p style={{ marginBottom: '8px' }}>Nhấn nút <strong>"SAO CHÉP HTML"</strong> để copy toàn bộ iframe code.</p>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginTop: '8px', fontSize: '13px', fontFamily: 'monospace', overflowX: 'auto' }}>
                  <code style={{ color: '#666' }}>
                    &lt;iframe src="https://www.google.com/maps/embed?pb=..."...&gt;&lt;/iframe&gt;
                  </code>
                </div>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#e91e63', marginBottom: '12px' }}>Bước 5: Dán vào form</h3>
                <p style={{ marginBottom: '8px' }}>Dán toàn bộ mã iframe vừa copy vào ô <strong>"Link Google Maps hoặc Iframe Embed"</strong>. Hệ thống sẽ tự động trích xuất URL.</p>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  className="btn-save"
                  onClick={() => setShowGuideModal(false)}
                  style={{ padding: '12px 32px' }}
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostHomestays;
