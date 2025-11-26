import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import Toast from '../components/Toast';
import '../styles/Auth.css';

const ResetPasswordNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, forgotPassword } = useAuth();
  
  // Get email from ForgotPassword page state
  const emailFromState = location.state?.email || '';

  const [step, setStep] = useState(1); // Step 1: OTP, Step 2: New Password
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  // Refs for OTP inputs
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    // Check if email exists
    if (!emailFromState && step === 1) {
      showToast('Vui lòng yêu cầu mã OTP trước', 'error');
      setTimeout(() => {
        navigate('/forgot-password');
      }, 2000);
    }
  }, [emailFromState, step, navigate]);

  useEffect(() => {
    // Focus first input on mount
    if (otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
  }, []);

  useEffect(() => {
    // Countdown timer for resend OTP
    if (step === 1 && resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleResendOTP = async () => {
    if (!canResend || loading) return;
    
    setLoading(true);
    
    try {
      const result = await forgotPassword(emailFromState);
      
      if (result.success) {
        // Reset timer and OTP inputs
        setResendTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        showToast('Mã OTP mới đã được gửi đến email của bạn!', 'success');
        
        // Focus first input
        setTimeout(() => {
          otpRefs[0].current?.focus();
        }, 100);
      } else {
        showToast(result.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);

      // Auto focus next input
      if (numericValue && index < 5) {
        otpRefs[index + 1].current?.focus();
      }

      // Auto verify when all 6 digits are filled
      if (numericValue && index === 5) {
        // Check if all digits are filled
        const allFilled = newOtp.every(digit => digit !== '');
        if (allFilled) {
          setTimeout(() => {
            verifyOTP(newOtp);
          }, 100);
        }
      }
    }
  };

  const verifyOTP = async (otpArray) => {
    const otpString = otpArray.join('');
    if (otpString.length !== 6) {
      return;
    }

    setLoading(true);

    try {
      // Call API to verify OTP first
      const response = await fetch(`${import.meta.env.VITE_API_URL || '${API_BASE_URL}'}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFromState,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // OTP valid, move to step 2
        setStep(2);
      } else {
        // OTP invalid
        showToast(data.message || 'Mã OTP không đúng hoặc đã hết hạn', 'error');
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current?.focus();
      }
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (index, e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    console.log('Paste detected:', pastedData, 'Digits:', digits);
    
    if (digits.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      
      console.log('New OTP:', newOtp);
      
      // Auto verify if all 6 digits are filled
      if (digits.length === 6) {
        setTimeout(() => {
          verifyOTP(newOtp);
        }, 300);
      } else {
        // Focus last filled input
        setTimeout(() => {
          const focusIndex = Math.min(digits.length - 1, 5);
          otpRefs[focusIndex].current?.focus();
        }, 0);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    }
    if (!/[a-z]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ thường';
    }
    if (!/[0-9]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 số';
    }
    if (!/[@$!%*?&]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)';
    }
    return null;
  };



  const handleStep2Submit = async (e) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setLoading(true);

    try {
      const otpString = otp.join('');
      const result = await resetPassword(emailFromState, otpString, formData.password);

      if (result.success) {
        showToast('Đặt lại mật khẩu thành công!', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showToast(result.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!emailFromState && step === 1) {
    return null; // Will redirect
  }

  return (
    <div className="auth-container">
      {/* Left Side - Visual */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-logo">
            <img src="/logo.png" alt="Logo" />
            <h1>HomestayBooking</h1>
          </div>
          <h2 className="auth-visual-title">
            {step === 1 ? 'Xác thực OTP' : 'Tạo mật khẩu mới'}
          </h2>
          <p className="auth-visual-description">
            {step === 1 
              ? 'Nhập mã 6 số chúng tôi vừa gửi đến email của bạn'
              : 'Tạo mật khẩu mới để bảo mật tài khoản của bạn'
            }
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Đặt lại mật khẩu</h2>
            {step === 1 ? (
              <>
                <p className="auth-subtitle">Nhập mã OTP đã gửi đến email</p>
                <p className="auth-subtitle" style={{ fontSize: '14px', marginTop: '8px', color: '#E11D48', fontWeight: 600 }}>
                  {emailFromState}
                </p>
              </>
            ) : (
              <p className="auth-subtitle">Nhập mật khẩu mới của bạn</p>
            )}
          </div>

        {step === 1 ? (
          <div className="auth-form">
            <div className="form-group">
              <label style={{ textAlign: 'center', marginBottom: '16px' }}>MÃ OTP (6 SỐ)</label>
              <div className="otp-inputs" style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={(e) => handleOtpPaste(index, e)}
                    disabled={loading}
                    style={{
                      width: '48px',
                      height: '56px',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '2px solid ' + (digit ? '#E11D48' : 'rgba(20, 18, 23, 0.12)'),
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'monospace'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#E11D48';
                      e.target.style.boxShadow = '0 0 0 3px rgba(225, 29, 72, 0.1)';
                    }}
                    onBlur={(e) => {
                      if (!digit) {
                        e.target.style.borderColor = 'rgba(20, 18, 23, 0.12)';
                      }
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
              <small className="form-hint" style={{ textAlign: 'center', display: 'block' }}>
                Nhập mã 6 số đã được gửi đến email. Mã có hiệu lực trong 5 phút.
              </small>
            </div>

            <div className="auth-footer" style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6B5A65', marginBottom: '12px' }}>
                Chưa nhận được mã?{' '}
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E11D48',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Gửi lại
                  </button>
                ) : (
                  <span style={{ color: '#9CA3AF' }}>
                    Gửi lại ({resendTimer}s)
                  </span>
                )}
              </p>
              <Link to="/login" className="auth-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStep2Submit} className="auth-form">
            <div className="email-info" style={{
              background: '#FFF1F7',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center'
            }}>
              ✓ Đang đặt lại mật khẩu cho: <strong>{emailFromState}</strong>
            </div>

            <div className="form-group">
              <label htmlFor="password">MẬT KHẨU MỚI</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="form-hint">
                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">XÁC NHẬN MẬT KHẨU</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>

            <div className="auth-footer">
              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Quay lại bước trước
              </button>
            </div>
          </form>
        )}
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default ResetPasswordNew;
