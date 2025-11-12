# 🚀 Hướng dẫn Start Backend Server

## ⚠️ LỖI: ERR_CONNECTION_REFUSED

Lỗi này xảy ra vì **Backend server chưa được khởi động**.

## ✅ Giải pháp:

### Bước 1: Mở Terminal mới (hoặc tab mới)

### Bước 2: Di chuyển vào thư mục backend
```bash
cd /Users/nhim/Downloads/homestay-booking/backend
```

### Bước 3: Khởi động Backend Server
```bash
npm run dev
```

### Kết quả mong đợi:
Bạn sẽ thấy output giống như:
```
[nodemon] starting `node src/server.js`
✅ Connected to MongoDB
🚀 Server is running on port 5001
📝 Swagger API docs available at http://localhost:5001/api-docs
```

---

## 📋 Checklist đầy đủ:

### ✅ Terminal 1: Backend (Port 5001)
```bash
cd backend
npm run dev
```
**Phải thấy:** "Server is running on port 5001"

### ✅ Terminal 2: Frontend (Port 5173)
```bash
npm run dev
```
**Phải thấy:** "Local: http://localhost:5173"

---

## 🔍 Kiểm tra Backend đã chạy chưa:

### Cách 1: Check port
```bash
lsof -i :5001
```
Phải có output hiển thị process `node`

### Cách 2: Test API
```bash
curl http://localhost:5001/api/v1/homestays
```
Phải trả về JSON response

### Cách 3: Mở trình duyệt
Truy cập: http://localhost:5001/api/v1/homestays
Phải thấy JSON data, không phải "This site can't be reached"

---

## ❌ Nếu gặp lỗi "Port 5001 is already in use":

```bash
# Tìm process đang dùng port 5001
lsof -i :5001

# Kill process đó
kill -9 <PID>

# Hoặc dùng lệnh này:
npx kill-port 5001

# Rồi start lại
npm run dev
```

---

## 📝 Scripts có sẵn:

```json
"scripts": {
  "start": "node src/server.js",        // Production mode
  "dev": "nodemon src/server.js",       // Development mode (recommended)
  "test": "jest --coverage",            // Run tests
  "lint": "eslint ."                    // Check code quality
}
```

---

## 🌐 Các URL quan trọng:

- **Backend API:** http://localhost:5001/api/v1
- **API Documentation:** http://localhost:5001/api-docs
- **Frontend:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin

---

## 🔧 Troubleshooting:

### Lỗi: "Cannot find module"
```bash
cd backend
npm install
npm run dev
```

### Lỗi: "MONGODB_URI is not defined"
Kiểm tra file `backend/.env` có đầy đủ config:
```env
MONGODB_URI=mongodb+srv://...
PORT=5001
JWT_SECRET=...
```

### Lỗi: "Failed to connect to MongoDB"
- Kiểm tra internet connection
- Kiểm tra MONGODB_URI trong `.env` có đúng không
- Thử connect bằng MongoDB Compass

---

## 💡 Lưu ý:

1. **Phải giữ Backend chạy** trong khi sử dụng Admin Panel
2. Nếu dừng Backend, Admin Panel sẽ không hoạt động
3. Backend phải chạy **TRƯỚC** khi mở Admin Panel
4. Dùng `Ctrl + C` để dừng Backend khi cần

---

## ✅ Khi Backend đã chạy:

1. Truy cập: http://localhost:5173/admin/login
2. Đăng nhập:
   - Email: `admin@homestay.com`
   - Password: `Admin@123456`
3. Bắt đầu quản lý homestay! 🎉
