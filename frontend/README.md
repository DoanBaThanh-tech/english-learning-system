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
| `/onboarding` | Ba bước hỏi nhanh: kênh biết tới SkyWord, trình độ A1–C2, mục tiêu học (giao tiếp, du học, công việc, IELTS, TOEIC, du lịch, phim/nhạc, thi tốt nghiệp, khác); xem trước lộ trình ngay khi chọn |
| `/login` | Đăng nhập một thẻ căn giữa trên ảnh bầu trời xanh; email, mật khẩu, ghi nhớ phiên |
| `/register` | Tạo tài khoản: tên gọi, email, trình độ, mục tiêu ngày, mật khẩu + xác nhận; đọc câu trả lời onboarding để điền sẵn trình độ/mục tiêu và gửi kèm mục tiêu học + kênh giới thiệu |
| `/app` | Trang chủ sau đăng nhập: lời chào, mục tiêu ngày, chuỗi ngày, thống kê, hoạt động 7 ngày và điểm kỹ năng; thẻ **Chương trình dành cho bạn** bám trình độ + mục tiêu học; nút 3 gạch cạnh logo mở menu vòng tròn 8 chức năng |
| `/app/context` | Ngữ cảnh: nhập câu + từ, chạm từ trong câu để chọn, xem nghĩa đúng ngữ cảnh, độ tin cậy, bản dịch cả câu và các nghĩa thay thế; lưu từ kèm câu gốc |
| `/app/words` | Sổ từ & SRS: thống kê mới/đang học/đã thuộc/đến hạn, tìm và lọc theo trạng thái/thư mục/thẻ, thêm từ theo lemma + câu ngữ cảnh, sửa ghi chú/thư mục/thẻ ngay trong thẻ từ, xóa có xác nhận, quản lý thư mục/thẻ, phiên ôn flashcard tự chấm Lại/Khó/Được/Dễ và tổng kết độ chính xác |
| `/app/profile` | Hồ sơ: xem và cập nhật tên gọi, ảnh đại diện (URL), trình độ A1–C2, **mục tiêu học**, mục tiêu từ/ngày, múi giờ; xem kênh đã giới thiệu; đổi mật khẩu có kiểm tra và thu hồi phiên khác |
| `/app/stats` | Thống kê: chuỗi ngày, thời gian học, độ chính xác, số từ, việc đến hạn; biểu đồ 14/30/90 ngày; radar + thanh điểm 5 kỹ năng; bản đồ nhiệt 90 ngày; phiên học gần đây; trạng thái onboarding khi chưa có dữ liệu |
| `/app/plan` | Lộ trình: tạo kế hoạch 3–90 ngày, 5–120 phút/ngày, chọn kỹ năng ưu tiên (mặc định theo mục tiêu học); xem tiến độ, cơ cấu kỹ năng, dòng thời gian Cần làm/Sắp tới/Đã xong/Tất cả, đánh dấu hoàn thành, thêm nhiệm vụ, xóa lộ trình và xem lịch sử |

Nút **Bắt đầu miễn phí** (và **Tạo tài khoản** ở cuối trang giới thiệu) dẫn tới `/onboarding` thay vì mở thẳng form đăng ký. Câu trả lời được truyền sang `/register` qua router state: trình độ điền sẵn, mục tiêu từ/ngày gợi ý theo trình độ + mục tiêu học, kèm băng tóm tắt chương trình và link **Đổi câu trả lời** (quay lại onboarding với lựa chọn cũ). Đăng ký gửi `learningPurpose` + `referralSource`; API lưu vào `Users.LearningPurpose` / `Users.ReferralSource`. Trang chủ dùng hai trường này để vẽ chương trình, kỹ năng ưu tiên và nhịp học; nếu chưa chọn mục tiêu, thẻ mời chọn trong Hồ sơ. Mục tiêu thay đổi trong Hồ sơ được lưu bằng `PUT /api/users/me` và cập nhật ngay trang chủ.

