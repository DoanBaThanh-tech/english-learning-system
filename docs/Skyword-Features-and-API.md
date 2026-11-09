# Skyword — Đặc tả chức năng, kiến trúc API và hướng dẫn chạy

> Bản bàn giao ngày 09/11/2026. Backend .NET 10 + SQL Server Express, frontend React + TypeScript tại `frontend/`.
> Database mặc định **trắng**: không user mẫu, không nạp sẵn từ vựng/bài đọc. Người dùng đầu tiên tự đăng ký.
> Giao diện thật: `frontend/` (Splash, trang giới thiệu, Đăng nhập, Đăng ký). Bản mẫu tham khảo: `frontend-preview/skyword-orbit.html`.

---

## 1. Mục tiêu sản phẩm

Một web học tiếng Anh cá nhân, ưu tiên **học theo ngữ cảnh**, **nghĩa tiếng Việt chính xác**, **miễn phí lâu dài**, và một **trải nghiệm điều hướng khác biệt** — không dùng sidebar trái/dọc.

Ba trụ cột:

1. **Hiểu đúng**: từ điển đa nghĩa + chọn nghĩa theo câu + dịch cả câu; lưu kèm câu gốc.
2. **Nhớ lâu**: sổ từ theo nghĩa, flashcard, SM-2, nhật ký lỗi, thời tiết trí nhớ.
3. **Dùng được**: đọc, nghe, nói, chatbot nhập vai, phát âm, lộ trình 3–90 ngày.

---

## 2. Danh sách chức năng từ dễ đến khó (không trùng nhau)

Ký hiệu: **API** = đã có endpoint chạy thật; **UI** = đã có trong trang mẫu; **Sau** = kiến trúc đã chừa chỗ, chưa làm.

### Giai đoạn 1 — Nền tảng (dễ)

| # | Chức năng | Nội dung | Trạng thái |
|---|---|---|---|
| 1 | Đăng ký / đăng nhập | Email + mật khẩu PBKDF2, JWT access token, refresh token xoay vòng, logout thu hồi | API |
| 2 | Hồ sơ & mục tiêu | Tên, avatar URL, trình độ A1–C2, mục tiêu từ/ngày, múi giờ | API |
| 3 | Dữ liệu tham chiếu | Levels, PartsOfSpeech, ExerciseTypes, Skills | API |
| 4 | Tra từ | Phiên âm US/UK, audio, định nghĩa, ví dụ, nghĩa Việt; cache vào SQL | API + UI |
| 5 | Sổ từ vựng | Lưu **theo nghĩa**, câu ngữ cảnh, ghi chú, thư mục, nhãn | API + UI |
| 6 | Flashcard | Mặt trước câu hỏi/ngữ cảnh, mặt sau nghĩa + ví dụ + audio | API + UI |
| 7 | Ôn ngắt quãng | SM-2: ease factor, interval, repetitions, due date, ReviewLog | API |
| 8 | Bài tập | Trắc nghiệm, điền từ, nghe chép chính tả, flashcard | API |
| 9 | Streak & mục tiêu ngày | UserDailyStats, GoalMet, chuỗi ngày học theo múi giờ | API + UI |
| 10 | Thống kê cơ bản | Tổng từ, đã thuộc, đến hạn, độ chính xác, phút học | API + UI |

### Giai đoạn 2 — Ngữ cảnh & kỹ năng (trung bình → khó)

