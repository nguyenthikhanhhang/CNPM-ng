# ODYSSEY Menswear (bản làm lại)

Angular 22 (frontend) + Express (API) + MariaDB/MySQL. Thiết kế chi tiết và sơ đồ tuần tự: `docs/ODYSSEY_Tai_lieu_thiet_ke.docx`.

## Chạy dự án
1. Cài Node.js 20+ và MariaDB/MySQL, bật dịch vụ database.
2. Backend:
   ```
   cd backend
   cp .env.example .env     # sửa DB_USER / DB_PASSWORD cho đúng máy bạn
   npm install
   npm run setup-db         # tạo bảng, nạp 20 sản phẩm, tạo admin
   npm start                # http://localhost:3000  (kiểm tra: /api/health)
   ```
3. Frontend (cửa sổ lệnh khác):
   ```
   cd frontend
   npm install
   npm start                # http://localhost:4200
   ```

## Tài khoản
- Admin: `admin@odyssey.vn` / `Admin@123` (đổi trong `.env` trước khi `setup-db`).
- Nhân viên: admin tạo trong trang **Quản trị**.
- Khách hàng: tự đăng ký (email, họ tên, số điện thoại, mật khẩu).

## Chức năng
- Khách: xem sản phẩm, giỏ hàng, thanh toán (COD / VietQR), xem đơn của mình.
- Nhân viên (`/staff`): thêm / sửa / ẩn sản phẩm, xem và đổi trạng thái đơn.
- Admin (`/admin`): báo cáo doanh thu, top sản phẩm, doanh thu theo danh mục, hàng sắp hết, cấp tài khoản nhân viên.

## Lưu ý
- Logo trường: `frontend/public/logo.png` (logo thật của trường, hiển thị ở góc trái đầu trang). Muốn đổi thì thay file này, giữ nguyên tên.
- Tên database là `odyssey_db` (khai báo trong `database/schema.sql` và `.env`). Nếu đổi tên, sửa cả hai nơi.
- Đổi tài khoản nhận tiền VietQR trong `frontend/src/app/config.ts`.
