# Knowledge Base - Booking Homestay System

## Payment System - Booking Model

### Business Rules
- [Rule] Payment method mặc định là 'bank_transfer' (file: backend/src/modules/bookings/booking.model.js:104)
- [Rule] Payment reference phải unique trong toàn hệ thống, cho phép null (sparse index) (file: backend/src/modules/bookings/booking.model.js:113-116)
- [Rule] QR code có thể tạo lại nếu: payment status = pending, QR đã hết hạn, booking chưa bị hủy/hoàn thành (file: backend/src/modules/bookings/booking.model.js:365-373)
- [Rule] Verification method có 3 loại: webhook, polling, manual (file: backend/src/modules/bookings/booking.model.js:199)
- [Rule] Manual verification bắt buộc phải có verifiedBy (user ID) (file: backend/src/modules/bookings/booking.model.js:213-219)
- [Rule] Verification method bắt buộc phải có verifiedAt khi có method (file: backend/src/modules/bookings/booking.model.js:202-208)

### Constraints
- [Constraint] QR createdAt không được là thời gian tương lai (file: backend/src/modules/bookings/booking.model.js:125-131)
- [Constraint] QR expiresAt phải sau createdAt (file: backend/src/modules/bookings/booking.model.js:134-141)
- [Constraint] Transaction amount không được âm (file: backend/src/modules/bookings/booking.model.js:159)
- [Constraint] Transaction amount không được vượt quá 10 tỷ VND (chống data corruption) (file: backend/src/modules/bookings/booking.model.js:160-166)
- [Constraint] Account number phải ở dạng masked format (ví dụ: ****7918) (file: backend/src/modules/bookings/booking.model.js:177-183)
- [Constraint] Verification notes không được vượt quá 500 ký tự (file: backend/src/modules/bookings/booking.model.js:233)
- [Constraint] Verification verifiedAt không được là thời gian tương lai (file: backend/src/modules/bookings/booking.model.js:222-228)

### Assumptions
- [Assumption] Payment reference có thể null - không phải booking nào cũng có payment reference (file: backend/src/modules/bookings/booking.model.js:115)
- [Assumption] QR code data có thể là Base64 hoặc URL (file: backend/src/modules/bookings/booking.model.js:119-122)
- [Assumption] Transaction amount giới hạn 10 tỷ VND để chống data corruption (file: backend/src/modules/bookings/booking.model.js:163)
- [Assumption] Account number được lưu dạng masked để bảo mật (file: backend/src/modules/bookings/booking.model.js:180)

### Database Indexes
- [Index] Sparse index cho payment.reference để tối ưu query và cho phép null values (file: backend/src/modules/bookings/booking.model.js:303)
- [Index] Compound index cho payment.status và payment.qrCode.createdAt để hỗ trợ polling (file: backend/src/modules/bookings/booking.model.js:304)

### Methods

- [Method] `isQRExpired()`: Kiểm tra QR code đã hết hạn chưa, return true nếu hết hạn hoặc chưa được tạo (file: backend/src/modules/bookings/booking.model.js:347-358)
- [Method] `canRegenerateQR()`: Kiểm tra có thể tạo lại QR code không dựa trên payment status, QR expiry và booking status (file: backend/src/modules/bookings/booking.model.js:365-373)

---

## Payment System - Booking Service

### Business Rules

- [Rule] Payment status mapping: Khi payment status = pending và QR đã hết hạn → trả về status "expired" thay vì "pending" (file: backend/src/modules/bookings/booking.service.js:342-345)
- [Rule] Transaction info chỉ được hiển thị khi payment status = completed (file: backend/src/modules/bookings/booking.service.js:353-362)
- [Rule] QR code data/url chỉ được trả về khi QR chưa hết hạn (file: backend/src/modules/bookings/booking.service.js:371-374)
- [Rule] Khi QR expired, cung cấp message hướng dẫn user tạo QR mới (file: backend/src/modules/bookings/booking.service.js:378-380)

