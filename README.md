# UIT Scheduler

> Hệ thống hỗ trợ xếp thời khóa biểu tự động, thông minh dành riêng cho sinh viên **Trường Đại học Công nghệ Thông tin, ĐHQG-HCM (UIT)**.
> Xử lý 100% trên Client-side (Trình duyệt) - Không cần backend server.

---

## Tính Năng Nổi Bật

- **Nhập file Excel TKB chính thức của UIT**:
  - Hỗ trợ file Excel TKB 1 sheet (gộp) hoặc 2 sheet riêng biệt (`TKB LT` & `TKB TH`).
  - Tự động nhận diện cột (Mã MH, Mã lớp, Tên môn, Thứ, Tiết, Phòng, Giảng viên, Cách tuần,...).
- **Thuật toán CSP Solver tối ưu trên Frontend**:
  - Tự động ghép nối chuẩn xác giữa **Lớp Lý thuyết (LT)** và **Lớp Thực hành (TH)** tương ứng.
  - Hỗ trợ cố định lớp cụ thể (Chỉ định riêng LT, riêng TH hoặc cả hai) - Thuật toán tự động tìm phần còn lại.
  - Phân tích xung đột và chẩn đoán trùng lịch chi tiết kèm tên đầy đủ của môn học.
- **Tùy chọn khung giờ rảnh / bận linh hoạt**:
  - Đánh dấu khung giờ bận (Né buổi sáng, Né buổi chiều, Nghỉ Thứ 7,...).
  - Khung giờ tiết 1..10 chuẩn xác theo quy định của UIT.
- **Giao diện Cao cấp & Theme Linh Hoạt**:
  - Bảng màu kép: **Catppuccin Latte** (Giao diện Sáng) & **Tokyo Night** (Giao diện Tối).
- **Tương tác trực tiếp trên Thời Khóa Biểu**:
  - Nhấp trực tiếp vào ô môn học để đổi nhanh sang lớp khác mà không cần làm lại từ đầu.
- **Xuất ảnh chất lượng cao (.PNG)**:
  - Tải ảnh thời khóa biểu siêu nét (hỗ trợ cả nền Sáng và Tối).

---

## Công Nghệ Sử Dụng

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Xử lý Excel**: [xlsx](https://sheetjs.com/)
- **Export ảnh**: [html-to-image](https://github.com/bubkoo/html-to-image)
- **Hiệu ứng**: [canvas-confetti](https://github.com/catdad/canvas-confetti)

---

## Cài Đặt & Chạy Cục Bộ

### 1. Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)
- Trình quản lý gói `npm`, `pnpm` hoặc `yarn`

### 2. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 3. Chạy môi trường phát triển (Dev)

```bash
npm run dev
```

Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

### 4. Build phiên bản Production

```bash
npm run build
npm start
```

---

## Hướng Dẫn Sử Dụng

1. **Bước 1 - Chọn Môn & Lớp**:
   - Tải file Excel TKB do phòng đào tạo UIT công bố lên hệ thống.
   - Tìm kiếm và chọn các môn bạn muốn đăng ký học.
   - *(Tùy chọn)* Nhấp vào biểu tượng mắt để khóa mã lớp cụ thể nếu muốn.
2. **Bước 2 - Chọn Khung Giờ**:
   - Quét chọn các tiết bận bạn muốn né (màu đỏ).
   - Nhấp **Tìm Lịch Học Tối Ưu**.
3. **Bước 3 - Xem & Xuất TKB**:
   - Xem các phương án xếp lịch không trùng.
   - Chuyển đổi giữa chế độ **Bảng Sáng** / **Bảng Tối**.
   - Nhấp **Xuất Ảnh (.png)** để lưu về máy.

---

## Bản Quyền & Giấy Phép

Phát triển bởi sinh viên vì cộng đồng sinh viên UIT.
