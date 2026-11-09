# SkyWord English — Frontend

Project VS Code riêng cho giao diện SkyWord: **Vite + React 19 + TypeScript**.

## Mở project

Mở thư mục `frontend/` trong VS Code (không mở cả repo nếu bạn chỉ làm giao diện).

## Chạy local

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API cần chạy trước tại http://localhost:5041 (`dotnet run` trong `backend/EnglishApp.Api`).

Cấu hình API nằm ở `.env.development`:

```
VITE_API_BASE_URL=http://localhost:5041
```

Khi deploy, đổi biến này sang domain API thật.

## Các trang hiện có

| Route | Mô tả |
|---|---|
| `/` | Splash nền skyblue, vòng tròn ripple, logo orbit, chữ SkyWord English; tự chuyển sau ~3,5 giây |
| `/welcome` | Trang giới thiệu: hero + 3 chức năng nổi bật; header có 2 nút Đăng nhập / Đăng ký |
| `/login` | Đăng nhập một thẻ căn giữa trên ảnh bầu trời xanh; email, mật khẩu, ghi nhớ phiên |
| `/register` | Tạo tài khoản: tên gọi, email, trình độ, mục tiêu ngày, mật khẩu + xác nhận |
| `/app` | Trang chủ sau đăng nhập: lời chào, mục tiêu ngày, chuỗi ngày, thống kê, hoạt động 7 ngày và điểm kỹ năng |

Đăng ký thành công sẽ chuyển sang `/login` với email vừa đăng ký được điền sẵn và con trỏ nằm ở ô mật khẩu; người dùng chỉ cần nhập mật khẩu. Đăng nhập thành công vào thẳng `/app`. Người đã có phiên mở `/login`, `/register` sẽ được đưa về `/app`; khách mở `/app` sẽ được đưa về `/login`.

## Auth & API

- `src/lib/api.ts`: gọi API, chuẩn hóa lỗi ProblemDetails.
- `src/lib/AuthContext.tsx`: lưu phiên, đăng nhập/đăng ký/đăng xuất, tự refresh access token khi gặp 401.
- Access token + refresh token được lưu ở `localStorage` khi chọn “Ghi nhớ đăng nhập”, ngược lại dùng `sessionStorage`.
- Mật khẩu được băm PBKDF2 phía API; frontend không bao giờ lưu mật khẩu.

## Dữ liệu

Database mặc định trắng: không có tài khoản demo, không nạp sẵn từ vựng hay bài học. Người dùng đầu tiên bấm **Tạo tài khoản mới** và đăng nhập bằng chính tài khoản đó.

## Kiểm tra build

```bash
npm run build
```

Kết quả hiện tại: build thành công, 0 lỗi TypeScript. Luồng thật đã được kiểm thử end-to-end: splash → trang giới thiệu → đăng ký → trang đăng nhập điền sẵn email → nhập mật khẩu → trang chủ → đăng xuất → đăng nhập lại → tự refresh token.

Bố cục đã được kiểm tra ở 320, 360, 390, 430, 768, 1024, 1366, 1920, 2560 và 3840px: không tràn ngang, header/2 nút luôn vừa, thẻ đăng nhập/đăng ký nằm trong màn hình và form dài có thể cuộn.