### Constraints

- [Constraint] Authorization được xử lý bởi middleware checkBookingAccess trước khi vào service (file: backend/src/modules/bookings/booking.service.js:325)
- [Constraint] Sử dụng helper method _checkQRExpiry() để tính toán thời gian hết hạn và remainingSeconds (file: backend/src/modules/bookings/booking.service.js:331-333)
- [Constraint] Response data structure thay đổi dựa trên payment status và QR expiry state (file: backend/src/modules/bookings/booking.service.js:347-380)

### Assumptions

- [Assumption] Không sử dụng .lean() khi query booking để giữ khả năng gọi model methods nếu cần (file: backend/src/modules/bookings/booking.service.js:328)
- [Assumption] RemainingSeconds được tính toán để frontend có thể hiển thị countdown timer (file: backend/src/modules/bookings/booking.service.js:331-333)
- [Assumption] Payment status "expired" là virtual status, không lưu vào database (file: backend/src/modules/bookings/booking.service.js:342-345)

### Methods

- [Method] `_checkQRExpiry()`: Private helper kiểm tra QR expiry và tính remainingSeconds (file: backend/src/modules/bookings/booking.service.js:225-239)
- [Method] `_buildPaymentInfo()`: Private helper build payment info object từ booking (file: backend/src/modules/bookings/booking.service.js:246-253)
- [Method] `_buildBankInfo()`: Private helper build bank info từ environment variables (file: backend/src/modules/bookings/booking.service.js:260-267)
- [Method] `generatePaymentQRCode()`: Tạo hoặc trả về QR code hiện tại nếu chưa hết hạn (file: backend/src/modules/bookings/booking.service.js:275-313)
- [Method] `getPaymentStatus()`: Lấy trạng thái thanh toán với logic mapping expired status (file: backend/src/modules/bookings/booking.service.js:322-383)

---

## Payment System - VietQR Service

### Business Rules

- [Rule] VietQR API không yêu cầu authentication, chỉ cần URL public (file: backend/src/services/vietqr.service.js:10)
- [Rule] Template mặc định sử dụng là 'compact2' cho QR code ngắn gọn (file: backend/src/services/vietqr.service.js:36)
- [Rule] Khi VietQR API fail, hệ thống tự động fallback sang text-based manual payment (file: backend/src/services/vietqr.service.js:148-150)
- [Rule] Retry logic: tối đa 3 lần với exponential backoff (1s, 2s, 4s) (file: backend/src/services/vietqr.service.js:193-209)
- [Rule] Nếu tất cả retry fail, trả về fallback QR code (file: backend/src/services/vietqr.service.js:213-214)

### Constraints

- [Constraint] Bank BIN phải là chuỗi 6 chữ số (file: backend/src/services/vietqr.service.js:64-66)
- [Constraint] Account number phải chỉ chứa chữ số (file: backend/src/services/vietqr.service.js:72-74)
- [Constraint] Amount phải > 0 và <= 999,999,999 VND (file: backend/src/services/vietqr.service.js:77-85)
- [Constraint] Content (payment reference) không được vượt quá 100 ký tự (file: backend/src/services/vietqr.service.js:88-92)
- [Constraint] Account name không được vượt quá 50 ký tự (file: backend/src/services/vietqr.service.js:95-99)
- [Constraint] Timeout kiểm tra URL accessibility: 5 giây (file: backend/src/services/vietqr.service.js:129)

### Assumptions

- [Assumption] VietQR URL có thể không accessible ngay lập tức nhưng vẫn hoạt động khi user truy cập (file: backend/src/services/vietqr.service.js:131-133)
- [Assumption] Fallback mode trả về thông tin để frontend hiển thị manual payment instructions (file: backend/src/services/vietqr.service.js:167-178)
- [Assumption] QR code data có thể là URL hoặc base64, hiện tại dùng URL (file: backend/src/services/vietqr.service.js:138-139)

### Methods

