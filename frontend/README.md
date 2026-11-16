# SkyWorld — Frontend

Giao diện **SkyWorld** (tiếng Việt) cho ứng dụng học tiếng Anh, dựng bằng **Vite + React 19 + TypeScript**, kết nối **API .NET thật** trong `backend/EnglishApp.Api`.

Mascot **Nimbo** là chú mây 3D dựng bằng Three.js r128, tự dừng khi tab bị ẩn và tôn trọng `prefers-reduced-motion`. Màn chơi level dùng thêm 12 linh vật 3D riêng; bản đồ chỉ dựng linh vật ở gần khung nhìn.

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
| `/app` | Học: bản đồ khóa Nimbus 12 level, vòng 4 phase, XP, sao, lộ trình cá nhân |
| `/app/lesson/:levelId` | Màn chơi level 4 phase: nhận diện, ghép nối, sắp xếp, nghe & viết |
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

- `src/lib/curriculum.ts`: 3 unit × 4 level (A1 → B1). Mỗi level chia 4 phase: **Nhận diện** (trắc nghiệm), **Ghép nối** (ghép cặp), **Sắp xếp** (xếp câu), **Nghe & viết** (nghe chép + điền từ).
- `src/lib/courseProgress.ts`: tiến độ, XP, sao và số phase đã xong lưu theo email trong `localStorage` (`skyworld.course.v1:<email>`), không ghi vào DB để giữ database trắng. Bản ghi cũ chỉ có `completedAt` được tự chuyển thành 4/4 phase.
- Vòng tròn xanh quanh node trên bản đồ chạy theo `phases/4`; **đủ 4 phase mới mở level kế**. Học lại level đã xong vẫn giữ thành tích tốt nhất.
- 3 sao khi đạt ≥ 90% câu đúng, 2 sao khi ≥ 70%, còn lại 1 sao (tính trên số câu đã làm trong lượt chơi).
- `src/components/mascot/CloudBuddy.tsx`: 6 bạn mây SVG cùng nét với Nimbo — Pip, Lumi, Misty, Bibi, Coco và Nimbo. Mỗi dạng bài có một bạn đồng hành riêng trong thẻ câu hỏi.
- `src/lib/mascots.ts` + `src/components/mascot/LevelMascot.tsx`: **12 linh vật 3D** đại diện 12 level (thỏ, cáo, cú, mèo, cánh cụt, ếch, gấu trúc, rái cá, khủng long, robot, sư tử, rồng). Tạo hình theo phong cách hoạt hình bo tròn, đầu to, mắt trắng to với đồng tử đậm, màu bão hòa và phụ kiện riêng (nơ, khăn, vòng cổ, mũ, lá trúc, bờm, cánh…). Bề mặt dùng cel-shading 4 nấc (`MeshToonMaterial`, tắt tone mapping, không phản xạ) cộng viền màu tối kiểu tranh vector (inverted hull) nên nhân vật phẳng, đậm nét hoạt hình như Duolingo thay vì bóng nhựa; các bạn sáng màu như Mochi hay Bao vẫn tách rõ khỏi nền trắng. Mỗi linh vật **luôn cử động liên tục** — thở, đảo mắt, vểnh tai, ve vẩy đuôi — và tự chọn ngẫu nhiên các động tác nhỏ (nhún, vẫy tay, ngó quanh, nghiêng người, vươn vai, xoay) sau những khoảng nghỉ ngẫu nhiên, không còn chu kỳ nhảy cố định mỗi 10 giây. Mọi động tác dùng envelope `sin²` bắt đầu/kết thúc bằng 0, cộng dồn trên cùng một pha chuyển động liên tục và chạy bằng delta-time nên không có điểm gãy, không giật khi đổi tư thế; nhân vật vẫn nhảy mừng khi hoàn thành phase. Camera được đẩy gần hơn, lưới cầu/tròn dày hơn và canvas bám theo `devicePixelRatio` (tới 2,6) kể cả khi zoom trình duyệt, nên phóng to không còn lộ pixel. Chỉ dựng lại khi đổi linh vật, tạm dừng khi tab ẩn, tôn trọng `prefers-reduced-motion`.
- `src/components/mascot/LazyLevelMascot.tsx`: thumbnail 3D trên node bản đồ, hero và màn level khóa. Chỉ dựng canvas khi linh vật ở gần khung nhìn và tự dọn khi cuộn qua, nên bản đồ 12 level không tạo 12 WebGL context cùng lúc.
- Không còn avatar 2D trong luồng level: mọi nhân vật đại diện level đều là mô hình three.js.
- Màn chơi ẩn sidebar/rail/tab để tập trung; thanh tiến độ chia 4 đoạn theo phase, có hiệu ứng pháo giấy khi xong phase/level. Nút “Lưu từ vào sổ” gọi API `POST /api/vocabulary/words/by-lemma` (best-effort, báo số từ đã lưu).

