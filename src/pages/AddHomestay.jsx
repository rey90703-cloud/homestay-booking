import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AddHomestay.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

function AddHomestay() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    basePrice: '',
    coverImage: null,
    images: [],
    amenities: []
  });

  const AMENITIES = [
    { id: 'wifi', name: 'WiFi' },
    { id: 'tv', name: 'TV' },
    { id: 'kitchen', name: 'Bếp' },
    { id: 'washing_machine', name: 'Máy giặt' },
    { id: 'air_conditioning', name: 'Điều hòa' },
    { id: 'heating', name: 'Sưởi ấm' },
    { id: 'workspace', name: 'Không gian làm việc' },
    { id: 'pool', name: 'Hồ bơi' },
    { id: 'gym', name: 'Phòng gym' },
    { id: 'parking', name: 'Đỗ xe miễn phí' },
    { id: 'balcony', name: 'Ban công' },
    { id: 'garden', name: 'Vườn' },
  ];

  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [imagesPreview, setImagesPreview] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      formDataToSend.append('location[city]', formData.city);
      formDataToSend.append('location[address]', formData.address);
      formDataToSend.append('capacity[guests]', formData.maxGuests);
      formDataToSend.append('capacity[bedrooms]', formData.bedrooms);
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
        navigate('/host/homestays');
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
              {AMENITIES.map((amenity) => (
                <label key={amenity.id} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.amenities?.includes(amenity.id) || false}
                    onChange={() => handleAmenityToggle(amenity.id)}
                  />
                  <span className="amenity-name">{amenity.name}</span>
                </label>
              ))}
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
      <Header />
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
      <Footer />
    </>
  );
}

export default AddHomestay;