- [Method] `buildVietQRUrl()`: Tạo URL VietQR API với format chuẩn, encode content và account name để URL safe (file: backend/src/services/vietqr.service.js:25-44)
- [Method] `validateParams()`: Validate tất cả input parameters trước khi tạo QR code (file: backend/src/services/vietqr.service.js:57-103)
- [Method] `generateQRCode()`: Tạo QR code, kiểm tra URL accessibility, tự động fallback nếu fail (file: backend/src/services/vietqr.service.js:117-151)
- [Method] `generateFallbackQRCode()`: Tạo fallback data với thông tin ngân hàng để hiển thị manual (file: backend/src/services/vietqr.service.js:160-180)
- [Method] `generateQRCodeWithRetry()`: Tạo QR code với retry logic và exponential backoff (file: backend/src/services/vietqr.service.js:189-215)

---

## Payment System - SeePay Client Service

### Business Rules

- [Rule] Lỗi client (4xx) không được retry, chỉ throw error ngay lập tức (file: backend/src/services/sepay.client.js:61-67)
- [Rule] Error classification: Server response error (status từ response), No response (503 - SEPAY_NO_RESPONSE), Request setup error (500 - SEPAY_REQUEST_ERROR) (file: backend/src/services/sepay.client.js:100-130)
- [Rule] API key validation sử dụng getTransactions với khoảng thời gian 1 giờ gần đây (file: backend/src/services/sepay.client.js:238-248)
- [Rule] Lỗi 401/403 trong validateApiKey trả về false, các lỗi khác throw exception (file: backend/src/services/sepay.client.js:254-261)
- [Rule] Date format bắt buộc: 'YYYY-MM-DD HH:mm:ss' với timezone Việt Nam (UTC+7) (file: backend/src/services/sepay.client.js:11-12)
- [Rule] Recent transactions mặc định lấy 15 phút gần nhất (file: backend/src/services/sepay.client.js:8)
- [Rule] Response data có thể null, phải validate trước khi sử dụng (file: backend/src/services/sepay.client.js:182-184, 213-215)

### Constraints

- [Constraint] Default timeout: 30 giây cho mỗi API request (file: backend/src/services/sepay.client.js:6)
- [Constraint] Max retries: 3 lần với exponential backoff delays [1s, 2s, 4s] (file: backend/src/services/sepay.client.js:7, 29-31)
- [Constraint] Account number masking: chỉ hiển thị 4 số cuối khi log (file: backend/src/services/sepay.client.js:283-288)
- [Constraint] Minutes parameter phải là số dương (> 0) (file: backend/src/services/sepay.client.js:298-300)
- [Constraint] Transaction ID phải là string không rỗng (file: backend/src/services/sepay.client.js:199-201)
- [Constraint] Account number bắt buộc khi gọi getTransactions (file: backend/src/services/sepay.client.js:163-165)
- [Constraint] Date format phải hợp lệ theo SEPAY_DATE_FORMAT (file: backend/src/services/sepay.client.js:167-169)

### Assumptions

- [Assumption] SeePay API sử dụng Bearer token authentication (file: backend/src/services/sepay.client.js:38-40)
- [Assumption] Account number có thể được override qua parameter hoặc dùng từ env (file: backend/src/services/sepay.client.js:162)
- [Assumption] Retry chỉ áp dụng cho lỗi server (5xx) và network errors, không retry lỗi client (4xx) (file: backend/src/services/sepay.client.js:61-67)
- [Assumption] API token có thể không được config, chỉ warning không throw error (file: backend/src/services/sepay.client.js:24-26)
- [Assumption] SeePay API trả về transactions array trong response.data.transactions (file: backend/src/services/sepay.client.js:188)

### Methods

