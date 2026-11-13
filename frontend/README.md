# SkyWorld — Frontend

Giao diện **SkyWorld** (tiếng Việt) cho ứng dụng học tiếng Anh, dựng bằng **Vite + React 19 + TypeScript**, kết nối **API .NET thật** trong `backend/EnglishApp.Api`.

Mascot **Nimbo** là chú mây 3D dựng bằng Three.js r128, một canvas mỗi trang, tự dừng khi tab bị ẩn và tôn trọng `prefers-reduced-motion`.

## Chạy local

```bash
# 1) API
cd backend/EnglishApp.Api
dotnet run            # http://localhost:5041
# Nếu cổng 5041 đang bị tiến trình cũ giữ:
# .\run-dev.ps1      # tự dừng tiến trình giữ cổng rồi chạy lại

# 2) Giao diện
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Cấu hình API (tạo file `.env.development`, không commit):

```
VITE_API_URL=http://localhost:5041
```

`VITE_API_BASE_URL` vẫn được chấp nhận để tương thích; `VITE_API_URL` được ưu tiên.

## Lệnh

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy Vite, cổng 5173 (tự chuyển cổng nếu bận) |
| `npm run build` | `tsc -b` + build production vào `dist/` |
| `npm run preview` | Xem bản build tại cổng 4173 |
| `npm run lint` | Kiểm tra bằng oxlint |

## Route

| Route | Trang |
|---|---|
| `/` | Welcome: hero Nimbo, 7 tính năng, 5 khối giới thiệu, CTA, footer |
| `/onboarding` | 3 câu hỏi cá nhân hóa: kênh biết tới, trình độ A1–C2, mục tiêu |
| `/register` | Tạo tài khoản, điền sẵn trình độ/mục tiêu từ onboarding |
| `/login` | Đăng nhập, điền sẵn email sau khi đăng ký |
| `/app` | Học: bản đồ khóa Nimbus 12 level, XP, sao, lộ trình cá nhân |
| `/app/lesson/:levelId` | Màn chơi level: trắc nghiệm, ghép cặp, xếp câu, nghe chép, điền từ |
| `/app/dictionary` | Từ điển: tra từ, nghe, lưu từ, tra theo ngữ cảnh |
| `/app/vocabulary` | Sổ từ: lọc, thư mục, thẻ, thêm/sửa/xóa từ |
| `/app/review` | Ôn tập SM-2: flashcard 4 mức Quên/Khó/Tốt/Dễ |
| `/app/practice` | Luyện: trắc nghiệm, điền từ, nghe chép chính tả |
| `/app/speaking` | Luyện nói: micro, chấm điểm, âm vị và gợi ý |
| `/app/chat` | Trò chuyện AI theo tình huống, sửa ngữ pháp |
| `/app/reading` | Bài đọc A1–C2, tạo bài từ văn bản, tra từ khi đọc |
| `/app/stats` | Thống kê: chuỗi ngày, biểu đồ, kỹ năng, bản đồ nhiệt |
| `/app/profile` | Hồ sơ: mục tiêu, trình độ, mục tiêu ngày, đổi mật khẩu |

Đường dẫn SkyWord cũ được chuyển hướng: `/app/words` → `/app/vocabulary`, `/app/context` → `/app/dictionary`, `/app/plan` → `/app`, `/welcome` → `/`.

## Thiết kế

- `src/styles/tokens.css`: token màu sáng/tối, font **Baloo 2** (tiêu đề) + **Nunito** (nội dung), reset, focus ring, reduced motion.
- `src/styles/ui.css`: `.btn` khối nổi (viền 2px, đáy 5px, chữ hoa, active nhấn xuống), `.card`, form, tab, progress, chip, modal, feedback, skeleton.
- Mỗi trang có CSS riêng trong `src/styles/`.
- Dark mode theo `prefers-color-scheme` và `data-theme="dark"`; chữ dùng token nên đổi màu an toàn.
- Responsive từ 320px đến TV 4K; app dùng sidebar trái + cột giữa tối đa 760px + rail phải trên desktop, thanh tab dưới trên mobile.

## Mascot Nimbo

`src/components/mascot/NimboMascot.tsx`

```tsx
<NimboMascot pose="idle" size={320} interactive onClick={() => {}} />
```

- Pose: `idle | shock | think | sad | wave | cheer | walk`.
- Thân mây SDF (rounded box + 5 ellipsoid, smooth-union k = 0.14), chiếu lên `SphereGeometry(1, 96, 64)`.
- Vertex color `#e3ecf5 → #b9d8f0`, ACES tone mapping, sRGB.
- Mắt, mí, lông mày, má, miệng, lưỡi, nhíu mày, nước mắt; tay, chân, giày.
- Thở, trôi nhẹ, xoay chậm, chớp mắt; pose chỉ nội suy, không dựng lại scene.
- Kéo để xoay, chạm để vẫy tay 2,4 giây (Welcome).
- Dispose toàn bộ geometry/material/renderer khi unmount; tạm dừng khi `document.hidden`.

