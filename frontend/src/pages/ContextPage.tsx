import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import skyBackground from '../assets/sky-background.webp'
import { AppHeader } from '../components/AppHeader'
import { OrbitMenu } from '../components/OrbitMenu'
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  LayersIcon,
  SpeakerIcon,
  SparkIcon,
} from '../components/Icons'
import {
  ApiError,
  addUserWordRequest,
  addWordByLemmaRequest,
  contextLookupRequest,
  type ContextLookupResult,
  type SenseAlternative,
} from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import '../styles/landing.css'
import '../styles/home.css'
import '../styles/context.css'

const SENTENCE_MAX = 1000
const WORD_MAX = 100
const WORD_PATTERN = /^[\p{L}][\p{L}' -]{0,99}$/u

const LOADING_MESSAGES = [
  'Đang tách câu và nhận diện từ bạn chọn...',
  'Đang đối chiếu từng nghĩa với ngữ cảnh...',
  'Đang dịch cả câu sang tiếng Việt...',
]

const EXAMPLES = [
  {
    sentence: 'She manages a small café near the corner.',
    word: 'manages',
  },
  {
    sentence: 'I deposited money at the bank yesterday.',
    word: 'bank',
  },
  {
    sentence: 'She runs every morning before work.',
    word: 'runs',
  },
]

const POS_VI: Record<string, string> = {
  noun: 'danh từ',
  verb: 'động từ',
  adjective: 'tính từ',
  adverb: 'trạng từ',
  pronoun: 'đại từ',
  preposition: 'giới từ',
  conjunction: 'liên từ',
  determiner: 'hạn định từ',
  interjection: 'thán từ',
  numeral: 'số từ',
  auxiliary: 'trợ động từ',
  phrase: 'cụm từ',
}

const SOURCE_VI: Record<string, string> = {
  ai: 'AI chọn theo câu',
  heuristic: 'Suy luận từ điển',
  cache: 'Kết quả đã lưu',
  'machine-translation': 'Dịch máy',
}

type SentenceToken = {
  text: string
  word: string | null
}

function cleanToken(part: string): string | null {
  const cleaned = part
    .replace(/[’]/g, "'")
    .replace(/^[^\p{L}'-]+|[^\p{L}'-]+$/gu, '')
  return cleaned.length > 0 ? cleaned : null
}

function tokenize(sentence: string): SentenceToken[] {
  return sentence
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, word: cleanToken(part) }))
}

function posLabel(code: string): string {
  if (!code) return 'chưa xác định'
  return POS_VI[code.toLowerCase()] ?? code
}

function sourceLabel(source: string): string {
  return SOURCE_VI[source] ?? source
}

function confidenceTone(value: number): 'high' | 'mid' | 'low' {
  if (value >= 80) return 'high'
  if (value >= 60) return 'mid'
  return 'low'
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value))
}