- [Method] `retryWithBackoff()`: Retry wrapper với exponential backoff, không retry lỗi 4xx (file: backend/src/services/sepay.client.js:49-86)
- [Method] `handleError()`: Xử lý lỗi và tạo error object chuẩn với code, statusCode, operation (file: backend/src/services/sepay.client.js:100-130)
- [Method] `getTransactions()`: Lấy danh sách giao dịch với startDate, endDate, accountNumber (file: backend/src/services/sepay.client.js:157-190)
- [Method] `getTransactionDetail()`: Lấy chi tiết một giao dịch theo transactionId (file: backend/src/services/sepay.client.js:198-220)
- [Method] `validateApiKey()`: Validate API key bằng cách thử gọi getTransactions (file: backend/src/services/sepay.client.js:228-263)
- [Method] `formatDate()`: Format date thành string cho SeePay API với Vietnam timezone (file: backend/src/services/sepay.client.js:271-274)
- [Method] `maskAccountNumber()`: Mask account number để log an toàn (file: backend/src/services/sepay.client.js:283-288)
- [Method] `getRecentTransactions()`: Lấy giao dịch trong N phút gần đây (default: 15 phút) (file: backend/src/services/sepay.client.js:296-308)

## Payment System - Unmatched Transaction Model

### Business Rules

- [Rule] Transaction status có 3 trạng thái: pending (mặc định), matched, ignored (file: backend/src/models/unmatchedTransaction.model.js:56-60)
- [Rule] Transaction chỉ có thể được khớp thủ công khi status = 'pending' (file: backend/src/models/unmatchedTransaction.model.js:178-180)
- [Rule] Khi đánh dấu matched, phải cung cấp bookingId, userId và có thể có notes (file: backend/src/models/unmatchedTransaction.model.js:145-154)
- [Rule] Khi đánh dấu ignored, phải cung cấp userId và có thể có notes (file: backend/src/models/unmatchedTransaction.model.js:163-171)

### Constraints

- [Constraint] Transaction ID phải unique trong toàn hệ thống (file: backend/src/models/unmatchedTransaction.model.js:11-16)
- [Constraint] Amount không được âm (file: backend/src/models/unmatchedTransaction.model.js:19-23)
- [Constraint] Content (nội dung chuyển khoản) là bắt buộc (file: backend/src/models/unmatchedTransaction.model.js:26-30)
- [Constraint] Account number phải ở dạng masked (****7918) hoặc số đầy đủ (file: backend/src/models/unmatchedTransaction.model.js:39-45)
- [Constraint] Match notes không được vượt quá 500 ký tự (file: backend/src/models/unmatchedTransaction.model.js:81-84)
- [Constraint] Raw payload từ SeePay là bắt buộc để debug (file: backend/src/models/unmatchedTransaction.model.js:87-91)

### Assumptions

- [Assumption] Matched booking ID có thể null (sparse index) khi transaction chưa được khớp (file: backend/src/models/unmatchedTransaction.model.js:63-67)
- [Assumption] Validation details lưu chi tiết lý do không khớp: reference, checksum, amount, timestamp (file: backend/src/models/unmatchedTransaction.model.js:99-118)
- [Assumption] Raw payload lưu toàn bộ dữ liệu từ SeePay để có thể review và debug sau (file: backend/src/models/unmatchedTransaction.model.js:87-91)

### Database Indexes

- [Index] Unique index cho transactionId để tránh duplicate (file: backend/src/models/unmatchedTransaction.model.js:128)
- [Index] Index cho status để filter nhanh (file: backend/src/models/unmatchedTransaction.model.js:129)
- [Index] Index cho transactionDate và createdAt để sort theo thời gian (file: backend/src/models/unmatchedTransaction.model.js:130-131)
- [Index] Sparse index cho matchedBookingId (file: backend/src/models/unmatchedTransaction.model.js:132)
- [Index] Compound index cho status + transactionDate để filter và sort hiệu quả (file: backend/src/models/unmatchedTransaction.model.js:135)

### Methods

