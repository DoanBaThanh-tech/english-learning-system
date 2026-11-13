import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Tabs } from '../components/ui/Tabs'
import {
  ArrowRightIcon,
  BookIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  SparkIcon,
} from '../components/Icons'
import {
  addWordByLemmaRequest,
  createPassageRequest,
  passageLensRequest,
  passageRequest,
  passagesRequest,
  updatePassageProgressRequest,
  type PassageDetail,
  type PassageLens,
  type PassageSummary,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import { LEVEL_CHOICES } from '../lib/personalization'
import '../styles/reading.css'

export function ReadingPage() {
  const { run } = useAuthedApi()
  const [level, setLevel] = useState('')
  const [passages, setPassages] = useState<PassageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [active, setActive] = useState<PassageDetail | null>(null)
  const [lens, setLens] = useState<PassageLens | null>(null)
  const [opening, setOpening] = useState(false)
  const [selectedWord, setSelectedWord] = useState<{ text: string; meaning: string | null } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [topic, setTopic] = useState('')
  const [newLevel, setNewLevel] = useState(3)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await run((token) =>
        passagesRequest(token, level ? Number(level) : null),
      )
      setPassages(items)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa tải được bài đọc.')
    } finally {
      setLoading(false)
    }
  }, [level, run])

  useEffect(() => {
    load()
  }, [load])

  async function openPassage(id: number) {
    setOpening(true)
    setError('')
    setSelectedWord(null)
    try {
      const [detail, nextLens] = await Promise.all([
        run((token) => passageRequest(token, id)),
        run((token) => passageLensRequest(token, id)),
      ])
      setActive(detail)
      setLens(nextLens)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa mở được bài đọc.')
    } finally {
      setOpening(false)
    }
  }

  async function markDone() {
    if (!active) return
    try {
      await run((token) => updatePassageProgressRequest(token, active.id, 100))
      setActive({ ...active, progressPct: 100 })
      setMessage('Đã đánh dấu đọc xong. Tiến độ của bạn được cập nhật.')
      load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa cập nhật được tiến độ.')
    }
  }

  async function saveWord(text: string) {
    try {
      await run((token) =>
        addWordByLemmaRequest(token, {
          lemma: text,
          contextSentence: active ? active.body.slice(0, 300) : null,
        }),
      )
      setMessage(`Đã lưu “${text}” vào sổ từ.`)
      setSelectedWord(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa lưu được từ.')
    }
  }

  async function createPassage(event: FormEvent) {
    event.preventDefault()
    if (title.trim().length < 3 || body.trim().length < 40) {
      setCreateError('Cần tiêu đề và đoạn văn ít nhất 40 ký tự.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const created = await run((token) =>
        createPassageRequest(token, {
          title: title.trim(),
          body: body.trim(),
          levelId: newLevel,
          topic: topic.trim() || null,
        }),
      )
      setCreateOpen(false)
      setTitle('')
      setBody('')
      setTopic('')
      setMessage('Đã tạo bài đọc mới. Bạn có thể mở và đánh dấu từ chưa biết.')
      await load()
      await openPassage(created.id)
    } catch (caught) {
      setCreateError(caught instanceof Error ? caught.message : 'Chưa tạo được bài đọc.')
    } finally {
      setCreating(false)
    }
  }

  if (active && lens) {
    return (
      <div className="reading">
        <header className="page-head">
          <div className="page-head__copy">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setActive(null); setLens(null) }}>
              ← Danh sách bài đọc
            </button>
            <h1>{active.title}</h1>
            <p>
              {active.levelCode} · {active.topic ?? 'Chủ đề tự chọn'} · {active.wordCount} từ
            </p>
          </div>
          <div className="page-head__actions">
            <Button size="sm" variant="secondary" onClick={markDone}>
              <CheckIcon size={15} /> Đọc xong
            </Button>
          </div>
        </header>

        {message ? <FeedbackBar tone="ok">{message}</FeedbackBar> : null}
        {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

        <div className="reading__reader">
          <Card className="reading__text">
            <p className="reading__body">
              {lens.segments.map((segment, index) =>
                segment.isWord ? (
                  <button
                    key={`${segment.text}-${index}`}
                    type="button"
                    className={segment.userWordId ? 'is-saved' : ''}
                    onClick={() => setSelectedWord({ text: segment.text, meaning: segment.meaningVi })}
                  >
                    {segment.text}
                  </button>
                ) : (
                  <span key={`${segment.text}-${index}`}>{segment.text}</span>
                ),
              )}
            </p>
            <div className="reading__legend">
              <span><i className="is-saved" /> Từ đã lưu</span>
              <span><i /> Bấm từ để xem nghĩa</span>
              <Chip tone="gold"><BookmarkIcon size={11} /> {lens.savedWordCount} từ</Chip>
            </div>
          </Card>

          <aside className="page-stack">
            {selectedWord ? (
              <Card className="reading-word">
                <span className="card__eyebrow">Từ đang chọn</span>
                <h2>{selectedWord.text}</h2>
                <p>{selectedWord.meaning ?? 'Chưa có nghĩa trong từ điển. Bạn vẫn có thể lưu để bổ sung sau.'}</p>
                <div className="reading-word__actions">
                  <Button size="sm" onClick={() => saveWord(selectedWord.text)}>
                    <BookmarkIcon size={14} /> Lưu từ
                  </Button>
                  <button type="button" className="btn btn--sec btn--sm" onClick={() => setSelectedWord(null)}>
                    Đóng
                  </button>
                </div>
              </Card>
            ) : (
              <Card flat>
                <span className="card__eyebrow">Cách đọc</span>
                <p style={{ marginTop: 6, color: 'var(--mut)', fontSize: '0.8rem' }}>
                  Bấm vào từ được tô để xem nghĩa. Từ đã lưu có gạch chân vàng.
                  Đọc xong, bấm “Đọc xong” để ghi tiến độ.
                </p>
              </Card>
            )}
            <Card flat>
              <span className="card__eyebrow">Tiến độ</span>
              <div className="progress" style={{ marginTop: 8 }}>
                <i style={{ width: `${active.progressPct}%` }} />
              </div>
              <p style={{ marginTop: 5, color: 'var(--mut)', fontSize: '0.72rem' }}>
                {active.progressPct}% hoàn thành
              </p>
            </Card>
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className="reading">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><BookIcon size={14} /> Bài đọc</span>
          <h1>Đọc một chút, mỗi ngày</h1>
          <p>Chọn trình độ A1–C2. Từ chưa biết được tô vàng và bấm được.</p>
        </div>
        <div className="page-head__actions">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon size={15} /> Tạo bài đọc
          </Button>
        </div>
      </header>

      {message ? <FeedbackBar tone="ok">{message}</FeedbackBar> : null}
      {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

      <div className="reading__levels">
        <Tabs
          items={[
            { id: '', label: 'Tất cả' },
            ...LEVEL_CHOICES.map((item) => ({ id: String(item.id), label: item.code })),
          ]}
          value={level}
          onChange={setLevel}
          ariaLabel="Lọc bài đọc theo trình độ"
        />
      </div>

      {loading ? (
        <div className="page-stack">
          <div className="skeleton" style={{ height: 90 }} />
          <div className="skeleton" style={{ height: 90 }} />
          <div className="skeleton" style={{ height: 90 }} />
        </div>
      ) : passages.length === 0 ? (
        <div className="empty">
          <span className="empty__art"><BookIcon size={26} /></span>
          <h3>Chưa có bài đọc nào</h3>
          <p>
            Dán một đoạn văn tiếng Anh bạn thích. SkyWorld sẽ tách từ, tô từ chưa
            biết và lưu vào sổ khi bạn bấm.
          </p>
          <div className="empty__actions">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <SparkIcon size={15} /> Tạo bài đọc đầu tiên
            </Button>
          </div>
        </div>
      ) : (
        <div className="reading__grid">
          {passages.map((item) => (
            <article className="reading-card" key={item.id}>
              <div className="reading-card__top">
                <Chip tone="gold">{item.levelCode}</Chip>
                <span>{item.wordCount} từ</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.topic ?? 'Chủ đề tự chọn'}</p>
              <div className="progress progress--slim">
                <i style={{ width: `${item.progressPct}%` }} />
              </div>
              <div className="reading-card__foot">
                <span>
                  <ClockIcon size={12} />
                  {item.lastReadAt
                    ? new Date(item.lastReadAt).toLocaleDateString('vi-VN')
                    : 'Chưa đọc'}
                </span>
                <button type="button" className="rail-link" onClick={() => openPassage(item.id)} disabled={opening}>
                  Đọc ngay <ArrowRightIcon size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Card flat className="reading__create-hint">
        <SparkIcon size={18} />
        <p>
          Dán một đoạn văn tiếng Anh bất kỳ — email, bài báo, ghi chú — SkyWorld sẽ
          tách từ, tô từ chưa biết và lưu vào sổ từ của bạn khi bấm.
        </p>
      </Card>

      <Modal open={createOpen} title="Tạo bài đọc mới" onClose={() => setCreateOpen(false)}>
        <form className="page-stack" onSubmit={createPassage}>
          <Input
            label="Tiêu đề"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A morning in the city"
            autoFocus
          />
          <div className="page-grid">
            <div className="field">
              <label htmlFor="reading-level">Trình độ</label>
              <select
                id="reading-level"
                value={newLevel}
                onChange={(event) => setNewLevel(Number(event.target.value))}
              >
                {LEVEL_CHOICES.map((item) => (
                  <option key={item.id} value={item.id}>{item.code} · {item.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Chủ đề (không bắt buộc)"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Du lịch, công việc..."
            />
          </div>
          <div className="field">
            <label htmlFor="reading-body">Nội dung tiếng Anh</label>
            <textarea
              id="reading-body"
              className="input"
              rows={7}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Dán đoạn văn tiếng Anh vào đây..."
            />
            <span className="field__hint">{body.trim().split(/\s+/).filter(Boolean).length} từ</span>
          </div>
          {createError ? <FeedbackBar tone="bad">{createError}</FeedbackBar> : null}
          <Button type="submit" block disabled={creating}>
            {creating ? <span className="spinner" /> : <PlusIcon size={15} />}
            {creating ? 'Đang tạo...' : 'Tạo bài đọc'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
