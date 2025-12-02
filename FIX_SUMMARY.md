# Tóm tắt sửa lỗi Filter - Đánh giá & Tiện nghi

## ✅ Đã sửa

Trang Search giờ đây có thể lọc chính xác theo:
1. **Đánh giá** (⭐ 4.0+, 4.5+, 4.8+)
2. **Tiện nghi** (WiFi, TV, Bếp, Máy giặt, Điều hòa, v.v.)

## 🔧 Các file đã thay đổi

### Backend
- `backend/src/modules/homestays/homestay.service.js` - Thêm logging cho amenity filter
- `backend/scripts/seed-amenities.js` - Script seed amenities (MỚI)
- `backend/scripts/update-homestay-amenities.js` - Script cập nhật homestays (MỚI)
- `backend/package.json` - Thêm scripts

### Frontend
- `src/components/FilterSidebar.jsx` - Sửa amenity IDs (underscore → hyphen)
- `src/services/searchService.js` - Cập nhật amenity mapping

## 🚀 Chạy ngay

```bash
# 1. Seed amenities
cd backend
npm run seed:amenities

# 2. Cập nhật homestays hiện có (nếu có)
npm run update:homestay-amenities

# 3. Khởi động backend
npm run dev

# 4. Khởi động frontend (terminal mới)
cd ..
npm run dev
```

## 🧪 Test

1. Mở `http://localhost:5173/search`
2. Click vào filter "⭐ 4.5+" → Chỉ hiện homestays rating >= 4.5
3. Click vào "WiFi" + "Điều hòa" → Chỉ hiện homestays có cả 2 tiện nghi
4. Kết hợp cả hai → Phải thỏa mãn cả 2 điều kiện

## 📝 Chi tiết

Xem file `FILTER_FIX_INSTRUCTIONS.md` để biết thêm chi tiết và troubleshooting.