- [Method] `markAsMatched()`: Đánh dấu transaction đã khớp với booking, cập nhật status, bookingId, userId, timestamp (file: backend/src/models/unmatchedTransaction.model.js:145-154)
- [Method] `markAsIgnored()`: Đánh dấu transaction bị bỏ qua, cập nhật status, userId, timestamp (file: backend/src/models/unmatchedTransaction.model.js:163-171)
- [Method] `canBeMatched()`: Kiểm tra transaction có thể khớp thủ công không (status = pending) (file: backend/src/models/unmatchedTransaction.model.js:178-180)

### Virtuals

- [Virtual] `matchedBooking`: Populate thông tin booking đã khớp (file: backend/src/models/unmatchedTransaction.model.js:183-188)
- [Virtual] `matcher`: Populate thông tin user đã thực hiện khớp (file: backend/src/models/unmatchedTransaction.model.js:191-196)

---

## Payment System - Payment Controller

### Design Principles

- [Principle] Thin controller pattern: Delegate toàn bộ business logic cho services (file: backend/src/controllers/payment.controller.js:7-10)
- [Principle] No error handling in controller: Services xử lý responses hoàn toàn (signature verification, validation, response sending) (file: backend/src/controllers/payment.controller.js:8)
- [Principle] Stateless controller: Không có instance state, chỉ pure delegation (file: backend/src/controllers/payment.controller.js:9)

### Business Rules

- [Rule] Webhook endpoint delegate toàn bộ xử lý cho WebhookHandler service (file: backend/src/controllers/payment.controller.js:26)
- [Rule] WebhookHandler tự xử lý: signature verification, payload parsing/validation, transaction matching, response sending (file: backend/src/controllers/payment.controller.js:16-21)

### Assumptions

- [Assumption] WebhookHandler.handleWebhook() tự gửi response (success/error), controller không cần xử lý response (file: backend/src/controllers/payment.controller.js:8, 26)
- [Assumption] Controller chỉ là entry point, không chứa business logic hay error handling (file: backend/src/controllers/payment.controller.js:7-10)

---

## Payment System - Payment Service

### Business Rules

- [Rule] Payment reference format: BOOKING-{bookingId}-{checksum} với checksum là 4 ký tự cuối SHA256 hash (file: backend/src/services/payment.service.js:35-36)
- [Rule] Checksum tính từ: bookingId + amount + timestamp (file: backend/src/services/payment.service.js:63)
- [Rule] QR code tái sử dụng: Nếu QR chưa hết hạn, trả về QR cũ thay vì tạo mới (file: backend/src/services/payment.service.js:237-260)
- [Rule] QR code regeneration: Khi QR hết hạn, tạo QR mới nhưng giữ nguyên payment reference (file: backend/src/services/payment.service.js:262-275)
- [Rule] Payment amount tolerance: ±1000 VND, transaction amount phải >= expectedAmount - tolerance (file: backend/src/services/payment.service.js:540-541)
- [Rule] Idempotency: Payment đã completed không được xử lý lại, trả về alreadyProcessed=true (file: backend/src/services/payment.service.js:437-454)
- [Rule] Booking cancelled không thể nhận payment (file: backend/src/services/payment.service.js:456-458)
- [Rule] Payment failed booking có thể nhận payment (chỉ warning, không block) (file: backend/src/services/payment.service.js:460-465)
- [Rule] Manual verification chỉ admin được thực hiện, yêu cầu adminId và notes (file: backend/src/services/payment.service.js:586-587)
- [Rule] Manual verification validate amount nhưng không block nếu mismatch (chỉ warning) (file: backend/src/services/payment.service.js:641-651)

### Constraints

- [Constraint] QR expiry time: 15 phút (config qua QR_EXPIRY_MINUTES env) (file: backend/src/services/payment.service.js:297)
- [Constraint] Checksum length: 4 ký tự uppercase từ SHA256 hash (file: backend/src/services/payment.service.js:71)
- [Constraint] Payment reference pattern: /^BOOKING-([a-f0-9]+)-([A-F0-9]{4})$/ (file: backend/src/services/payment.service.js:103)
- [Constraint] Payment status phải là 'pending' để tạo QR code (file: backend/src/services/payment.service.js:221-225)
- [Constraint] MongoDB transaction được sử dụng để đảm bảo atomicity khi process payment (file: backend/src/services/payment.service.js:399-400)
- [Constraint] Transaction amount max: 10 tỷ VND (inherited từ booking model constraint)
- [Constraint] Payment amount tolerance default: 1000 VND (file: backend/src/services/payment.service.js:540)

