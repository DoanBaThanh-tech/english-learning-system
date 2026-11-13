import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AppScaffold } from '../components/AppScaffold'
import {
  BookmarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  EditIcon,
  FlameIcon,
  FolderIcon,
  LayersIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
  SpeakerIcon,
  TagIcon,
  TargetIcon,
  TrashIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  ApiError,
  addWordByLemmaRequest,
  createFolderRequest,
  createTagRequest,
  deleteFolderRequest,
  deleteTagRequest,
  deleteUserWordRequest,
  dueUserWordsRequest,
  finishStudySessionRequest,
  foldersRequest,
  nextStudyCardRequest,
  startStudySessionRequest,
  submitStudyAnswerRequest,
  tagsRequest,
  updateUserWordRequest,
  userWordsRequest,
  vocabularyStatsRequest,
  type PagedResult,
  type StudyCard,
  type StudySummary,
  type UserWord,
  type VocabularyStats,
  type WordFolder,
  type WordTag,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/words.css'

const PAGE_SIZE = 10

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'learning', label: 'Đang học' },
  { value: 'mastered', label: 'Đã thuộc' },
] as const

type StatusFilter = (typeof STATUS_TABS)[number]['value']

const STATUS_LABEL: Record<string, string> = {
  new: 'Mới',
  learning: 'Đang học',
  mastered: 'Đã thuộc',
}

type Notice = { tone: 'ok' | 'error'; text: string }
type PendingDelete = { kind: 'folder' | 'tag'; id: number } | null

type WordEditor = {
  folderId: number | null
  status: string
  note: string
  tagIds: number[]
}

type AddForm = {
  lemma: string
  context: string
  folderId: number | null
  note: string
  tagIds: number[]
}

const EMPTY_ADD: AddForm = {
  lemma: '',
  context: '',
  folderId: null,
  note: '',
  tagIds: [],
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.92
  window.speechSynthesis.speak(utterance)
}

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id]
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function dueLabel(srs: UserWord['srs']): string {
  if (!srs) return 'Chưa lên lịch'
  const due = new Date(srs.dueAt)
  if (Number.isNaN(due.getTime())) return 'Chưa lên lịch'
  const diff = Math.round((startOfDay(due) - startOfDay(new Date())) / 86_400_000)
  if (diff < 0) return `Quá hạn ${Math.abs(diff)} ngày`
  if (diff === 0) return 'Đến hạn hôm nay'
  if (diff === 1) return 'Đến hạn ngày mai'
  return `Ôn ${due.getDate()}/${due.getMonth() + 1}`
}

function shortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

function HighlightedSentence({
  sentence,
  lemma,
}: {
  sentence: string | null
  lemma: string
}) {
  if (!sentence) return null
  const index = sentence.toLowerCase().indexOf(lemma.toLowerCase())
  if (index < 0) return <blockquote className="word-quote">“{sentence}”</blockquote>
  return (
    <blockquote className="word-quote">
      “{sentence.slice(0, index)}
      <mark>{sentence.slice(index, index + lemma.length)}</mark>
      {sentence.slice(index + lemma.length)}”
    </blockquote>
  )
}

