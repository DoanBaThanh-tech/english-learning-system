/* Câu trả lời onboarding và chương trình gợi ý theo trình độ + mục tiêu.
   Mã trùng với backend OnboardingCodes. */

export type PurposeCode =
  | 'communication'
  | 'study_abroad'
  | 'work'
  | 'ielts'
  | 'toeic'
  | 'travel'
  | 'media'
  | 'exam'
  | 'other'

export type SourceCode =
  | 'tiktok'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'google'
  | 'friend'
  | 'school'
  | 'other'

export type OnboardingAnswers = {
  source: SourceCode | null
  levelId: number | null
  purpose: PurposeCode | null
}

export const SOURCE_OPTIONS: {
  code: SourceCode
  label: string
  hint: string
  mark: string
}[] = [
  { code: 'tiktok', label: 'TikTok', hint: 'Video ngắn, mẹo học', mark: 'T' },
  { code: 'facebook', label: 'Facebook', hint: 'Nhóm và bài chia sẻ', mark: 'f' },
  { code: 'instagram', label: 'Instagram', hint: 'Reels, story học tập', mark: 'IG' },
  { code: 'youtube', label: 'YouTube', hint: 'Kênh dạy tiếng Anh', mark: 'YT' },
  { code: 'google', label: 'Tìm kiếm Google', hint: 'Tự tìm trang web', mark: 'G' },
  { code: 'friend', label: 'Bạn bè giới thiệu', hint: 'Người quen rủ học', mark: 'B' },
  { code: 'school', label: 'Trường học / giáo viên', hint: 'Lớp học, câu lạc bộ', mark: 'S' },
  { code: 'other', label: 'Kênh khác', hint: 'Diễn đàn, bài báo...', mark: '+' },
]

export const LEVEL_CHOICES = [
  {
    id: 1,
    code: 'A1',
    label: 'Mới bắt đầu',
    band: 'Nền tảng',
    description: 'Biết vài từ quen thuộc, cần mẫu câu đơn giản để bắt đầu.',
  },
  {
    id: 2,
    code: 'A2',
    label: 'Cơ bản',
    band: 'Nền tảng',
    description: 'Hiểu câu ngắn trong đời sống, muốn nói và nghe tự tin hơn.',
  },
  {
    id: 3,
    code: 'B1',
    label: 'Trung cấp',
    band: 'Bứt phá',
    description: 'Xử lý được tình huống quen thuộc, cần mở rộng vốn từ và phản xạ.',
  },
  {
    id: 4,
    code: 'B2',
    label: 'Trung cao',
    band: 'Bứt phá',
    description: 'Trao đổi khá trôi chảy, muốn dùng tiếng Anh cho học tập và công việc.',
  },
  {
    id: 5,
    code: 'C1',
    label: 'Cao cấp',
    band: 'Nâng cao',
    description: 'Diễn đạt linh hoạt, cần tinh chỉnh sắc thái và độ chính xác.',
  },
  {
    id: 6,
    code: 'C2',
    label: 'Thành thạo',
    band: 'Nâng cao',
    description: 'Gần như bản ngữ, muốn giữ phong độ và mài sắc kỹ năng khó.',
  },
] as const

