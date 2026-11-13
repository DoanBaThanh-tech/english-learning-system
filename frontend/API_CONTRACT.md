# SkyWorld API Contract

Tài liệu này mô tả **hợp đồng API thật** mà giao diện SkyWorld (`frontend/`) đang gọi.
Backend nằm trong `backend/EnglishApp.Api` (.NET), database SQL Server `English_System_DB`.

## 1. Kết nối

| Mục | Giá trị |
|---|---|
| Base URL mặc định | `http://localhost:5041` |
| Biến môi trường | `VITE_API_URL` (ưu tiên) hoặc `VITE_API_BASE_URL` |
| Định dạng | JSON (`Content-Type: application/json`) |
| Xác thực | `Authorization: Bearer <accessToken>` cho mọi endpoint trừ auth/reference công khai |

Frontend chuẩn hóa base URL bằng cách bỏ dấu `/` cuối. Khi deploy, đặt biến môi trường trỏ tới domain API thật; không commit file `.env` có secret.

### Lỗi

API trả `ProblemDetails` (RFC 7807) với các trường `type`, `title`, `status`, `detail`, `errors` (nếu validate).

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Yêu cầu không hợp lệ",
  "status": 400,
  "detail": "Mật khẩu phải có ít nhất một ký tự đặc biệt."
}
```

`401` nghĩa là access token hết hạn/không hợp lệ. Frontend tự gọi `POST /api/auth/refresh` một lần rồi phát lại request; nếu refresh thất bại thì đăng xuất và chuyển về `/login`.

## 2. Auth

| Method | Endpoint | Body | Trả về |
|---|---|---|---|
| POST | `/api/auth/register` | `email`, `password`, `displayName`, `levelId?`, `dailyWordGoal?`, `learningPurpose?`, `referralSource?` | `TokenResponse` (token bị thu hồi ngay, không tự đăng nhập) |
| POST | `/api/auth/login` | `email`, `password` | `TokenResponse` |
| POST | `/api/auth/refresh` | `refreshToken` | `TokenResponse` |
| POST | `/api/auth/logout` | `refreshToken` | `204` |
| POST | `/api/auth/change-password` | `currentPassword`, `newPassword` | `204` |

`TokenResponse`:

```ts
type TokenResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAtUtc: string
  user: UserProfile
}
```

`UserProfile`:

```ts
type UserProfile = {
  id: number
  email: string
  displayName: string
  avatarUrl: string | null
  currentLevelId: number | null
  levelCode: string | null      // A1…C2
  levelName: string | null
  dailyWordGoal: number
  timeZoneId: string
  createdAt: string
  learningPurpose: string | null
  referralSource: string | null
}
```

Mã `learningPurpose`: `communication`, `study_abroad`, `work`, `ielts`, `toeic`, `travel`, `media`, `exam`, `other`.
Mã `referralSource`: `tiktok`, `facebook`, `instagram`, `youtube`, `google`, `friend`, `school`, `other`.

## 3. Hồ sơ & dashboard

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/users/me` | Hồ sơ hiện tại |
| PUT | `/api/users/me` | `displayName`, `avatarUrl`, `currentLevelId`, `dailyWordGoal`, `timeZoneId`, `learningPurpose` |
| GET | `/api/users/me/dashboard` | Dữ liệu trang Học và rail phải |

`Dashboard`:

```ts
type Dashboard = {
  user: UserProfile
  totalWords: number
  dueCount: number
  streakDays: number
  today: {
    dailyGoal: number
    wordsLearned: number
    minutes: number
    goalMet: boolean
  }
  last7Days: { date: string; words: number; minutes: number }[]
}
```

