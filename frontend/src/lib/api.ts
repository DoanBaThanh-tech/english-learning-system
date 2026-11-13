// Prompt SkyWorld dùng VITE_API_URL; giữ VITE_API_BASE_URL để tương thích cấu hình cũ.
const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5041'
).replace(/\/+$/, '')

export type UserProfile = {
  id: number
  email: string
  displayName: string
  avatarUrl: string | null
  currentLevelId: number | null
  levelCode: string | null
  levelName: string | null
  dailyWordGoal: number
  timeZoneId: string
  createdAt: string
  learningPurpose: string | null
  referralSource: string | null
}

export type TokenResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAtUtc: string
  user: UserProfile
}

export type DailyStat = {
  date: string
  wordsLearned: number
  wordsReviewed: number
  minutesStudied: number
  goalMet: boolean
}

export type SkillScore = {
  skillId: number
  code: string
  nameVi: string
  score: number
  measuredAt: string
}

export type ActivePlanTask = {
  planId: number
  taskId: number
  title: string
  dueDate: string
  skillCode: string
  skillNameVi: string
}

export type Dashboard = {
  user: UserProfile
  streakDays: number
  today: {
    wordsLearned: number
    wordsReviewed: number
    minutesStudied: number
    dailyGoal: number
    goalMet: boolean
  }
  dueCount: number
  totalWords: number
  masteredWords: number
  weekly: DailyStat[]
  skills: SkillScore[]
  nextTask: ActivePlanTask | null
}

export type RegisterInput = {
  displayName: string
  email: string
  password: string
  currentLevelId: number | null
  dailyWordGoal: number
  learningPurpose?: string | null
  referralSource?: string | null
}

export type SenseAlternative = {
  senseId: number
  partOfSpeech: string
  definitionEn: string
  meaningVi: string
  confidence: number
}

export type ContextLookupResult = {
  word: string
  lemma: string
  wordId: number | null
  chosenSenseId: number | null
  meaningVi: string
  definitionEn: string
  partOfSpeech: string
  phonetic: string | null
  confidence: number
  source: string
  fromCache: boolean
  sentenceTranslation: string | null
  alternatives: SenseAlternative[]
}

export type ContextLookupInput = {
  word: string
  sentence: string
  levelId?: number | null
  translateSentence?: boolean
}

export type SavedUserWord = {
  id: number
  senseId: number
  wordId: number
  lemma: string
  meaningVi: string
  contextSentence: string | null
  status: string
  addedAt: string
}

export type PagedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type SrsInfo = {
  dueAt: string
  intervalDays: number
  repetitions: number
  easeFactor: number
  isDue: boolean
}

export type WordFolder = {
  id: number
  name: string
  wordCount: number
}

export type WordTag = {
  id: number
  name: string
  wordCount: number
}

export type UserWord = {
  id: number
  senseId: number
  wordId: number
  lemma: string
  phonetic: string | null
  audioUrl: string | null
  meaningVi: string
  definitionEn: string
  partOfSpeech: string
  levelCode: string | null
  contextSentence: string | null
  note: string | null
  status: string
  folderId: number | null
  folderName: string | null
  tags: WordTag[]
  srs: SrsInfo | null
  addedAt: string
}

export type VocabularyStats = {
  total: number
  new: number
  learning: number
  mastered: number
  due: number
  folders: number
  tags: number
}

export type UpdateUserWordInput = {
  folderId?: number | null
  note?: string | null
  status?: string | null
  tagIds?: number[]
}