export function ContextPage() {
  const navigate = useNavigate()
  const { user, session, refresh, logout } = useAuth()

  const [sentence, setSentence] = useState('')
  const [word, setWord] = useState('')
  const [analyzedSentence, setAnalyzedSentence] = useState('')
  const [result, setResult] = useState<ContextLookupResult | null>(null)
  const [activeSenseId, setActiveSenseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingIndex, setLoadingIndex] = useState(0)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const requestRef = useRef(0)
  const resultRef = useRef<HTMLDivElement>(null)
  const wordInputRef = useRef<HTMLInputElement>(null)

  const accessToken = session?.accessToken

  const tokens = useMemo(() => tokenize(sentence), [sentence])

  const wordInSentence = useMemo(() => {
    const target = word.trim().toLowerCase()
    if (!target || sentence.trim().length === 0) return true
    return tokens.some((token) => token.word?.toLowerCase() === target)
  }, [sentence, tokens, word])

  const wordLooksValid = WORD_PATTERN.test(word.trim())

  const activeAlt: SenseAlternative | null =
    result?.alternatives.find((alternative) => alternative.senseId === activeSenseId) ?? null

  const confidence = activeAlt?.confidence ?? result?.confidence ?? 0
  const meaning = activeAlt?.meaningVi || result?.meaningVi || ''
  const definition = activeAlt?.definitionEn || result?.definitionEn || ''
  const posCode = activeAlt?.partOfSpeech || result?.partOfSpeech || ''
  const canSave = Boolean(result && (activeSenseId !== null || result.lemma.length > 0))

  useEffect(() => {
    if (!loading) {
      setLoadingIndex(0)
      return
    }
    const timer = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % LOADING_MESSAGES.length)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [loading])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const profile = user
  if (!profile) return null

  const displayName = profile.displayName.trim() || 'bạn'
  const firstName = displayName.split(' ').slice(-1)[0] ?? displayName
  const initial = displayName.charAt(0).toUpperCase()
  const accountEmail = profile.email

  async function handleAuthFailure() {
    await logout()
    navigate('/login', { replace: true, state: { email: accountEmail } })
  }

  async function callWithAuth<T>(task: (token: string) => Promise<T>): Promise<T> {
    if (!accessToken) {
      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401)
    }
    try {
      return await task(accessToken)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        const next = await refresh()
        return await task(next.accessToken)
      }
      throw caught
    }
  }

  async function analyze(override?: { sentence?: string; word?: string }) {
    const nextSentence = (override?.sentence ?? sentence).trim()
    const nextWord = (override?.word ?? word).trim()

    if (override) {
      setSentence(nextSentence)
      setWord(nextWord)
    }

    if (nextSentence.length === 0) {
      setError('Bạn dán hoặc gõ một câu tiếng Anh trước nhé.')
      return
    }
    if (nextWord.length === 0) {
      setError('Chọn từ bạn muốn hiểu trong câu.')
      wordInputRef.current?.focus()
      return
    }
    if (!WORD_PATTERN.test(nextWord)) {
      setError('Từ cần tra chỉ gồm chữ cái, dấu nháy hoặc gạch nối, tối đa 100 ký tự.')
      wordInputRef.current?.focus()
      return
    }

    const requestId = ++requestRef.current
    setLoading(true)
    setError('')
    setResult(null)
    setActiveSenseId(null)
    setSaveState('idle')
    setSaveError('')

    if (window.matchMedia('(max-width: 980px)').matches) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    try {
      const data = await callWithAuth((token) =>
        contextLookupRequest(token, { word: nextWord, sentence: nextSentence }),
      )
      if (requestRef.current !== requestId) return

      setResult(data)
      setAnalyzedSentence(nextSentence)
      setActiveSenseId(data.chosenSenseId ?? data.alternatives[0]?.senseId ?? null)

      window.setTimeout(() => {
        if (window.matchMedia('(max-width: 980px)').matches) {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 140)
    } catch (caught) {
      if (requestRef.current !== requestId) return
      if (caught instanceof ApiError && caught.status === 401) {
        await handleAuthFailure()
        return
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa phân tích được câu này. Vui lòng thử lại.',
      )
    } finally {
      if (requestRef.current === requestId) setLoading(false)
    }
  }

  async function saveWord() {
    if (!result || saveState === 'saving' || saveState === 'saved') return

    setSaveState('saving')
    setSaveError('')

    try {
      const contextSentence = analyzedSentence || sentence.trim()
      const saved =
        activeSenseId !== null
          ? await callWithAuth((token) =>
              addUserWordRequest(token, {
                senseId: activeSenseId,
                contextSentence,
              }),
            )
          : await callWithAuth((token) =>
              addWordByLemmaRequest(token, {
                lemma: result.lemma,
                contextSentence,
              }),
            )

      if (!saved?.id) {
        throw new ApiError('Chưa lưu được từ. Vui lòng thử lại.', 0)
      }
      setSaveState('saved')
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        await handleAuthFailure()
        return
      }
      setSaveState('error')
      setSaveError(
        caught instanceof ApiError
          ? caught.message
          : 'Chưa lưu được từ vào sổ. Vui lòng thử lại.',
      )
    }
  }

  function useExample(example: (typeof EXAMPLES)[number], run = false) {
    setSentence(example.sentence)
    setWord(example.word)
    setError('')
    if (run) {
      void analyze({ sentence: example.sentence, word: example.word })
    }
  }

  function pickToken(token: SentenceToken) {
    if (!token.word) return
    setWord(token.word)
    if (error) setError('')
  }

  function speak(text: string, key: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (!text.trim()) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.92
    utterance.pitch = 1
    utterance.onend = () => setSpeaking((current) => (current === key ? null : current))
    utterance.onerror = () => setSpeaking((current) => (current === key ? null : current))
    setSpeaking(key)
    window.speechSynthesis.speak(utterance)
  }

  async function copyText(text: string, key: string) {
    if (!text.trim()) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => {
        setCopied((current) => (current === key ? null : current))
      }, 1600)
    } catch {
      setCopied(null)
    }
  }

  async function handleLogout() {
    setLeaving(true)
    await logout()
    navigate('/welcome', { replace: true })
  }

  return (
    <div className={`context-page${leaving ? ' is-leaving' : ''}`}>
      <div
        className="context-page__bg"
        style={{ backgroundImage: `url(${skyBackground})` }}
        aria-hidden="true"
      />
      <div className="context-page__veil" aria-hidden="true" />
      <div className="context-page__aura" aria-hidden="true" />

      <AppHeader
        displayName={displayName}
        initial={initial}
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onLogout={handleLogout}
        leaving={leaving}
      />

      <main className="context-page__main">
        <section className="context-hero site-shell">
          <div className="context-hero__copy">
            <span className="hero__pill">
              <LayersIcon size={16} />
              Context Lens · hiểu từ trong câu
            </span>
            <h1>
              Đừng chỉ tra nghĩa.
              <br />
              <em>Hiểu đúng điều câu đang nói.</em>
            </h1>
            <p>
              SkyWord đọc cả câu, đối chiếu từng nghĩa rồi chọn phương án hợp với
              ngữ cảnh nhất — kèm bản dịch, độ tin cậy và câu gốc để bạn ôn lại
              sau này.
            </p>
            <ul className="context-points">
              <li>
                <CheckIcon size={15} />
                Chọn nghĩa theo ngữ cảnh, không lấy nghĩa đầu tiên
              </li>
              <li>
                <CheckIcon size={15} />
                Hiểu cả câu bằng bản dịch tiếng Việt
              </li>
              <li>
                <CheckIcon size={15} />
                Lưu từ kèm câu gốc vào sổ từ
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="context-preview"
            onClick={() => useExample(EXAMPLES[0], true)}
            aria-label="Thử câu ví dụ: She manages a small café near the corner"
          >
            <span className="context-preview__tag">
              <SparkIcon size={13} />
              Ví dụ trực tiếp
            </span>
            <span className="context-preview__label">Câu đang đọc</span>
            <span className="context-preview__sentence">
              She <mark>manages</mark> a small café near the corner.
            </span>
            <span className="context-preview__lens">
              <span className="context-preview__word">manages</span>
              <ArrowRightIcon size={15} />
              <span className="context-preview__meaning">phụ trách</span>
              <span className="context-preview__conf">động từ</span>
            </span>
            <span className="context-preview__trans">
              Cô ấy phụ trách một quán cà phê nhỏ ở góc phố.
            </span>
            <span className="context-preview__cta">
              Chạm để phân tích câu này
              <ArrowRightIcon size={15} />
            </span>
          </button>
        </section>

        <section
          className="context-work site-shell"
          aria-label="Không gian tra từ theo ngữ cảnh"
        >
          <form
            className="ctx-card ctx-card--input"
            onSubmit={(event) => {
              event.preventDefault()
              void analyze()
            }}
            noValidate
          >
            <div className="ctx-card__head">
              <span className="ctx-step">01</span>
              <div>
                <h2>Câu của bạn</h2>
                <p>Dán câu tiếng Anh đang đọc, rồi chọn từ muốn hiểu.</p>
              </div>
            </div>

            <label className="ctx-label" htmlFor="ctx-sentence">
              Câu ngữ cảnh
            </label>
            <div className="ctx-textarea-wrap">
              <textarea
                id="ctx-sentence"
                className="ctx-textarea"
                value={sentence}
                onChange={(event) => {
                  setSentence(event.target.value)
                  if (error) setError('')
                }}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault()
                    void analyze()
                  }
                }}
                placeholder="Ví dụ: She manages a small café near the corner."
                maxLength={SENTENCE_MAX}
                rows={5}
                spellCheck={false}
              />
              <span
                className={`ctx-counter${sentence.length > SENTENCE_MAX - 100 ? ' is-near' : ''}`}
              >
                {sentence.length}/{SENTENCE_MAX}
              </span>
            </div>

            {sentence.trim().length > 0 ? (
              <div className="ctx-tokens">
                <span className="ctx-tokens__label">Chạm vào một từ để chọn nhanh</span>
                <div className="ctx-tokens__flow">
                  {tokens.map((token, index) =>
                    token.word ? (
                      <button
                        key={`${index}-${token.text}`}
                        type="button"
                        className={`ctx-token${
                          token.word.toLowerCase() === word.trim().toLowerCase()
                            ? ' is-selected'
                            : ''
                        }`}
                        onClick={() => pickToken(token)}
                      >
                        {token.text}
                      </button>
                    ) : (
                      <span key={`${index}-space`}>{token.text}</span>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            <div className="ctx-word-row">
              <div className="ctx-word-field">
                <label className="ctx-label" htmlFor="ctx-word">
                  Từ cần hiểu
                </label>
                <div className="ctx-word-control">
                  <SparkIcon size={18} className="ctx-word-control__icon" />
                  <input
                    id="ctx-word"
                    ref={wordInputRef}
                    value={word}
                    onChange={(event) => {
                      setWord(event.target.value)
                      if (error) setError('')
                    }}
                    placeholder="runs"
                    maxLength={WORD_MAX}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {word ? (
                    <button
                      type="button"
                      className="ctx-word-clear"
                      onClick={() => setWord('')}
                      aria-label="Xóa từ cần tra"
                    >
                      <CloseIcon size={15} />
                    </button>
                  ) : null}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn--primary ctx-analyze"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <SparkIcon size={18} />
                    Phân tích ngữ cảnh
                  </>
                )}
              </button>
            </div>

            {wordLooksValid && word.trim() && sentence.trim() && !wordInSentence ? (
              <p className="ctx-hint ctx-hint--soft">
                Từ này không xuất hiện nguyên văn trong câu. SkyWord vẫn tra theo
                dạng gốc của từ.
              </p>
            ) : (
              <p className="ctx-hint">
                Mẹo: từ chia như “runs” hay “booked” vẫn được đưa về dạng gốc.
              </p>
            )}

            <div className="ctx-examples">
              <span className="ctx-examples__label">Thử nhanh</span>
              {EXAMPLES.map((example) => (
                <button
                  key={example.sentence}
                  type="button"
                  className="ctx-example"
                  onClick={() => useExample(example)}
                >
                  <span className="ctx-example__sentence">{example.sentence}</span>
                  <span className="ctx-example__word">{example.word}</span>
                </button>
              ))}
            </div>
          </form>

          <div className="ctx-result-wrap" ref={resultRef}>
            {loading ? (
              <article className="ctx-card ctx-card--result ctx-loading" role="status" aria-live="polite">
                <div className="ctx-orbit-visual" aria-hidden="true">
                  <span className="ctx-orbit-visual__ring ctx-orbit-visual__ring--outer" />
                  <span className="ctx-orbit-visual__ring ctx-orbit-visual__ring--dash" />
                  <span className="ctx-orbit-visual__ring ctx-orbit-visual__ring--inner" />
                  <span className="ctx-orbit-visual__core">
                    <LayersIcon size={26} />
                  </span>
                </div>
                <h2>Đang đọc câu của bạn...</h2>
                <p>{LOADING_MESSAGES[loadingIndex]}</p>
                <span className="ctx-loading__note">
                  Lần đầu tra một từ mới có thể mất vài giây để bổ sung dữ liệu.
                </span>
              </article>
            ) : error ? (
              <article className="ctx-card ctx-card--result ctx-empty" role="alert">
                <span className="ctx-empty__badge">
                  <SparkIcon size={22} />
                </span>
                <h2>Chưa phân tích được</h2>
                <p>{error}</p>
                <button
                  type="button"
                  className="btn btn--primary ctx-retry"
                  onClick={() => void analyze()}
                >
                  Thử lại
                </button>
              </article>
            ) : result ? (
              <article className="ctx-card ctx-card--result ctx-result">
                <header className="ctx-result__head">
                  <div className="ctx-result__identity">
                    <span className="ctx-result__eyebrow">
                      {result.fromCache ? 'Kết quả đã lưu' : 'Vừa phân tích'} ·{' '}
                      {posLabel(posCode)}
                    </span>
                    <div className="ctx-result__wordline">
                      <h2>{result.lemma}</h2>
                      <button
                        type="button"
                        className={`ctx-ipa${speaking === 'word' ? ' is-playing' : ''}`}
                        onClick={() => speak(result.lemma, 'word')}
                        aria-label={`Nghe phát âm ${result.lemma}`}
                      >
                        {result.phonetic ? <span>{result.phonetic}</span> : <span>Nghe</span>}
                        <SpeakerIcon size={16} />
                      </button>
                    </div>
                    {result.word && result.word.toLowerCase() !== result.lemma.toLowerCase() ? (
                      <p className="ctx-result__inflection">
                        Trong câu: <strong>{result.word}</strong>
                      </p>
                    ) : null}

                    <div className="ctx-tags">
                      {posCode ? <span className="ctx-tag">{posLabel(posCode)}</span> : null}
                      <span className="ctx-tag ctx-tag--source">
                        {sourceLabel(result.source)}
                      </span>
                      {result.fromCache ? (
                        <span className="ctx-tag ctx-tag--cache">Từ bộ nhớ</span>
                      ) : null}
                      {!result.chosenSenseId ? (
                        <span className="ctx-tag ctx-tag--soft">Chưa có nghĩa từ điển</span>
                      ) : null}
                    </div>
                  </div>

                  <div className={`ctx-confidence ctx-confidence--${confidenceTone(confidence)}`}>
                    <svg viewBox="0 0 96 96" aria-hidden="true">
                      <circle
                        className="ctx-confidence__track"
                        cx="48"
                        cy="48"
                        r="40"
                        pathLength={100}
                      />
                      <circle
                        className="ctx-confidence__value"
                        cx="48"
                        cy="48"
                        r="40"
                        pathLength={100}
                        strokeDasharray="100"
                        strokeDashoffset={100 - clampPercent(confidence)}
                      />
                    </svg>
                    <span className="ctx-confidence__number">
                      {Math.round(confidence)}
                      <em>%</em>
                    </span>
                    <span className="ctx-confidence__label">tin cậy</span>
                  </div>
                </header>

                <div className="ctx-meaning">
                  <span className="ctx-meaning__label">Nghĩa phù hợp trong câu này</span>
                  <p className="ctx-meaning__vi">{meaning || 'Chưa có nghĩa tiếng Việt.'}</p>
                  {definition ? (
                    <p className="ctx-meaning__en">{definition}</p>
                  ) : null}
                  {!result.chosenSenseId ? (
                    <p className="ctx-meaning__note">
                      Từ này chưa có trong từ điển SkyWord. Bạn vẫn có thể lưu từ ở
                      dạng gốc để ôn sau.
                    </p>
                  ) : null}
                </div>

                {result.sentenceTranslation ? (
                  <div className="ctx-translation">
                    <div className="ctx-translation__head">
                      <span>Bản dịch cả câu</span>
                      <div className="ctx-translation__tools">
                        <button
                          type="button"
                          className={`ctx-icon-button${speaking === 'sentence' ? ' is-playing' : ''}`}
                          onClick={() => speak(analyzedSentence || sentence, 'sentence')}
                          aria-label="Nghe câu tiếng Anh"
                        >
                          <SpeakerIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className={`ctx-icon-button${copied === 'translation' ? ' is-done' : ''}`}
                          onClick={() =>
                            void copyText(result.sentenceTranslation ?? '', 'translation')
                          }
                          aria-label="Sao chép bản dịch"
                        >
                          {copied === 'translation' ? (
                            <CheckIcon size={16} />
                          ) : (
                            <CopyIcon size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="ctx-translation__text">{result.sentenceTranslation}</p>
                    <span className="ctx-translation__source">
                      Dịch tự động · đối chiếu với câu gốc khi cần
                    </span>
                  </div>
                ) : null}

                <footer className="ctx-result__actions">
                  <button
                    type="button"
                    className={`btn ctx-save${saveState === 'saved' ? ' is-saved' : ''}`}
                    onClick={() => void saveWord()}
                    disabled={!canSave || saveState === 'saving' || saveState === 'saved'}
                  >
                    {saveState === 'saving' ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        Đang lưu...
                      </>
                    ) : saveState === 'saved' ? (
                      <>
                        <CheckIcon size={17} />
                        Đã lưu vào sổ từ
                      </>
                    ) : (
                      <>
                        <BookmarkIcon size={17} />
                        Lưu vào sổ từ
                      </>
                    )}
                  </button>

                  <div className="ctx-result__footnote">
                    {saveState === 'saved' ? (
                      <span className="ctx-saved-note">
                        Từ sẽ được ôn lại theo lịch ghi nhớ của bạn.{' '}
                        <Link to="/app">Về trang chủ</Link>
                      </span>
                    ) : saveError ? (
                      <span className="ctx-save-error" role="alert">
                        {saveError}
                      </span>
                    ) : (
                      <span>Lưu kèm câu gốc để lần sau ôn lại đúng ngữ cảnh.</span>
                    )}
                  </div>
                </footer>

                {result.alternatives.length > 0 ? (
                  <section className="ctx-alts" aria-label="Các nghĩa khác">
                    <div className="ctx-alts__head">
                      <h3>Nghĩa khác có thể phù hợp</h3>
                      <span>{result.alternatives.length} lựa chọn</span>
                    </div>
                    <div className="ctx-alts__list">
                      {result.alternatives.map((alternative) => {
                        const active = alternative.senseId === activeSenseId
                        return (
                          <button
                            key={alternative.senseId}
                            type="button"
                            className={`ctx-alt${active ? ' is-active' : ''}`}
                            aria-pressed={active}
                            onClick={() => setActiveSenseId(alternative.senseId)}
                          >
                            <span className="ctx-alt__main">
                              <span className="ctx-alt__pos">
                                {posLabel(alternative.partOfSpeech)}
                              </span>
                              <span className="ctx-alt__vi">{alternative.meaningVi}</span>
                              <span className="ctx-alt__en">{alternative.definitionEn}</span>
                            </span>
                            <span className="ctx-alt__side">
                              {active ? (
                                <CheckIcon size={16} />
                              ) : (
                                <span className="ctx-alt__conf">
                                  {Math.round(alternative.confidence)}%
                                </span>
                              )}
                            </span>
                            <span className="ctx-alt__bar" aria-hidden="true">
                              <span
                                style={{ width: `${clampPercent(alternative.confidence)}%` }}
                              />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ) : null}
              </article>
            ) : (
              <article className="ctx-card ctx-card--result ctx-empty">
                <div className="ctx-orbit-visual" aria-hidden="true">
                  <span className="ctx-orbit-visual__ring ctx-orbit-visual__ring--outer" />
                  <span className="ctx-orbit-visual__ring ctx-orbit-visual__ring--dash" />
                  <span className="ctx-orbit-visual__ring ctx-orbit-visual__ring--inner" />
                  <span className="ctx-orbit-visual__core">
                    <LayersIcon size={26} />
                  </span>
                </div>
                <span className="ctx-empty__eyebrow">Sẵn sàng khi bạn cần</span>
                <h2>Nghĩa đúng sẽ xuất hiện ở đây</h2>
                <p>
                  Không còn phải đoán giữa nhiều nghĩa. Một câu, một từ, và lựa
                  chọn phù hợp nhất với điều bạn đang đọc.
                </p>
                <ol className="ctx-steps">
                  <li>
                    <span>1</span>
                    Dán câu tiếng Anh đang đọc
                  </li>
                  <li>
                    <span>2</span>
                    Chạm vào từ muốn hiểu
                  </li>
                  <li>
                    <span>3</span>
                    Nhận nghĩa, bản dịch và lưu lại
                  </li>
                </ol>
              </article>
            )}
          </div>
        </section>
      </main>

      <footer className="home__foot site-shell">
        <span>© 2026 SkyWord English</span>
        <Link to="/welcome">Giới thiệu SkyWord</Link>
      </footer>

      <OrbitMenu open={menuOpen} onClose={() => setMenuOpen(false)} userName={firstName} />
    </div>
  )
}