Đăng ký thành công sẽ chuyển sang `/login` với email vừa đăng ký được điền sẵn và con trỏ nằm ở ô mật khẩu; người dùng chỉ cần nhập mật khẩu. Đăng nhập thành công vào thẳng `/app`. Người đã có phiên mở `/login`, `/register` sẽ được đưa về `/app`; khách mở `/app` sẽ được đưa về `/login`.

Trang **Ngữ cảnh** nằm ở `/app/context` và cũng yêu cầu đăng nhập. Trang gọi thật `POST /api/dictionary/context-lookup` để chọn nghĩa theo câu, hiển thị độ tin cậy, nguồn chọn nghĩa, bản dịch cả câu và tối đa 6 nghĩa thay thế; nút lưu gọi `POST /api/vocabulary/words` với `senseId` + câu gốc. Trong menu vòng tròn, năm mục **Từ điển ngữ cảnh**, **Sổ từ**, **Thống kê**, **Lộ trình** và **Hồ sơ** có chấm “đã mở” và nút **Mở chức năng**; Phát âm, Gia sư AI và Bài đọc vẫn là “Sắp mở”.

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

Bốn trang mới đã được kiểm thử với API thật trên database của user 1: đọc/cập nhật hồ sơ (giữ nguyên dữ liệu thật), tạo–sửa–xóa từ kèm câu ngữ cảnh, tạo/xóa thư mục và thẻ, phiên ôn `review` với flashcard (chấm quality 4) rồi `finish`, tạo lộ trình 7 ngày, hoàn thành nhiệm vụ, thêm nhiệm vụ và xóa lộ trình. Sau kiểm thử, toàn bộ từ/thư mục/thẻ/lộ trình/phiên học/progress thử đã được dọn sạch; database trở lại **1 user thật, 0 từ, 0 lộ trình** và điểm 5 kỹ năng về 50.

Giao diện được duyệt bằng Chrome headless ở 320, 390, 768, 1024, 1366, 1920 và 3840px cho bốn trang (28 phép đo): không tràn ngang, không lỗi console. Đã chụp thêm trạng thái rỗng của cả bốn trang, form thêm/sửa từ, phiên ôn trước/sau khi lật thẻ và màn hình tổng kết, form tạo lộ trình, form thêm nhiệm vụ, trạng thái vừa hoàn thành nhiệm vụ, menu vòng tròn chọn chức năng và nút **Mở chức năng** điều hướng đúng route.

Luồng onboarding mới đã được kiểm thử end-to-end với API thật: **Bắt đầu miễn phí** → chọn TikTok → B2 → IELTS → form đăng ký điền sẵn B2/30 từ/ngày kèm băng IELTS Foundation → tạo tài khoản → đăng nhập → trang chủ hiện **IELTS Foundation** (B2, 30 từ/ngày, 20 phút/ngày, 21 ngày, trọng tâm Đọc) → mở Lộ trình thấy sẵn 21 ngày/20 phút/kỹ năng Đọc → đổi mục tiêu sang Công việc trong Hồ sơ → trang chủ cập nhật **Tiếng Anh cho công việc**. API trả 400 với mã mục tiêu lạ. Đã đo onboarding (cả 3 bước), trang chủ, form lộ trình và Hồ sơ ở 320–3840px: 0 tràn ngang, 0 lỗi console; sửa khoảng đệm để nhãn cấp độ A1–C2 không bị nút chọn che ở 320px. Sau kiểm thử, hai tài khoản test và toàn bộ lộ trình/nhiệm vụ/refresh token của chúng đã được xóa; database trở lại **1 user thật**, 0 lộ trình, 0 từ.

Bố cục đã được kiểm tra ở 320, 360, 390, 430, 768, 1024, 1366, 1920, 2560 và 3840px: không tràn ngang, header/2 nút luôn vừa, thẻ đăng nhập/đăng ký nằm trong màn hình và form dài có thể cuộn.
