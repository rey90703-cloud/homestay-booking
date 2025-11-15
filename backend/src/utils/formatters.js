/**
 * Formatting Utilities
 * Centralized formatting functions for currency, dates, and other data types
 */

/**
 * Format số tiền theo định dạng VND
 * @param {number} amount - Số tiền cần format
 * @returns {string} Số tiền đã format (VD: "1.998.900 ₫")
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Format ngày theo định dạng tiếng Việt
 * @param {Date|string} date - Ngày cần format
 * @returns {string} Ngày đã format (VD: "Thứ Năm, 14 tháng 11, 2025")
 */
function formatDate(date) {
  if (!date) {
    return '';
  }

  return new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format ngày giờ theo định dạng tiếng Việt
 * @param {Date|string} date - Ngày giờ cần format
 * @returns {string} Ngày giờ đã format (VD: "14 tháng 11, 2025, 10:30")
 */
function formatDateTime(date) {
  if (!date) {
    return '';
  }

  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {string} Số điện thoại đã format hoặc "Chưa cung cấp"
 */
function formatPhone(phone) {
  return phone || 'Chưa cung cấp';
}

/**
 * Tính số ngày giữa 2 ngày
 * @param {Date|string} startDate - Ngày bắt đầu
 * @param {Date|string} endDate - Ngày kết thúc
 * @returns {number} Số ngày
 */
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  calculateDays,
};