### Assumptions

- [Assumption] Timestamp không có trong validatePaymentReference() vì không biết timestamp gốc, phải query từ database (file: backend/src/services/payment.service.js:119-122)
- [Assumption] Full validation với timestamp được thực hiện trong validateChecksumWithTimestamp() (file: backend/src/services/payment.service.js:145-184)
- [Assumption] QR code data có thể là URL hoặc base64, ưu tiên URL (file: backend/src/services/payment.service.js:285, 318)
- [Assumption] Verification method có 3 loại: webhook, polling, manual (file: backend/src/services/payment.service.js:397)
- [Assumption] Bank info lấy từ environment variables (BANK_NAME, BANK_ACCOUNT_NUMBER, BANK_ACCOUNT_NAME) (file: backend/src/services/payment.service.js:253-257, 322-326)
- [Assumption] SeePay transaction data structure: id, amount_in, transaction_date, bank_brand_name, account_number, reference_number (file: backend/src/services/payment.service.js:468-476, 653-659)

### Methods

- [Method] `generatePaymentReference()`: Tạo payment reference với format BOOKING-{bookingId}-{checksum} (file: backend/src/services/payment.service.js:20-37)
- [Method] `calculateChecksum()`: Tính SHA256 hash từ bookingId+amount+timestamp, lấy 4 ký tự cuối uppercase (file: backend/src/services/payment.service.js:47-74)
- [Method] `validatePaymentReference()`: Validate format và bookingId, không validate checksum (thiếu timestamp) (file: backend/src/services/payment.service.js:84-143)
- [Method] `validateChecksumWithTimestamp()`: Full validation với timestamp từ database (file: backend/src/services/payment.service.js:145-184)
- [Method] `generateQRCodeForBooking()`: Tạo hoặc trả về QR code, tự động regenerate nếu hết hạn (file: backend/src/services/payment.service.js:193-330)
- [Method] `processPayment()`: Xử lý payment với MongoDB transaction, idempotency check, update booking status (file: backend/src/services/payment.service.js:346-517)
- [Method] `validatePaymentAmount()`: Validate amount với tolerance ±1000 VND (file: backend/src/services/payment.service.js:527-560)
- [Method] `verifyPaymentManually()`: Admin xác minh payment thủ công, query transaction từ SeePay (file: backend/src/services/payment.service.js:573-683)

---

## Payment System - Unmatched Transaction Controller

### Business Rules

- [Rule] Manual matching workflow: Admin chọn unmatched transaction → chọn booking → validate → process payment → mark as matched (file: backend/src/controllers/unmatchedTransaction.controller.js:73-217)
- [Rule] Amount validation với tolerance: Khi amount không khớp, chỉ log warning nhưng vẫn cho phép admin proceed (admin có quyền quyết định cuối cùng) (file: backend/src/controllers/unmatchedTransaction.controller.js:136-151)
- [Rule] Transaction status validation: Chỉ transaction có status = 'pending' (canBeMatched() = true) mới có thể được khớp thủ công (file: backend/src/controllers/unmatchedTransaction.controller.js:109-115)
- [Rule] Booking payment completed validation: Booking đã completed payment không thể nhận payment lại (file: backend/src/controllers/unmatchedTransaction.controller.js:124-126)
- [Rule] Booking cancelled validation: Booking đã cancelled không thể nhận payment (file: backend/src/controllers/unmatchedTransaction.controller.js:128-130)
- [Rule] Transaction data mapping: Unmatched transaction được map sang SeePay transaction format để process payment (file: backend/src/controllers/unmatchedTransaction.controller.js:154-163)
- [Rule] Atomic operation: Nếu process payment fail, transaction không được mark as matched (rollback logic) (file: backend/src/controllers/unmatchedTransaction.controller.js:196-213)
- [Rule] Default notes: Nếu admin không cung cấp notes, sử dụng default message với unmatchedTransactionId (file: backend/src/controllers/unmatchedTransaction.controller.js:170)
- [Rule] Valid status filter values: unmatched, matched, refunded, ignored (file: backend/src/controllers/unmatchedTransaction.controller.js:35-39)