## 4. Từ điển

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/dictionary/search?q=&limit=` | Tìm lemma; trả `DictWord[]` |
| GET | `/api/dictionary/words/{lemma}` | Chi tiết một từ (encodeURIComponent lemma) |
| GET | `/api/dictionary/word-of-the-day` | Từ của ngày |
| POST | `/api/dictionary/context-lookup` | `{ sentence, word }` → nghĩa đúng ngữ cảnh, bản dịch câu, nghĩa thay thế |

```ts
type DictWord = {
  wordId: number
  lemma: string
  phonetic: string | null
  audioUrl: string | null
  partOfSpeech: string | null
  levelCode: string | null
  senses: {
    senseId: number
    meaningVi: string
    definitionEn: string | null
    exampleEn: string | null
    exampleVi: string | null
    isPrimary: boolean
  }[]
}

type ContextLookupResult = {
  word: string
  chosenSenseId: number | null
  confidence: number
  sentenceTranslation: string | null
  chosen: DictWord['senses'][number] | null
  alternatives: DictWord['senses']
}
```

## 5. Sổ từ vựng & SRS

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/vocabulary/words?page=&pageSize=&q=&status=&folderId=&tagId=` | `PagedResult<UserWord>` |
| GET | `/api/vocabulary/words/due?limit=` | Từ đến hạn |
| GET | `/api/vocabulary/words/{id}` | Một từ đã lưu |
| POST | `/api/vocabulary/words` | `{ senseId, contextSentence? }` |
| POST | `/api/vocabulary/words/by-lemma` | `{ lemma, contextSentence?, folderId?, note?, tagIds? }` |
| PUT | `/api/vocabulary/words/{id}` | `{ note?, status?, folderId?, tagIds? }` – `status`: `new` / `learning` / `mastered` |
| DELETE | `/api/vocabulary/words/{id}` | `204` |
| GET | `/api/vocabulary/stats` | Tổng / mới / đang học / cần ôn |
| GET/POST | `/api/vocabulary/folders` | `{ name }` |
| DELETE | `/api/vocabulary/folders/{id}` | `204` |
| GET/POST | `/api/vocabulary/tags` | `{ name }` |
| DELETE | `/api/vocabulary/tags/{id}` | `204` |

```ts
type UserWord = {
  id: number
  senseId: number
  wordId: number
  lemma: string
  phonetic: string | null
  audioUrl: string | null
  meaningVi: string
  definitionEn: string | null
  partOfSpeech: string | null
  levelCode: string | null
  contextSentence: string | null
  note: string | null
  status: 'new' | 'learning' | 'mastered'
  folderId: number | null
  folderName: string | null
  tags: { id: number; name: string }[]
  srs: {
    dueAt: string
    intervalDays: number
    repetitions: number
    easeFactor: number
    isDue: boolean
  }
  addedAt: string
}
```

## 6. Phiên học, bài tập & lộ trình

| Method | Endpoint | Ghi chú |
|---|---|---|
| POST | `/api/study/sessions` | `{ mode: 'review' \| 'learn', limit, exerciseTypeCode? }` |
| GET | `/api/study/sessions/{id}/next?type=` | Thẻ kế tiếp hoặc `null` khi hết |
| POST | `/api/study/sessions/{id}/answers` | `{ userWordId, exerciseTypeCode, quality, responseMs }` |
| POST | `/api/study/sessions/{id}/finish` | Tổng kết phiên |
| GET | `/api/study/sessions?limit=` | Lịch sử phiên |
| GET | `/api/plans` | Danh sách lộ trình |
| POST | `/api/plans/generate` | `{ days, minutesPerDay, focusSkill? }` |
| DELETE | `/api/plans/{id}` | `204` |
| POST | `/api/plans/{id}/tasks/{taskId}/complete` | Đánh dấu xong |
| POST | `/api/plans/{id}/tasks` | `{ title, skillCode?, dayIndex? }` |

`exerciseTypeCode`: `flashcard`, `multiple_choice`, `fill_blank`, `dictation`.
`quality` theo SM-2: `1` Quên, `3` Khó, `4` Tốt, `5` Dễ.

