import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
import './AddHomestay.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

function AddHomestay({ onSuccess, hideLayout = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showGuideModal, setShowGuideModal] = useState(false);
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

  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [imagesPreview, setImagesPreview] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('contactPhone', formData.contactPhone);
      formDataToSend.append('propertyType', 'entire_place'); // Default property type
      formDataToSend.append('location[city]', formData.city);
      formDataToSend.append('location[address]', formData.address);
      formDataToSend.append('location[country]', 'Việt Nam'); // Default country
      if (formData.googleMapsUrl) {
        formDataToSend.append('location[googleMapsUrl]', formData.googleMapsUrl);
      }
      formDataToSend.append('capacity[guests]', formData.maxGuests);
      formDataToSend.append('capacity[bedrooms]', formData.bedrooms);
      formDataToSend.append('capacity[beds]', formData.bedrooms); // Default beds = bedrooms
      formDataToSend.append('capacity[bathrooms]', formData.bathrooms);
      formDataToSend.append('pricing[basePrice]', formData.basePrice);

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

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/homestays`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        alert('Đăng homestay thành công! Homestay của bạn đang chờ phê duyệt.');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/host/dashboard');
        }
      } else {
        alert(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi đăng homestay');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Thông tin cơ bản</h2>
            <p className="step-description">Hãy cho chúng tôi biết về homestay của bạn</p>

            <div className="form-group">
              <label>Tiêu đề <span className="required">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="VD: Căn hộ view biển tuyệt đẹp"
                required
              />
            </div>

            <div className="form-group">
              <label>Mô tả <span className="required">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả chi tiết về homestay của bạn..."
                rows="6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Thành phố <span className="required">*</span></label>
                <select name="city" value={formData.city} onChange={handleInputChange} required>
                  <option value="">Chọn thành phố</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Lào Cai">Lào Cai</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Nha Trang">Nha Trang</option>
                  <option value="Đà Lạt">Đà Lạt</option>
                </select>
              </div>

              <div className="form-group">
                <label>Địa chỉ <span className="required">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Số nhà, tên đường"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Link Google Maps hoặc Iframe Embed</label>
              <textarea
                name="googleMapsUrl"
                value={formData.googleMapsUrl}
                onChange={handleInputChange}
                placeholder="Dán link Google Maps hoặc toàn bộ iframe embed code từ Google Maps"
                rows="3"
              />
              <small className="form-hint">
                📍 Bạn có thể dán link hoặc iframe embed code. 
                <button 
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#FF385C', 
                    textDecoration: 'underline', 
                    cursor: 'pointer',
                    padding: '0 4px',
                    fontSize: '14px'
                  }}
                >
                  Xem hướng dẫn
                </button>
              </small>
            </div>

            <div className="form-group">
              <label>Số điện thoại liên hệ <span className="required">*</span></label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="VD: 03xxxxxxxx"
                pattern="[0-9]{10,11}"
                title="Số điện thoại phải có 10-11 chữ số"
                required
              />
              <small className="form-hint">Số điện thoại để khách có thể liên hệ trực tiếp với bạn</small>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Sức chứa & Giá</h2>
            <p className="step-description">Thông tin về không gian và giá cả</p>

            <div className="form-row">
              <div className="form-group">
                <label>Số khách tối đa <span className="required">*</span></label>
                <input
                  type="number"
                  name="maxGuests"
                  value={formData.maxGuests}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="VD: 4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Số phòng ngủ <span className="required">*</span></label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="VD: 2"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Số phòng tắm <span className="required">*</span></label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="VD: 1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Giá mỗi đêm (VNĐ) <span className="required">*</span></label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="VD: 500000"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Tiện nghi</h2>
            <p className="step-description">Chọn các tiện nghi có sẵn tại homestay</p>

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
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Hình ảnh</h2>
            <p className="step-description">Thêm ảnh để thu hút khách hàng</p>

            <div className="form-group">
              <label>Ảnh bìa <span className="required">*</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                required={!coverImagePreview}
              />
              {coverImagePreview && (
                <div className="image-preview">
                  <img src={coverImagePreview} alt="Cover preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Ảnh bổ sung (tối đa 10 ảnh)</label>
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {!hideLayout && <Header />}
      
      {/* Guide Modal */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>📍 Hướng dẫn lấy link nhúng Google Maps</h2>
              <button onClick={() => setShowGuideModal(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div className="guide-content" style={{ padding: '24px' }}>
              <div className="guide-step">
                <h3 style={{ color: '#FF385C', marginBottom: '12px' }}>Bước 1: Mở Google Maps</h3>
                <p style={{ marginBottom: '8px' }}>Truy cập <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={{ color: '#FF385C' }}>Google Maps</a> và tìm kiếm địa chỉ homestay của bạn.</p>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#FF385C', marginBottom: '12px' }}>Bước 2: Nhấn nút "Chia sẻ"</h3>
                <p style={{ marginBottom: '8px' }}>Sau khi tìm thấy địa chỉ, nhấn vào nút <strong>"Chia sẻ"</strong> hoặc <strong>"Share"</strong> ở bên trái màn hình.</p>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#FF385C', marginBottom: '12px' }}>Bước 3: Chọn tab "Nhúng bản đồ"</h3>
                <p style={{ marginBottom: '8px' }}>Trong popup hiện ra, chọn tab <strong>"Nhúng bản đồ"</strong> hoặc <strong>"Embed a map"</strong>.</p>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#FF385C', marginBottom: '12px' }}>Bước 4: Sao chép mã nhúng</h3>
                <p style={{ marginBottom: '8px' }}>Nhấn nút <strong>"SAO CHÉP HTML"</strong> để copy toàn bộ iframe code.</p>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginTop: '8px', fontSize: '13px', fontFamily: 'monospace', overflowX: 'auto' }}>
                  <code style={{ color: '#666' }}>
                    &lt;iframe src="https://www.google.com/maps/embed?pb=..."...&gt;&lt;/iframe&gt;
                  </code>
                </div>
              </div>

              <div className="guide-step" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#FF385C', marginBottom: '12px' }}>Bước 5: Dán vào form</h3>
                <p style={{ marginBottom: '8px' }}>Dán toàn bộ mã iframe vừa copy vào ô <strong>"Link Google Maps hoặc Iframe Embed"</strong>. Hệ thống sẽ tự động trích xuất URL.</p>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => setShowGuideModal(false)}
                  style={{ padding: '12px 32px', background: '#FF385C', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="add-homestay-page">
        <div className="add-homestay-container">
        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Thông tin'}
                  {step === 2 && 'Sức chứa'}
                  {step === 3 && 'Tiện nghi'}
                  {step === 4 && 'Hình ảnh'}
                </div>
              </div>
            ))}
          </div>
          <div className="progress-line">
            <div className="progress-fill" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="add-homestay-form">
          {renderStepContent()}

          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" className="btn-back" onClick={handleBack}>
                ← Quay lại
              </button>
            )}
            {currentStep < 4 ? (
              <button type="button" className="btn-next" onClick={handleNext}>
                Tiếp theo →
              </button>
            ) : (
              <button type="submit" className="btn-submit">
                🎉 Đăng homestay
              </button>
            )}
          </div>
        </form>
        </div>
      </div>
      {!hideLayout && <Footer />}
    </>
  );
}

export default AddHomestay;