export const PURPOSE_OPTIONS: {
  code: PurposeCode
  label: string
  hint: string
  goal: number
  focusSkill: string
  program: string
  tagline: string
  steps: string[]
}[] = [
  {
    code: 'communication',
    label: 'Giao tiếp hằng ngày',
    hint: 'Nói chuyện tự nhiên trong đời sống',
    goal: 10,
    focusSkill: 'speaking',
    program: 'Giao tiếp tự tin mỗi ngày',
    tagline: 'Bắt đầu từ những mẫu câu bạn dùng mỗi ngày, rồi luyện phản xạ nói.',
    steps: ['Mẫu câu theo tình huống', 'Luyện nói phản xạ', 'Ôn từ trong ngữ cảnh'],
  },
  {
    code: 'study_abroad',
    label: 'Du học',
    hint: 'Học thuật, đọc – nghe – ghi chú',
    goal: 30,
    focusSkill: 'reading',
    program: 'Hành trang du học',
    tagline: 'Xây vốn từ học thuật và kỹ năng đọc – nghe để tự tin trong lớp.',
    steps: ['Đọc hiểu học thuật', 'Nghe và ghi ý chính', 'Từ vựng theo chủ đề du học'],
  },
  {
    code: 'work',
    label: 'Công việc',
    hint: 'Email, họp, thuyết trình',
    goal: 20,
    focusSkill: 'speaking',
    program: 'Tiếng Anh cho công việc',
    tagline: 'Tập trung vào email, cuộc họp và cách diễn đạt chuyên nghiệp.',
    steps: ['Email và cuộc họp', 'Từ vựng chuyên ngành', 'Sửa lỗi diễn đạt'],
  },
  {
    code: 'ielts',
    label: 'Thi IELTS',
    hint: 'Listening, Reading, Writing, Speaking',
    goal: 30,
    focusSkill: 'reading',
    program: 'IELTS Foundation',
    tagline: 'Luyện đúng dạng đề, bổ sung từ vựng học thuật và ngữ pháp nền.',
    steps: ['Reading & Listening theo dạng đề', 'Từ vựng học thuật', 'Ngữ pháp và sửa lỗi'],
  },
  {
    code: 'toeic',
    label: 'Thi TOEIC',
    hint: 'Listening – Reading cho môi trường làm việc',
    goal: 30,
    focusSkill: 'listening',
    program: 'TOEIC Listening & Reading',
    tagline: 'Luyện phản xạ nghe và đọc hiểu theo chủ đề công sở.',
    steps: ['Nghe hiểu hội thoại', 'Đọc hiểu thông báo', 'Từ vựng công sở'],
  },
  {
    code: 'travel',
    label: 'Du lịch',
    hint: 'Sân bay, khách sạn, hỏi đường',
    goal: 10,
    focusSkill: 'listening',
    program: 'Tiếng Anh du lịch',
    tagline: 'Những tình huống thực tế để bạn tự tin đi lại và giao tiếp khi đi xa.',
    steps: ['Tình huống sân bay – khách sạn', 'Nghe và hỏi đường', 'Mẫu câu ứng biến'],
  },
  {
    code: 'media',
    label: 'Phim, nhạc, nội dung',
    hint: 'Hiểu nội dung yêu thích bằng tiếng Anh',
    goal: 10,
    focusSkill: 'listening',
    program: 'Hiểu nội dung bạn yêu thích',
    tagline: 'Học qua phim, nhạc và video ngắn để việc học nhẹ nhàng hơn.',
    steps: ['Nghe hiểu theo ngữ cảnh', 'Từ lóng và cụm tự nhiên', 'Nói lại nội dung'],
  },
  {
    code: 'exam',
    label: 'Thi tốt nghiệp / đại học',
    hint: 'Ngữ pháp, đọc hiểu, từ vựng nền',
    goal: 20,
    focusSkill: 'grammar',
    program: 'Ôn thi vững nền',
    tagline: 'Hệ thống hóa ngữ pháp và đọc hiểu, ưu tiên phần dễ mất điểm.',
    steps: ['Ngữ pháp trọng tâm', 'Đọc hiểu và từ vựng', 'Chữa lỗi thường gặp'],
  },
  {
    code: 'other',
    label: 'Mục tiêu khác',
    hint: 'Tự chọn nhịp học của riêng bạn',
    goal: 20,
    focusSkill: '',
    program: 'Lộ trình tiếng Anh của bạn',
    tagline: 'Cân bằng năm kỹ năng và điều chỉnh nhịp học theo thời gian rảnh.',
    steps: ['Từ vựng theo ngữ cảnh', 'Nghe – nói đều đặn', 'Theo dõi tiến bộ'],
  },
]

export function sourceLabel(code: string | null | undefined): string {
  return SOURCE_OPTIONS.find((item) => item.code === code)?.label ?? 'Kênh khác'
}

export function purposeInfo(code: string | null | undefined) {
  return PURPOSE_OPTIONS.find((item) => item.code === code) ?? null
}

export function levelInfo(levelId: number | null, levelCode?: string | null) {
  return (
    LEVEL_CHOICES.find((item) =>
      levelCode ? item.code === levelCode : item.id === levelId,
    ) ?? null
  )
}

function levelBase(levelCode: string | null | undefined): number {
  if (levelCode === 'C1' || levelCode === 'C2') return 30
  if (levelCode === 'B1' || levelCode === 'B2') return 20
  return 10
}

export function suggestedGoal(
  levelCode: string | null | undefined,
  purpose: string | null | undefined,
): number {
  const info = purposeInfo(purpose)
  const base = info?.goal ?? 20
  return Math.min(
    30,
    Math.max(10, Math.round((base + levelBase(levelCode)) / 2 / 10) * 10),
  )
}

export function focusSkillFor(purpose: string | null | undefined): string {
  return purposeInfo(purpose)?.focusSkill ?? ''
}

export type PersonalProgram = {
  title: string
  tagline: string
  levelBand: string
  levelLabel: string
  purposeLabel: string
  goal: number
  minutes: number
  days: number
  steps: string[]
  focusSkill: string
  hasPurpose: boolean
}

export function buildProgram(
  levelCode: string | null | undefined,
  levelName: string | null | undefined,
  purpose: string | null | undefined,
): PersonalProgram {
  const info = purposeInfo(purpose)
  const level = levelInfo(null, levelCode)
  const minutes =
    levelCode === 'C1' || levelCode === 'C2'
      ? 30
      : levelCode === 'B1' || levelCode === 'B2'
        ? 20
        : 15
  const days =
    levelCode === 'C1' || levelCode === 'C2'
      ? 30
      : levelCode === 'B1' || levelCode === 'B2'
        ? 21
        : 14

  return {
    title: info?.program ?? 'Lộ trình tiếng Anh của bạn',
    tagline:
      info?.tagline ??
      'Chọn mục tiêu học để SkyWorld tập trung đúng phần kiến thức bạn cần dùng.',
    levelBand: level?.band ?? 'Nền tảng',
    levelLabel: levelCode
      ? `${levelCode}${levelName ? ` · ${levelName}` : ''}`
      : 'Chưa chọn trình độ',
    purposeLabel: info?.label ?? 'Chưa chọn mục tiêu',
    goal: suggestedGoal(levelCode, purpose),
    minutes,
    days,
    steps: info?.steps ?? [
      'Chọn mục tiêu học',
      'Nhận lộ trình gợi ý',
      'Bắt đầu từng bước nhỏ',
    ],
    focusSkill: info?.focusSkill ?? '',
    hasPurpose: Boolean(info),
  }
}
