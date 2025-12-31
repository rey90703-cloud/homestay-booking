# Smart Door Access Control Models

## Overview

Các models này hỗ trợ tính năng Smart Door Access Control, tích hợp với ESP32 và MQTT Broker (HiveMQ Cloud).

## Models

### 1. AccessControl Model

**File:** `accessControl.model.js`

**Mục đích:** Quản lý mật khẩu guest cho smart door. Mật khẩu do ESP32 tự sinh và gửi lên backend qua MQTT.

**Schema:**
```javascript
{
  bookingId: ObjectId (unique),
  guestPassword: String (4-6 digits, not "9999"),
  durationMinutes: Number (0-1440),
  lastUpdated: Date,
  expiresAt: Date,
  isActive: Boolean,
  confirmedAt: Date,
  confirmedBy: ObjectId (User)
}
```

**Indexes:**
- `bookingId` (unique)
- `expiresAt`
- `isActive`

**Methods:**
- `isExpired()`: Kiểm tra password đã hết hạn chưa
- `calculateExpiry(durationMinutes)`: Tính thời gian hết hạn

**Validation:**
- Password phải là 4-6 chữ số
- Password không được là "9999" (admin password)
- Duration từ 0-1440 phút (0-24 giờ)

---

### 2. AccessLog Model

**File:** `accessLog.model.js`

**Mục đích:** Lưu lịch sử truy cập cửa từ ESP32 qua MQTT topic `smartdoor/log`.

**Schema:**
```javascript
{
  bookingId: ObjectId,
  user: String (enum: ['Admin', 'Guest', 'Chủ nhà']),
  method: String (enum: ['KEYPAD', 'WEB']),
  timestamp: Date,
  rawTimestamp: Number (millis từ ESP32)
}
```

**Indexes:**
- `bookingId`
- `timestamp`
- Compound: `bookingId + timestamp` (descending)

**Methods:**
- `convertMillisToDate()`: Chuyển rawTimestamp sang Date
- Static `convertMillisToDate(millis)`: Chuyển millis sang Date

**Pre-save Hook:**
- Tự động chuyển `rawTimestamp` sang `timestamp` nếu chưa có

---

### 3. Booking Model Extension

**File:** `backend/src/modules/bookings/booking.model.js`

**Field mới:**
```javascript
smartDoorAccess: {
  enabled: Boolean (default: false),
  confirmedAt: Date,
  confirmedBy: ObjectId (User)
}
```

**Mục đích:**
- `enabled`: Đánh dấu booking có sử dụng smart door không
- `confirmedAt`: Thời gian host xác nhận và gửi password cho guest
- `confirmedBy`: User ID của host xác nhận

---

## Migration

Khi deploy lần đầu, chạy migration script để thêm field `smartDoorAccess` vào bookings hiện có:

```bash
node backend/scripts/migrate-smart-door-access.js
```

Script này sẽ:
1. Kết nối MongoDB
2. Tìm tất cả bookings chưa có field `smartDoorAccess`
3. Thêm field với giá trị mặc định `{ enabled: false }`
4. Verify migration thành công

---

## Usage Examples

### Tạo AccessControl mới

```javascript
const AccessControl = require('./models/accessControl.model');

const accessControl = new AccessControl({
  bookingId: booking._id,
  guestPassword: '1234',
  durationMinutes: 120,
});

// expiresAt sẽ tự động được tính
await accessControl.save();

console.log(accessControl.isExpired()); // false
```

### Lưu AccessLog từ MQTT

```javascript
const AccessLog = require('./models/accessLog.model');

// Data từ MQTT topic: smartdoor/log
const logData = {
  user: 'Guest',
  method: 'KEYPAD',
  time: 1704067200000, // millis
};

const log = new AccessLog({
  bookingId: booking._id,
  user: logData.user,
  method: logData.method,
  rawTimestamp: logData.time,
});

// timestamp sẽ tự động được chuyển đổi từ rawTimestamp
await log.save();
```

### Update Booking với Smart Door Access

```javascript
const Booking = require('./modules/bookings/booking.model');

// Khi host xác nhận
booking.smartDoorAccess = {
  enabled: true,
  confirmedAt: new Date(),
  confirmedBy: host._id,
};

await booking.save();
```

---

## Notes

- AccessControl có relationship 1-1 với Booking (unique bookingId)
- AccessLog có relationship 1-N với Booking (nhiều logs cho 1 booking)
- Password "9999" được reserve cho admin (host)
- Duration = 0 có nghĩa là disable password
- Timestamps được lưu dạng millis từ ESP32 và convert sang Date

---

## Related Files

- MQTT Service: `backend/src/services/mqtt.service.js`
- Access Control Service: `backend/src/services/accessControl.service.js`
- Access Log Service: `backend/src/services/accessLog.service.js`
- Smart Door Controller: `backend/src/controllers/smartDoor.controller.js`