| # | Chức năng | Nội dung | Trạng thái |
|---|---|---|---|
| 11 | Dịch theo ngữ cảnh | Chọn sense đúng trong câu, trả lời vì sao, độ tin cậy, dịch cả câu, cache (từ + câu) | API + UI |
| 12 | Bôi đen lưu từ | Gửi lemma + câu + thư mục/nhãn; tự chọn nghĩa theo câu; idempotent | API |
| 13 | Bài đọc | Bài theo trình độ/chủ đề, lưu tiến độ, lens từ đã lưu trong câu | API + UI |
| 14 | Nghe mẫu / dictation | Audio US/UK + bài nghe chép; lưu StudyAnswer | API + UI |
| 15 | Chấm phát âm | Nhận transcript/audio, căn chỉnh từ, điểm tổng, gợi ý âm vị, lịch sử | API + UI mô phỏng |
| 16 | Chatbot nhập vai | 5 kịch bản, sửa câu, trả lời, gợi ý từ đến hạn; AI tùy chọn + fallback offline | API + UI |
| 17 | Nhật ký lỗi | Lỗi từ bài tập / chat / phát âm; nhóm theo kỹ năng; đánh dấu đã sửa | API + UI |
| 18 | Nguồn tài liệu → bài học | Dán text/URL/video/document; trích từ theo tần suất; sinh lesson + lưu sổ | API + UI |
| 19 | Lộ trình cá nhân | Sinh 3–90 ngày theo trình độ, mục tiêu, điểm kỹ năng; gắn bài đọc/kịch bản | API + UI |
| 20 | Radar 5 kỹ năng | Tính lại từ dữ liệu thật: từ vựng, nghe, nói, đọc, ngữ pháp | API |

### Giai đoạn 3 — Chức năng đặc biệt / khác biệt

| # | Chức năng đặc biệt | Vì sao đáng làm | Trạng thái |
|---|---|---|---|
| 21 | **Sky Orbit** — menu vòng sao 16 chức năng | Điều hướng bằng vòng tròn thay sidebar; phân 8 nhóm, mở bằng phím `M`; kèm command palette `Ctrl K` | UI |
| 22 | **Context Lens** — ống kính ngữ cảnh | Không chỉ trả nghĩa: hiển thị nghĩa đã chọn, độ tin cậy, nghĩa thay thế và lý do chọn | API + UI |
| 23 | **Memory Weather** — thời tiết trí nhớ | Dự báo 7 ngày từ đến hạn như thời tiết; biến dữ liệu SRS khô khan thành hình ảnh dễ hiểu | API dữ liệu + UI |
| 24 | **Error Constellation** — chòm sao lỗi | Gom lỗi theo kỹ năng/mẫu lỗi, tạo bài luyện đúng chỗ yếu (hiện có summary; clustering là bước sau) | API nền + Sau |
| 25 | **Echo Chamber** — so sóng giọng đọc | Lưu audio của bạn, so waveform với mẫu, tô màu âm vị yếu | Lưu audio + Sau |
| 26 | **5-minute Sky Break** | Phiên 5 phút tự chọn từ đến hạn + 1 bài đọc ngắn + 3 câu nói; mở bằng một nút | Sau |
| 27 | **Reverse Translation** | Việt → Anh với 2–3 cách diễn đạt, so sắc thái, AI tùy chọn | Sau |
| 28 | **Word Weather Graph** | Đồ thị quên lãng dự báo theo từng từ, gợi ý thời điểm ôn tốt nhất | Sau |
| 29 | **Real-time Voice Room** | WebSocket + ASR/TTS, hội thoại nói thời gian thực | Sau |
| 30 | **PWA / Offline** | Cache bài đọc + từ đến hạn, học khi mất mạng, đồng bộ sau | Sau |

**Không trùng lặp:** mỗi mục chỉ giải quyết một vấn đề. Ví dụ “Memory Weather” là dự báo SRS, còn “Word Garden” chỉ là cách hiển thị trạng thái new/learning/mastered trong sổ từ; “Error Constellation” là phân tích lỗi, không phải nhật ký lỗi cơ bản.

---

## 3. Cách web hiện đại lấy nhiều từ vựng và dịch đúng ngữ cảnh

### 3.1 Không lưu cả từ điển vào database

Database **không cần** chứa hàng triệu từ. Nó là **cache có cấu trúc**:

```
Người dùng tra một từ
   → có trong DB?  → dùng luôn (nhanh, nghĩa đã kiểm duyệt)
   → chưa có?      → Free Dictionary API (định nghĩa, phiên âm, audio, ví dụ)
                   → dịch định nghĩa sang tiếng Việt (MyMemory, miễn phí)
                   → lưu Word + WordSense + SenseTranslation + Example
                   → lần sau tra lại không gọi mạng
```

