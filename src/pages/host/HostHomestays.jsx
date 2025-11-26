import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import { FaWifi, FaTv, FaSnowflake, FaFire, FaBriefcase, FaSwimmer, FaDumbbell, FaParking, FaBuilding, FaSeedling } from 'react-icons/fa';
import { FaKitchenSet } from 'react-icons/fa6';
import { MdLocalLaundryService } from 'react-icons/md';
import './HostHomestays.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

function HostHomestays() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [homestays, setHomestays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedHomestay, setSelectedHomestay] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    contactPhone: '',
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    basePrice: '',
    coverImage: null,
    images: [],
    amenities: []
  });

  // Danh sách tiện nghi với icons
  const AMENITIES = [
    { id: 'wifi', name: 'WiFi', icon: FaWifi, color: '#4285F4' },
    { id: 'tv', name: 'TV', icon: FaTv, color: '#FF6B6B' },
    { id: 'kitchen', name: 'Bếp', icon: FaKitchenSet, color: '#4ECDC4' },
    { id: 'washing_machine', name: 'Máy giặt', icon: MdLocalLaundryService, color: '#45B7D1' },
    { id: 'air_conditioning', name: 'Điều hòa', icon: FaSnowflake, color: '#74C0FC' },
    { id: 'heating', name: 'Sưởi ấm', icon: FaFire, color: '#FF8E53' },
    { id: 'workspace', name: 'Không gian làm việc', icon: FaBriefcase, color: '#6C5CE7' },
    { id: 'pool', name: 'Hồ bơi', icon: FaSwimmer, color: '#00B894' },
    { id: 'gym', name: 'Phòng gym', icon: FaDumbbell, color: '#E17055' },
    { id: 'parking', name: 'Đỗ xe miễn phí', icon: FaParking, color: '#636E72' },
    { id: 'balcony', name: 'Ban công', icon: FaBuilding, color: '#A29BFE' },
    { id: 'garden', name: 'Vườn', icon: FaSeedling, color: '#00B894' },
  ];
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [imagesPreview, setImagesPreview] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      navigate('/');
      return;
    }
    fetchHomestays();
  }, [user, navigate]);

  const fetchHomestays = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/homestays/my-listings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setHomestays(data.data || []);
      } else {
        setError(data.error?.message || 'Không thể tải danh sách homestay');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải danh sách homestay');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedHomestay(null);
    setFormData({
      title: '',
      description: '',
      city: '',
      address: '',
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
    setShowModal(true);
  };

  const handleEdit = (homestay) => {
    setSelectedHomestay(homestay);
    setFormData({
      title: homestay.title || '',
      description: homestay.description || '',
      city: homestay.location?.city || '',
      address: homestay.location?.address || '',
      contactPhone: homestay.contactPhone || '',
      maxGuests: homestay.capacity?.guests || '',
      bedrooms: homestay.capacity?.bedrooms || '',
      bathrooms: homestay.capacity?.bathrooms || '',
      basePrice: homestay.pricing?.basePrice || '',
      coverImage: null,
      images: [],
      amenities: homestay.amenityNames || []
    });
    setCoverImagePreview(homestay.coverImage || '');
    setImagesPreview(homestay.images?.map(img => img.url) || []);
    setShowModal(true);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa homestay này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/homestays/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Xóa homestay thành công!');
        fetchHomestays();
      } else {
        alert(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa homestay');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.title.length < 10) {
      alert('Tiêu đề phải có ít nhất 10 ký tự');
      return;
    }

    if (formData.description.length < 50) {
      alert('Mô tả phải có ít nhất 50 ký tự');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Luôn gửi đầy đủ thông tin cơ bản (bắt buộc)
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('contactPhone', formData.contactPhone);
      formDataToSend.append('propertyType', 'entire_place'); // Default property type
      
      // Location
      formDataToSend.append('location[city]', formData.city);
      formDataToSend.append('location[address]', formData.address);
      formDataToSend.append('location[country]', 'Vietnam');
      
      // Pricing
      formDataToSend.append('pricing[basePrice]', formData.basePrice);
      formDataToSend.append('pricing[currency]', 'VND');
      
      // Capacity
      formDataToSend.append('capacity[guests]', formData.maxGuests);
      formDataToSend.append('capacity[bedrooms]', formData.bedrooms);
      formDataToSend.append('capacity[beds]', formData.bedrooms); // Default: beds = bedrooms
      formDataToSend.append('capacity[bathrooms]', formData.bathrooms);

      // Thêm amenities
      if (formData.amenities && formData.amenities.length > 0) {
        formData.amenities.forEach((amenity) => {
          formDataToSend.append('amenities[]', amenity);
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

      const url = selectedHomestay
        ? `${API_BASE_URL}/homestays/${selectedHomestay._id}`
        : `${API_BASE_URL}/homestays`;

      const response = await fetch(url, {
        method: selectedHomestay ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        alert(selectedHomestay ? 'Cập nhật homestay thành công!' : 'Thêm homestay thành công!');
        setShowModal(false);
        fetchHomestays();
      } else {
        // Hiển thị lỗi chi tiết từ backend
        let errorMessage = data.error?.message || 'Có lỗi xảy ra';
        
        // Nếu có validation errors, hiển thị chi tiết
        if (data.error?.details && Array.isArray(data.error.details)) {
          const detailMessages = data.error.details.map(d => d.message).join('\n');
          errorMessage = `${errorMessage}\n\nChi tiết:\n${detailMessages}`;
        }
        
        alert(errorMessage);
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu homestay');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="host-homestays-container">
          <p>Đang tải...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="host-homestays-container">
        <div className="host-homestays-header">
          <h1>Quản lý homestay của tôi</h1>
          <button className="btn-add" onClick={handleAdd}>
            + Thêm homestay
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="homestays-grid">
          {homestays.length === 0 ? (
            <p>Bạn chưa có homestay nào. Hãy thêm homestay đầu tiên!</p>
          ) : (
            homestays.map((homestay) => (
              <div key={homestay._id} className="homestay-card">
                <img
                  src={homestay.coverImage || '/placeholder.jpg'}
                  alt={homestay.title}
                  className="homestay-image"
                />
                <div className="homestay-info">
                  <h3 className="homestay-title">{homestay.title}</h3>
                  <div className="homestay-meta">
                    <p className="homestay-price">
                      {homestay.pricing?.basePrice?.toLocaleString('vi-VN')} VNĐ/đêm
                    </p>
                    <p className="homestay-location">
                      {homestay.location?.city}
                    </p>
                  </div>
                  <div className="homestay-actions">
                    <button className="btn-edit" onClick={() => handleEdit(homestay)}>
                      Sửa
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(homestay._id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedHomestay ? 'Chỉnh sửa homestay' : 'Thêm homestay mới'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Thành phố *</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    >
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
                    <label>Giá (VNĐ/đêm) *</label>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="VD: 0397707745"
                    pattern="[0-9]{10,11}"
                    title="Số điện thoại phải có 10-11 chữ số"
                    required
                    autoComplete="off"
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>
                    Số điện thoại để khách có thể liên hệ trực tiếp với bạn
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số khách *</label>
                    <input
                      type="number"
                      name="maxGuests"
                      value={formData.maxGuests}
                      onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phòng ngủ *</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phòng tắm *</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Tiện nghi</label>
                  <div className="amenities-grid">
                    {AMENITIES.map((amenity) => {
                      const IconComponent = amenity.icon;
                      return (
                        <label key={amenity.id} className="amenity-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.amenities?.includes(amenity.id) || false}
                            onChange={() => handleAmenityToggle(amenity.id)}
                          />
                          <IconComponent 
                            className="amenity-icon" 
                            style={{ color: amenity.color }}
                          />
                          <span className="amenity-name">{amenity.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label>Ảnh bìa *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    required={!selectedHomestay}
                  />
                  {coverImagePreview && (
                    <div className="image-preview">
                      <img src={coverImagePreview} alt="Cover preview" />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Ảnh phụ (có thể chọn nhiều ảnh)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                  />
                  {imagesPreview.length > 0 && (
                    <div className="images-preview-grid">
                      {imagesPreview.map((preview, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={preview} alt={`Preview ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-submit">
                    {selectedHomestay ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default HostHomestays;