### Constraints

- [Constraint] Required input: bookingId là bắt buộc khi match transaction (file: backend/src/controllers/unmatchedTransaction.controller.js:93-95)
- [Constraint] Pagination defaults: page=1, limit=20, maxLimit=100 (file: backend/src/controllers/unmatchedTransaction.controller.js:28-32)
- [Constraint] Amount tolerance: ±1000 VND (inherited từ payment service) (file: backend/src/controllers/unmatchedTransaction.controller.js:135)
- [Constraint] Sort default: -createdAt (newest first) (file: backend/src/controllers/unmatchedTransaction.controller.js:26)

### Assumptions

- [Assumption] Admin authority: Admin có quyền quyết định match transaction ngay cả khi amount không khớp hoàn toàn (file: backend/src/controllers/unmatchedTransaction.controller.js:136-151)
- [Assumption] Transaction data structure: Unmatched transaction có đủ thông tin để map sang SeePay format (id, amount, date, bankInfo) (file: backend/src/controllers/unmatchedTransaction.controller.js:154-163)
- [Assumption] Error handling: Nếu process payment fail, error được re-throw để catchAsync xử lý (file: backend/src/controllers/unmatchedTransaction.controller.js:213)
- [Assumption] Populate relations: matchedBookingId và matchedBy được populate khi query danh sách (file: backend/src/controllers/unmatchedTransaction.controller.js:54-55)

### Methods

- [Method] `getUnmatchedTransactions()`: Lấy danh sách unmatched transactions với pagination, filter by status, sort (file: backend/src/controllers/unmatchedTransaction.controller.js:24-71)
- [Method] `matchUnmatchedTransaction()`: Match unmatched transaction với booking thủ công (Admin only) (file: backend/src/controllers/unmatchedTransaction.controller.js:73-217)

---

## Payment System - QR Payment Modal (Frontend)

### Business Rules

- [Rule] Payment status polling: Kiểm tra trạng thái thanh toán mỗi 10 giây sau khi QR code được tạo (file: src/components/QRPaymentModal.jsx:89)
- [Rule] Auto-redirect on success: Sau khi thanh toán thành công (status = 'completed'), đợi 1.5 giây trước khi gọi onSuccess callback (file: src/components/QRPaymentModal.jsx:73-75)
- [Rule] Auto-stop polling: Dừng polling khi payment status = 'completed' hoặc 'expired' (file: src/components/QRPaymentModal.jsx:71-79)
- [Rule] QR regeneration: Cho phép tạo lại QR code mới khi status = 'expired' (file: src/components/QRPaymentModal.jsx:128-130, 207)
- [Rule] Countdown timer: Cập nhật thời gian còn lại mỗi giây, tự động set status = 'expired' khi hết thời gian (file: src/components/QRPaymentModal.jsx:106-118)
- [Rule] Cleanup on unmount: Clear tất cả polling và countdown intervals khi component unmount (file: src/components/QRPaymentModal.jsx:18-22)

### Constraints

