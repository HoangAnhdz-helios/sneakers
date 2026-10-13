# PHUANH SNEAKER - E-COMMERCE PLATFORM

Website thương mại điện tử chuyên cung cấp các dòng giày sneaker (Onitsuka Tiger, Air Jordan, Nike SB/Cortez, MLB, LV, Puma, Adidas, New Balance, Vans,...), tích hợp Firebase Authentication, Cloud Firestore, quản lý kho biến thể theo size, quy trình đặt hàng và Admin Panel hoàn chỉnh.

---

## 1. Công nghệ & Kiến trúc

- **Frontend:** React 19 + TypeScript + Vite.
- **Phong cách & Giao diện:** Thiết kế trung thực 100% theo nhận diện PhuAnh Sneaker gốc (Montserrat, Đen - Trắng - Đỏ #cc0000, Phosphor Icons).
- **Backend & Database:** Google Cloud Firestore (Database ID: `ai-studio-phuanhsneaker-62c5ecb7-a4c2-472a-a99a-ff453ae0b7df`).
- **Xác thực:** Firebase Authentication (Hỗ trợ Email/Mật khẩu và Google Sign-in `signInWithPopup`).
- **Bảo mật:** `firestore.rules` với xác thực phân quyền 2 lớp (Admin vs Customer), khóa sửa đổi giá và vai trò, chống tạo đơn ảo, cô lập dữ liệu PII.

---

## 2. Các chức năng chính

### Khách hàng
1. **Trang chủ:** Banner Slider tự động cuộn (carousel), ribbon phân loại thương hiệu nhanh, sản phẩm mới, sản phẩm bán chạy, cam kết dịch vụ.
2. **Danh mục & Bộ lọc:**
   - Lọc theo Dòng sản phẩm (Tiger, JD, Nike, Puma, Adidas, MLB, LV, NB, Vans,...)
   - Lọc theo Khoảng giá (Dưới 450k, 450k - 480k, Trên 480k)
   - Lọc theo Kích cỡ (Size 35 - 44)
   - Lọc theo tình trạng còn hàng
   - Tìm kiếm tức thì theo tên, SKU, alias
   - Sắp xếp (Mới nhất, Giá tăng/giảm dần, Tên A-Z)
   - Thẻ tag bộ lọc hoạt động, hỗ trợ xóa từng tag hoặc xóa toàn bộ
3. **Chi tiết sản phẩm:**
   - Bộ sưu tập ảnh sản phẩm chất lượng cao (ảnh chính + thumbnails)
   - Bảng biến thể size hiển thị chính xác số lượng tồn kho từng size
   - Tự động khóa các size hết hàng
   - Thêm vào giỏ & Mua ngay (mở form thanh toán tức thì)
   - Sản phẩm liên quan cùng nhóm thương hiệu
4. **Giỏ hàng & Thanh toán:**
   - Giỏ hàng lưu trữ bền vững (localStorage)
   - Quản lý dòng giỏ hàng theo từng biến thể (cùng mẫu nhưng khác size được tách biệt)
   - Kiểm tra tồn kho tối đa khi tăng/giảm số lượng
   - Áp dụng mã giảm giá thực tế (`PHUANH50`: giảm 50.000₫, `SNEAKER10`: giảm 100.000₫, `FREESHIP`: miễn phí ship)
   - Phí vận chuyển: Miễn phí đơn từ 1.000.000₫, mặc định 30.000₫
   - Phương thức thanh toán:
     - **COD:** Thanh toán khi nhận hàng
     - **Chuyển khoản:** Hiển thị tự động mã VietQR, STK Vietcombank `1234567890`, chủ tài khoản `PHUANH SNEAKER`, cú pháp chuyển khoản
     - **Thẻ:** Visa, Mastercard, ví điện tử
   - Tạo mã đơn hàng duy nhất dạng `PA-YYYYMMDD-XXXX`
   - Trừ tồn kho tự động và an toàn khi đặt hàng
   - Màn hình xác nhận đơn hàng thành công kèm chức năng in phiếu đơn hàng
5. **Tài khoản cá nhân:**
   - Đăng ký, Đăng nhập, Quên mật khẩu
   - Đăng nhập nhanh bằng Google
   - Cập nhật hồ sơ (Họ tên, SĐT, Địa chỉ giao hàng mặc định)
   - Lịch sử mua hàng kèm trạng thái chi tiết
   - Chức năng hủy đơn hàng tự phục vụ (kèm hoàn tồn kho tự động) khi đơn ở trạng thái Chờ xử lý (`pending`)
   - Danh sách sản phẩm yêu thích (Wishlist)

---

### Trang quản trị (Admin Panel)
- **Truy cập:** Dành riêng cho tài khoản có quyền `ADMIN` và email quản trị viên: `imperblorius@gmail.com`.
- **Dashboard:**
  - Tổng doanh thu (loại trừ đơn hủy), Doanh thu hôm nay
  - Tổng số đơn hàng, số đơn chờ xử lý
  - Cảnh báo tồn kho thấp (&lt; 3 đôi)
  - Thống kê tỷ lệ đơn theo trạng thái (Chờ xử lý, Đang đóng gói, Đang giao, Hoàn thành, Đã hủy)
- **Quản lý sản phẩm:**
  - Danh sách sản phẩm đầy đủ với tìm kiếm và lọc danh mục
  - Thêm sản phẩm mới và Chỉnh sửa sản phẩm
  - Quản lý nhiều biến thể size, số lượng tồn kho cho từng size
  - Xóa sản phẩm
- **Quản lý kho (Inventory Movements):**
  - Bảng tồn kho chi tiết từng size và SKU
  - Thao tác Nhập kho (+), Xuất kho (-), Kiểm kê điều chỉnh (=) kèm lý do bắt buộc
  - Nhật ký biến động kho (Audit Log) ghi nhận thời gian, người thực hiện, lượng thay đổi và tồn kho trước/sau
- **Quản lý đơn hàng:**
  - Tìm kiếm theo mã đơn, tên khách, số điện thoại
  - Lọc theo trạng thái đơn hàng
  - Cập nhật quy trình đơn hàng (`pending` → `processing` → `shipping` → `delivered`)
  - Cập nhật mã vận đơn và đơn vị vận chuyển
  - Hủy đơn và hoàn tồn kho an toàn (không bị hoàn kho 2 lần)
  - In hóa đơn / phiếu giao hàng
  - **Xuất báo cáo đơn hàng định dạng CSV**
- **Quản lý khuyến mãi:**
  - Thêm, sửa, xóa mã giảm giá
  - Cấu hình giảm theo tiền hoặc theo %, đơn tối thiểu, số lượt dùng tối đa
- **Cài đặt cửa hàng:**
  - Thay đổi hotline, email, thông báo banner đầu trang
  - Cấu hình thông tin tài khoản ngân hàng chuyển khoản
  - Nút đồng bộ lại 46 sản phẩm gốc vào Firestore bất kỳ lúc nào

---

## 3. Tài khoản Quản trị mặc định

- **Email:** `imperblorius@gmail.com`
- Tài khoản này được cấu hình tự động nhận quyền **ADMIN** trong hệ thống và được quy định trực tiếp trong `firestore.rules`.
- Khi đăng nhập bằng tài khoản này, menu tài khoản sẽ hiển thị nút **Admin Panel** màu đỏ để vào trang quản trị.