## Khóa học Nimbus

- `src/lib/curriculum.ts`: 3 unit × 4 level (A1 → B1), mỗi level 5 dạng bài: trắc nghiệm, ghép cặp, xếp câu, nghe chép, điền từ.
- `src/lib/courseProgress.ts`: tiến độ, XP và sao lưu theo email trong `localStorage` (`skyworld.course.v1:<email>`), không ghi vào DB để giữ database trắng.
- Hoàn thành level mở level kế; 3 sao khi đạt ≥ 90% câu đúng, 2 sao khi ≥ 70%, còn lại 1 sao.
- `src/components/mascot/CloudBuddy.tsx`: 6 bạn mây SVG cùng nét với Nimbo — Pip, Lumi, Misty, Bibi, Coco và Nimbo. Mỗi dạng bài có một bạn đồng hành riêng.
- `src/components/mascot/CloudFriends.tsx`: cụm 3 nhân vật mây 3D (Nimbo, Lumi, Pip) trong **một** canvas three.js, phản ứng `cheer / sad / think` theo câu trả lời.
- Màn chơi ẩn sidebar/rail/tab để tập trung; nút “Lưu từ vào sổ” gọi API `POST /api/vocabulary/words/by-lemma` (best-effort, báo số từ đã lưu).

## API

Hợp đồng đầy đủ: [`API_CONTRACT.md`](./API_CONTRACT.md).

- `src/lib/api.ts`: client REST, chuẩn hóa lỗi `ProblemDetails`.
- `src/lib/AuthContext.tsx`: phiên đăng nhập, refresh token một lần khi gặp 401.
- `src/lib/useAuthedApi.ts`: bọc gọi API kèm token và tự đăng xuất khi hết phiên.

Database mặc định trắng: không có tài khoản demo, không seed từ vựng/bài học. Người dùng đầu tiên tự đăng ký.

## Kiểm thử đã chạy

- `npm run build`: TypeScript 0 lỗi, Vite build thành công.
- Khóa Nimbus: hoàn thành level 1-1 qua cả 5 dạng bài (100%, 3 sao, +70 XP), mở khóa level 2, chặn level chưa mở, trả lời sai trừ tim và hiện đáp án; tiến độ lưu/đọc lại đúng theo email.
- Luồng thật: Welcome → onboarding 3 bước → đăng ký → đăng nhập → Học → tra từ → lưu từ → sửa trạng thái/thư mục/thẻ → ôn SM-2 → luyện trắc nghiệm → chấm phát âm → trò chuyện → tạo bài đọc + lưu từ + ghi tiến độ → tạo lộ trình → thống kê → cập nhật hồ sơ.
- Duyệt giao diện 320 / 390 / 768 / 1024 / 1440 / 1920 / 3840 px, light + dark: không tràn ngang, mỗi trang tối đa 1 canvas, không lỗi console. Màn chơi level dùng đúng 1 canvas 3D (rail Nimbo được ẩn).

> Ghi chú: nếu API chưa cấu hình nhà cung cấp AI, trang Trò chuyện dùng phản hồi mẫu và hiển thị rõ trạng thái ngoại tuyến. Cloudinary chỉ nên dùng **unsigned preset**; không commit `.env` hoặc file chứa secret.
