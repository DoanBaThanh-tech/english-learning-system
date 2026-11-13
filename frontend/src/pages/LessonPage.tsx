import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
  SparkIcon,
  SpeakerIcon,
  TrophyIcon,
} from '../components/Icons'
import { CloudBuddy, CLOUD_FRIENDS } from '../components/mascot/CloudBuddy'
import { CloudFriends, type CloudMood } from '../components/mascot/CloudFriends'
import {
  ALL_LEVELS,
  EXERCISE_LABEL,
  findLevel,
  levelIndex,
  unitOfLevel,
  type CourseLevel,
  type Exercise,
} from '../lib/curriculum'
import {
  isLevelUnlocked,
  useCourseProgress,
} from '../lib/courseProgress'
import { ApiError, addWordByLemmaRequest } from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import { useAuth } from '../lib/AuthContext'
import { speakEnglish } from '../lib/speech'
import '../styles/lesson.css'

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:"“”'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

type Token = { id: number; text: string }

export function LessonPage() {
  const { levelId } = useParams()
  const level = findLevel(levelId)
  if (!level) {
    return (
      <div className="lesson lesson--center">
        <Card className="lesson-missing">
          <CloudBuddy friend="lumi" size={110} pose="sad" />
          <h1>Không tìm thấy level này</h1>
          <p>Level có thể đã đổi tên. Quay về bản đồ khóa học để chọn lại nhé.</p>
          <Link to="/app" className="btn">Về bản đồ</Link>
        </Card>
      </div>
    )
  }
  return <LessonRunner key={level.id} level={level} />
}

