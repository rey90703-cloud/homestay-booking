# Hướng dẫn sửa lỗi Filter (Đánh giá & Tiện nghi)

## Vấn đề đã được sửa

1. **Lọc theo Đánh giá**: Backend đã có logic lọc theo `minRating` trong field `stats.averageRating`
2. **Lọc theo Tiện nghi**: 
   - Frontend đã được cập nhật để gửi slug với dấu gạch ngang (`-`) thay vì gạch dưới (`_`)
   - Backend đã có logic tìm amenities theo slug và lọc homestays
   - Đã thêm logging để debug

## Các thay đổi đã thực hiện

### Backend
1. **`backend/src/modules/homestays/homestay.service.js`**
   - Thêm logging để debug amenity filtering
   - Logic đã sẵn sàng để lọc theo amenities và rating

2. **`backend/scripts/seed-amenities.js`** (MỚI)
   - Script để seed amenities vào database với đúng slug format

3. **`backend/package.json`**
   - Thêm script `seed:amenities` để chạy seed

### Frontend
1. **`src/components/FilterSidebar.jsx`**
   - Cập nhật amenity IDs từ underscore sang hyphen format
   - Ví dụ: `washing_machine` → `washing-machine`, `air_conditioning` → `air-conditioning`

2. **`src/services/searchService.js`**
   - Cập nhật amenity mapping để khớp với format mới

## Cách chạy

### Bước 1: Seed Amenities vào Database
```bash
cd backend
npm run seed:amenities
```

Kết quả mong đợi:
```
✅ Connected to MongoDB
🗑️  Cleared existing amenities
✅ Created 12 amenities:
   - WiFi (slug: wifi)
   - TV (slug: tv)
   - Bếp (slug: kitchen)
   - Máy giặt (slug: washing-machine)
   - Điều hòa (slug: air-conditioning)
   - Sưởi ấm (slug: heating)
   - Không gian làm việc (slug: workspace)
   - Hồ bơi (slug: pool)
   - Phòng gym (slug: gym)
   - Đỗ xe miễn phí (slug: parking)
   - Ban công (slug: balcony)
   - Vườn (slug: garden)
✅ Amenities seeded successfully!
```

### Bước 2: Cập nhật Homestays hiện có (nếu có)
```bash
cd backend
npm run update:homestay-amenities
```

Script này sẽ:
- Đọc tất cả homestays trong database
- Chuyển đổi `amenityNames` (tên tiện nghi) thành `amenities` (ObjectId references)
- Bỏ qua homestays đã có amenities

### Bước 3: Khởi động lại Backend (nếu đang chạy)
```bash
cd backend
npm run dev
```

### Bước 3: Khởi động Frontend
```bash
npm run dev
```

### Bước 4: Test Filter

1. Truy cập trang Search: `http://localhost:5173/search`
2. Thử lọc theo **Đánh giá**:
   - Click vào "⭐ 4.0+", "⭐ 4.5+", hoặc "⭐ 4.8+"
   - Kiểm tra URL có param `minRating=4.0` (hoặc 4.5, 4.8)
   - Kết quả chỉ hiển thị homestays có rating >= giá trị đã chọn

3. Thử lọc theo **Tiện nghi**:
   - Click vào các tiện nghi như "WiFi", "TV", "Bếp", v.v.
   - Kiểm tra URL có param `amenities=wifi,tv,kitchen`
   - Kết quả chỉ hiển thị homestays có TẤT CẢ các tiện nghi đã chọn

4. Thử kết hợp cả hai:
   - Chọn đánh giá "⭐ 4.5+" và tiện nghi "WiFi" + "Điều hòa"
   - Kết quả phải thỏa mãn cả hai điều kiện

## Kiểm tra Backend Logs

Khi filter, bạn sẽ thấy logs trong terminal backend:
```
🔍 Searching for amenities with slugs: wifi, air-conditioning
✅ Found 2 amenities: wifi, air-conditioning
```

Nếu không tìm thấy amenities:
```
⚠️ No amenities found for slugs: wifi, air-conditioning
```

## Lưu ý quan trọng

1. **Homestays phải có amenities**: Đảm bảo các homestays trong database đã được gán amenities
2. **Homestays phải có rating**: Field `stats.averageRating` phải có giá trị để lọc theo đánh giá hoạt động
3. **Status phải là 'active'**: Chỉ homestays có status='active' mới hiển thị trong search

## Troubleshooting

### Lọc tiện nghi không hoạt động
1. Kiểm tra amenities đã được seed: `GET http://localhost:5000/api/v1/amenities`
2. Kiểm tra homestays có amenities: Xem field `amenities` trong response
3. Xem backend logs để debug

### Lọc đánh giá không hoạt động
1. Kiểm tra homestays có field `stats.averageRating`
2. Giá trị phải là số từ 0-5
3. Nếu chưa có reviews, rating sẽ là 0

### Không có kết quả nào
1. Thử bỏ tất cả filters (click "Đặt lại")
2. Kiểm tra có homestays nào có status='active' không
3. Thử search không có filters để xem có data không

## API Endpoints để test

```bash
# Lấy tất cả amenities
GET http://localhost:5000/api/v1/amenities

# Search với rating filter
GET http://localhost:5000/api/v1/homestays?minRating=4.5

# Search với amenity filter
GET http://localhost:5000/api/v1/homestays?amenities=wifi,tv

# Search với cả hai
GET http://localhost:5000/api/v1/homestays?minRating=4.5&amenities=wifi,air-conditioning
```