Vì vậy dữ liệu **lớn dần theo nhu cầu**, không phình ngay từ đầu. Mặc định database không nạp sẵn kho từ vựng: từ chỉ được lấy từ Free Dictionary khi người dùng tra và chỉ cache lại đúng từ đã tra. Bộ 34 từ “hạt giống” trong `Data/Seed/CuratedWordSeed.cs` chỉ dùng khi bật `Seed:Content=true` để kiểm thử cục bộ.

### 3.2 Vì sao lưu theo “sense” chứ không chỉ “word”

`UserWords` trỏ tới `WordSenses`, không trỏ `Words`. Một từ như **run** có 4 nghĩa; người học cần lưu đúng nghĩa **điều hành** kèm câu “She runs a small café…”, không phải lưu “run = chạy”. Đây là quyết định thiết kế quan trọng nhất để dịch đúng ngữ cảnh.

### 3.3 Thuật toán chọn nghĩa theo ngữ cảnh (đang chạy)

1. Chuẩn hóa từ, thử lemma: `runs → run`, `studies → study`, `running → run`.
2. Nếu chưa có, gọi Free Dictionary rồi lưu cache.
3. Chấm từng sense:
   - Giao token giữa câu và định nghĩa + ví dụ.
   - Tín hiệu từ loại: sau “to/will/can…” ưu tiên động từ; sau “a/an/the” ưu tiên danh từ.
   - Khớp cụm ví dụ.
4. Nếu cấu hình AI: gọi LLM trả JSON `{chosenIndex, meaningVi, confidence, explanation}`.
5. Nếu không: dùng `SenseMatcher` offline.
6. Dịch cả câu bằng MyMemory/Google.
7. Lưu `TranslationCache` theo `(WordId, SHA256(câu))` — mỗi cặp từ + câu chỉ gọi AI/dịch một lần.

Kết quả thật đã kiểm thử:

```json
{
  "word": "runs",
  "lemma": "run",
  "meaningVi": "điều hành",
  "confidence": 97,
  "sentenceTranslation": "Cô ấy điều hành một quán cà phê nhỏ ở Quận 1."
}
```

### 3.4 Nhà cung cấp miễn phí đang dùng

| Nhu cầu | Dịch vụ | Key | Ghi chú |
|---|---|---|---|
| Định nghĩa, phiên âm, audio | `api.dictionaryapi.dev` | Không | Miễn phí, không giới hạn cứng |
| Dịch câu Anh → Việt | MyMemory | Không | Có hạn mức ngày; đã fallback Google gtx |
| Dịch dự phòng | `translate.googleapis.com` | Không | Endpoint công khai, có thể đổi |
| Chat AI | Gemini free tier / Groq / OpenRouter | Tùy | Tương thích OpenAI; tắt mặc định |
| Phát âm | Web Speech API (client) | Không | Trình duyệt nhận dạng; server chấm transcript |
| Phát âm nâng cao | Azure Speech | Có | Chừa interface để thay provider |

**Bảo mật:** không commit key. Đặt qua biến môi trường hoặc user-secrets:

```bash
Ai__Enabled=true
Ai__ApiKey=...
Ai__BaseUrl=https://generativelanguage.googleapis.com/v1beta/openai/
Ai__Model=gemini-2.5-flash
```

Khi chưa có key, chatbot dùng **gia sư offline**: sửa các lỗi phổ biến của người Việt (`I very like`, `He don't`, `I want`, `more better`, `informations`…), trả lời theo kịch bản và ghi lỗi vào nhật ký. API không bao giờ chết vì thiếu AI.

---

## 4. Database: quan hệ và quy tắc toàn vẹn

35 bảng, tạo bởi `database/schema.sql` (trích 150 dòng schema từ file gốc, bỏ phần `CREATE LOGIN` placeholder).

### 4.1 Các quan hệ then chốt