export type StatsOverview = {
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

export type HeatmapDay = {
  date: string
  answers: number
  minutes: number
  level: number
}

export type Heatmap = {
  days: number
  maxAnswers: number
  data: HeatmapDay[]
}

export type SkillRadar = {
  skills: SkillScore[]
  measuredAt: string
  strongestSkill: string
  weakestSkill: string
}

export type PlanTask = {
  id: number
  skillId: number
  skillCode: string
  skillNameVi: string
  title: string
  dueDate: string
  isDone: boolean
  lessonId: number | null
  passageId: number | null
  scenarioId: number | null
}

export type LearningPlan = {
  id: number
  startDate: string
  endDate: string
  status: string
  doneTasks: number
  totalTasks: number
  tasks: PlanTask[]
}

export type GeneratePlanInput = {
  days: number
  minutesPerDay: number
  focusSkill?: string | null
}

export type StudySession = {
  id: number
  mode: string
  startedAt: string
  endedAt: string | null
  answered: number
  correct: number
}

export type StudyCard = {
  userWordId: number
  senseId: number
  wordId: number
  lemma: string
  phonetic: string | null
  audioUrl: string | null
  definitionEn: string
  meaningVi: string
  partOfSpeech: string
  levelCode: string | null
  contextSentence: string | null
  exerciseTypeCode: string
  exerciseTypeName: string
  options: string[]
  srs: SrsInfo | null
  status: string
}

export type StudyAnswerResult = {
  isCorrect: boolean
  correctAnswer: string
  quality: number
  dueAt: string
  intervalDays: number
  repetitions: number
  message: string
}

export type StudySummary = {
  id: number
  mode: string
  startedAt: string
  endedAt: string | null
  minutes: number
  answered: number
  correct: number
  accuracyPct: number
  learnedUserWordIds: number[]
}

export type LevelRef = {
  id: number
  code: string
  name: string
}

export type SkillRef = {
  id: number
  code: string
  nameVi: string
}

type ProblemPayload = {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function messageFrom(payload: ProblemPayload | null, status: number): string {
  if (payload?.errors) {
    const first = Object.values(payload.errors).flat().find(Boolean)
    if (first) return first
  }
  if (payload?.detail && payload.detail.trim().length > 0) return payload.detail
  if (status === 401) return 'Email hoặc mật khẩu chưa đúng. Bạn thử lại nhé.'
  if (status === 409) return 'Email này đã được sử dụng.'
  if (status >= 500) return 'Máy chủ đang bận. Vui lòng thử lại sau ít phút.'
  return 'Yêu cầu chưa thể xử lý. Vui lòng thử lại.'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(
      'Không kết nối được máy chủ SkyWorld. Kiểm tra API đang chạy ở cổng 5041 nhé.',
      0,
    )
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new ApiError(messageFrom(payload as ProblemPayload | null, response.status), response.status)
  }

  return payload as T
}

export function loginRequest(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function registerRequest(input: RegisterInput): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      currentLevelId: input.currentLevelId,
      dailyWordGoal: input.dailyWordGoal,
      learningPurpose: input.learningPurpose ?? null,
      referralSource: input.referralSource ?? null,
    }),
  })
}