function LessonRunner({ level }: { level: CourseLevel }) {
  const { user } = useAuth()
  const { run } = useAuthedApi()
  const { progress, complete } = useCourseProgress(user?.email)
  const flatIndex = levelIndex(level.id)
  const unlocked = isLevelUnlocked(progress, flatIndex)
  const unit = unitOfLevel(level)

  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [phase, setPhase] = useState<'play' | 'done'>('play')
  const [hearts, setHearts] = useState(5)
  const [correctCount, setCorrectCount] = useState(0)
  const [xp, setXp] = useState(0)
  const [result, setResult] = useState<{ ok: boolean; answer: string; explain: string } | null>(null)
  const [summary, setSummary] = useState<{ accuracy: number; stars: number; xp: number } | null>(null)

  const [selected, setSelected] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [bank, setBank] = useState<Token[]>([])
  const [order, setOrder] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [pickLeft, setPickLeft] = useState<number | null>(null)
  const [flash, setFlash] = useState<string[]>([])
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'done'>('idle')
  const [saveNote, setSaveNote] = useState('')
  const finishedRef = useRef(false)

  const exercise: Exercise = level.exercises[index]
  const total = level.exercises.length
  const friend = CLOUD_FRIENDS[exercise.friend]

  const rightOrder = useMemo(
    () => (exercise.kind === 'match' ? shuffle(exercise.pairs.map((_, position) => position)) : []),
    [exercise],
  )

  useEffect(() => {
    setSelected(null)
    setText('')
    setResult(null)
    setMatched([])
    setPickLeft(null)
    setFlash([])
    setOrder([])
    if (exercise.kind === 'order') {
      const tokens = exercise.tokens.map((textValue, id) => ({ id, text: textValue }))
      setBank(shuffle(tokens))
    } else {
      setBank([])
    }
  }, [exercise, index, attempt])

  useEffect(() => {
    if (exercise.kind !== 'listen') return
    const timer = window.setTimeout(() => speakEnglish(exercise.audio), 320)
    return () => window.clearTimeout(timer)
  }, [exercise])

  useEffect(() => {
    if (hearts > 0) return
    const timer = window.setTimeout(() => setHearts(5), 1400)
    return () => window.clearTimeout(timer)
  }, [hearts])

  if (!unlocked) {
    const previous = ALL_LEVELS[flatIndex - 1]
    return (
      <div className="lesson lesson--center">
        <Card className="lesson-missing">
          <CloudBuddy friend="lumi" size={120} pose="think" />
          <Chip tone="line"><LockIcon size={12} /> Level đang khóa</Chip>
          <h1>Học level trước đã nhé!</h1>
          <p>
            {previous
              ? `Hoàn thành “${previous.title}” để Nimbo mở khóa level này.`
              : 'Level này chưa mở.'}
          </p>
          <div className="lesson-missing__actions">
            <Link to="/app" className="btn">Về bản đồ</Link>
            {previous ? (
              <Link to={`/app/lesson/${previous.id}`} className="btn btn--sec">
                Học level trước
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    )
  }

  function loseHeart() {
    setHearts((value) => Math.max(0, value - 1))
  }

  const canCheck =
    !result &&
    (exercise.kind === 'choice'
      ? selected !== null
      : exercise.kind === 'match'
        ? matched.length === exercise.pairs.length
        : exercise.kind === 'order'
          ? order.length > 0
          : text.trim().length > 0)

  function check() {
    if (!canCheck) return
    let ok = false
    let answer = ''
    if (exercise.kind === 'choice') {
      answer = exercise.answer
      ok = selected !== null && exercise.options[selected] === exercise.answer
    } else if (exercise.kind === 'match') {
      answer = exercise.pairs.map((pair) => `${pair.en} = ${pair.vi}`).join(' · ')
      // Ghép đủ cặp là hoàn thành; mỗi lần chọn sai đã bị trừ tim ngay khi ghép.
      ok = true
    } else if (exercise.kind === 'order') {
      answer = exercise.answer
      const built = order.map((id) => exercise.tokens[id] ?? '').join(' ')
      ok = normalize(built) === normalize(exercise.answer)
    } else {
      answer = exercise.answer
      ok = normalize(text) === normalize(exercise.answer)
    }

    if (ok) {
      setCorrectCount((value) => value + 1)
      setXp((value) => value + 10)
    } else {
      loseHeart()
    }
    setResult({ ok, answer, explain: exercise.explain })
  }

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1
    const earned = xp + 10 + (stars === 3 ? 10 : 0)
    complete(level.id, { stars, accuracy, xp: earned })
    setSummary({ accuracy: Math.round(accuracy), stars, xp: earned })
    setPhase('done')
    setResult(null)
  }

  function advance() {
    if (index + 1 >= total) {
      finish()
      return
    }
    setIndex((value) => value + 1)
  }

  function restart() {
    finishedRef.current = false
    setAttempt((value) => value + 1)
    setIndex(0)
    setHearts(5)
    setCorrectCount(0)
    setXp(0)
    setPhase('play')
    setSummary(null)
    setResult(null)
    setSaveState('idle')
    setSaveNote('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function tryMatch(rightIndex: number) {
    if (result || matched.includes(rightIndex)) return
    if (pickLeft === null) {
      setFlash([`r-${rightIndex}`])
      window.setTimeout(() => setFlash([]), 420)
      return
    }
    if (pickLeft === rightIndex) {
      setMatched((values) => [...values, rightIndex])
      setPickLeft(null)
      setFlash([])
      return
    }
    loseHeart()
    setFlash([`l-${pickLeft}`, `r-${rightIndex}`])
    setPickLeft(null)
    window.setTimeout(() => setFlash([]), 480)
  }

  async function saveWords() {
    if (saveState !== 'idle') return
    setSaveState('saving')
    setSaveNote('')
    let saved = 0
    let missing = 0
    for (const word of level.words) {
      try {
        await run((token) =>
          addWordByLemmaRequest(token, {
            lemma: word.lemma,
            contextSentence: word.example,
          }),
        )
        saved += 1
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 409) saved += 1
        else missing += 1
      }
    }
    setSaveState('done')
    setSaveNote(
      missing > 0
        ? `Đã lưu ${saved} từ. ${missing} từ chưa có trong từ điển, bạn có thể tra tay nhé.`
        : `Đã lưu ${saved} từ vào sổ từ để Nimbo nhắc bạn ôn.`,
    )
  }

  if (phase === 'done' && summary) {
    const next = ALL_LEVELS[flatIndex + 1] ?? null
    return (
      <div className="lesson lesson--done">
        <div className="lesson-done">
          <div className="lesson-done__stage">
            <CloudFriends mood="cheer" ariaLabel="Nimbo, Lumi và Pip đang reo mừng" />
          </div>
          <span className="eyebrow"><TrophyIcon size={14} /> Hoàn thành level</span>
          <h1>{summary.stars === 3 ? 'Quá đỉnh, Nimbo tự hào về bạn!' : 'Xong level rồi, giỏi lắm!'}</h1>
          <p className="lesson-done__sub">
            {unit?.title} · {level.title}
          </p>

          <div className="lesson-stars" aria-label={`${summary.stars} trên 3 sao`}>
            {[0, 1, 2].map((star) => (
              <Star key={star} filled={star < summary.stars} />
            ))}
          </div>

          <div className="lesson-done__metrics">
            <div><strong>{summary.accuracy}%</strong><span>chính xác</span></div>
            <div><strong>{correctCount}/{total}</strong><span>câu đúng</span></div>
            <div><strong>+{summary.xp}</strong><span>XP</span></div>
          </div>

          <div className="lesson-words">
            <div className="lesson-words__head">
              <h2>Từ vựng của level</h2>
              <span>{level.words.length} từ</span>
            </div>
            <ul>
              {level.words.map((word) => (
                <li key={word.lemma}>
                  <button
                    type="button"
                    className="lesson-words__say"
                    onClick={() => speakEnglish(word.lemma)}
                    aria-label={`Nghe phát âm ${word.lemma}`}
                  >
                    <SpeakerIcon size={15} />
                  </button>
                  <div>
                    <strong>{word.lemma}</strong>
                    <em>{word.ipa}</em>
                  </div>
                  <span>{word.meaning}</span>
                </li>
              ))}
            </ul>
            <div className="lesson-words__actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={saveWords}
                disabled={saveState === 'saving' || saveState === 'done'}
              >
                {saveState === 'saving' ? <span className="spinner" /> : <BookIcon size={15} />}
                {saveState === 'done' ? 'Đã lưu vào sổ từ' : 'Lưu từ vào sổ'}
              </Button>
              {saveNote ? <p>{saveNote}</p> : null}
            </div>
          </div>

          <div className="lesson-done__actions">
            <Button onClick={restart} variant="secondary">Học lại level</Button>
            <Link to="/app" className="btn btn--sec">Về bản đồ</Link>
            {next ? (
              <Link to={`/app/lesson/${next.id}`} className="btn">
                Level tiếp <ArrowRightIcon size={15} />
              </Link>
            ) : null}
          </div>
          {!next ? (
            <p className="lesson-done__finish">
              <TrophyIcon size={16} /> Bạn đã hoàn thành cả 12 level của khóa Nimbus!
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  const progressPct = Math.round(((index + (result ? 1 : 0)) / total) * 100)
  const stageMood: CloudMood = result ? (result.ok ? 'cheer' : 'sad') : 'idle'
  const buddyPose = result ? (result.ok ? 'cheer' : 'sad') : 'idle'

  return (
    <div className="lesson">
      <header className="lesson__top">
        <Link to="/app" className="lesson__close" aria-label="Thoát bài học">
          <CloseIcon size={20} />
        </Link>
        <div className="lesson__progress-wrap">
          <div
            className="lesson__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label="Tiến độ bài học"
          >
            <i style={{ width: `${progressPct}%` }} />
          </div>
          <span>
            {unit ? `Unit ${unit.cefr}` : 'Khóa Nimbus'} · Level {level.title} · Câu {index + 1}/{total}
          </span>
        </div>
        <div className="lesson__hearts" aria-label={`${hearts} trên 5 trái tim`}>
          {[0, 1, 2, 3, 4].map((heart) => (
            <Heart key={heart} filled={heart < hearts} />
          ))}
          <b>{hearts}</b>
        </div>
      </header>

      <div className="lesson__body">
        <section className="lesson__main">
          <div className="lesson__buddy">
            <CloudBuddy friend={exercise.friend} size={62} pose={buddyPose} decorative />
            <div>
              <strong>{friend.name}</strong>
              <span>{exercise.prompt}</span>
            </div>
            <Chip tone="line">{EXERCISE_LABEL[exercise.kind]}</Chip>
          </div>

          <div className="lesson__quiz">
            {exercise.kind === 'choice' ? (
              <ChoiceView
                exercise={exercise}
                selected={selected}
                result={result}
                onSelect={setSelected}
              />
            ) : null}

            {exercise.kind === 'match' ? (
              <MatchView
                exercise={exercise}
                rightOrder={rightOrder}
                matched={matched}
                pickLeft={pickLeft}
                flash={flash}
                result={Boolean(result)}
                onPickLeft={setPickLeft}
                onPickRight={tryMatch}
              />
            ) : null}

            {exercise.kind === 'order' ? (
              <OrderView
                exercise={exercise}
                bank={bank}
                order={order}
                result={Boolean(result)}
                onAdd={(id) => {
                  const token = bank.find((item) => item.id === id)
                  if (!token) return
                  setBank((values) => values.filter((item) => item.id !== id))
                  setOrder((values) => [...values, id])
                }}
                onRemove={(id) => {
                  setOrder((values) => values.filter((item) => item !== id))
                  const removed = exercise.tokens[id]
                  if (removed !== undefined) {
                    setBank((values) => [...values, { id, text: removed }])
                  }
                }}
              />
            ) : null}

            {exercise.kind === 'listen' ? (
              <ListenView
                exercise={exercise}
                text={text}
                result={Boolean(result)}
                onChange={setText}
                onPlay={() => speakEnglish(exercise.audio)}
                onSubmit={check}
              />
            ) : null}

            {exercise.kind === 'fill' ? (
              <FillView
                exercise={exercise}
                text={text}
                result={Boolean(result)}
                onChange={setText}
                onSubmit={check}
              />
            ) : null}
          </div>

          {result ? (
            <FeedbackBar
              tone={result.ok ? 'ok' : 'bad'}
              title={result.ok ? 'Chính xác!' : `Chưa đúng · Đáp án: ${result.answer}`}
              action={
                <Button size="sm" onClick={advance}>
                  {index + 1 >= total ? 'Xem kết quả' : 'Tiếp tục'}
                  <ArrowRightIcon size={14} />
                </Button>
              }
            >
              <span>{result.explain}</span>
              {hearts === 0 ? <span className="lesson__refill"> Nimbo tiếp thêm 5 tim để bạn học tiếp.</span> : null}
            </FeedbackBar>
          ) : (
            <Button block onClick={check} disabled={!canCheck}>
              <CheckIcon size={16} /> KIỂM TRA
            </Button>
          )}
        </section>

        <aside className="lesson__stage">
          <CloudFriends mood={stageMood} />
          <div className="lesson__speech">
            <SparkIcon size={14} />
            <p>
              {result
                ? result.ok
                  ? `${friend.name} reo lên: “Đúng rồi! Thêm 10 XP nhé.”`
                  : `${friend.name} bảo đừng lo, xem đáp án rồi đi tiếp.`
                : `${friend.name}: “Bình tĩnh đọc kỹ rồi chọn nhé!”`}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ChoiceView({
  exercise,
  selected,
  result,
  onSelect,
}: {
  exercise: Extract<Exercise, { kind: 'choice' }>
  selected: number | null
  result: { ok: boolean; answer: string } | null
  onSelect: (index: number) => void
}) {
  return (
    <>
      <h2 className="lesson__question">{exercise.question}</h2>
      <div className="lesson-options">
        {exercise.options.map((option, index) => {
          const isCorrect = Boolean(result) && option === exercise.answer
          const isWrong = Boolean(result) && selected === index && option !== exercise.answer
          return (
            <button
              key={option}
              type="button"
              className={`lesson-option${selected === index ? ' is-selected' : ''}${
                isCorrect ? ' is-right' : ''
              }${isWrong ? ' is-wrong' : ''}`}
              onClick={() => !result && onSelect(index)}
              disabled={Boolean(result)}
            >
              <span>{option}</span>
              {isCorrect ? <CheckIcon size={16} /> : null}
            </button>
          )
        })}
      </div>
    </>
  )
}

function MatchView({
  exercise,
  rightOrder,
  matched,
  pickLeft,
  flash,
  result,
  onPickLeft,
  onPickRight,
}: {
  exercise: Extract<Exercise, { kind: 'match' }>
  rightOrder: number[]
  matched: number[]
  pickLeft: number | null
  flash: string[]
  result: boolean
  onPickLeft: (index: number) => void
  onPickRight: (index: number) => void
}) {
  return (
    <>
      <h2 className="lesson__question">Ghép từ tiếng Anh với nghĩa đúng</h2>
      <p className="lesson__hint">Chọn một từ bên trái, rồi chọn nghĩa bên phải.</p>
      <div className="lesson-match">
        <div className="lesson-match__col">
          {exercise.pairs.map((pair, index) => (
            <button
              key={pair.en}
              type="button"
              className={`lesson-token${pickLeft === index ? ' is-selected' : ''}${
                matched.includes(index) ? ' is-matched' : ''
              }${flash.includes(`l-${index}`) ? ' is-wrong' : ''}`}
              onClick={() => !result && !matched.includes(index) && onPickLeft(index)}
              disabled={result || matched.includes(index)}
            >
              {pair.en}
            </button>
          ))}
        </div>
        <div className="lesson-match__col">
          {rightOrder.map((index) => (
            <button
              key={exercise.pairs[index].vi}
              type="button"
              className={`lesson-token${matched.includes(index) ? ' is-matched' : ''}${
                flash.includes(`r-${index}`) ? ' is-wrong' : ''
              }`}
              onClick={() => onPickRight(index)}
              disabled={result || matched.includes(index)}
            >
              {exercise.pairs[index].vi}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function OrderView({
  exercise,
  bank,
  order,
  result,
  onAdd,
  onRemove,
}: {
  exercise: Extract<Exercise, { kind: 'order' }>
  bank: Token[]
  order: number[]
  result: boolean
  onAdd: (id: number) => void
  onRemove: (id: number) => void
}) {
  const tokenById = (id: number): Token | undefined =>
    exercise.tokens[id] !== undefined ? { id, text: exercise.tokens[id] } : undefined
  return (
    <>
      <h2 className="lesson__question">Xếp các từ thành câu đúng</h2>
      <p className="lesson__hint">Gợi ý: {exercise.hint}</p>
      <div className={`lesson-order__answer${order.length === 0 ? ' is-empty' : ''}`}>
        {order.length === 0 ? <span>Chạm vào các từ bên dưới…</span> : null}
        {order.map((id) => {
          const token = tokenById(id)
          return token ? (
            <button
              key={id}
              type="button"
              className="lesson-token"
              onClick={() => !result && onRemove(id)}
              disabled={result}
            >
              {token.text}
            </button>
          ) : null
        })}
      </div>
      <div className="lesson-order__bank">
        {bank.map((token) => (
          <button
            key={token.id}
            type="button"
            className="lesson-token"
            onClick={() => !result && onAdd(token.id)}
            disabled={result}
          >
            {token.text}
          </button>
        ))}
      </div>
    </>
  )
}

function ListenView({
  exercise,
  text,
  result,
  onChange,
  onPlay,
  onSubmit,
}: {
  exercise: Extract<Exercise, { kind: 'listen' }>
  text: string
  result: boolean
  onChange: (value: string) => void
  onPlay: () => void
  onSubmit: () => void
}) {
  return (
    <>
      <h2 className="lesson__question">Nghe và chép lại</h2>
      <p className="lesson__hint">Gợi ý: {exercise.hint}</p>
      <button type="button" className="lesson-listen" onClick={onPlay} aria-label="Nghe lại câu">
        <span><SpeakerIcon size={26} /></span>
        <div>
          <strong>Nghe câu</strong>
          <em>Bấm để nghe lại, ở tốc độ chậm</em>
        </div>
      </button>
      <Input
        value={text}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Gõ câu bạn nghe được…"
        aria-label="Câu bạn nghe được"
        disabled={result}
        autoFocus
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit()
        }}
      />
    </>
  )
}

function FillView({
  exercise,
  text,
  result,
  onChange,
  onSubmit,
}: {
  exercise: Extract<Exercise, { kind: 'fill' }>
  text: string
  result: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  const [before, after] = exercise.sentence.split('___')
  return (
    <>
      <h2 className="lesson__question">Điền từ còn thiếu</h2>
      <p className="lesson__hint">Gợi ý: {exercise.hint}</p>
      <div className="lesson-fill">
        <span>{before}</span>
        <span className="lesson-fill__blank">{text.trim() || '___'}</span>
        <span>{after}</span>
      </div>
      <Input
        value={text}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nhập từ còn thiếu…"
        aria-label="Từ còn thiếu"
        disabled={result}
        autoFocus
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit()
        }}
      />
    </>
  )
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      className={`lesson-star${filled ? ' is-filled' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className={`lesson-heart${filled ? ' is-filled' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M12 20.2s-7.1-4.5-9.2-9C1.2 7.6 3.1 4 6.8 4c2.1 0 3.6 1.2 4.4 2.5h1.6C13.6 5.2 15.1 4 17.2 4c3.7 0 5.6 3.6 4 7.2-2.1 4.5-9.2 9-9.2 9Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}