| Quan hệ | Kiểu | Quy tắc |
|---|---|---|
| `Words` → `WordSenses` | 1–n | `SenseOrder` unique trong từng từ |
| `WordSenses` → `SenseTranslations` | 1–n | unique `(SenseId, MeaningVi)` |
| `WordSenses` → `Examples` | 1–n | ví dụ Anh/Việt |
| `Words` → `WordPronunciations` | 1–n | unique `(WordId, Accent)`, Accent US/UK |
| `Users` → `UserWords` | 1–n | unique `(UserId, SenseId)` — không lưu trùng một nghĩa |
| `UserWords` → `SrsStates` | 1–1 | PK/FK là `UserWordId` |
| `UserWords` ↔ `Tags` | n–n | bảng nối `UserWordTags` |
| `WordFolders` → `UserWords` | 1–n | xóa thư mục thì set `FolderId = NULL` trước khi xóa |
| `StudySessions` → `StudyAnswers` | 1–n | mỗi câu trả lời thuộc một phiên |
| `UserWords` → `ReviewLogs` | 1–n | log SM-2, có `StudyAnswerId` tùy chọn |
| `Sources` → `GeneratedLessons` | 1–n | xóa nguồn thì set `SourceId = NULL` |
| `GeneratedLessons` → `LessonItems` | 1–n | PK ghép `(LessonId, SenseId)` |
| `LearningPlans` → `PlanTasks` | 1–n | task có thể trỏ bài học/bài đọc/kịch bản |
| `LearnerErrors` | 1 nguồn lỗi | CHECK đúng **một** trong `PronunciationAttemptId`, `ChatMessageId`, `StudyAnswerId` |

### 4.2 Vì sao thiết kế này “chuẩn”

- **Không nhầm nghĩa:** lưu ở cấp sense, không phải word.
- **Không nhầm nguồn lỗi:** CHECK constraint bắt buộc đúng một nguồn.
- **Không mất lịch sử:** `StudyAnswers`, `ReviewLogs`, `UserSkillScores`, `TranslationCache` đều là log/cache có khóa ngoại rõ ràng.
- **Xóa an toàn:** service xử lý thứ tự xóa (lỗi → review log → study answer → user word) và set NULL cho các tham chiếu mềm (source, passage, lesson) trước khi xóa.
- **Cache không thay nguồn:** `TranslationCache` unique `(WordId, SentenceHash)`; `Words` unique lemma.
- **Múi giờ:** streak/mục tiêu tính theo `Users.TimeZoneId`, không dùng UTC ngây thơ.

### 4.3 Dữ liệu thật — không seed mẫu

- Mặc định **không có user mẫu**, không có từ vựng/bài đọc/kịch bản nạp sẵn. Người dùng đầu tiên tự đăng ký và trở thành chủ tài khoản.
- Chỉ các bảng tham chiếu cố định (`Levels`, `PartsOfSpeech`, `ExerciseTypes`, `Skills`) được tạo bởi schema.
- Seed từ vựng/bài đọc/demo user là **tùy chọn kiểm thử**, bật bằng biến môi trường `Seed__Content=true` và `Seed__DemoUser=true`; không dùng cho dữ liệu thật.
- Từ vựng không lưu hàng loạt: API tra Free Dictionary + dịch theo ngữ cảnh, chỉ cache lại từ người dùng thực sự tra. Với ~100 người dùng, dung lượng DB vẫn nhỏ và dễ quản lý.
- Tài khoản được bảo vệ bằng PBKDF2 (120.000 vòng), email unique, refresh token băm SHA-256 và xoay vòng khi làm mới; frontend tự refresh khi access token hết hạn.

---

## 5. Kiến trúc backend (C# .NET 10, 3 tầng)