## API

Hợp đồng đầy đủ: [`API_CONTRACT.md`](./API_CONTRACT.md).

- `src/lib/api.ts`: client REST, chuẩn hóa lỗi `ProblemDetails`.
- `src/lib/AuthContext.tsx`: phiên đăng nhập, refresh token một lần khi gặp 401.
- `src/lib/useAuthedApi.ts`: bọc gọi API kèm token và tự đăng xuất khi hết phiên.

Database mặc định trắng: không có tài khoản demo, không seed từ vựng/bài học. Người dùng đầu tiên tự đăng ký.

## Kiểm thử đã chạy

- `npm run build`: TypeScript 0 lỗi, Vite build thành công.
- Khóa Nimbus: role/flow 4 phase đã chạy thật — phase 3 hoàn thành hiện màn “Sắp xếp xong rồi!” và ghi `phases: 3`; phase 4 gồm điền từ + nghe chép, xong hiện tổng kết 4/4, 3 sao, +70 XP và ghi `phases: 4`. Level kế chỉ mở khi level trước đủ 4 phase; level khóa hiện avatar đúng linh vật của level đó.
- 12 linh vật 3D đều dựng được trong cùng gallery kiểm thử, không canvas trắng; mỗi bạn có màu lông, tai/đuôi/cánh và phụ kiện khác nhau. Ảnh chụp cách nhau cho thấy nhân vật thở/đảo mắt/đổi tư thế ngẫu nhiên liên tục, không còn phụ thuộc mốc 10 giây. Khung hình mascot đã tăng: stage chơi 284px, màn chúc mừng 330px, thumbnail bản đồ 68px, hero 158px; camera gần hơn nên nhân vật chiếm phần lớn khung.
- Animation tính theo delta-time, envelope `sin²` và pha chuyển động liên tục; chớp mắt, đảo mắt, tai, đuôi, cánh đều dùng hàm sin nên không có cú giật khi bắt đầu/kết thúc động tác.
- Kiểm tra độ nét: phóng trình duyệt 200% và chụp cận mascot, canvas tự tăng pixel ratio theo `devicePixelRatio` (cap 2,6 cho full, 1,9 cho thumbnail), silhouette cầu/tròn không lộ cạnh đa giác.
- Duyệt giao diện 320 / 390 / 1366 / 1440 / 1536 / 3840 px, light + dark: `scrollWidth` bằng đúng chiều rộng khung nhìn (không tràn ngang). Rail phải tự ẩn dưới 1460px; node bản đồ thu nhỏ và giảm offset dưới 700px để không bị cắt. Màn chơi dùng đúng 1 canvas 3D; bản đồ chỉ dựng canvas cho linh vật gần khung nhìn (4–6 context), không lỗi console. Bản đồ hiển thị vòng xanh đầy cho level đã xong và nửa vòng cho level đang học.

> Ghi chú: nếu API chưa cấu hình nhà cung cấp AI, trang Trò chuyện dùng phản hồi mẫu và hiển thị rõ trạng thái ngoại tuyến. Cloudinary chỉ nên dùng **unsigned preset**; không commit `.env` hoặc file chứa secret.