export function refreshRequest(refreshToken: string): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export function logoutRequest(accessToken: string, refreshToken: string): Promise<void> {
  return request<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function dashboardRequest(accessToken: string): Promise<Dashboard> {
  return request<Dashboard>('/api/users/me/dashboard', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function contextLookupRequest(
  accessToken: string,
  input: ContextLookupInput,
): Promise<ContextLookupResult> {
  return request<ContextLookupResult>('/api/dictionary/context-lookup', {
    method: 'POST',
    body: JSON.stringify({
      word: input.word,
      sentence: input.sentence,
      levelId: input.levelId ?? null,
      translateSentence: input.translateSentence ?? true,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function addUserWordRequest(
  accessToken: string,
  input: { senseId: number; contextSentence?: string | null },
): Promise<SavedUserWord> {
  return request<SavedUserWord>('/api/vocabulary/words', {
    method: 'POST',
    body: JSON.stringify({
      senseId: input.senseId,
      contextSentence: input.contextSentence ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function addWordByLemmaRequest(
  accessToken: string,
  input: {
    lemma: string
    contextSentence?: string | null
    folderId?: number | null
    note?: string | null
    tagIds?: number[]
  },
): Promise<SavedUserWord> {
  return request<SavedUserWord>('/api/vocabulary/words/by-lemma', {
    method: 'POST',
    body: JSON.stringify({
      lemma: input.lemma,
      contextSentence: input.contextSentence ?? null,
      folderId: input.folderId ?? null,
      note: input.note ?? null,
      tagIds: input.tagIds ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

function toQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

/* ---------- Hồ sơ ---------- */

export function profileRequest(accessToken: string): Promise<UserProfile> {
  return request<UserProfile>('/api/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function updateProfileRequest(
  accessToken: string,
  input: {
    displayName: string
    avatarUrl: string | null
    currentLevelId: number | null
    dailyWordGoal: number
    timeZoneId: string
    learningPurpose?: string | null
  },
): Promise<UserProfile> {
  return request<UserProfile>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function changePasswordRequest(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return request<void>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Thống kê ---------- */

export function statsOverviewRequest(accessToken: string): Promise<StatsOverview> {
  return request<StatsOverview>('/api/stats/overview', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function statsDailyRequest(
  accessToken: string,
  from: string,
  to: string,
): Promise<DailyStat[]> {
  return request<DailyStat[]>(`/api/stats/daily${toQuery({ from, to })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function statsHeatmapRequest(accessToken: string, days = 90): Promise<Heatmap> {
  return request<Heatmap>(`/api/stats/heatmap${toQuery({ days })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function statsSkillsRequest(accessToken: string): Promise<SkillRadar> {
  return request<SkillRadar>('/api/stats/skills', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Sổ từ ---------- */

export function vocabularyStatsRequest(accessToken: string): Promise<VocabularyStats> {
  return request<VocabularyStats>('/api/vocabulary/stats', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function userWordsRequest(
  accessToken: string,
  params: {
    folderId?: number | null
    tagId?: number | null
    status?: string | null
    search?: string | null
    page?: number
    pageSize?: number
  } = {},
): Promise<PagedResult<UserWord>> {
  const query = toQuery({
    folderId: params.folderId,
    tagId: params.tagId,
    status: params.status,
    search: params.search,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  })
  return request<PagedResult<UserWord>>(`/api/vocabulary/words${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function dueUserWordsRequest(accessToken: string, limit = 20): Promise<UserWord[]> {
  return request<UserWord[]>(`/api/vocabulary/words/due${toQuery({ limit })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function updateUserWordRequest(
  accessToken: string,
  id: number,
  input: UpdateUserWordInput,
): Promise<UserWord> {
  return request<UserWord>(`/api/vocabulary/words/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      folderId: input.folderId ?? null,
      note: input.note ?? null,
      status: input.status ?? null,
      tagIds: input.tagIds ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function deleteUserWordRequest(accessToken: string, id: number): Promise<void> {
  return request<void>(`/api/vocabulary/words/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function foldersRequest(accessToken: string): Promise<WordFolder[]> {
  return request<WordFolder[]>('/api/vocabulary/folders', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createFolderRequest(accessToken: string, name: string): Promise<WordFolder> {
  return request<WordFolder>('/api/vocabulary/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function deleteFolderRequest(accessToken: string, id: number): Promise<void> {
  return request<void>(`/api/vocabulary/folders/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function tagsRequest(accessToken: string): Promise<WordTag[]> {
  return request<WordTag[]>('/api/vocabulary/tags', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createTagRequest(accessToken: string, name: string): Promise<WordTag> {
  return request<WordTag>('/api/vocabulary/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function deleteTagRequest(accessToken: string, id: number): Promise<void> {
  return request<void>(`/api/vocabulary/tags/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Phiên học / SRS ---------- */

export function startStudySessionRequest(
  accessToken: string,
  mode: 'learn' | 'review',
  limit = 20,
  exerciseTypeCode = 'flashcard',
): Promise<StudySession> {
  return request<StudySession>('/api/study/sessions', {
    method: 'POST',
    body: JSON.stringify({ mode, limit, exerciseTypeCode }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function nextStudyCardRequest(
  accessToken: string,
  sessionId: number,
  type = 'flashcard',
): Promise<StudyCard | null> {
  return request<StudyCard | null>(`/api/study/sessions/${sessionId}/next${toQuery({ type })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function submitStudyAnswerRequest(
  accessToken: string,
  sessionId: number,
  input: {
    userWordId: number
    exerciseTypeCode: string
    userAnswer?: string | null
    quality?: number | null
    responseMs?: number | null
  },
): Promise<StudyAnswerResult> {
  return request<StudyAnswerResult>(`/api/study/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({
      userWordId: input.userWordId,
      exerciseTypeCode: input.exerciseTypeCode,
      userAnswer: input.userAnswer ?? null,
      quality: input.quality ?? null,
      responseMs: input.responseMs ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function finishStudySessionRequest(
  accessToken: string,
  sessionId: number,
): Promise<StudySummary> {
  return request<StudySummary>(`/api/study/sessions/${sessionId}/finish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function studySessionsRequest(accessToken: string, limit = 8): Promise<StudySession[]> {
  return request<StudySession[]>(`/api/study/sessions${toQuery({ limit })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Lộ trình ---------- */

export function plansRequest(accessToken: string): Promise<LearningPlan[]> {
  return request<LearningPlan[]>('/api/plans', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function generatePlanRequest(
  accessToken: string,
  input: GeneratePlanInput,
): Promise<LearningPlan> {
  return request<LearningPlan>('/api/plans/generate', {
    method: 'POST',
    body: JSON.stringify({
      days: input.days,
      minutesPerDay: input.minutesPerDay,
      focusSkill: input.focusSkill ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function deletePlanRequest(accessToken: string, planId: number): Promise<void> {
  return request<void>(`/api/plans/${planId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function completePlanTaskRequest(
  accessToken: string,
  planId: number,
  taskId: number,
  isDone: boolean,
): Promise<PlanTask> {
  return request<PlanTask>(`/api/plans/${planId}/tasks/${taskId}/complete`, {
    method: 'PUT',
    body: JSON.stringify({ isDone }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function addPlanTaskRequest(
  accessToken: string,
  planId: number,
  input: { skillId: number; title: string; dueDate: string },
): Promise<PlanTask> {
  return request<PlanTask>(`/api/plans/${planId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Tham chiếu ---------- */

export function levelsRequest(accessToken: string): Promise<LevelRef[]> {
  return request<LevelRef[]>('/api/reference/levels', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function skillsRequest(accessToken: string): Promise<SkillRef[]> {
  return request<SkillRef[]>('/api/reference/skills', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Từ điển ---------- */

export type DictExample = {
  sentenceEn: string
  sentenceVi: string | null
}

export type DictSense = {
  id: number
  partOfSpeech: string
  partOfSpeechVi: string
  levelCode: string | null
  definitionEn: string
  meaningVi: string
  isVerified: boolean
  examples: DictExample[]
}

export type DictWord = {
  id: number
  lemma: string
  phoneticUs: string | null
  phoneticUk: string | null
  audioUs: string | null
  audioUk: string | null
  senses: DictSense[]
  saved: boolean
  userWordId: number | null
}

export type DictSearchItem = {
  id: number
  lemma: string
  phonetic: string | null
  meaning: string
  partOfSpeech: string
  levelCode: string | null
}

export type WordOfTheDay = {
  date: string
  word: DictWord
  contextSentence: string
  contextMeaning: string
}

export function searchWordsRequest(
  accessToken: string,
  query: string,
  limit = 12,
): Promise<DictSearchItem[]> {
  return request<DictSearchItem[]>(
    `/api/dictionary/search${toQuery({ q: query, limit })}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
}

export function dictWordRequest(accessToken: string, lemma: string): Promise<DictWord> {
  return request<DictWord>(`/api/dictionary/words/${encodeURIComponent(lemma)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function wordOfTheDayRequest(accessToken: string): Promise<WordOfTheDay> {
  return request<WordOfTheDay>('/api/dictionary/word-of-the-day', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Trò chuyện ---------- */

export type ChatScenario = {
  id: number
  levelId: number | null
  levelCode: string | null
  name: string
}

export type ChatSession = {
  id: number
  scenarioId: number | null
  scenarioName: string | null
  title: string | null
  createdAt: string
  messageCount: number
  lastMessage: string | null
  lastMessageAt: string | null
}

export type ChatMessage = {
  id: number
  role: string
  content: string
  correctedContent: string | null
  createdAt: string
}

export type ChatSessionDetail = {
  id: number
  scenarioId: number | null
  scenarioName: string | null
  title: string | null
  createdAt: string
  messages: ChatMessage[]
}

export type ChatCorrection = {
  original: string
  correction: string
  explanation: string
}

export type SendMessageResult = {
  userMessage: ChatMessage
  assistantMessage: ChatMessage
  corrections: ChatCorrection[]
  suggestedWords: string[]
  aiUsed: boolean
}

export function chatScenariosRequest(accessToken: string): Promise<ChatScenario[]> {
  return request<ChatScenario[]>('/api/chat/scenarios', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function chatSessionsRequest(accessToken: string): Promise<ChatSession[]> {
  return request<ChatSession[]>('/api/chat/sessions', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createChatSessionRequest(
  accessToken: string,
  input: { scenarioId?: number | null; title?: string | null },
): Promise<ChatSession> {
  return request<ChatSession>('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({
      scenarioId: input.scenarioId ?? null,
      title: input.title ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function chatSessionRequest(accessToken: string, id: number): Promise<ChatSessionDetail> {
  return request<ChatSessionDetail>(`/api/chat/sessions/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function deleteChatSessionRequest(accessToken: string, id: number): Promise<void> {
  return request<void>(`/api/chat/sessions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function sendChatMessageRequest(
  accessToken: string,
  sessionId: number,
  content: string,
): Promise<SendMessageResult> {
  return request<SendMessageResult>(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Phát âm ---------- */

export type PhonemeScore = {
  phoneme: string
  score: number
  feedback: string | null
}

export type SpeechWord = {
  word: string
  spoken: string
  correct: boolean
}

export type PronunciationAttempt = {
  id: number
  referenceText: string
  wordId: number | null
  lemma: string | null
  overallScore: number
  audioUrl: string | null
  createdAt: string
  phonemes: PhonemeScore[]
  words: SpeechWord[]
  tips: string[]
}

export type PronunciationSummary = {
  attempts: number
  averageScore: number
  bestScore: number
  lastPracticedAt: string | null
  focusTips: string[]
}

export function analyzePronunciationRequest(
  accessToken: string,
  input: {
    referenceText: string
    transcript: string
    wordId?: number | null
    audioUrl?: string | null
  },
): Promise<PronunciationAttempt> {
  return request<PronunciationAttempt>('/api/pronunciation/analyze', {
    method: 'POST',
    body: JSON.stringify({
      wordId: input.wordId ?? null,
      referenceText: input.referenceText,
      transcript: input.transcript,
      audioUrl: input.audioUrl ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function pronunciationSummaryRequest(
  accessToken: string,
): Promise<PronunciationSummary> {
  return request<PronunciationSummary>('/api/pronunciation/summary', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/* ---------- Bài đọc ---------- */

export type PassageSummary = {
  id: number
  title: string
  topic: string | null
  levelId: number
  levelCode: string
  levelName: string
  wordCount: number
  progressPct: number
  lastReadAt: string | null
  sourceId: number | null
}

export type PassageDetail = PassageSummary & {
  body: string
}

export type LensSegment = {
  text: string
  isWord: boolean
  wordId: number | null
  userWordId: number | null
  meaningVi: string | null
}

export type PassageLens = {
  passageId: number
  title: string
  segments: LensSegment[]
  savedWordCount: number
}

export function passagesRequest(
  accessToken: string,
  levelId?: number | null,
): Promise<PassageSummary[]> {
  return request<PassageSummary[]>(
    `/api/reading/passages${toQuery({ levelId })}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
}

export function passageRequest(accessToken: string, id: number): Promise<PassageDetail> {
  return request<PassageDetail>(`/api/reading/passages/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createPassageRequest(
  accessToken: string,
  input: { title: string; body: string; levelId: number; topic?: string | null },
): Promise<PassageDetail> {
  return request<PassageDetail>('/api/reading/passages', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      body: input.body,
      levelId: input.levelId,
      topic: input.topic ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function updatePassageProgressRequest(
  accessToken: string,
  id: number,
  progressPct: number,
): Promise<void> {
  return request<void>(`/api/reading/passages/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progressPct }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function passageLensRequest(
  accessToken: string,
  id: number,
): Promise<PassageLens> {
  return request<PassageLens>(`/api/reading/passages/${id}/lens`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createChatScenarioRequest(
  accessToken: string,
  input: { name: string; systemPrompt: string; levelId?: number | null },
): Promise<ChatScenario> {
  return request<ChatScenario>('/api/chat/scenarios', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      systemPrompt: input.systemPrompt,
      levelId: input.levelId ?? null,
    }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
