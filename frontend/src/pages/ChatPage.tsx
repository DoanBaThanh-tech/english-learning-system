import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import {
  ArrowRightIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  SparkIcon,
  TrashIcon,
} from '../components/Icons'
import {
  chatScenariosRequest,
  chatSessionRequest,
  chatSessionsRequest,
  createChatScenarioRequest,
  createChatSessionRequest,
  deleteChatSessionRequest,
  sendChatMessageRequest,
  type ChatSessionDetail,
  type ChatSession,
  type ChatCorrection,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/chat.css'

const TEMPLATES = [
  {
    name: 'Gọi món ở quán cà phê',
    prompt:
      'Bạn là nhân viên quán cà phê thân thiện. Hãy trò chuyện bằng tiếng Anh đơn giản với người học, hỏi đồ uống và gợi ý món.',
  },
  {
    name: 'Phỏng vấn xin việc',
    prompt:
      'Bạn là nhà tuyển dụng. Hỏi người học về kinh nghiệm, điểm mạnh và mục tiêu nghề nghiệp bằng tiếng Anh ở mức trung cấp.',
  },
  {
    name: 'Check-in sân bay',
    prompt:
      'Bạn là nhân viên sân bay. Hướng dẫn người học check-in, hỏi hành lý và cổng boarding bằng tiếng Anh ngắn gọn.',
  },
]

export function ChatPage() {
  const { run } = useAuthedApi()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [active, setActive] = useState<ChatSessionDetail | null>(null)
  const [scenarios, setScenarios] = useState<{ id: number; name: string }[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [corrections, setCorrections] = useState<ChatCorrection[]>([])
  const [suggested, setSuggested] = useState<string[]>([])
  const [aiUsed, setAiUsed] = useState(true)
  const endRef = useRef<HTMLDivElement | null>(null)

  const loadLists = useCallback(async () => {
    const [nextSessions, nextScenarios] = await Promise.all([
      run((token) => chatSessionsRequest(token)),
      run((token) => chatScenariosRequest(token)),
    ])
    setSessions(nextSessions)
    setScenarios(nextScenarios)
  }, [run])

  useEffect(() => {
    loadLists().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Chưa tải được cuộc trò chuyện.')
    })
  }, [loadLists])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [active?.messages.length, sending])

  async function openSession(id: number) {
    setCreating(true)
    setError('')
    try {
      const detail = await run((token) => chatSessionRequest(token, id))
      setActive(detail)
      setCorrections([])
      setSuggested([])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa mở được cuộc trò chuyện.')
    } finally {
      setCreating(false)
    }
  }

  async function startWith(scenarioName: string | null, prompt?: string) {
    setCreating(true)
    setError('')
    try {
      let scenarioId: number | null = null
      if (scenarioName) {
        const existing = scenarios.find((item) => item.name === scenarioName)
        if (existing) {
          scenarioId = existing.id
        } else if (prompt) {
          try {
            const created = await run((token) =>
              createChatScenarioRequest(token, { name: scenarioName, systemPrompt: prompt }),
            )
            scenarioId = created.id
          } catch {
            scenarioId = null
          }
        }
      }
      const session = await run((token) =>
        createChatSessionRequest(token, {
          scenarioId,
          title: scenarioName ?? 'Trò chuyện tự do',
        }),
      )
      await loadLists()
      await openSession(session.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa bắt đầu được cuộc trò chuyện.')
    } finally {
      setCreating(false)
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!active || !message.trim() || sending) return
    const content = message.trim()
    setMessage('')
    setSending(true)
    setError('')
    try {
      const result = await run((token) => sendChatMessageRequest(token, active.id, content))
      setActive({
        ...active,
        messages: [...active.messages, result.userMessage, result.assistantMessage],
      })
      setSessions((current) =>
        current.map((item) =>
          item.id === active.id
            ? {
                ...item,
                messageCount: item.messageCount + 2,
                lastMessage: result.assistantMessage.content,
                lastMessageAt: result.assistantMessage.createdAt,
              }
            : item,
        ),
      )
      setCorrections(result.corrections)
      setSuggested(result.suggestedWords)
      setAiUsed(result.aiUsed)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa gửi được tin nhắn.')
      setMessage(content)
    } finally {
      setSending(false)
    }
  }

  async function removeSession(id: number) {
    try {
      await run((token) => deleteChatSessionRequest(token, id))
      if (active?.id === id) setActive(null)
      await loadLists()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa xóa được cuộc trò chuyện.')
    }
  }

  return (
    <div className="chat">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><ChatIcon size={14} /> Trò chuyện cùng AI</span>
          <h1>Nói chuyện thật, sửa lỗi ngay</h1>
          <p>Đóng vai tình huống thật. Câu sửa ngữ pháp được làm nổi bật màu mint.</p>
        </div>
        <div className="page-head__actions">
          <Button size="sm" variant="secondary" onClick={() => startWith(null)} disabled={creating}>
            <PlusIcon size={15} /> Cuộc mới
          </Button>
        </div>
      </header>

      {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

      <div className="chat__layout">
        <Card className="chat__main">
          {active ? (
            <>
              <div className="chat__head">
                <div>
                  <h2>{active.title ?? 'Trò chuyện tự do'}</h2>
                  <span>{active.scenarioName ?? 'Không theo tình huống'}</span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setActive(null)}
                  aria-label="Đóng cuộc trò chuyện"
                >
                  <ArrowRightIcon size={16} />
                </button>
              </div>

              <div className="chat__messages" aria-live="polite">
                {active.messages.length === 0 ? (
                  <div className="chat__intro">
                    <span className="empty__art"><ChatIcon size={24} /></span>
                    <h3>Bắt đầu cuộc trò chuyện</h3>
                    <p>Chào Nimbo bằng tiếng Anh. Nimbo sẽ trả lời và sửa lỗi giúp bạn.</p>
                  </div>
                ) : null}
                {active.messages.map((msg) => (
                  <div key={msg.id} className={`bubble bubble--${msg.role === 'user' ? 'me' : 'ai'}`}>
                    <p>{msg.content}</p>
                    {msg.correctedContent && msg.correctedContent !== msg.content ? (
                      <span className="bubble__fix">Sửa: {msg.correctedContent}</span>
                    ) : null}
                  </div>
                ))}
                {sending ? (
                  <div className="bubble bubble--ai bubble--typing">
                    Nimbo đang trả lời
                    <i /><i /><i />
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>

              {corrections.length > 0 ? (
                <div className="chat__corrections">
                  <span className="card__eyebrow"><CheckIcon size={12} /> Góp ý ngữ pháp</span>
                  {corrections.map((item) => (
                    <div key={`${item.original}-${item.correction}`} className="correction">
                      <del>{item.original}</del>
                      <ins>{item.correction}</ins>
                      <span>{item.explanation}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {!aiUsed ? (
                <p className="chat__offline">
                  <ClockIcon size={13} /> AI đang ở chế độ ngoại tuyến; phản hồi có thể mang tính mẫu.
                </p>
              ) : null}

              {suggested.length > 0 ? (
                <div className="chat__suggested">
                  <span>Thử dùng:</span>
                  {suggested.map((word) => (
                    <button
                      key={word}
                      type="button"
                      className="chip chip--line"
                      onClick={() => setMessage((value) => `${value} ${word}`.trim())}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              ) : null}

              <form className="chat__composer" onSubmit={send}>
                <textarea
                  className="input"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Nhập bằng tiếng Anh... (Enter để gửi)"
                  rows={2}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                />
                <Button type="submit" disabled={sending || !message.trim()}>
                  {sending ? <span className="spinner" /> : <ArrowRightIcon size={16} />}
                  Gửi
                </Button>
              </form>
            </>
          ) : (
            <div className="chat__empty">
              <span className="empty__art"><ChatIcon size={26} /></span>
              <h2>Chọn một tình huống để bắt đầu</h2>
              <p>
                Không cần sợ sai. Nimbo sửa ngữ pháp nhẹ nhàng và gợi ý từ để bạn
                nói tự nhiên hơn.
              </p>
              <div className="chat__templates">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    className="chat-template"
                    onClick={() => startWith(template.name, template.prompt)}
                    disabled={creating}
                  >
                    <span className="learn-quick__icon"><ChatIcon size={18} /></span>
                    <strong>{template.name}</strong>
                    <span>Đóng vai có hướng dẫn</span>
                    <ArrowRightIcon size={15} />
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn--sec btn--sm" onClick={() => startWith(null)} disabled={creating}>
                <SparkIcon size={14} /> Trò chuyện tự do
              </button>
            </div>
          )}
        </Card>

        <aside className="page-stack">
          <Card>
            <div className="card__head">
              <div>
                <span className="card__eyebrow">Gần đây</span>
                <h2 className="card__title">Cuộc trò chuyện</h2>
              </div>
              <ChatIcon size={17} />
            </div>
            {sessions.length === 0 ? (
              <p className="field__hint">Chưa có cuộc trò chuyện nào.</p>
            ) : (
              <div className="chat-history">
                {sessions.map((item) => (
                  <div key={item.id} className={`chat-history__row${active?.id === item.id ? ' is-active' : ''}`}>
                    <button type="button" onClick={() => openSession(item.id)}>
                      <strong>{item.title ?? item.scenarioName ?? 'Trò chuyện'}</strong>
                      <span>{item.lastMessage ?? 'Chưa có tin nhắn'} · {item.messageCount} tin</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => removeSession(item.id)}
                      aria-label="Xóa cuộc trò chuyện"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card flat>
            <span className="card__eyebrow">Mẹo nhỏ</span>
            <p style={{ marginTop: 6, color: 'var(--mut)', fontSize: '0.78rem' }}>
              Viết câu ngắn, đúng ý trước. Khi đã quen, hãy thử thêm lý do và cảm
              xúc để câu tự nhiên hơn.
            </p>
            <div className="chat__chips">
              <Chip tone="ok">Sửa ngữ pháp</Chip>
              <Chip tone="gold">Đóng vai</Chip>
              <Chip>Từ gợi ý</Chip>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