```ts
type StudyCard = {
  userWordId: number
  exerciseTypeCode: string
  exerciseTypeName: string
  lemma: string
  phonetic: string | null
  audioUrl: string | null
  partOfSpeech: string | null
  meaningVi: string
  definitionEn: string | null
  exampleEn: string | null
  contextSentence: string | null
  options: string[] | null
  correctAnswer: string | null
}

type StudyAnswerResult = {
  isCorrect: boolean
  correctAnswer: string | null
  explanation: string | null
  nextDueAt: string | null
}

type StudySummary = {
  answered: number
  correct: number
  accuracyPct: number
  minutes: number
  dueTomorrow: number
}
```

## 7. Phát âm

| Method | Endpoint | Ghi chú |
|---|---|---|
| POST | `/api/pronunciation/analyze` | `{ referenceText, transcript, wordId?, audioUrl? }` |
| GET | `/api/pronunciation/summary` | Tổng hợp luyện nói |

`PronunciationAttempt` gồm `overallScore`, `phonemes[]` (`phoneme`, `score`, `feedback`), `words[]` (`word`, `spoken`, `correct`) và `tips[]`.

## 8. Trò chuyện

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/chat/scenarios` | Danh sách tình huống |
| POST | `/api/chat/scenarios` | `{ name, systemPrompt }` – tạo tình huống tùy chỉnh |
| GET | `/api/chat/sessions` | Danh sách cuộc trò chuyện |
| POST | `/api/chat/sessions` | `{ scenarioId?, title? }` |
| GET | `/api/chat/sessions/{id}` | Chi tiết + tin nhắn |
| DELETE | `/api/chat/sessions/{id}` | `204` |
| POST | `/api/chat/sessions/{id}/messages` | `{ content }` |

```ts
type SendMessageResult = {
  userMessage: ChatMessage
  assistantMessage: ChatMessage
  corrections: { original: string; correction: string; explanation: string }[]
  suggestedWords: string[]
  aiUsed: boolean
}
```

Khi backend chưa cấu hình nhà cung cấp AI, `aiUsed = false` và tin nhắn trợ lý có thể mang tính mẫu; giao diện hiển thị ghi chú “AI đang ở chế độ ngoại tuyến”.

## 9. Bài đọc

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/reading/passages?levelId=` | Danh sách bài đọc |
| GET | `/api/reading/passages/{id}` | Chi tiết |
| POST | `/api/reading/passages` | `{ title, content, levelId?, topic? }` |
| GET | `/api/reading/passages/{id}/lens` | Tách từ, đánh dấu từ chưa biết, gợi ý nghĩa |
| PUT | `/api/reading/passages/{id}/progress` | `{ progressPct }` – 0…100 |

## 10. Thống kê

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/stats/overview` | Tổng quan |
| GET | `/api/stats/daily?from=&to=` | Chuỗi ngày |
| GET | `/api/stats/heatmap?days=` | Bản đồ nhiệt |
| GET | `/api/stats/skills` | Điểm 5 kỹ năng |

```ts
type StatsOverview = {
  totalWords: number
  masteredWords: number
  learningWords: number
  dueCount: number
  streakDays: number
  totalStudyMinutes: number
  totalAnswers: number
  accuracyPct: number
  today: Dashboard['today']
  last14Days: DailyStat[]
  skills: SkillScore[]
}

type Heatmap = {
  days: number
  maxAnswers: number
  data: { date: string; answers: number; minutes: number; level: number }[]
}
```

## 11. Tham chiếu

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/reference/levels` | A1–C2 |
| GET | `/api/reference/skills` | Danh sách kỹ năng |

## 12. Quy ước triển khai

- UI logic (state, filter, hiển thị, điều hướng) nằm ở frontend.
- Logic liên bảng, phân quyền, giao dịch và tính SRS nằm ở API.
- Mọi thời điểm gửi/nhận là ISO 8601 UTC; frontend hiển thị theo múi giờ người dùng.
- Không gửi mật khẩu/refresh token ra ngoài API; không lưu mật khẩu trong frontend.
- Database mặc định trắng: không seed từ vựng, bài học hay tài khoản demo.
