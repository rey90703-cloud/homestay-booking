# ⚡ Quick Start Guide - Homestay Booking Admin

## 🚨 QUAN TRỌNG: Phải chạy Backend trước!

### ❌ Lỗi hiện tại của bạn:
```
ERR_CONNECTION_REFUSED
localhost:5001
```

**Nguyên nhân:** Backend server chưa được khởi động!

---

## ✅ Giải pháp nhanh (3 bước):

### 1️⃣ Mở Terminal mới
```bash
cd /Users/nhim/Downloads/homestay-booking/backend
```

### 2️⃣ Start Backend
```bash
npm run dev
```

### 3️⃣ Đợi thấy message này:
```
✅ Connected to MongoDB
🚀 Server is running on port 5001
```

**XOng!** Bây giờ refresh lại trang Admin Panel của bạn.

---

## 🎯 Hoặc dùng Script tự động:

```bash
cd /Users/nhim/Downloads/homestay-booking
./start-backend.sh
```

---

## 📋 Checklist đầy đủ:

### Terminal 1 - Backend (PHẢI chạy trước)
```bash
cd backend
npm run dev
```
✅ Thấy: "Server is running on port 5001"

### Terminal 2 - Frontend
```bash
npm run dev
```
✅ Thấy: "Local: http://localhost:5173"

### Browser
```
http://localhost:5173/admin
```
✅ Admin Panel hoạt động bình thường

---

## 🔍 Kiểm tra Backend đã chạy:

### Test 1: Check port
```bash
lsof -i :5001
```
**Mong đợi:** Có output với process `node`

### Test 2: Curl API
```bash
curl http://localhost:5001/api/v1/homestays
```
**Mong đợi:** Trả về JSON

### Test 3: Browser
```
http://localhost:5001/api/v1/homestays
```
**Mong đợi:** Thấy data JSON, không phải lỗi kết nối

---

## 🎓 Thứ tự Start đúng:

```
1. Start Backend    → port 5001 ✅
2. Start Frontend   → port 5173 ✅
3. Open Browser     → Admin Panel ✅
```

**Sai thứ tự = ERR_CONNECTION_REFUSED** ❌

---

## 🔐 Đăng nhập Admin:

**URL:** http://localhost:5173/admin/login

**Thông tin:**
- Email: `admin@homestay.com`
- Password: `Admin@123456`

---

## 🆘 Troubleshooting nhanh:

| Lỗi | Giải pháp |
|-----|-----------|
| `ERR_CONNECTION_REFUSED` | Backend chưa chạy → `cd backend && npm run dev` |
| `Port 5001 already in use` | Kill process: `npx kill-port 5001` |
| `Cannot find module` | Install deps: `cd backend && npm install` |
| `MongoDB connection failed` | Check internet & `.env` file |
| `401 Unauthorized` | Đăng xuất và đăng nhập lại |

---

## 💡 Tips:

- Giữ 2 terminals mở: 1 cho Backend, 1 cho Frontend
- Backend PHẢI chạy khi dùng Admin Panel
- Dùng `Ctrl + C` để dừng server
- Check Backend logs nếu có lỗi

---

## 📱 Test nhanh Backend hoạt động:

```bash
# Test 1: Health check
curl http://localhost:5001/api/v1/homestays

# Test 2: Get specific homestay
curl http://localhost:5001/api/v1/homestays/690b28952b2d16778f0f4b31

# Test 3: Check port
lsof -i :5001
```

---

## 🎉 Khi mọi thứ chạy OK:

```
✅ Backend: http://localhost:5001     (Terminal 1)
✅ Frontend: http://localhost:5173    (Terminal 2)
✅ Admin: http://localhost:5173/admin (Browser)
```

**Giờ bạn có thể quản lý homestay!** 🏠✨
