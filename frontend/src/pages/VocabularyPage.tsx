import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Tabs } from '../components/ui/Tabs'
import {
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  EditIcon,
  FolderIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  TrashIcon,
} from '../components/Icons'
import {
  addWordByLemmaRequest,
  createFolderRequest,
  createTagRequest,
  deleteUserWordRequest,
  foldersRequest,
  tagsRequest,
  updateUserWordRequest,
  userWordsRequest,
  vocabularyStatsRequest,
  type UserWord,
  type VocabularyStats,
  type WordFolder,
  type WordTag,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/vocabulary.css'

const STATUS_TABS = [
  { id: '', label: 'Tất cả' },
  { id: 'new', label: 'Mới' },
  { id: 'learning', label: 'Đang học' },
  { id: 'mastered', label: 'Đã thuộc' },
]

const STATUS_LABEL: Record<string, string> = {
  new: 'Mới',
  learning: 'Đang học',
  mastered: 'Đã thuộc',
}

type EditState = {
  word: UserWord
  note: string
  status: string
  folderId: number | null
  tagIds: number[]
}

export function VocabularyPage() {
  const { run } = useAuthedApi()
  const [words, setWords] = useState<UserWord[]>([])
  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [folders, setFolders] = useState<WordFolder[]>([])
  const [tags, setTags] = useState<WordTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [folderId, setFolderId] = useState<number | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [newLemma, setNewLemma] = useState('')
  const [newContext, setNewContext] = useState('')
  const [newFolder, setNewFolder] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [edit, setEdit] = useState<EditState | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserWord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [folderName, setFolderName] = useState('')
  const [tagName, setTagName] = useState('')

  const loadCollections = useCallback(async () => {
    const [nextFolders, nextTags, nextStats] = await Promise.all([
      run((token) => foldersRequest(token)),
      run((token) => tagsRequest(token)),
      run((token) => vocabularyStatsRequest(token)),
    ])
    setFolders(nextFolders)
    setTags(nextTags)
    setStats(nextStats)
  }, [run])

  const loadWords = useCallback(
    async (search: string, nextStatus: string, nextFolder: number | null) => {
      const data = await run((token) =>
        userWordsRequest(token, {
          search: search.trim() || null,
          status: nextStatus || null,
          folderId: nextFolder,
          pageSize: 60,
        }),
      )
      setWords(data.items)
    },
    [run],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([
        loadCollections(),
        loadWords(query, status, folderId),
      ])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa tải được sổ từ.')
    } finally {
      setLoading(false)
    }
  }, [folderId, loadCollections, loadWords, query, status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const filtered = useMemo(() => words, [words])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    const lemma = newLemma.trim()
    if (lemma.length < 2) {
      setAddError('Nhập một từ tiếng Anh trước nhé.')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      await run((token) =>
        addWordByLemmaRequest(token, {
          lemma,
          contextSentence: newContext.trim() || null,
          folderId: newFolder,
        }),
      )
      setAddOpen(false)
      setNewLemma('')
      setNewContext('')
      setNewFolder(null)
      setMessage('Đã thêm từ vào sổ. Nimbo sẽ nhắc bạn ôn đúng lúc.')
      await refresh()
    } catch (caught) {
      setAddError(caught instanceof Error ? caught.message : 'Chưa thêm được từ.')
    } finally {
      setAdding(false)
    }
  }

  function startEdit(word: UserWord) {
    setEdit({
      word,
      note: word.note ?? '',
      status: word.status,
      folderId: word.folderId,
      tagIds: word.tags.map((tag) => tag.id),
    })
  }

  async function saveEdit() {
    if (!edit) return
    setSavingEdit(true)
    try {
      await run((token) =>
        updateUserWordRequest(token, edit.word.id, {
          note: edit.note.trim() || null,
          status: edit.status,
          folderId: edit.folderId,
          tagIds: edit.tagIds,
        }),
      )
      setEdit(null)
      setMessage('Đã cập nhật từ trong sổ.')
      await refresh()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Chưa lưu được thay đổi.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await run((token) => deleteUserWordRequest(token, deleteTarget.id))
      setDeleteTarget(null)
      setMessage('Đã xóa từ khỏi sổ. Lịch sử ôn tập vẫn được giữ.')
      await refresh()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Chưa xóa được từ.')
    } finally {
      setDeleting(false)
    }
  }

  async function addFolder() {
    const name = folderName.trim()
    if (!name) return
    try {
      await run((token) => createFolderRequest(token, name))
      setFolderName('')
      await loadCollections()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Chưa tạo được thư mục.')
    }
  }

  async function addTag() {
    const name = tagName.trim()
    if (!name) return
    try {
      await run((token) => createTagRequest(token, name))
      setTagName('')
      await loadCollections()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Chưa tạo được thẻ.')
    }
  }

  return (
    <div className="vocab">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><BookmarkIcon size={14} /> Sổ từ vựng</span>
          <h1>Sổ từ của bạn</h1>
          <p>Lưu từ kèm câu gốc, gắn thẻ và ôn đúng lúc.</p>
        </div>
        <div className="page-head__actions">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon size={15} /> Thêm từ
          </Button>
          <Link to="/app/review" className="btn btn--sec btn--sm">
            <PlayIcon size={15} /> Ôn tập
          </Link>
        </div>
      </header>

      <div className="metric-row">
        <Metric icon={<BookmarkIcon size={15} />} label="Tổng từ" value={stats?.total ?? 0} />
        <Metric icon={<SparkDot />} label="Mới" value={stats?.new ?? 0} />
        <Metric icon={<EditIcon size={15} />} label="Đang học" value={stats?.learning ?? 0} />
        <Metric icon={<ClockIcon size={15} />} label="Cần ôn" value={stats?.due ?? 0} />
      </div>

      {message ? <FeedbackBar tone="info">{message}</FeedbackBar> : null}
      {error ? (
        <FeedbackBar tone="bad" action={<Button size="sm" variant="secondary" onClick={refresh}>Thử lại</Button>}>
          {error}
        </FeedbackBar>
      ) : null}

      <div className="vocab__layout">
        <div className="page-stack">
          <Card>
            <div className="vocab__toolbar">
              <Input
                placeholder="Tìm trong sổ từ..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                icon={<SearchIcon size={17} />}
              />
              <Tabs
                items={STATUS_TABS}
                value={status}
                onChange={setStatus}
                ariaLabel="Lọc theo trạng thái"
              />
            </div>

            <div className="vocab__list">
              {loading ? (
                <>
                  <div className="skeleton" style={{ height: 74 }} />
                  <div className="skeleton" style={{ height: 74 }} />
                  <div className="skeleton" style={{ height: 74 }} />
                </>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <span className="empty__art"><BookmarkIcon size={24} /></span>
                  <h3>Chưa có từ nào ở đây</h3>
                  <p>
                    Thêm từ mới hoặc đổi bộ lọc. Bạn cũng có thể tra một câu ở
                    Từ điển rồi lưu từ.
                  </p>
                  <div className="empty__actions">
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <PlusIcon size={15} /> Thêm từ đầu tiên
                    </Button>
                    <Link to="/app/dictionary" className="btn btn--sec btn--sm">
                      Mở từ điển
                    </Link>
                  </div>
                </div>
              ) : (
                filtered.map((word) => (
                  <article className="vocab-word" key={word.id}>
                    <div className="vocab-word__main">
                      <div className="vocab-word__title">
                        <strong>{word.lemma}</strong>
                        {word.phonetic ? <em>{word.phonetic}</em> : null}
                        <Chip tone="line">{word.partOfSpeech}</Chip>
                        <Chip tone={word.status === 'mastered' ? 'ok' : word.status === 'new' ? 'warn' : 'default'}>
                          {STATUS_LABEL[word.status] ?? word.status}
                        </Chip>
                      </div>
                      <p className="vocab-word__meaning">{word.meaningVi}</p>
                      {word.contextSentence ? (
                        <p className="vocab-word__context">“{word.contextSentence}”</p>
                      ) : null}
                      <div className="vocab-word__tags">
                        {word.folderName ? (
                          <Chip tone="line"><FolderIcon size={11} /> {word.folderName}</Chip>
                        ) : null}
                        {word.tags.map((tag) => (
                          <Chip key={tag.id} tone="line"><TagIcon size={11} /> {tag.name}</Chip>
                        ))}
                        {word.srs?.dueAt ? (
                          <Chip tone="line"><ClockIcon size={11} /> Ôn {new Date(word.srs.dueAt).toLocaleDateString('vi-VN')}</Chip>
                        ) : null}
                      </div>
                    </div>
                    <div className="vocab-word__actions">
                      <button type="button" className="icon-btn" onClick={() => startEdit(word)} aria-label={`Sửa ${word.lemma}`}>
                        <EditIcon size={16} />
                      </button>
                      <button type="button" className="icon-btn icon-btn--danger" onClick={() => setDeleteTarget(word)} aria-label={`Xóa ${word.lemma}`}>
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </Card>
        </div>

        <aside className="page-stack">
          <Card>
            <div className="card__head">
              <div>
                <span className="card__eyebrow">Thư mục</span>
                <h2 className="card__title">Nhóm từ của bạn</h2>
              </div>
              <FolderIcon size={18} />
            </div>
            <button
              type="button"
              className={`vocab-filter${folderId === null ? ' is-active' : ''}`}
              onClick={() => setFolderId(null)}
            >
              Tất cả từ <span>{stats?.total ?? 0}</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={`vocab-filter${folderId === folder.id ? ' is-active' : ''}`}
                onClick={() => setFolderId(folder.id)}
              >
                {folder.name} <span>{folder.wordCount}</span>
              </button>
            ))}
            <div className="vocab-inline-form">
              <input
                className="input"
                placeholder="Tên thư mục mới"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addFolder()
                }}
              />
              <button type="button" className="icon-btn" onClick={addFolder} aria-label="Tạo thư mục">
                <PlusIcon size={16} />
              </button>
            </div>
          </Card>

          <Card>
            <div className="card__head">
              <div>
                <span className="card__eyebrow">Thẻ</span>
                <h2 className="card__title">Chủ đề nhỏ</h2>
              </div>
              <TagIcon size={18} />
            </div>
            <div className="vocab-tags">
              {tags.length === 0 ? <p className="field__hint">Chưa có thẻ nào.</p> : null}
              {tags.map((tag) => (
                <Chip key={tag.id} tone="line">{tag.name} · {tag.wordCount}</Chip>
              ))}
            </div>
            <div className="vocab-inline-form">
              <input
                className="input"
                placeholder="Tên thẻ mới"
                value={tagName}
                onChange={(event) => setTagName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addTag()
                }}
              />
              <button type="button" className="icon-btn" onClick={addTag} aria-label="Tạo thẻ">
                <PlusIcon size={16} />
              </button>
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={addOpen}
        title="Thêm từ vào sổ"
        onClose={() => setAddOpen(false)}
      >
        <form onSubmit={handleAdd} className="page-stack">
          <Input
            label="Từ tiếng Anh"
            value={newLemma}
            onChange={(event) => setNewLemma(event.target.value)}
            placeholder="resilient"
            autoFocus
          />
          <div className="field">
            <label htmlFor="add-context">Câu ngữ cảnh (không bắt buộc)</label>
            <textarea
              id="add-context"
              className="input"
              value={newContext}
              onChange={(event) => setNewContext(event.target.value)}
              placeholder="She stayed resilient after the setback."
              rows={3}
            />
          </div>
          <div className="field">
            <label htmlFor="add-folder">Thư mục</label>
            <select
              id="add-folder"
              value={newFolder ?? ''}
              onChange={(event) => setNewFolder(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Chưa xếp thư mục</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
          {addError ? <FeedbackBar tone="bad">{addError}</FeedbackBar> : null}
          <Button type="submit" block disabled={adding}>
            {adding ? <span className="spinner" /> : <PlusIcon size={16} />}
            {adding ? 'Đang thêm...' : 'Thêm vào sổ'}
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(edit)}
        title={edit ? `Sửa “${edit.word.lemma}”` : 'Sửa từ'}
        onClose={() => setEdit(null)}
      >
        {edit ? (
          <div className="page-stack">
            <div className="field">
              <label htmlFor="edit-note">Ghi chú</label>
              <textarea
                id="edit-note"
                className="input"
                value={edit.note}
                onChange={(event) => setEdit({ ...edit, note: event.target.value })}
                rows={3}
                placeholder="Mẹo nhớ, cách dùng..."
              />
            </div>
            <div className="page-grid">
              <div className="field">
                <label htmlFor="edit-status">Trạng thái</label>
                <select
                  id="edit-status"
                  value={edit.status}
                  onChange={(event) => setEdit({ ...edit, status: event.target.value })}
                >
                  <option value="new">Mới</option>
                  <option value="learning">Đang học</option>
                  <option value="mastered">Đã thuộc</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="edit-folder">Thư mục</label>
                <select
                  id="edit-folder"
                  value={edit.folderId ?? ''}
                  onChange={(event) => setEdit({ ...edit, folderId: event.target.value ? Number(event.target.value) : null })}
                >
                  <option value="">Chưa xếp thư mục</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <span className="field__label">Thẻ</span>
              <div className="vocab-tag-picker">
                {tags.map((tag) => {
                  const active = edit.tagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`chip${active ? ' chip--gold' : ' chip--line'}`}
                      onClick={() =>
                        setEdit({
                          ...edit,
                          tagIds: active
                            ? edit.tagIds.filter((id) => id !== tag.id)
                            : [...edit.tagIds, tag.id],
                        })
                      }
                    >
                      {active ? <CheckIcon size={11} /> : null}
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <Button block onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? <span className="spinner" /> : <EditIcon size={15} />}
              {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Xóa từ khỏi sổ?"
        onClose={() => setDeleteTarget(null)}
      >
        <p style={{ color: 'var(--mut)', fontSize: '0.86rem' }}>
          “{deleteTarget?.lemma}” sẽ bị xóa khỏi sổ từ. Lịch sử ôn tập vẫn được giữ.
        </p>
        <div className="page-head__actions" style={{ marginTop: 18 }}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Giữ lại</Button>
          <Button onClick={confirmDelete} disabled={deleting}>
            {deleting ? <span className="spinner" /> : <TrashIcon size={15} />}
            Xóa
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="metric">
      <span>{icon} {label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SparkDot() {
  return <span className="badge-dot" aria-hidden="true" />
}
