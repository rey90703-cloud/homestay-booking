const PDFDocument = require('pdfkit');
const moment = require('moment-timezone');
const { formatCurrency } = require('../utils/formatters');
const path = require('path');

class PDFInvoiceService {
  /**
   * Generate invoice PDF for a booking
   * @param {Object} booking - Booking object with populated fields
   * @returns {PDFDocument} PDF document stream
   */
  generateInvoice(booking) {
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      bufferPages: true,
      info: {
        Title: 'Hoa Don Thanh Toan',
        Author: 'Booking Homestay Platform',
      }
    });

    // Register Roboto font for Vietnamese support
    const fontPath = path.join(__dirname, '../../fonts');
    doc.registerFont('Roboto', path.join(fontPath, 'Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', path.join(fontPath, 'Roboto-Bold.ttf'));

    // Add content to PDF
    this.addHeader(doc, booking);
    this.addBookingInfo(doc, booking);
    this.addGuestInfo(doc, booking);
    this.addHomestayInfo(doc, booking);
    this.addPricingDetails(doc, booking);
    this.addPaymentInfo(doc, booking);
    this.addFooter(doc, booking);

    // Finalize PDF
    doc.end();

    return doc;
  }

  addHeader(doc, booking) {
    doc
      .fontSize(24)
      .font('Roboto-Bold')
      .text('HÓA ĐƠN THANH TOÁN', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Roboto')
      .text('BOOKING HOMESTAY PLATFORM', { align: 'center' })
      .moveDown(0.3)
      .fontSize(10)
      .text('Địa chỉ: Việt Nam', { align: 'center' })
      .text('Email: support@bookinghomestay.com', { align: 'center' })
      .text('Hotline: 1900-xxxx', { align: 'center' })
      .moveDown(1);

    // Invoice number and date
    const invoiceNumber = booking.payment?.reference || booking._id.toString().substring(0, 12).toUpperCase();
    const issueDate = moment(booking.payment?.paidAt || booking.createdAt)
      .tz('Asia/Ho_Chi_Minh')
      .format('DD/MM/YYYY HH:mm');

    doc
      .fontSize(11)
      .font('Roboto-Bold')
      .text(`Số hóa đơn: ${invoiceNumber}`, 50, doc.y)
      .font('Roboto')
      .text(`Ngày xuất: ${issueDate}`, 50, doc.y)
      .moveDown(1.5);
  }

  addBookingInfo(doc, booking) {
    const checkIn = moment(booking.checkInDate).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
    const checkOut = moment(booking.checkOutDate).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');

    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text('THÔNG TIN ĐẶT PHÒNG', 50, doc.y, { underline: true })
      .moveDown(0.5)
      .font('Roboto')
      .fontSize(10);

    const labelX = 50;
    const valueX = 180;
    let currentY = doc.y;

    doc.text('Mã đặt phòng:', labelX, currentY);
    doc.text(booking.bookingReference || booking._id.toString().substring(0, 8).toUpperCase(), valueX, currentY);
    
    currentY += 20;
    doc.text('Ngày nhận phòng:', labelX, currentY);
    doc.text(checkIn, valueX, currentY);
    
    currentY += 20;
    doc.text('Ngày trả phòng:', labelX, currentY);
    doc.text(checkOut, valueX, currentY);
    
    currentY += 20;
    doc.text('Số đêm:', labelX, currentY);
    doc.text(`${booking.numberOfNights} đêm`, valueX, currentY);
    
    currentY += 20;
    doc.text('Số khách:', labelX, currentY);
    doc.text(`${booking.numberOfGuests} người`, valueX, currentY);
    
    doc.y = currentY + 30;
  }

  addGuestInfo(doc, booking) {
    const guest = booking.guestDetails || {};
    const guestName = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 
                      (booking.guestId?.firstName ? `${booking.guestId.firstName} ${booking.guestId.lastName || ''}` : 'N/A');

    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text('THÔNG TIN KHÁCH HÀNG', 50, doc.y, { underline: true })
      .moveDown(0.5)
      .font('Roboto')
      .fontSize(10);

    const labelX = 50;
    const valueX = 180;
    let currentY = doc.y;

    doc.text('Họ tên:', labelX, currentY);
    doc.text(guestName, valueX, currentY);
    
    currentY += 20;
    doc.text('Email:', labelX, currentY);
    doc.text(guest.email || booking.guestId?.email || 'N/A', valueX, currentY);
    
    currentY += 20;
    doc.text('Số điện thoại:', labelX, currentY);
    doc.text(guest.phone || booking.guestId?.phone || 'N/A', valueX, currentY);
    
    doc.y = currentY + 30;
  }

  addHomestayInfo(doc, booking) {
    const homestay = booking.homestayId || {};
    const location = homestay.location || {};

    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text('THÔNG TIN NHÀ TRỌ', 50, doc.y, { underline: true })
      .moveDown(0.5)
      .font('Roboto')
      .fontSize(10);

    const labelX = 50;
    const valueX = 180;
    let currentY = doc.y;

    doc.text('Tên:', labelX, currentY);
    doc.text(homestay.title || 'N/A', valueX, currentY, { width: 350 });
    
    currentY = doc.y + 5;
    doc.text('Địa chỉ:', labelX, currentY);
    doc.text(location.address || 'N/A', valueX, currentY, { width: 350 });
    
    currentY = doc.y + 5;
    doc.text('Thành phố:', labelX, currentY);
    doc.text(location.city || 'N/A', valueX, currentY);
    
    currentY += 20;
    doc.text('Quốc gia:', labelX, currentY);
    doc.text(location.country || 'Việt Nam', valueX, currentY);
    
    doc.y = currentY + 30;
  }

  addPricingDetails(doc, booking) {
    const pricing = booking.pricing || {};
    
    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text('CHI TIẾT GIÁ', 50, doc.y, { underline: true })
      .moveDown(0.5)
      .fontSize(10)
      .font('Roboto');

    // Table header background
    const tableTop = doc.y;
    doc
      .rect(50, tableTop, 495, 20)
      .fill('#f0f0f0')
      .fill('black');

    // Table header
    doc
      .font('Roboto-Bold')
      .text('Mô tả', 60, tableTop + 5, { width: 250 })
      .text('Số lượng', 310, tableTop + 5, { width: 80, align: 'center' })
      .text('Đơn giá', 390, tableTop + 5, { width: 70, align: 'right' })
      .text('Thành tiền', 460, tableTop + 5, { width: 75, align: 'right' });

    // Table rows
    let currentY = tableTop + 25;
    doc.font('Roboto');

    // Base price
    const baseTotal = (pricing.basePrice || 0) * (pricing.numberOfNights || booking.numberOfNights || 1);
    this.addTableRow(
      doc,
      'Giá phòng',
      `${pricing.numberOfNights || booking.numberOfNights} đêm`,
      formatCurrency(pricing.basePrice || 0),
      formatCurrency(baseTotal),
      currentY
    );
    currentY += 20;

    // Cleaning fee
    if (pricing.cleaningFee > 0) {
      this.addTableRow(
        doc,
        'Phí dọn dẹp',
        '1',
        formatCurrency(pricing.cleaningFee),
        formatCurrency(pricing.cleaningFee),
        currentY
      );
      currentY += 20;
    }

    // Service fee
    if (pricing.serviceFee > 0) {
      this.addTableRow(
        doc,
        'Phí dịch vụ',
        '1',
        formatCurrency(pricing.serviceFee),
        formatCurrency(pricing.serviceFee),
        currentY
      );
      currentY += 20;
    }

    // Divider line
    doc
      .moveTo(50, currentY)
      .lineTo(545, currentY)
      .stroke();

    currentY += 10;

    // Total
    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text('TỔNG CỘNG:', 60, currentY, { width: 400 })
      .text(formatCurrency(pricing.totalAmount || 0), 460, currentY, { width: 75, align: 'right' });

    doc.moveDown(2);
  }

  addTableRow(doc, description, quantity, unitPrice, total, y) {
    doc
      .fontSize(10)
      .text(description, 60, y, { width: 250 })
      .text(quantity, 310, y, { width: 80, align: 'center' })
      .text(unitPrice, 390, y, { width: 70, align: 'right' })
      .text(total, 460, y, { width: 75, align: 'right' });
  }

  addPaymentInfo(doc, booking) {
    const payment = booking.payment || {};
    const statusMap = {
      pending: 'Chờ thanh toán',
      completed: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền'
    };

    const methodMap = {
      bank_transfer: 'Chuyển khoản ngân hàng',
      credit_card: 'Thẻ tín dụng',
      debit_card: 'Thẻ ghi nợ',
      paypal: 'PayPal',
      cash: 'Tiền mặt'
    };

    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text('THÔNG TIN THANH TOÁN', 50, doc.y, { underline: true })
      .moveDown(0.5)
      .font('Roboto')
      .fontSize(10);

    const labelX = 50;
    const valueX = 180;
    let currentY = doc.y;

    doc.text('Trạng thái:', labelX, currentY);
    doc.text(statusMap[payment.status] || payment.status || 'N/A', valueX, currentY);
    
    currentY += 20;
    doc.text('Phương thức:', labelX, currentY);
    doc.text(methodMap[payment.method] || payment.method || 'N/A', valueX, currentY);

    if (payment.transactionId) {
      currentY += 20;
      doc.text('Mã giao dịch:', labelX, currentY);
      doc.text(payment.transactionId, valueX, currentY);
    }

    if (payment.paidAt) {
      const paidAtStr = moment(payment.paidAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm');
      currentY += 20;
      doc.text('Thời gian thanh toán:', labelX, currentY);
      doc.text(paidAtStr, valueX, currentY);
    }

    doc.y = currentY + 40;
  }

  addFooter(doc, booking) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Footer line
      doc
        .moveTo(50, 750)
        .lineTo(545, 750)
        .stroke();

      doc
        .fontSize(9)
        .font('Roboto')
        .text(
          'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!',
          50,
          760,
          { align: 'center' }
        )
        .text(
          'Mọi thắc mắc xin liên hệ: support@bookinghomestay.com',
          50,
          775,
          { align: 'center' }
        );
    }
  }
}

module.exports = new PDFInvoiceService();