```
backend/EnglishApp.Api/
  Controllers/                 # chỉ nhận request, gọi service, trả DTO
  Services/
    Interfaces/                # hợp đồng từng chức năng
    Implementations/           # logic phức tạp, giao dịch, cross-table
    External/                  # Dictionary API, dịch, AI (adapter)
  Repositories/
    Base/                      # IRepository<T> + Repository<T>
    Specific/                  # User, Word, UserWord (query có Include)
  DTOs/<Feature>/              # record request/response, không lộ entity
  Data/                        # AppDbContext, seed tùy chọn (mặc định tắt)
  Common/                      # JWT, PBKDF2, exception middleware, utils
  Program.cs                   # DI, auth, CORS, Swagger/Scalar, seed tùy chọn
  wwwroot/uploads/             # audio phát âm
```

```
frontend/
  src/pages/                   # SplashPage, LandingPage, LoginPage, RegisterPage
  src/components/              # BrandOrbit, AuthLayout, PasswordField, Icons
  src/lib/                     # API client + AuthContext (JWT, refresh, storage)
  src/styles/                  # token màu, splash, landing, auth
  src/assets/sky-background.webp
  .env.development             # VITE_API_BASE_URL
```

Quy ước đã áp dụng:

- **Controller không chứa logic** — mỗi action chỉ một dòng gọi service.
- **Service chứa logic liên bảng** — chọn nghĩa, SRS, streak, sinh lộ trình, xóa an toàn.
- **Repository chứa query đơn giản** — `GetByLemmaAsync`, `GetDueAsync`, `SearchAsync`.
- **Mỗi file < 1000 dòng** — file lớn nhất khoảng 400 dòng.
- **Mỗi chức năng một gói DTO/Service/Controller** — dễ tách frontend React sau này.

---

## 6. Danh mục endpoint (86 endpoint)

