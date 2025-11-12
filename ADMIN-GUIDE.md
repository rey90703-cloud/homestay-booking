# Hướng dẫn quản lý Admin - Homestay Booking

## 🔧 Các lỗi đã sửa

### 1. Lỗi Template String trong API calls
**Vấn đề:** Sử dụng single quotes `'` thay vì backticks `` ` `` cho template literals, khiến URL API không được format đúng.

**Files đã sửa:**
- ✅ `src/pages/admin/AdminHomestays.jsx` (line 269)
- ✅ `src/pages/admin/AdminUsers.jsx` (line 179)
- ✅ `src/pages/admin/AdminPayments.jsx` (line 43)

**Trước:**
```javascript
fetch('${API_BASE_URL}/homestays', { ... })
```

**Sau:**
```javascript
fetch(`${API_BASE_URL}/homestays`, { ... })
```

### 2. Lỗi API Routes cho Admin
**Vấn đề:** Đường dẫn API không khớp với backend routes.

**Files đã sửa:**
- ✅ `src/pages/admin/AdminHomestays.jsx`
  - `/admin/homestays/:id/approve` → `/homestays/admin/:id/approve`
  - `/admin/homestays/:id/reject` → `/homestays/admin/:id/reject`

## 👤 Quản lý Admin User

### Tạo Admin mới hoặc Reset password
```bash
cd backend
node scripts/create-admin.js
```

**Thông tin đăng nhập mặc định:**
- Email: `admin@homestay.com`
- Password: `Admin@123456`

### Cấp quyền Admin cho User hiện có
```bash
cd backend
node scripts/set-user-admin.js <email-cua-user>
```

Ví dụ:
```bash
node scripts/set-user-admin.js user@example.com
```

## 🔐 Yêu cầu quyền

### Backend Routes Protection
Các API endpoints yêu cầu:
- **Authentication:** Token JWT hợp lệ
- **Role:** `admin` hoặc `host` (tùy endpoint)

### Homestay CRUD Operations
```javascript
// routes/homestay.routes.js
POST   /homestays              // host, admin - Tạo homestay
PUT    /homestays/:id          // host, admin - Cập nhật homestay
DELETE /homestays/:id          // host, admin - Xóa homestay

PATCH  /homestays/admin/:id/approve  // admin only - Duyệt homestay
PATCH  /homestays/admin/:id/reject   // admin only - Từ chối homestay
```

## 🚀 Testing

### 1. Khởi động Backend
```bash
cd backend
npm run dev
```

### 2. Khởi động Frontend
```bash
cd ..
npm run dev
```

### 3. Đăng nhập Admin Panel
1. Truy cập: `http://localhost:5173/admin/login`
2. Nhập thông tin:
   - Email: `admin@homestay.com`
   - Password: `Admin@123456`

### 4. Test CRUD Homestay
1. Vào tab "Quản lý homestay"
2. Click "+ Thêm homestay mới"
3. Điền thông tin và upload ảnh
4. Click "Tạo mới"

## ❗ Troubleshooting

### Lỗi 401 Unauthorized
**Nguyên nhân:** Token không hợp lệ hoặc hết hạn
**Giải pháp:**
1. Xóa localStorage: `localStorage.clear()`
2. Đăng nhập lại

### Lỗi 403 Forbidden
**Nguyên nhân:** User không có quyền admin
**Giải pháp:**
```bash
cd backend
node scripts/set-user-admin.js <your-email>
```

### Lỗi API không gọi được
**Kiểm tra:**
1. Backend có đang chạy? → `http://localhost:5001`
2. File `.env` có đúng MONGODB_URI?
3. Browser console có lỗi CORS?

### Không tạo/cập nhật được Homestay
**Kiểm tra:**
1. User đã login với role `admin` hoặc `host`?
2. Token có trong localStorage?
3. Backend console có log lỗi?

## 📊 Database Schema

### User Roles
```javascript
ROLES: {
  GUEST: 'guest',    // User thông thường
  HOST: 'host',      // Chủ nhà - có thể tạo homestay
  ADMIN: 'admin'     // Admin - full quyền
}
```

### Homestay Status
```javascript
HOMESTAY_STATUS: {
  DRAFT: 'draft',           // Nháp
  PENDING: 'pending',       // Chờ duyệt
  ACTIVE: 'active',         // Hoạt động
  SUSPENDED: 'suspended',   // Tạm ngừng
  DELETED: 'deleted'        // Đã xóa
}
```

## 🔍 Kiểm tra Database

### Xem tất cả users và roles
```javascript
// MongoDB Compass hoặc mongosh
use BookingHomestay
db.users.find({}, { email: 1, role: 1, fullName: 1 })
```

### Kiểm tra homestay
```javascript
db.homestays.find({}, { title: 1, status: 1, verificationStatus: 1 })
```

## ✅ Checklist hoàn thành

- [x] Sửa lỗi template string trong API calls
- [x] Sửa đường dẫn API routes cho admin
- [x] Tạo script set-user-admin.js
- [x] Test build frontend thành công
- [x] Verify admin user exists với role `admin`
- [x] Tạo tài liệu hướng dẫn

## 📝 Notes

- **Token expiration:** 24 giờ (có thể thay đổi trong `.env`)
- **Max images per homestay:** 10 ảnh
- **Max image size:** 5MB
- **Supported formats:** JPEG, PNG, WebP

---

Nếu vẫn gặp lỗi, check:
1. Backend logs: `backend/logs/`
2. Browser DevTools Console
3. Network tab trong DevTools
