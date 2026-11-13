import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  PlayIcon,
  SpeakerIcon,
  SparkIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  finishStudySessionRequest,
  nextStudyCardRequest,
  startStudySessionRequest,
  submitStudyAnswerRequest,
  type StudyCard,
  type StudySession,
  type StudySummary,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import { useAppData } from '../components/layout/AppLayout'
import '../styles/review.css'

const QUALITIES = [
  { value: 1, label: 'Quên', hint: '1', tone: 'bad' },
  { value: 3, label: 'Khó', hint: '2', tone: 'warn' },
  { value: 4, label: 'Tốt', hint: '3', tone: 'ok' },
  { value: 5, label: 'Dễ', hint: '4', tone: 'gold' },
] as const

function speak(url: string | null | undefined, text: string) {
  if (url) {
    new Audio(url).play().catch(() => {
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text))
    })
    return
  }
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }
}

export function ReviewPage() {
  const { run } = useAuthedApi()
  const { dashboard, reload } = useAppData()
  const [session, setSession] = useState<StudySession | null>(null)
  const [card, setCard] = useState<StudyCard | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(0)
  const [cardShownAt, setCardShownAt] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastQuality, setLastQuality] = useState<number | null>(null)
  const [summary, setSummary] = useState<StudySummary | null>(null)
  const limit = 20
  const finishing = useRef(false)

  const finish = useCallback(
    async (sessionId: number) => {
      if (finishing.current) return
      finishing.current = true
      try {
        const result = await run((token) => finishStudySessionRequest(token, sessionId))
        setSummary(result)
        setCard(null)
        reload()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Chưa kết thúc được phiên ôn.')
      } finally {
        finishing.current = false
      }
    },
    [reload, run],
  )

  const loadNext = useCallback(
    async (sessionId: number) => {
      setFlipped(false)
      setLastQuality(null)
      try {
        const next = await run((token) => nextStudyCardRequest(token, sessionId, 'flashcard'))
        if (!next) {
          await finish(sessionId)
          return
        }
        setCard(next)
        setCardShownAt(Date.now())
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Chưa tải được thẻ tiếp theo.')
      }
    },
    [finish, run],
  )

  async function start() {
    setLoading(true)
    setError('')
    setSummary(null)
    setAnswered(0)
    finishing.current = false
    try {
      const nextSession = await run((token) => startStudySessionRequest(token, 'review', limit))
      setSession(nextSession)
      await loadNext(nextSession.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa bắt đầu được phiên ôn.')
    } finally {
      setLoading(false)
    }
  }

  async function rate(quality: number) {
    if (!session || !card || lastQuality !== null) return
    setLastQuality(quality)
    try {
      await run((token) =>
        submitStudyAnswerRequest(token, session.id, {
          userWordId: card.userWordId,
          exerciseTypeCode: card.exerciseTypeCode,
          quality,
          responseMs: Date.now() - cardShownAt,
        }),
      )
      setAnswered((value) => value + 1)
      window.setTimeout(() => {
        void loadNext(session.id)
      }, 480)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa ghi nhận được câu trả lời.')
      setLastQuality(null)
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!card) return
      if (event.code === 'Space') {
        event.preventDefault()
        setFlipped((value) => !value)
        return
      }
      if (flipped && ['1', '2', '3', '4'].includes(event.key)) {
        const quality = QUALITIES[Number(event.key) - 1]
        if (quality) rate(quality.value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, flipped, lastQuality])

  const dueCount = dashboard?.dueCount ?? 0
  const progress = Math.min(100, (answered / limit) * 100)

  if (summary) {
    return (
      <div className="review review--summary">
        <Card className="review-summary">
          <span className="review-summary__art"><TrophyIcon size={44} /></span>
          <span className="eyebrow"><SparkIcon size={14} /> Hoàn thành phiên ôn</span>
          <h1>{summary.answered === 0 ? 'Chưa có thẻ nào để ôn' : 'Nimbo tự hào về bạn!'}</h1>
          <div className="review-summary__metrics">
            <div><strong>{summary.answered}</strong><span>thẻ đã ôn</span></div>
            <div><strong>{Math.round(summary.accuracyPct)}%</strong><span>chính xác</span></div>
            <div><strong>{summary.minutes}</strong><span>phút học</span></div>
          </div>
          <p>
            {summary.answered === 0
              ? 'Hiện chưa có từ nào đến hạn. Hãy thêm từ mới hoặc quay lại sau nhé.'
              : 'Các từ vừa ôn đã được xếp lịch quay lại đúng lúc bạn sắp quên.'}
          </p>
          <div className="review-summary__actions">
            <Button onClick={start}><PlayIcon size={15} /> Ôn tiếp</Button>
            <Link to="/app/vocabulary" className="btn btn--sec">Về sổ từ</Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="review">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><ClockIcon size={14} /> Ôn tập ngắt quãng</span>
          <h1>Ôn đúng lúc, nhớ lâu hơn</h1>
          <p>SM-2 chọn thời điểm bạn sắp quên. Lật thẻ rồi tự chấm mức độ nhớ.</p>
        </div>
        {session ? (
          <div className="page-head__actions">
            <Button size="sm" variant="secondary" onClick={() => finish(session.id)}>
              Kết thúc
            </Button>
          </div>
        ) : null}
      </header>

      {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

      {!session ? (
        <Card className="review-intro">
          <div className="review-intro__copy">
            <Chip tone="gold"><ClockIcon size={12} /> {dueCount} từ đến hạn</Chip>
            <h2>Sẵn sàng ôn {Math.min(dueCount, limit)} thẻ?</h2>
            <p>
              Mỗi thẻ chỉ mất vài giây. Bạn tự chấm Quên / Khó / Tốt / Dễ để hệ
              thống tính lần quay lại tiếp theo.
            </p>
            <div className="review-intro__actions">
              <Button onClick={start} disabled={loading}>
                {loading ? <span className="spinner" /> : <PlayIcon size={16} />}
                {loading ? 'Đang chuẩn bị...' : 'Bắt đầu ôn'}
              </Button>
              <Link to="/app/vocabulary" className="btn btn--sec">Xem sổ từ</Link>
            </div>
          </div>
          <span className="review-intro__art"><ClockIcon size={52} /></span>
        </Card>
      ) : card ? (
        <div className="review-stage">
          <div className="review-progress">
            <span>Thẻ {answered + 1}</span>
            <div className="progress progress--slim"><i style={{ width: `${progress}%` }} /></div>
            <span>{answered} đã ôn</span>
          </div>

          <button
            type="button"
            className={`flip-card${flipped ? ' is-flipped' : ''}`}
            onClick={() => setFlipped((value) => !value)}
            aria-label={flipped ? 'Lật lại mặt trước' : 'Lật thẻ để xem nghĩa'}
          >
            <span className="flip-card__inner">
              <span className="flip-card__face flip-card__front">
                <span className="flip-card__label">{card.exerciseTypeName}</span>
                <strong>{card.lemma}</strong>
                {card.phonetic ? <em>{card.phonetic}</em> : null}
                <span className="flip-card__hint">Chạm hoặc nhấn Space để lật thẻ</span>
                {card.audioUrl ? (
                  <span
                    className="flip-card__audio"
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      speak(card.audioUrl, card.lemma)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation()
                        speak(card.audioUrl, card.lemma)
                      }
                    }}
                  >
                    <SpeakerIcon size={16} /> Nghe
                  </span>
                ) : null}
              </span>
              <span className="flip-card__face flip-card__back">
                <span className="flip-card__label">Nghĩa</span>
                <strong>{card.meaningVi}</strong>
                <p>{card.definitionEn}</p>
                {card.contextSentence ? (
                  <blockquote>“{card.contextSentence}”</blockquote>
                ) : null}
                <Chip tone="line">{card.partOfSpeech}</Chip>
              </span>
            </span>
          </button>

          <div className="review-rate" aria-label="Chấm mức độ nhớ">
            {QUALITIES.map((quality) => (
              <button
                key={quality.value}
                type="button"
                className={`review-rate__btn review-rate__btn--${quality.tone}${lastQuality === quality.value ? ' is-picked' : ''}`}
                onClick={() => rate(quality.value)}
                disabled={!flipped || lastQuality !== null}
              >
                <b>{quality.label}</b>
                <span>{quality.hint}</span>
              </button>
            ))}
          </div>
          <p className="review-hint">
            {flipped ? 'Chấm đúng mức bạn nhớ. Phím 1–4 cũng dùng được.' : 'Lật thẻ trước khi chấm điểm nhé.'}
          </p>

          {lastQuality !== null ? (
            <FeedbackBar tone={lastQuality >= 4 ? 'ok' : lastQuality === 3 ? 'warn' : 'bad'}>
              Đã ghi nhận. Chuẩn bị thẻ tiếp theo...
            </FeedbackBar>
          ) : null}
        </div>
      ) : (
        <Card>
          <div className="skeleton" style={{ height: 260 }} />
        </Card>
      )}

      <Card flat className="review-tip">
        <CheckIcon size={18} />
        <p>
          Không cần cố nhớ hoàn hảo. Chấm trung thực giúp lịch ôn chính xác hơn.
        </p>
        <Link to="/app/vocabulary" className="rail-link">
          <BookmarkIcon size={13} /> Thêm từ mới <ArrowRightIcon size={13} />
        </Link>
      </Card>
    </div>
  )
}