### Auth (6)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/change-password
GET    /api/auth/me
```

### Users (3)
```
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/dashboard
```

### Reference (5)
```
GET /api/reference/levels
GET /api/reference/parts-of-speech
GET /api/reference/exercise-types
GET /api/reference/skills
GET /api/reference/all
```

### Dictionary (6)
```
GET  /api/dictionary/search?q=&limit=
GET  /api/dictionary/words/{lemma}
POST /api/dictionary/words/{lemma}/enrich
POST /api/dictionary/context-lookup
POST /api/dictionary/translate
GET  /api/dictionary/word-of-the-day
```

### Vocabulary (16)
```
GET    /api/vocabulary/words?folderId=&tagId=&status=&search=&page=&pageSize=
GET    /api/vocabulary/words/due?limit=
GET    /api/vocabulary/words/{id}
POST   /api/vocabulary/words
POST   /api/vocabulary/words/by-lemma
PUT    /api/vocabulary/words/{id}
DELETE /api/vocabulary/words/{id}
GET    /api/vocabulary/stats
GET    /api/vocabulary/folders
POST   /api/vocabulary/folders
PUT    /api/vocabulary/folders/{id}
DELETE /api/vocabulary/folders/{id}
GET    /api/vocabulary/tags
POST   /api/vocabulary/tags
PUT    /api/vocabulary/tags/{id}
DELETE /api/vocabulary/tags/{id}
```

### Study & SRS (6)
```
POST /api/study/sessions
GET  /api/study/sessions
GET  /api/study/sessions/{id}
GET  /api/study/sessions/{id}/next?type=
POST /api/study/sessions/{id}/answers
POST /api/study/sessions/{id}/finish
```

### Stats (5)
```
GET  /api/stats/overview
GET  /api/stats/daily?from=&to=
GET  /api/stats/heatmap?days=
GET  /api/stats/skills
POST /api/stats/skills/recalculate
```

### Pronunciation (5)
```
POST /api/pronunciation/analyze
POST /api/pronunciation/analyze-audio      # multipart, lưu file
GET  /api/pronunciation/attempts
GET  /api/pronunciation/attempts/{id}
GET  /api/pronunciation/summary
```

### Chat (7)
```
GET    /api/chat/scenarios
POST   /api/chat/scenarios
GET    /api/chat/sessions
POST   /api/chat/sessions
GET    /api/chat/sessions/{id}
DELETE /api/chat/sessions/{id}
POST   /api/chat/sessions/{id}/messages
```

### Errors (4)
```
GET    /api/errors?resolved=&skillId=&limit=
GET    /api/errors/summary
PUT    /api/errors/{id}/resolve
DELETE /api/errors/{id}
```

### Reading (7)
```
GET    /api/reading/passages?levelId=&topic=
GET    /api/reading/passages/{id}
POST   /api/reading/passages
PUT    /api/reading/passages/{id}
DELETE /api/reading/passages/{id}
PUT    /api/reading/passages/{id}/progress
GET    /api/reading/passages/{id}/lens
```

### Sources & Lessons (9)
```
GET    /api/sources
GET    /api/sources/{id}
POST   /api/sources
PUT    /api/sources/{id}
DELETE /api/sources/{id}
POST   /api/sources/{id}/generate-lesson
GET    /api/lessons
GET    /api/lessons/{id}
DELETE /api/lessons/{id}
```

### Plans (6)
```
GET    /api/plans
GET    /api/plans/{id}
POST   /api/plans/generate
DELETE /api/plans/{id}
POST   /api/plans/{id}/tasks
PUT    /api/plans/{id}/tasks/{taskId}/complete
```

### Health (1)
```
GET /health
```

Tất cả endpoint (trừ auth/health) yêu cầu `Authorization: Bearer <accessToken>`.

---

## 7. Hướng dẫn chạy

### 7.1 Yêu cầu

- .NET SDK 10
- SQL Server Express (instance `.\SQLEXPRESS`)
- Windows Authentication hoặc SQL login có quyền đọc/ghi DB `English_System_DB`

### 7.2 Tạo database

```bash
sqlcmd -S ".\SQLEXPRESS" -E -C -f 65001 -i database/schema.sql
```

Luôn thêm `-f 65001` để SQL Server đọc đúng tiếng Việt trong file UTF-8 (nếu thiếu, `Levels.Name`, `Skills.NameVi`… sẽ bị lỗi font).

File `database/schema.sql` là schema gốc, **không** gồm `CREATE LOGIN english_app` với mật khẩu placeholder. Nếu muốn dùng SQL login, tạo login thật rồi sửa connection string.

### 7.3 Cấu hình

`appsettings.Development.json` mặc định:

```
Server=.\SQLEXPRESS;Database=English_System_DB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True
```

Lưu ý: máy bạn từng có user-secret `ConnectionStrings:Default` trỏ tới login `english_app` với mật khẩu placeholder. Secret đó đã được bỏ để appsettings phát huy tác dụng. Nếu tự cấu hình lại, dùng `dotnet user-secrets` hoặc biến môi trường, đừng commit mật khẩu.

### 7.4 Chạy API

```bash
cd backend/EnglishApp.Api
dotnet run
```

- API: `http://localhost:5041`
- Scalar UI: `http://localhost:5041/scalar/v1`
- Health: `http://localhost:5041/health`

Database mặc định trắng — không seed user, từ vựng hay bài đọc.

### 7.5 Chạy frontend React (mở như một project VS Code riêng)

```bash
cd frontend
npm install
npm run dev
```

- Web: `http://localhost:5173`
- Cấu hình API: `frontend/.env.development` → `VITE_API_BASE_URL=http://localhost:5041`
- Luồng hiện có: Splash tự chuyển sau ~3,5 giây → trang giới thiệu (Welcome) → Đăng nhập / Đăng ký → quay lại trang giới thiệu với lời chào.
- Phiên đăng nhập: access token + refresh token; “Ghi nhớ đăng nhập” lưu 30 ngày, tự refresh khi token hết hạn.
- Background dùng ảnh bầu trời xanh rõ; đã kiểm tra bố cục từ 320px đến TV 4K, không tràn ngang.

### 7.6 Kiểm thử end-to-end

```bash
cd backend
python tests/smoke_test.py
```

Script kiểm tra auth, refresh xoay vòng, từ điển, enrich từ lạ, chọn nghĩa theo ngữ cảnh, sổ từ, SRS, stats, phát âm, chat (gồm xóa hội thoại), lỗi, đọc, sinh bài học, lộ trình. Kết quả: **98/98 PASS** khi chạy với seed QA.

