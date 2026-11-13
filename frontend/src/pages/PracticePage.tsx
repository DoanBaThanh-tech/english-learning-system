import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  PlayIcon,
  SearchIcon,
  SpeakerIcon,
  TargetIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  finishStudySessionRequest,
  nextStudyCardRequest,
  startStudySessionRequest,
  submitStudyAnswerRequest,
  type StudyAnswerResult,
  type StudyCard,
  type StudySession,
  type StudySummary,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import { useAppData } from '../components/layout/AppLayout'
import '../styles/practice.css'

const TYPES = [
  { code: 'multiple_choice', label: 'Trắc nghiệm', hint: 'Chọn nghĩa đúng', icon: TargetIcon },
  { code: 'fill_blank', label: 'Điền từ', hint: 'Điền vào câu', icon: SearchIcon },
  { code: 'dictation', label: 'Nghe chép', hint: 'Nghe rồi viết lại', icon: SpeakerIcon },
] as const

function speakWord(text: string, url?: string | null) {
  if (url) {
    new Audio(url).play().catch(() => undefined)
    return
  }
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }
}

function shorten(text: string, max = 110) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

export function PracticePage() {
  const { run } = useAuthedApi()
  const { reload } = useAppData()
  const [type, setType] = useState<string>('multiple_choice')
  const [session, setSession] = useState<StudySession | null>(null)
  const [card, setCard] = useState<StudyCard | null>(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<StudyAnswerResult | null>(null)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<StudySummary | null>(null)
  const shownAt = useRef(0)
  const limit = 10

  const finish = useCallback(
    async (id: number) => {
      try {
        const data = await run((token) => finishStudySessionRequest(token, id))
        setSummary(data)
        setCard(null)
        setSession(null)
        reload()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Chưa kết thúc được phiên luyện.')
      }
    },
    [reload, run],
  )

  const loadNext = useCallback(
    async (id: number, cardType: string) => {
      setAnswer('')
      setResult(null)
      try {
        const next = await run((token) => nextStudyCardRequest(token, id, cardType))
        if (!next) {
          await finish(id)
          return
        }
        setCard(next)
        shownAt.current = Date.now()
        if (next.exerciseTypeCode === 'dictation') {
          window.setTimeout(() => speakWord(next.lemma, next.audioUrl), 250)
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Chưa tải được câu hỏi.')
      }
    },
    [finish, run],
  )

  async function start(nextType = type) {
    setLoading(true)
    setError('')
    setSummary(null)
    setAnswered(0)
    setCorrect(0)
    setType(nextType)
    try {
      const nextSession = await run((token) =>
        startStudySessionRequest(token, 'learn', limit, nextType),
      )
      setSession(nextSession)
      await loadNext(nextSession.id, nextType)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa bắt đầu được phiên luyện.')
    } finally {
      setLoading(false)
    }
  }

  async function check() {
    if (!session || !card || submitting) return
    const value = answer.trim()
    if (!value) {
      setError('Chọn hoặc nhập câu trả lời trước khi kiểm tra nhé.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const data = await run((token) =>
        submitStudyAnswerRequest(token, session.id, {
          userWordId: card.userWordId,
          exerciseTypeCode: card.exerciseTypeCode,
          userAnswer: value,
          responseMs: Date.now() - shownAt.current,
        }),
      )
      setResult(data)
      setAnswered((count) => count + 1)
      if (data.isCorrect) setCorrect((count) => count + 1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa kiểm tra được câu trả lời.')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = Math.min(100, (answered / limit) * 100)

  if (summary) {
    return (
      <div className="practice">
        <Card className="practice-summary">
          <span className="practice-summary__art"><TrophyIcon size={42} /></span>
          <span className="eyebrow">Hoàn thành bài luyện</span>
          <h1>{summary.answered === 0 ? 'Chưa có từ để luyện' : 'Làm tốt lắm!'}</h1>
          <div className="practice-metrics">
            <div><strong>{summary.answered}</strong><span>câu</span></div>
            <div><strong>{Math.round(summary.accuracyPct)}%</strong><span>chính xác</span></div>
            <div><strong>{summary.minutes}</strong><span>phút</span></div>
          </div>
          <p>Các từ vừa luyện đã được cập nhật vào lịch ôn của bạn.</p>
          <div className="practice-summary__actions">
            <Button onClick={() => start(type)}><PlayIcon size={15} /> Luyện tiếp</Button>
            <Link to="/app" className="btn btn--sec">Về trang Học</Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="practice">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><TargetIcon size={14} /> Luyện tập</span>
          <h1>Luyện đúng dạng bài bạn cần</h1>
          <p>Trắc nghiệm, điền từ và nghe chép chính tả — có phản hồi ngay.</p>
        </div>
        {session ? (
          <div className="page-head__actions">
            <Button size="sm" variant="secondary" onClick={() => finish(session.id)}>Kết thúc</Button>
          </div>
        ) : null}
      </header>

      {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

      {!session ? (
        <>
          <Card className="practice-intro">
            <div>
              <h2>Chọn dạng bài</h2>
              <p>Nimbo sẽ lấy từ trong sổ và tạo câu hỏi phù hợp. Mỗi phiên 10 câu.</p>
            </div>
            <span className="practice-intro__art"><TargetIcon size={48} /></span>
          </Card>
          <div className="practice-types">
            {TYPES.map((item) => {
              const Icon = item.icon
              return (
                <button key={item.code} type="button" className="practice-type" onClick={() => start(item.code)}>
                  <span className="learn-quick__icon"><Icon size={20} /></span>
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                  <ArrowRightIcon size={15} />
                </button>
              )
            })}
          </div>
          <Card flat className="practice-note">
            <ClockIcon size={18} />
            <p>Chưa có từ trong sổ? Hãy <Link to="/app/dictionary">tra từ</Link> hoặc <Link to="/app/vocabulary">thêm từ</Link> trước nhé.</p>
          </Card>
        </>
      ) : card ? (
        <div className="practice-stage">
          <div className="practice-progress">
            <span>Câu {answered + 1}/{limit}</span>
            <ProgressBar value={progress} label="Tiến độ bài luyện" />
            <Chip tone="ok">{correct} đúng</Chip>
          </div>

          <Card className="practice-question">
            <div className="practice-question__top">
              <Chip tone="line">{card.exerciseTypeName}</Chip>
              <Chip>{card.partOfSpeech}</Chip>
            </div>

            {card.exerciseTypeCode === 'multiple_choice' ? (
              <>
                <h2>{card.definitionEn}</h2>
                <p className="practice-question__sub">Chọn nghĩa tiếng Việt đúng</p>
                <div className="practice-options">
                  {card.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`practice-option${answer === option ? ' is-selected' : ''}${
                        result ? (option === result.correctAnswer ? ' is-right' : '') : ''
                      }`}
                      onClick={() => !result && setAnswer(option)}
                      disabled={Boolean(result)}
                    >
                      {shorten(option)}
                      {result && option === result.correctAnswer ? <CheckIcon size={15} /> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : card.exerciseTypeCode === 'fill_blank' ? (
              <>
                <h2>{card.contextSentence ?? card.definitionEn}</h2>
                <p className="practice-question__sub">Điền từ còn thiếu (gợi ý: {card.meaningVi})</p>
                <Input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Nhập từ..."
                  disabled={Boolean(result)}
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void check()
                  }}
                />
              </>
            ) : (
              <>
                <h2>Nghe và chép lại từ</h2>
                <p className="practice-question__sub">Bấm loa để nghe lại, rồi viết đúng từ.</p>
                <button type="button" className="practice-listen" onClick={() => speakWord(card.lemma, card.audioUrl)}>
                  <SpeakerIcon size={22} /> Nghe lại
                </button>
                <Input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Gõ từ bạn nghe được..."
                  disabled={Boolean(result)}
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void check()
                  }}
                />
              </>
            )}

            {result ? (
              <FeedbackBar
                tone={result.isCorrect ? 'ok' : 'bad'}
                title={result.isCorrect ? 'Chính xác!' : 'Chưa đúng'}
                action={
                  <Button size="sm" onClick={() => loadNext(session.id, type)}>
                    Tiếp tục <ArrowRightIcon size={14} />
                  </Button>
                }
              >
                {result.isCorrect
                  ? 'Nimbo cộng điểm và hẹn bạn ôn lại đúng lúc.'
                  : `Đáp án đúng: ${result.correctAnswer}. ${result.message}`}
              </FeedbackBar>
            ) : (
              <Button block onClick={check} disabled={submitting || !answer.trim()}>
                {submitting ? <span className="spinner" /> : <CheckIcon size={16} />}
                {submitting ? 'Đang kiểm tra...' : 'KIỂM TRA'}
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <Card><div className="skeleton" style={{ height: 280 }} /></Card>
      )}
    </div>
  )
}