- [Constraint] Polling interval: 10 giây (10000ms) để kiểm tra payment status (file: src/components/QRPaymentModal.jsx:89)
- [Constraint] Success redirect delay: 1.5 giây (1500ms) trước khi redirect sau payment success (file: src/components/QRPaymentModal.jsx:74)
- [Constraint] Countdown update interval: 1 giây (1000ms) để cập nhật timer (file: src/components/QRPaymentModal.jsx:108)
- [Constraint] Time format: MM:SS với zero-padding (ví dụ: 14:05, 00:30) (file: src/components/QRPaymentModal.jsx:132-136)
- [Constraint] Time calculation: Sử dụng Math.max(0, ...) để đảm bảo không có giá trị âm (file: src/components/QRPaymentModal.jsx:101-103, 110-112)

### Assumptions

- [Assumption] QR data source: QR code có thể là `qrData.qrCode.data` (base64) hoặc `qrData.qrCode.url` (URL) (file: src/components/QRPaymentModal.jsx:213-214)
- [Assumption] Token storage: JWT token được lưu trong localStorage với key 'token' (file: src/components/QRPaymentModal.jsx:30, 59)
- [Assumption] API response structure: Backend trả về object với format `{ success: boolean, data: object, message: string }` (file: src/components/QRPaymentModal.jsx:39-47, 65-79)
- [Assumption] Payment status values: 'pending' (default), 'completed', 'expired' (file: src/components/QRPaymentModal.jsx:9, 68, 76, 116, 176, 200)
- [Assumption] API endpoints: POST `/bookings/:id/payment/qrcode` để tạo QR, GET `/bookings/:id/payment/status` để check status (file: src/components/QRPaymentModal.jsx:31, 59)
- [Assumption] Copy to clipboard: Sử dụng navigator.clipboard.writeText() với alert đơn giản (file: src/components/QRPaymentModal.jsx:138-141)

### UI/UX Rules

- [Rule] Loading state: Hiển thị spinner và message "Đang tạo mã QR thanh toán..." khi loading (file: src/components/QRPaymentModal.jsx:143-152)
- [Rule] Error state: Hiển thị error icon, message và 2 buttons "Thử lại" + "Đóng" (file: src/components/QRPaymentModal.jsx:154-174)
- [Rule] Success state: Hiển thị success icon, message "Thanh toán thành công!" và "Đang chuyển hướng..." (file: src/components/QRPaymentModal.jsx:176-188)
- [Rule] Expired state: Hiển thị expired icon, message và button "Tạo lại mã QR" (file: src/components/QRPaymentModal.jsx:200-209)
- [Rule] Copy functionality: Cung cấp copy button (📋) cho account number, amount và payment reference (file: src/components/QRPaymentModal.jsx:234-237, 247-250, 261-264)
- [Rule] Modal overlay: Click overlay để đóng modal, click modal content không đóng (stopPropagation) (file: src/components/QRPaymentModal.jsx:190-192)

---

## Server Configuration & Lifecycle

### Business Rules

- [Rule] Environment validation bắt buộc: MONGODB_URI, JWT_SECRET, SEPAY_API_KEY, BANK_ACCOUNT_NUMBER phải được config (file: backend/src/server.js:18-32)
- [Rule] Payment Poller chỉ khởi động sau khi database đã kết nối thành công (file: backend/src/server.js:154)
- [Rule] Graceful shutdown sequence: Stop HTTP server → Stop Payment Poller → Close database connection (file: backend/src/server.js:95-115)
- [Rule] Uncaught exception và unhandled rejection trigger immediate shutdown (file: backend/src/server.js:167-191)

### Constraints

- [Constraint] Shutdown timeout: 10 giây, sau đó force exit (file: backend/src/server.js:12, 99-103)
- [Constraint] Payment Poller interval mặc định: 60 giây, config qua PAYMENT_POLLING_INTERVAL (file: backend/src/server.js:40)
- [Constraint] Nếu Payment Poller fail khi start, server vẫn tiếp tục chạy (không throw error) (file: backend/src/server.js:47)

### Assumptions

- [Assumption] Payment Poller là optional service, server có thể hoạt động bình thường khi Poller không start được (file: backend/src/server.js:47)
- [Assumption] Sử dụng global.server để shutdown handlers có thể truy cập server instance (file: backend/src/server.js:157)