> Smoke test cần dữ liệu mẫu. Chạy API với `Seed__Content=true Seed__DemoUser=true`, test xong reset bằng `sqlcmd -f 65001` để trả DB về trắng.

### 7.7 Người dùng đầu tiên

Không còn tài khoản demo. Mở `http://localhost:5173`, bấm **Tạo tài khoản mới**, điền tên gọi, email, trình độ, mục tiêu ngày và mật khẩu. Tài khoản được ghi vào DB thật với Id bắt đầu từ 1; hệ thống chuyển sang trang đăng nhập, **điền sẵn email vừa đăng ký** và đặt con trỏ ở ô mật khẩu. Người dùng chỉ cần nhập mật khẩu để vào thẳng trang chủ `/app`.

---

## 8. Giao diện mẫu Sky Orbit

File: `frontend-preview/skyword-orbit.html` (mở trực tiếp bằng trình duyệt).

- Màu chủ đạo xanh bầu trời; nền giấy kem rất nhẹ để màu xanh nổi.
- **Không sidebar trái.** Điều hướng chính là **vòng sao 16 ô** mở bằng nút “Vòng sao” hoặc phím `M`.
- 16 chức năng chia 8 nhóm quanh vòng; tâm là logo; nhãn nhóm nằm ngoài vành.
- **Command palette** `Ctrl K` để tìm nhanh, có lọc, phím ↑↓, Enter.
- **Feature sheet** trượt từ đáy lên, hiển thị mô tả, endpoint API và nút mở.
- Hero “từ của hôm nay” với đĩa tròn, câu ngữ cảnh, nghĩa đã chọn, độ tin cậy.
- Bento: lộ trình, phát âm, vườn từ, ống kính ngữ cảnh, chatbot, bài đọc, heatmap.
- Tương tác thật: đọc mẫu bằng Web Speech API, lưu từ, đổi sense, chấm micro (nhận dạng hoặc mô phỏng), chat, checklist, toast.
- Deep link để chụp thiết kế: `?menu=1`, `?sheet=f02`, `?palette=1`.
- Ảnh chụp: `frontend-preview/shots/home.png`, `orbit.png`, `sheet.png`, `full.png`, `mobile500.png`.

### Vì sao menu này “mới”?

Menu không phải danh sách dọc. Nó là **bản đồ chức năng**: 16 vùng quạt quanh một tâm, phân nhóm theo vòng đời học (tra → lưu → ôn → dùng → đo → lập kế hoạch). Người dùng học vị trí bằng hình dạng và màu, mở nhanh bằng phím, và vẫn có command palette cho người thích bàn phím. Mobile chuyển thành lưới 2 cột — vẫn không phải sidebar trái.

---

## 9. Frontend React hiện tại

Đã hoàn thành trong project `frontend/` (Vite + React 19 + TypeScript):