export function WordBookPage() {
  const { run } = useAuthedApi()

  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [folders, setFolders] = useState<WordFolder[]>([])
  const [tags, setTags] = useState<WordTag[]>([])
  const [dueWords, setDueWords] = useState<UserWord[]>([])

  const [words, setWords] = useState<UserWord[]>([])
  const [pageData, setPageData] = useState<PagedResult<UserWord> | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [folderId, setFolderId] = useState<number | null>(null)
  const [tagId, setTagId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(true)
  const [initError, setInitError] = useState('')
  const [listError, setListError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editor, setEditor] = useState<WordEditor | null>(null)
  const [editorError, setEditorError] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deletingWord, setDeletingWord] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<AddForm>(EMPTY_ADD)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [newFolder, setNewFolder] = useState('')
  const [newTag, setNewTag] = useState('')
  const [collectionBusy, setCollectionBusy] = useState(false)
  const [collectionError, setCollectionError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)

  const [reviewMode, setReviewMode] = useState<'learn' | 'review' | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [card, setCard] = useState<StudyCard | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [reviewStarting, setReviewStarting] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewAnswered, setReviewAnswered] = useState(0)
  const [reviewSummary, setReviewSummary] = useState<StudySummary | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const cardShownAt = useRef(0)
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {})

  /* ---------- Tải dữ liệu ---------- */

  const loadCollections = useCallback(async () => {
    try {
      const [nextStats, nextFolders, nextTags, nextDue] = await Promise.all([
        run((token) => vocabularyStatsRequest(token)),
        run((token) => foldersRequest(token)),
        run((token) => tagsRequest(token)),
        run((token) => dueUserWordsRequest(token, 50)),
      ])
      setStats(nextStats)
      setFolders(nextFolders)
      setTags(nextTags)
      setDueWords(nextDue)
      setInitError('')
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setInitError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa tải được sổ từ. Vui lòng thử lại.',
      )
    }
  }, [run])

  const loadWords = useCallback(
    async (targetPage: number) => {
      setListLoading(true)
      setListError('')
      try {
        const data = await run((token) =>
          userWordsRequest(token, {
            folderId,
            tagId,
            status: status === 'all' ? null : status,
            search: debouncedSearch.trim() || null,
            page: targetPage,
            pageSize: PAGE_SIZE,
          }),
        )
        setWords(data.items)
        setPageData(data)
        if (data.page !== targetPage) setPage(data.page)
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) return
        setListError(
          caught instanceof ApiError
            ? caught.message
            : 'Chưa tải được danh sách từ. Vui lòng thử lại.',
        )
      } finally {
        setListLoading(false)
      }
    },
    [run, folderId, tagId, status, debouncedSearch],
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    loadCollections().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [loadCollections])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 320)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void loadWords(page)
  }, [loadWords, page])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4800)
    return () => window.clearTimeout(timer)
  }, [notice])

  /* ---------- Từ trong sổ ---------- */

  const folderName = useMemo(() => {
    const map = new Map(folders.map((folder) => [folder.id, folder.name]))
    return (word: UserWord) => word.folderName ?? (word.folderId ? map.get(word.folderId) ?? '' : '')
  }, [folders])

  function openEditor(word: UserWord) {
    setAddOpen(false)
    setEditingId(word.id)
    setEditor({
      folderId: word.folderId,
      status: word.status,
      note: word.note ?? '',
      tagIds: word.tags.map((tag) => tag.id),
    })
    setEditorError('')
  }

  function closeEditor() {
    setEditingId(null)
    setEditor(null)
    setEditorError('')
  }

  async function saveEditor(word: UserWord) {
    if (!editor) return
    setSavingId(word.id)
    setEditorError('')
    try {
      const updated = await run((token) =>
        updateUserWordRequest(token, word.id, {
          folderId: editor.folderId,
          status: editor.status,
          note: editor.note.trim() || null,
          tagIds: editor.tagIds,
        }),
      )
      setWords((list) => list.map((item) => (item.id === updated.id ? updated : item)))
      setNotice({ tone: 'ok', text: `Đã cập nhật “${updated.lemma}”.` })
      closeEditor()
      await Promise.all([loadCollections(), loadWords(page)])
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setEditorError(
        caught instanceof ApiError ? caught.message : 'Chưa lưu được thay đổi.',
      )
    } finally {
      setSavingId(null)
    }
  }

  async function removeWord(word: UserWord) {
    setDeletingWord(true)
    try {
      await run((token) => deleteUserWordRequest(token, word.id))
      setNotice({ tone: 'ok', text: `Đã xóa “${word.lemma}” khỏi sổ từ.` })
      setDeletingId(null)
      if (editingId === word.id) closeEditor()
      const targetPage = words.length === 1 && page > 1 ? page - 1 : page
      await loadCollections()
      if (targetPage !== page) {
        setPage(targetPage)
      } else {
        await loadWords(targetPage)
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setNotice({
        tone: 'error',
        text: caught instanceof ApiError ? caught.message : 'Chưa xóa được từ này.',
      })
      setDeletingId(null)
    } finally {
      setDeletingWord(false)
    }
  }

  /* ---------- Thêm từ ---------- */

  function resetAdd() {
    setAddForm(EMPTY_ADD)
    setAddError('')
  }

  async function submitAdd(event: FormEvent) {
    event.preventDefault()
    const lemma = addForm.lemma.trim()
    if (!/^[a-zA-Z][a-zA-Z' -]{0,40}$/.test(lemma)) {
      setAddError('Nhập một từ tiếng Anh, chỉ gồm chữ cái, dấu nháy hoặc gạch nối.')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      const saved = await run((token) =>
        addWordByLemmaRequest(token, {
          lemma,
          contextSentence: addForm.context.trim() || null,
          folderId: addForm.folderId,
          note: addForm.note.trim() || null,
          tagIds: addForm.tagIds,
        }),
      )
      setAddOpen(false)
      resetAdd()
      setNotice({ tone: 'ok', text: `Đã lưu “${saved.lemma}” vào sổ từ.` })
      await loadCollections()
      if (page !== 1) setPage(1)
      else await loadWords(1)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setAddError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa thêm được từ này. Bạn thử một từ khác nhé.',
      )
    } finally {
      setAdding(false)
    }
  }

  /* ---------- Thư mục và thẻ ---------- */

  async function createFolder(event: FormEvent) {
    event.preventDefault()
    const name = newFolder.trim()
    if (!name) return
    if (name.length > 40) {
      setCollectionError('Tên thư mục tối đa 40 ký tự.')
      return
    }
    setCollectionBusy(true)
    setCollectionError('')
    try {
      await run((token) => createFolderRequest(token, name))
      setNewFolder('')
      await loadCollections()
      setNotice({ tone: 'ok', text: `Đã tạo thư mục “${name}”.` })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setCollectionError(
        caught instanceof ApiError ? caught.message : 'Chưa tạo được thư mục.',
      )
    } finally {
      setCollectionBusy(false)
    }
  }

  async function createTag(event: FormEvent) {
    event.preventDefault()
    const name = newTag.trim()
    if (!name) return
    if (name.length > 40) {
      setCollectionError('Tên thẻ tối đa 40 ký tự.')
      return
    }
    setCollectionBusy(true)
    setCollectionError('')
    try {
      await run((token) => createTagRequest(token, name))
      setNewTag('')
      await loadCollections()
      setNotice({ tone: 'ok', text: `Đã tạo thẻ “${name}”.` })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setCollectionError(
        caught instanceof ApiError ? caught.message : 'Chưa tạo được thẻ.',
      )
    } finally {
      setCollectionBusy(false)
    }
  }

  async function confirmCollectionDelete() {
    if (!pendingDelete) return
    const target = pendingDelete
    setCollectionBusy(true)
    setCollectionError('')
    try {
      if (target.kind === 'folder') {
        await run((token) => deleteFolderRequest(token, target.id))
        if (folderId === target.id) {
          setFolderId(null)
          setPage(1)
        }
      } else {
        await run((token) => deleteTagRequest(token, target.id))
        if (tagId === target.id) {
          setTagId(null)
          setPage(1)
        }
      }
      setPendingDelete(null)
      setNotice({
        tone: 'ok',
        text: target.kind === 'folder' ? 'Đã xóa thư mục.' : 'Đã xóa thẻ.',
      })
      await loadCollections()
      await loadWords(page)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setCollectionError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa xóa được mục này.',
      )
    } finally {
      setCollectionBusy(false)
    }
  }

  /* ---------- Phiên ôn SRS ---------- */

  function resetReviewState() {
    setSessionId(null)
    setCard(null)
    setRevealed(false)
    setReviewError('')
    setReviewAnswered(0)
    setReviewSummary(null)
    setFeedback(null)
  }

  async function startReview(mode: 'learn' | 'review') {
    setReviewMode(mode)
    resetReviewState()
    setReviewStarting(true)
    try {
      const session = await run((token) =>
        startStudySessionRequest(token, mode, 20, 'flashcard'),
      )
      setSessionId(session.id)
      const next = await run((token) =>
        nextStudyCardRequest(token, session.id, 'flashcard'),
      )
      if (next) {
        setCard(next)
        cardShownAt.current = Date.now()
      } else {
        const summary = await run((token) =>
          finishStudySessionRequest(token, session.id),
        )
        setReviewSummary(summary)
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setReviewMode(null)
        return
      }
      setReviewError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa mở được phiên ôn. Vui lòng thử lại.',
      )
    } finally {
      setReviewStarting(false)
    }
  }

  async function answerWith(quality: number) {
    if (!sessionId || !card || reviewSubmitting || reviewSummary) return
    setReviewSubmitting(true)
    setReviewError('')
    setFeedback(null)
    try {
      const result = await run((token) =>
        submitStudyAnswerRequest(token, sessionId, {
          userWordId: card.userWordId,
          exerciseTypeCode: 'flashcard',
          quality,
          responseMs: Math.max(0, Date.now() - cardShownAt.current),
        }),
      )
      setReviewAnswered((value) => value + 1)
      setFeedback({ ok: result.isCorrect, text: result.message })
      await new Promise((resolve) => window.setTimeout(resolve, 520))

      const next = await run((token) =>
        nextStudyCardRequest(token, sessionId, 'flashcard'),
      )
      if (next) {
        setCard(next)
        setRevealed(false)
        cardShownAt.current = Date.now()
      } else {
        const summary = await run((token) =>
          finishStudySessionRequest(token, sessionId),
        )
        setReviewSummary(summary)
        setCard(null)
        await loadCollections()
        await loadWords(page)
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return
      setReviewError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa ghi nhận được câu trả lời. Bạn thử lại nhé.',
      )
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function closeReview() {
    const activeSession = sessionId
    const finished = Boolean(reviewSummary)
    const hadAnswers = reviewAnswered > 0
    setReviewMode(null)
    resetReviewState()
    if (!activeSession || finished) return
    try {
      await run((token) => finishStudySessionRequest(token, activeSession))
      if (hadAnswers) {
        await Promise.all([loadCollections(), loadWords(page)])
      }
    } catch {
      /* Phiên học sẽ được đóng ở lần tải sau. */
    }
  }

  keyHandler.current = (event: KeyboardEvent) => {
    if (!reviewMode) return
    if (event.key === 'Escape') {
      event.preventDefault()
      void closeReview()
      return
    }
    if (!card || reviewSummary || reviewStarting || reviewSubmitting) return
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    if (event.code === 'Space') {
      event.preventDefault()
      setRevealed(true)
      return
    }
    if (revealed && ['1', '2', '3', '4'].includes(event.key)) {
      event.preventDefault()
      const ratings = [1, 3, 4, 5]
      void answerWith(ratings[Number(event.key) - 1])
    }
  }

  useEffect(() => {
    if (!reviewMode) return
    const listener = (event: KeyboardEvent) => keyHandler.current(event)
    window.addEventListener('keydown', listener)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', listener)
      document.body.style.overflow = previous
    }
  }, [reviewMode])

  /* ---------- Dẫn xuất ---------- */

  const total = stats?.total ?? 0
  const filtered = status !== 'all' || folderId !== null || tagId !== null || debouncedSearch.trim() !== ''
  const filterTitle =
    STATUS_TABS.find((tab) => tab.value === status)?.label ?? 'Tất cả'
  const currentFolder = folders.find((folder) => folder.id === folderId)
  const currentTag = tags.find((tag) => tag.id === tagId)
  const reviewTotal = Math.max(
    1,
    Math.min(20, reviewMode === 'review' ? stats?.due ?? 20 : stats?.new ?? 20),
  )
  const reviewProgress = reviewSummary
    ? 100
    : Math.min(100, Math.round((reviewAnswered / reviewTotal) * 100))
  const summaryAccuracy = reviewSummary?.accuracyPct ?? 0

  function clearFilters() {
    setStatus('all')
    setFolderId(null)
    setTagId(null)
    setSearch('')
    setPage(1)
  }

  /* ---------- Giao diện ---------- */

  return (
    <AppScaffold className="wordbook-page">
      <section className="page-hero site-shell">
        <div className="page-hero__copy">
          <span className="page-eyebrow">
            <BookmarkIcon size={14} />
            Sổ từ &amp; ôn tập SRS
          </span>
          <h1>
            Mỗi từ đã lưu
            <br />
            <em>là một lần gặp lại.</em>
          </h1>
          <p>
            Giữ từ cùng câu ngữ cảnh bạn gặp, sắp vào thư mục và thẻ. Sổ từ tự
            nhắc bạn ôn đúng lúc để từ ở lại lâu hơn trong trí nhớ.
          </p>
        </div>
        <div className="page-hero__actions">
          {stats && stats.due > 0 ? (
            <button
              type="button"
              className="page-btn page-btn--primary"
              onClick={() => void startReview('review')}
            >
              <PlayIcon size={16} />
              Ôn {stats.due} từ đến hạn
            </button>
          ) : stats && stats.new > 0 ? (
            <button
              type="button"
              className="page-btn page-btn--primary"
              onClick={() => void startReview('learn')}
            >
              <SparkIcon size={16} />
              Học {stats.new} từ mới
            </button>
          ) : (
            <button
              type="button"
              className="page-btn page-btn--primary"
              onClick={() => setAddOpen(true)}
            >
              <PlusIcon size={16} />
              {total > 0 ? 'Thêm từ mới' : 'Thêm từ đầu tiên'}
            </button>
          )}
          <Link to="/app/context" className="page-btn">
            <LayersIcon size={16} />
            Tra theo ngữ cảnh
          </Link>
        </div>
      </section>

      <div className="site-shell">
        {notice ? (
          <div
            className={`wordbook-notice is-${notice.tone}`}
            role="status"
            aria-live="polite"
          >
            {notice.tone === 'ok' ? <CheckIcon size={15} /> : <CloseIcon size={15} />}
            <span>{notice.text}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setNotice(null)}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="page-state" aria-live="polite">
            <span className="spinner spinner--page" aria-hidden="true" />
            <p>Đang mở sổ từ của bạn...</p>
          </div>
        ) : initError ? (
          <div className="page-state" role="alert">
            <span className="page-state__icon">
              <BookmarkIcon size={22} />
            </span>
            <h2>Chưa mở được sổ từ</h2>
            <p className="page-error">{initError}</p>
            <div className="page-state__actions">
              <button
                type="button"
                className="page-btn page-btn--primary"
                onClick={() => {
                  setLoading(true)
                  loadCollections().finally(() => setLoading(false))
                }}
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : stats ? (
          <>
            <section className="wordbook-stats" aria-label="Tình hình sổ từ">
              <button
                type="button"
                className={`wordbook-stat${status === 'all' ? ' is-active' : ''}`}
                onClick={() => {
                  setStatus('all')
                  setPage(1)
                }}
              >
                <span className="wordbook-stat__icon">
                  <BookmarkIcon size={17} />
                </span>
                <span className="wordbook-stat__label">Tổng từ</span>
                <strong>{stats.total}</strong>
                <em>Tất cả trong sổ</em>
              </button>
              <button
                type="button"
                className={`wordbook-stat${status === 'new' ? ' is-active' : ''}`}
                onClick={() => {
                  setStatus('new')
                  setPage(1)
                }}
              >
                <span className="wordbook-stat__icon">
                  <SparkIcon size={17} />
                </span>
                <span className="wordbook-stat__label">Từ mới</span>
                <strong>{stats.new}</strong>
                <em>Chưa bắt đầu ôn</em>
              </button>
              <button
                type="button"
                className={`wordbook-stat${status === 'learning' ? ' is-active' : ''}`}
                onClick={() => {
                  setStatus('learning')
                  setPage(1)
                }}
              >
                <span className="wordbook-stat__icon">
                  <TargetIcon size={17} />
                </span>
                <span className="wordbook-stat__label">Đang học</span>
                <strong>{stats.learning}</strong>
                <em>Đang trong chu kỳ SRS</em>
              </button>
              <button
                type="button"
                className={`wordbook-stat${status === 'mastered' ? ' is-active' : ''}`}
                onClick={() => {
                  setStatus('mastered')
                  setPage(1)
                }}
              >
                <span className="wordbook-stat__icon">
                  <TrophyIcon size={17} />
                </span>
                <span className="wordbook-stat__label">Đã thuộc</span>
                <strong>{stats.mastered}</strong>
                <em>Nhớ dài hạn</em>
              </button>
              <button
                type="button"
                className="wordbook-stat wordbook-stat--due"
                onClick={() => {
                  if (stats.due > 0) void startReview('review')
                }}
                disabled={stats.due === 0}
              >
                <span className="wordbook-stat__icon">
                  <FlameIcon size={17} />
                </span>
                <span className="wordbook-stat__label">Đến hạn</span>
                <strong>{stats.due}</strong>
                <em>{stats.due > 0 ? 'Bấm để ôn ngay' : 'Đang trong nhịp'}</em>
              </button>
            </section>

            {dueWords.length > 0 ? (
              <section className="wordbook-due" aria-label="Từ đến hạn ôn">
                <span className="wordbook-due__icon">
                  <FlameIcon size={20} />
                </span>
                <div className="wordbook-due__copy">
                  <strong>{stats.due} từ đang chờ bạn ôn</strong>
                  <p>
                    Theo lịch SRS, ôn đúng hôm nay sẽ giúp lần gặp sau giãn ra
                    lâu hơn.
                  </p>
                  <div className="wordbook-due__chips">
                    {dueWords.slice(0, 5).map((word) => (
                      <span key={word.id} className="wordbook-due__chip">
                        {word.lemma}
                      </span>
                    ))}
                    {dueWords.length > 5 ? (
                      <span className="wordbook-due__chip is-more">
                        +{Math.max(stats.due - 5, dueWords.length - 5)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="page-btn page-btn--primary"
                  onClick={() => void startReview('review')}
                >
                  <PlayIcon size={15} />
                  Ôn ngay
                </button>
              </section>
            ) : null}

            <div className="wordbook-main">
              <article className="page-card wordbook-list-card">
                <div className="page-card__head">
                  <div>
                    <span className="page-card__eyebrow">Sổ từ của bạn</span>
                    <h2>
                      {filterTitle}
                      {currentFolder ? ` · ${currentFolder.name}` : ''}
                      {currentTag ? ` · #${currentTag.name}` : ''}
                    </h2>
                    <p className="page-card__note">
                      {pageData
                        ? `${pageData.total} từ phù hợp · trang ${pageData.page}/${Math.max(1, pageData.totalPages)}`
                        : 'Đang đếm từ...'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`page-btn${addOpen ? ' is-active' : ''}`}
                    onClick={() => {
                      setAddOpen((value) => !value)
                      setAddError('')
                      closeEditor()
                    }}
                    aria-expanded={addOpen}
                  >
                    <PlusIcon size={16} />
                    Thêm từ
                  </button>
                </div>

                {addOpen ? (
                  <form className="wordbook-add" onSubmit={submitAdd}>
                    <div className="wordbook-add__head">
                      <span className="wordbook-add__icon">
                        <PlusIcon size={16} />
                      </span>
                      <div>
                        <h3>Thêm từ nhanh</h3>
                        <p>
                          Từ được tra nghĩa tự động. Thêm câu ngữ cảnh để chọn
                          đúng nghĩa bạn gặp.
                        </p>
                      </div>
                    </div>
                    <div className="wordbook-add__grid">
                      <label className="wordbook-field">
                        <span>Từ tiếng Anh</span>
                        <input
                          value={addForm.lemma}
                          onChange={(event) =>
                            setAddForm((form) => ({ ...form, lemma: event.target.value }))
                          }
                          placeholder="vd: resilient"
                          maxLength={40}
                          autoFocus
                        />
                      </label>
                      <label className="wordbook-field">
                        <span>Thư mục</span>
                        <select
                          value={addForm.folderId ?? ''}
                          onChange={(event) =>
                            setAddForm((form) => ({
                              ...form,
                              folderId: event.target.value ? Number(event.target.value) : null,
                            }))
                          }
                        >
                          <option value="">Chưa xếp thư mục</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="wordbook-field wordbook-field--wide">
                        <span>Câu ngữ cảnh (không bắt buộc)</span>
                        <textarea
                          value={addForm.context}
                          onChange={(event) =>
                            setAddForm((form) => ({ ...form, context: event.target.value }))
                          }
                          placeholder="Dán câu bạn gặp từ này để sổ từ giữ lại ngữ cảnh."
                          rows={2}
                          maxLength={1000}
                        />
                      </label>
                      <label className="wordbook-field wordbook-field--wide">
                        <span>Ghi chú (không bắt buộc)</span>
                        <input
                          value={addForm.note}
                          onChange={(event) =>
                            setAddForm((form) => ({ ...form, note: event.target.value }))
                          }
                          placeholder="Mẹo nhớ, cách dùng, phát âm..."
                          maxLength={500}
                        />
                      </label>
                    </div>
                    {tags.length > 0 ? (
                      <div className="wordbook-tagpick">
                        <span>Gắn thẻ</span>
                        <div className="wordbook-tagpick__list">
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              className={`tag-chip${
                                addForm.tagIds.includes(tag.id) ? ' is-active' : ''
                              }`}
                              onClick={() =>
                                setAddForm((form) => ({
                                  ...form,
                                  tagIds: toggleId(form.tagIds, tag.id),
                                }))
                              }
                            >
                              <TagIcon size={12} />
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {addError ? (
                      <p className="wordbook-alert" role="alert">
                        {addError}
                      </p>
                    ) : null}
                    <div className="wordbook-add__actions">
                      <button
                        type="submit"
                        className="page-btn page-btn--primary"
                        disabled={adding}
                      >
                        {adding ? <span className="spinner" aria-hidden="true" /> : <PlusIcon size={15} />}
                        {adding ? 'Đang lưu...' : 'Lưu vào sổ từ'}
                      </button>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => {
                          setAddOpen(false)
                          resetAdd()
                        }}
                        disabled={adding}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="wordbook-toolbar">
                  <label className="wordbook-search">
                    <SearchIcon size={16} />
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setPage(1)
                      }}
                      placeholder="Tìm theo từ, nghĩa hoặc ngữ cảnh..."
                      aria-label="Tìm từ trong sổ"
                    />
                    {search ? (
                      <button
                        type="button"
                        aria-label="Xóa tìm kiếm"
                        onClick={() => {
                          setSearch('')
                          setPage(1)
                        }}
                      >
                        <CloseIcon size={14} />
                      </button>
                    ) : null}
                  </label>
                  <label className="wordbook-select">
                    <FolderIcon size={15} />
                    <select
                      value={folderId ?? ''}
                      onChange={(event) => {
                        setFolderId(event.target.value ? Number(event.target.value) : null)
                        setPage(1)
                      }}
                      aria-label="Lọc theo thư mục"
                    >
                      <option value="">Mọi thư mục</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name} ({folder.wordCount})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wordbook-select">
                    <TagIcon size={15} />
                    <select
                      value={tagId ?? ''}
                      onChange={(event) => {
                        setTagId(event.target.value ? Number(event.target.value) : null)
                        setPage(1)
                      }}
                      aria-label="Lọc theo thẻ"
                    >
                      <option value="">Mọi thẻ</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          #{tag.name} ({tag.wordCount})
                        </option>
                      ))}
                    </select>
                  </label>
                  {filtered ? (
                    <button type="button" className="wordbook-clear" onClick={clearFilters}>
                      <CloseIcon size={13} />
                      Bỏ lọc
                    </button>
                  ) : null}
                </div>

                {listError ? (
                  <div className="wordbook-liststate" role="alert">
                    <p className="page-error">{listError}</p>
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => void loadWords(page)}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : listLoading ? (
                  <div className="wordbook-liststate" aria-live="polite">
                    <span className="spinner spinner--page" aria-hidden="true" />
                    <p>Đang sắp lại sổ từ...</p>
                  </div>
                ) : words.length === 0 ? (
                  <div className="wordbook-empty">
                    <span className="wordbook-empty__icon">
                      {total === 0 && !filtered ? (
                        <BookmarkIcon size={24} />
                      ) : (
                        <SearchIcon size={24} />
                      )}
                    </span>
                    <h3>
                      {total === 0 && !filtered
                        ? 'Sổ từ đang trống'
                        : 'Không tìm thấy từ phù hợp'}
                    </h3>
                    <p>
                      {total === 0 && !filtered
                        ? 'Lưu từ đầu tiên khi bạn đọc hoặc tra nghĩa. Sổ từ sẽ giữ câu ngữ cảnh và nhắc bạn ôn đúng lịch.'
                        : 'Thử từ khóa khác hoặc bỏ bớt bộ lọc để xem toàn bộ sổ từ.'}
                    </p>
                    <div className="wordbook-empty__actions">
                      {total === 0 && !filtered ? (
                        <>
                          <button
                            type="button"
                            className="page-btn page-btn--primary"
                            onClick={() => setAddOpen(true)}
                          >
                            <PlusIcon size={15} />
                            Thêm từ đầu tiên
                          </button>
                          <Link to="/app/context" className="page-btn">
                            <LayersIcon size={15} />
                            Tra theo ngữ cảnh
                          </Link>
                        </>
                      ) : (
                        <button type="button" className="page-btn" onClick={clearFilters}>
                          <CloseIcon size={14} />
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="word-list">
                    {words.map((word) => {
                      const isEditing = editingId === word.id
                      const isDeleting = deletingId === word.id
                      return (
                        <article
                          key={word.id}
                          className={`word-card${isEditing ? ' is-editing' : ''}`}
                        >
                          <span className="word-card__mark" aria-hidden="true">
                            {word.lemma.charAt(0).toUpperCase()}
                          </span>
                          <div className="word-card__body">
                            <div className="word-card__title">
                              <h3>{word.lemma}</h3>
                              <span className="word-chip word-chip--pos">
                                {word.partOfSpeech}
                              </span>
                              {word.levelCode ? (
                                <span className="word-chip">{word.levelCode}</span>
                              ) : null}
                              <span className={`word-status is-${word.status}`}>
                                {STATUS_LABEL[word.status] ?? word.status}
                              </span>
                              {word.srs?.isDue ? (
                                <span className="word-chip word-chip--due">
                                  <FlameIcon size={11} />
                                  Đến hạn
                                </span>
                              ) : null}
                            </div>
                            {word.phonetic ? (
                              <div className="word-card__phonetic">
                                <span>{word.phonetic}</span>
                                <button
                                  type="button"
                                  onClick={() => speak(word.lemma)}
                                  aria-label={`Nghe phát âm ${word.lemma}`}
                                >
                                  <SpeakerIcon size={14} />
                                </button>
                              </div>
                            ) : null}
                            <p className="word-card__meaning">{word.meaningVi}</p>
                            {word.definitionEn ? (
                              <p className="word-card__definition">{word.definitionEn}</p>
                            ) : null}
                            <HighlightedSentence
                              sentence={word.contextSentence}
                              lemma={word.lemma}
                            />
                            {word.note ? (
                              <p className="word-card__note">
                                <EditIcon size={12} />
                                {word.note}
                              </p>
                            ) : null}
                            <div className="word-card__meta">
                              {word.folderId ? (
                                <span className="meta-chip">
                                  <FolderIcon size={12} />
                                  {folderName(word) || 'Thư mục'}
                                </span>
                              ) : null}
                              {word.tags.map((tag) => (
                                <span key={tag.id} className="meta-chip meta-chip--tag">
                                  <TagIcon size={11} />
                                  {tag.name}
                                </span>
                              ))}
                              <span className="meta-chip meta-chip--muted">
                                <ClockIcon size={12} />
                                {dueLabel(word.srs)}
                              </span>
                              <span className="meta-chip meta-chip--muted">
                                Lưu {shortDate(word.addedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="word-card__actions">
                            {isDeleting ? (
                              <div className="word-confirm">
                                <span>Xóa từ này?</span>
                                <div>
                                  <button
                                    type="button"
                                    className="word-confirm__yes"
                                    onClick={() => void removeWord(word)}
                                    disabled={deletingWord}
                                  >
                                    Xóa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(null)}
                                    disabled={deletingWord}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={`word-iconbtn${isEditing ? ' is-active' : ''}`}
                                  onClick={() =>
                                    isEditing ? closeEditor() : openEditor(word)
                                  }
                                  aria-label={`Sửa ${word.lemma}`}
                                  aria-expanded={isEditing}
                                >
                                  <EditIcon size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="word-iconbtn word-iconbtn--danger"
                                  onClick={() => setDeletingId(word.id)}
                                  aria-label={`Xóa ${word.lemma}`}
                                >
                                  <TrashIcon size={15} />
                                </button>
                              </>
                            )}
                          </div>

                          {isEditing && editor ? (
                            <div className="word-editor">
                              <div className="word-editor__grid">
                                <label className="wordbook-field">
                                  <span>Thư mục</span>
                                  <select
                                    value={editor.folderId ?? ''}
                                    onChange={(event) =>
                                      setEditor((current) =>
                                        current
                                          ? {
                                              ...current,
                                              folderId: event.target.value
                                                ? Number(event.target.value)
                                                : null,
                                            }
                                          : current,
                                      )
                                    }
                                  >
                                    <option value="">Chưa xếp thư mục</option>
                                    {folders.map((folder) => (
                                      <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="wordbook-field">
                                  <span>Trạng thái</span>
                                  <select
                                    value={editor.status}
                                    onChange={(event) =>
                                      setEditor((current) =>
                                        current
                                          ? { ...current, status: event.target.value }
                                          : current,
                                      )
                                    }
                                  >
                                    <option value="new">Mới</option>
                                    <option value="learning">Đang học</option>
                                    <option value="mastered">Đã thuộc</option>
                                  </select>
                                </label>
                                <label className="wordbook-field wordbook-field--wide">
                                  <span>Ghi chú</span>
                                  <textarea
                                    value={editor.note}
                                    onChange={(event) =>
                                      setEditor((current) =>
                                        current
                                          ? { ...current, note: event.target.value }
                                          : current,
                                      )
                                    }
                                    rows={2}
                                    maxLength={500}
                                    placeholder="Cách nhớ, sắc thái, cụm từ đi kèm..."
                                  />
                                </label>
                              </div>
                              {tags.length > 0 ? (
                                <div className="wordbook-tagpick">
                                  <span>Thẻ</span>
                                  <div className="wordbook-tagpick__list">
                                    {tags.map((tag) => (
                                      <button
                                        key={tag.id}
                                        type="button"
                                        className={`tag-chip${
                                          editor.tagIds.includes(tag.id) ? ' is-active' : ''
                                        }`}
                                        onClick={() =>
                                          setEditor((current) =>
                                            current
                                              ? {
                                                  ...current,
                                                  tagIds: toggleId(current.tagIds, tag.id),
                                                }
                                              : current,
                                          )
                                        }
                                      >
                                        <TagIcon size={12} />
                                        {tag.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="word-editor__hint">
                                  Tạo thẻ ở cột “Bộ sưu tập” để gắn nhãn cho từ.
                                </p>
                              )}
                              {editorError ? (
                                <p className="wordbook-alert" role="alert">
                                  {editorError}
                                </p>
                              ) : null}
                              <div className="word-editor__actions">
                                <button
                                  type="button"
                                  className="page-btn page-btn--primary"
                                  onClick={() => void saveEditor(word)}
                                  disabled={savingId === word.id}
                                >
                                  {savingId === word.id ? (
                                    <span className="spinner" aria-hidden="true" />
                                  ) : (
                                    <CheckIcon size={15} />
                                  )}
                                  {savingId === word.id ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                                <button
                                  type="button"
                                  className="page-btn"
                                  onClick={closeEditor}
                                  disabled={savingId === word.id}
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      )
                    })}
                  </div>
                )}

                {pageData && pageData.totalPages > 1 ? (
                  <div className="wordbook-pager">
                    <button
                      type="button"
                      className="page-btn page-btn--icon"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={page <= 1 || listLoading}
                      aria-label="Trang trước"
                    >
                      <ChevronLeftIcon size={16} />
                    </button>
                    <span>
                      Trang <b>{pageData.page}</b> / {pageData.totalPages}
                    </span>
                    <button
                      type="button"
                      className="page-btn page-btn--icon"
                      onClick={() =>
                        setPage((value) => Math.min(pageData.totalPages, value + 1))
                      }
                      disabled={page >= pageData.totalPages || listLoading}
                      aria-label="Trang sau"
                    >
                      <ChevronRightIcon size={16} />
                    </button>
                  </div>
                ) : null}
              </article>

              <aside className="wordbook-rail">
                <article className="page-card collection-card">
                  <div className="page-card__head">
                    <div>
                      <span className="page-card__eyebrow">Bộ sưu tập</span>
                      <h2>Thư mục &amp; thẻ</h2>
                    </div>
                  </div>
                  <p className="page-card__note">
                    Nhóm từ theo chủ đề để tìm lại nhanh khi viết hoặc nói.
                  </p>

                  {collectionError ? (
                    <p className="wordbook-alert" role="alert">
                      {collectionError}
                    </p>
                  ) : null}

                  <section className="collection-group">
                    <h3>
                      <FolderIcon size={15} />
                      Thư mục
                      <em>{folders.length}</em>
                    </h3>
                    <form className="collection-add" onSubmit={createFolder}>
                      <input
                        value={newFolder}
                        onChange={(event) => setNewFolder(event.target.value)}
                        placeholder="Tên thư mục mới"
                        maxLength={40}
                        aria-label="Tên thư mục mới"
                      />
                      <button
                        type="submit"
                        aria-label="Tạo thư mục"
                        disabled={collectionBusy || !newFolder.trim()}
                      >
                        <PlusIcon size={15} />
                      </button>
                    </form>
                    <div className="collection-list">
                      {folders.length === 0 ? (
                        <p className="collection-empty">
                          Chưa có thư mục. Tạo “Công việc”, “Du lịch”... để sắp
                          từ.
                        </p>
                      ) : (
                        folders.map((folder) => (
                          <div
                            key={folder.id}
                            className={`collection-row${folderId === folder.id ? ' is-active' : ''}`}
                          >
                            <button
                              type="button"
                              className="collection-row__main"
                              onClick={() => {
                                setFolderId((value) =>
                                  value === folder.id ? null : folder.id,
                                )
                                setPage(1)
                              }}
                            >
                              <FolderIcon size={14} />
                              <span>{folder.name}</span>
                              <em>{folder.wordCount}</em>
                            </button>
                            {pendingDelete?.kind === 'folder' &&
                            pendingDelete.id === folder.id ? (
                              <span className="collection-confirm">
                                <button
                                  type="button"
                                  onClick={() => void confirmCollectionDelete()}
                                  disabled={collectionBusy}
                                >
                                  Xóa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete(null)}
                                  disabled={collectionBusy}
                                >
                                  Hủy
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="collection-row__delete"
                                onClick={() =>
                                  setPendingDelete({ kind: 'folder', id: folder.id })
                                }
                                aria-label={`Xóa thư mục ${folder.name}`}
                              >
                                <TrashIcon size={13} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="collection-group">
                    <h3>
                      <TagIcon size={15} />
                      Thẻ
                      <em>{tags.length}</em>
                    </h3>
                    <form className="collection-add" onSubmit={createTag}>
                      <input
                        value={newTag}
                        onChange={(event) => setNewTag(event.target.value)}
                        placeholder="Tên thẻ mới"
                        maxLength={40}
                        aria-label="Tên thẻ mới"
                      />
                      <button
                        type="submit"
                        aria-label="Tạo thẻ"
                        disabled={collectionBusy || !newTag.trim()}
                      >
                        <PlusIcon size={15} />
                      </button>
                    </form>
                    <div className="collection-list">
                      {tags.length === 0 ? (
                        <p className="collection-empty">
                          Chưa có thẻ. Thẻ hợp cho “IELTS”, “cụm động từ”,
                          “cần phát âm lại”...
                        </p>
                      ) : (
                        tags.map((tag) => (
                          <div
                            key={tag.id}
                            className={`collection-row${tagId === tag.id ? ' is-active' : ''}`}
                          >
                            <button
                              type="button"
                              className="collection-row__main"
                              onClick={() => {
                                setTagId((value) => (value === tag.id ? null : tag.id))
                                setPage(1)
                              }}
                            >
                              <TagIcon size={13} />
                              <span>{tag.name}</span>
                              <em>{tag.wordCount}</em>
                            </button>
                            {pendingDelete?.kind === 'tag' &&
                            pendingDelete.id === tag.id ? (
                              <span className="collection-confirm">
                                <button
                                  type="button"
                                  onClick={() => void confirmCollectionDelete()}
                                  disabled={collectionBusy}
                                >
                                  Xóa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete(null)}
                                  disabled={collectionBusy}
                                >
                                  Hủy
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="collection-row__delete"
                                onClick={() =>
                                  setPendingDelete({ kind: 'tag', id: tag.id })
                                }
                                aria-label={`Xóa thẻ ${tag.name}`}
                              >
                                <TrashIcon size={13} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </article>

                <article className="page-card wordbook-tips">
                  <div className="page-card__head">
                    <div>
                      <span className="page-card__eyebrow">Nhịp ghi nhớ</span>
                      <h2>Sổ từ hoạt động thế nào?</h2>
                    </div>
                  </div>
                  <ol className="wordbook-tips__list">
                    <li>
                      <span>1</span>
                      <div>
                        <strong>Lưu cùng ngữ cảnh</strong>
                        <p>Câu gốc giúp bạn nhớ nghĩa đúng lúc gặp lại.</p>
                      </div>
                    </li>
                    <li>
                      <span>2</span>
                      <div>
                        <strong>Sắp thư mục và thẻ</strong>
                        <p>Nhóm theo chủ đề để tìm lại khi viết hoặc nói.</p>
                      </div>
                    </li>
                    <li>
                      <span>3</span>
                      <div>
                        <strong>Ôn đúng lịch SRS</strong>
                        <p>Mỗi lần nhớ lại, khoảng cách ôn sẽ giãn ra.</p>
                      </div>
                    </li>
                  </ol>
                  <div className="wordbook-tips__links">
                    <Link to="/app/stats" className="page-btn">
                      <TargetIcon size={15} />
                      Xem thống kê
                    </Link>
                    <Link to="/app/plan" className="page-btn">
                      <TrophyIcon size={15} />
                      Lộ trình học
                    </Link>
                  </div>
                </article>
              </aside>
            </div>
          </>
        ) : null}
      </div>

      {reviewMode
        ? createPortal(
            <div className="review-overlay" role="dialog" aria-modal="true" aria-label="Phiên ôn từ">
              <div className="review-panel">
                <header className="review-head">
                  <span className={`review-mode${reviewMode === 'review' ? ' is-review' : ''}`}>
                    {reviewMode === 'review' ? <PlayIcon size={14} /> : <SparkIcon size={14} />}
                    {reviewMode === 'review' ? 'Ôn tập đến hạn' : 'Học từ mới'}
                  </span>
                  <span className="review-count">
                    {reviewAnswered > 0 ? `Đã trả lời ${reviewAnswered}` : 'Chưa trả lời'}
                  </span>
                  <button
                    type="button"
                    className="review-close"
                    onClick={() => void closeReview()}
                    aria-label="Đóng phiên ôn"
                  >
                    <CloseIcon size={18} />
                  </button>
                </header>

                <div className="review-progress" aria-hidden="true">
                  <span style={{ width: `${reviewProgress}%` }} />
                </div>

                {reviewStarting ? (
                  <div className="review-state" aria-live="polite">
                    <span className="spinner spinner--page" aria-hidden="true" />
                    <p>Đang chuẩn bị thẻ ôn...</p>
                  </div>
                ) : reviewSummary ? (
                  <div className="review-summary">
                    {reviewSummary.answered === 0 ? (
                      <>
                        <span className="review-summary__icon">
                          <CheckIcon size={26} />
                        </span>
                        <h2>Hôm nay bạn đã ôn xong</h2>
                        <p>
                          Không còn từ nào đến hạn trong phiên này. Quay lại khi
                          có từ mới đến lịch, hoặc thêm từ từ trang Ngữ cảnh.
                        </p>
                        <div className="review-summary__actions">
                          <button
                            type="button"
                            className="page-btn page-btn--primary"
                            onClick={() => void closeReview()}
                          >
                            Về sổ từ
                          </button>
                          <Link to="/app/context" className="page-btn">
                            <LayersIcon size={15} />
                            Tra thêm từ
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="review-ring"
                          style={{
                            background: `conic-gradient(#3f9fe8 ${summaryAccuracy * 3.6}deg, rgba(63, 159, 232, 0.14) 0deg)`,
                          }}
                        >
                          <span>{summaryAccuracy}%</span>
                        </div>
                        <h2>Hoàn thành phiên ôn</h2>
                        <p>
                          {reviewSummary.correct}/{reviewSummary.answered} câu
                          đúng trong {Math.max(1, reviewSummary.minutes)} phút.
                          Lịch ôn tiếp theo đã được cập nhật.
                        </p>
                        <div className="review-summary__grid">
                          <div>
                            <strong>{reviewSummary.answered}</strong>
                            <span>câu đã ôn</span>
                          </div>
                          <div>
                            <strong>{reviewSummary.correct}</strong>
                            <span>câu đúng</span>
                          </div>
                          <div>
                            <strong>{Math.max(1, reviewSummary.minutes)}</strong>
                            <span>phút</span>
                          </div>
                        </div>
                        <div className="review-summary__actions">
                          <button
                            type="button"
                            className="page-btn page-btn--primary"
                            onClick={() => void closeReview()}
                          >
                            Về sổ từ
                          </button>
                          {((reviewMode === 'review' && (stats?.due ?? 0) > 0) ||
                            (reviewMode === 'learn' && (stats?.new ?? 0) > 0)) && (
                            <button
                              type="button"
                              className="page-btn"
                              onClick={() => void startReview(reviewMode)}
                            >
                              <PlayIcon size={15} />
                              Ôn tiếp
                            </button>
                          )}
                          <Link to="/app/stats" className="page-btn">
                            <TargetIcon size={15} />
                            Xem thống kê
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                ) : reviewError && !card ? (
                  <div className="review-state" role="alert">
                    <span className="page-state__icon">
                      <BookmarkIcon size={22} />
                    </span>
                    <h2>Chưa mở được phiên ôn</h2>
                    <p className="page-error">{reviewError}</p>
                    <div className="page-state__actions">
                      <button
                        type="button"
                        className="page-btn page-btn--primary"
                        onClick={() => {
                          if (reviewMode) void startReview(reviewMode)
                        }}
                      >
                        Thử lại
                      </button>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => void closeReview()}
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                ) : card ? (
                  <div className="review-body">
                    <div className="review-card">
                      <div className="review-card__top">
                        <span className="word-chip word-chip--pos">{card.partOfSpeech}</span>
                        {card.levelCode ? <span className="word-chip">{card.levelCode}</span> : null}
                        <span className={`word-status is-${card.status}`}>
                          {STATUS_LABEL[card.status] ?? card.status}
                        </span>
                      </div>
                      <h2 className="review-card__word">{card.lemma}</h2>
                      {card.phonetic ? (
                        <div className="review-card__phonetic">
                          <span>{card.phonetic}</span>
                          <button
                            type="button"
                            onClick={() => speak(card.lemma)}
                            aria-label={`Nghe phát âm ${card.lemma}`}
                          >
                            <SpeakerIcon size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="review-card__speak"
                          onClick={() => speak(card.lemma)}
                        >
                          <SpeakerIcon size={15} />
                          Nghe phát âm
                        </button>
                      )}
                      <HighlightedSentence
                        sentence={card.contextSentence}
                        lemma={card.lemma}
                      />

                      {revealed ? (
                        <div className="review-card__back">
                          <span className="review-label">Nghĩa</span>
                          <strong>{card.meaningVi}</strong>
                          {card.definitionEn ? (
                            <p className="review-definition">{card.definitionEn}</p>
                          ) : null}
                          {card.srs ? (
                            <span className="review-srs">
                              <ClockIcon size={12} />
                              Lần ôn trước: cách đây {Math.max(0, card.srs.intervalDays)} ngày ·
                              lặp {card.srs.repetitions}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="review-reveal"
                          onClick={() => setRevealed(true)}
                        >
                          <SparkIcon size={16} />
                          Lật thẻ để xem nghĩa
                          <kbd>Space</kbd>
                        </button>
                      )}
                    </div>

                    {feedback ? (
                      <div
                        className={`review-feedback${feedback.ok ? ' is-ok' : ' is-bad'}`}
                        role="status"
                      >
                        {feedback.ok ? <CheckIcon size={14} /> : <CloseIcon size={14} />}
                        {feedback.text}
                      </div>
                    ) : null}

                    {reviewError ? (
                      <p className="wordbook-alert" role="alert">
                        {reviewError}
                      </p>
                    ) : null}

                    <div className="review-actions">
                      {revealed ? (
                        <>
                          <button
                            type="button"
                            className="review-rate is-again"
                            onClick={() => void answerWith(1)}
                            disabled={reviewSubmitting}
                          >
                            <b>Lại</b>
                            <span>Quên rồi</span>
                            <kbd>1</kbd>
                          </button>
                          <button
                            type="button"
                            className="review-rate is-hard"
                            onClick={() => void answerWith(3)}
                            disabled={reviewSubmitting}
                          >
                            <b>Khó</b>
                            <span>Nhớ mơ hồ</span>
                            <kbd>2</kbd>
                          </button>
                          <button
                            type="button"
                            className="review-rate is-good"
                            onClick={() => void answerWith(4)}
                            disabled={reviewSubmitting}
                          >
                            <b>Được</b>
                            <span>Nhớ ổn</span>
                            <kbd>3</kbd>
                          </button>
                          <button
                            type="button"
                            className="review-rate is-easy"
                            onClick={() => void answerWith(5)}
                            disabled={reviewSubmitting}
                          >
                            <b>Dễ</b>
                            <span>Quá quen</span>
                            <kbd>4</kbd>
                          </button>
                        </>
                      ) : (
                        <p className="review-hint">
                          Nhớ nghĩa trước, rồi lật thẻ. Bạn tự chấm mức nhớ để
                          SRS chọn ngày ôn tiếp theo.
                        </p>
                      )}
                    </div>

                    {reviewSubmitting ? (
                      <span className="review-saving">
                        <span className="spinner spinner--page" aria-hidden="true" />
                        Đang lưu câu trả lời...
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="review-state" aria-live="polite">
                    <span className="spinner spinner--page" aria-hidden="true" />
                    <p>Đang tải thẻ...</p>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </AppScaffold>
  )
}