1. **Splash**: nền skyblue, vòng tròn ripple từ tâm, logo orbit, chữ SkyWord English, thanh tiến trình; tự chuyển sau ~3,5 giây, có nút bỏ qua.
2. **Trang giới thiệu (Welcome)**: hero giới thiệu sản phẩm và đúng 3 chức năng nổi bật (ngữ cảnh, sổ từ SRS, luyện nói). Khách thấy 2 nút **Đăng nhập** / **Đăng ký**; người đã đăng nhập thấy lời chào, nút **Trang chủ** và **Đăng xuất**.
3. **Đăng nhập**: một thẻ kính mờ căn giữa trên ảnh bầu trời xanh; email, mật khẩu (hiện/ẩn), caps-lock warning, ghi nhớ đăng nhập, lỗi inline, loading state, link về trang giới thiệu.
4. **Đăng ký**: tên gọi, email, trình độ A1–C2, mục tiêu 10/20/30/50 từ/ngày, mật khẩu + xác nhận + thanh độ mạnh, điều khoản; validate hai chiều với API. Tạo xong chuyển sang đăng nhập với email điền sẵn và thông báo thành công màu xanh.
5. **Trang chủ `/app`** (yêu cầu đăng nhập): lời chào theo buổi, ngày hiện tại, trình độ, mục tiêu ngày, vòng tiến độ từ đã học, 4 thẻ thống kê (tổng từ, đã thuộc, cần ôn, chuỗi ngày), biểu đồ 7 ngày, điểm 5 kỹ năng, việc kế tiếp của lộ trình và trạng thái sổ từ trống. Dữ liệu lấy từ `GET /api/users/me/dashboard`.
6. **Auth client**: login/register, lưu phiên theo “ghi nhớ”, tự động refresh access token khi gặp 401, chống gọi refresh trùng, xử lý lỗi ProblemDetails. Đăng ký không tự lưu phiên; token vừa phát được thu hồi để người dùng chủ động đăng nhập lại.
7. **Responsive**: đã kiểm tra 320, 360, 390, 430, 768, 1024, 1366, 1920, 2560 và 3840px; không tràn ngang, header luôn vừa màn hình, form cuộn được, TV dùng thẻ và chữ lớn hơn.

Bước tiếp theo: từ điển theo ngữ cảnh, sổ từ/SRS, phát âm, chat, bài đọc và lộ trình được nối vào trang chủ. Gợi ý state: React Query cho server state, Context/Zustand cho UI state; giữ CSS token xanh-trắng hiện tại.

---

## 10. Những điểm cần biết / giới hạn hiện tại

- **Chấm phát âm**: server chấm từ **transcript**. Audio được lưu để nghe lại, nhưng chưa chạy ASR server-side. Nếu client không gửi transcript, endpoint trả 400 với hướng dẫn. Muốn chấm âm vị thật, cắm Azure Speech hoặc Whisper qua `IPronunciationService`.
- **AI chatbot**: mặc định offline. Bật bằng biến môi trường; nếu provider lỗi, tự fallback, không làm hỏng phiên chat.
- **Dịch máy miễn phí**: MyMemory có hạn mức; đã có Google fallback và cache 24h. Với câu rất dài, chất lượng có thể giảm.
- **Từ điển**: Free Dictionary API không có tiếng Việt; nghĩa Việt được dịch từ định nghĩa và đánh dấu `IsVerified=false`. Bộ curated (chỉ khi bật seed QA) có `IsVerified=true`.
- **Xóa dữ liệu**: xóa UserWord sẽ xóa study answers/review logs liên quan để giữ FK; đây là lựa chọn có chủ ý cho app cá nhân.
- **JWT key**: nếu không cấu hình, API tạo khóa tạm mỗi lần khởi động. Access token cũ sẽ hết hiệu lực sau restart; refresh token vẫn dùng được. Production phải đặt `Jwt:Key`.
- **SQL login**: file schema gốc có phần tạo login `english_app` với placeholder; bản trong repo đã bỏ phần đó để tránh lỗi. Nếu cần login, tạo thủ công với mật khẩu mạnh.

---

## 11. Tóm tắt bàn giao

| Hạng mục | Đường dẫn |
|---|---|
| Frontend React + TypeScript | `frontend/` |
| API .NET 10 | `backend/EnglishApp.Api/` |
| Schema SQL | `database/schema.sql` |
| Smoke test | `backend/tests/smoke_test.py` |
| Giao diện mẫu Sky Orbit | `frontend-preview/skyword-orbit.html` |
| Ảnh Splash/Welcome/Login/Register (responsive) | `frontend-preview/shots/v3/` |
| Tài liệu này | `docs/Skyword-Features-and-API.md` |

API build 0 warning/0 error; 98/98 kiểm thử end-to-end đạt trên SQL Server thật khi bật seed QA. Database bàn giao không có user mẫu hay từ vựng nạp sẵn; tài khoản đang có là do người dùng tự đăng ký. Tài khoản test dùng khi kiểm thử giao diện đã được xóa sạch.
