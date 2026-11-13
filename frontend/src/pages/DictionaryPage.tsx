import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import { Input } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  SearchIcon,
  SparkIcon,
  SpeakerIcon,
} from '../components/Icons'
import {
  ApiError,
  addUserWordRequest,
  addWordByLemmaRequest,
  contextLookupRequest,
  dictWordRequest,
  searchWordsRequest,
  wordOfTheDayRequest,
  type ContextLookupResult,
  type DictSearchItem,
  type DictWord,
  type WordOfTheDay,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/dictionary.css'

function speak(url: string | null | undefined, text: string) {
  if (url) {
    const audio = new Audio(url)
    audio.play().catch(() => {
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

export function DictionaryPage() {
  const { run } = useAuthedApi()
  const [tab, setTab] = useState('word')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DictSearchItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<DictWord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string } | null>(null)
  const [wotd, setWotd] = useState<WordOfTheDay | null>(null)
  const [wotdLoading, setWotdLoading] = useState(true)
  const searchId = useRef(0)

  const [sentence, setSentence] = useState('')
  const [word, setWord] = useState('')
  const [lookup, setLookup] = useState<ContextLookupResult | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const loadWotd = useCallback(() => {
    setWotdLoading(true)
    run((token) => wordOfTheDayRequest(token))
      .then(setWotd)
      .catch(() => setWotd(null))
      .finally(() => setWotdLoading(false))
  }, [run])

  useEffect(() => {
    loadWotd()
  }, [loadWotd])

  useEffect(() => {
    const text = query.trim()
    if (text.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    const id = ++searchId.current
    setSearching(true)
    const timer = window.setTimeout(() => {
      run((token) => searchWordsRequest(token, text, 12))
        .then((items) => {
          if (searchId.current === id) setResults(items)
        })
        .catch((caught: unknown) => {
          if (searchId.current === id) {
            setResults([])
            if (caught instanceof ApiError && caught.status !== 401) {
              setMessage({ tone: 'bad', text: caught.message })
            }
          }
        })
        .finally(() => {
          if (searchId.current === id) setSearching(false)
        })
    }, 380)
    return () => window.clearTimeout(timer)
  }, [query, run])

  async function openWord(lemma: string) {
    setDetailLoading(true)
    setSelected(null)
    setMessage(null)
    try {
      const data = await run((token) => dictWordRequest(token, lemma))
      setSelected(data)
      if (!sentence) setSentence('')
    } catch (caught) {
      setMessage({
        tone: 'bad',
        text: caught instanceof Error ? caught.message : 'Chưa tải được nghĩa của từ.',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  async function saveSense(senseId: number, context: string | null) {
    try {
      await run((token) =>
        addUserWordRequest(token, { senseId, contextSentence: context || null }),
      )
      setMessage({ tone: 'ok', text: 'Đã lưu vào sổ từ. Nimbo sẽ nhắc bạn ôn đúng lúc.' })
      if (selected) {
        setSelected({ ...selected, saved: true })
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setMessage({ tone: 'info', text: 'Từ này đã có trong sổ từ của bạn.' })
        return
      }
      setMessage({
        tone: 'bad',
        text: caught instanceof Error ? caught.message : 'Chưa lưu được từ.',
      })
    }
  }

  async function saveLemma(lemma: string) {
    try {
      await run((token) =>
        addWordByLemmaRequest(token, { lemma, contextSentence: sentence.trim() || null }),
      )
      setMessage({ tone: 'ok', text: 'Đã lưu từ vào sổ. Bạn có thể thêm ghi chú sau.' })
    } catch (caught) {
      setMessage({
        tone: 'bad',
        text: caught instanceof Error ? caught.message : 'Chưa lưu được từ.',
      })
    }
  }

  async function handleContext(event: FormEvent) {
    event.preventDefault()
    const cleanWord = word.trim()
    const cleanSentence = sentence.trim()
    if (!cleanWord || !cleanSentence) {
      setLookupError('Nhập cả câu và từ cần hiểu nhé.')
      return
    }
    setLookingUp(true)
    setLookupError('')
    setLookup(null)
    try {
      const data = await run((token) =>
        contextLookupRequest(token, {
          word: cleanWord,
          sentence: cleanSentence,
          translateSentence: true,
        }),
      )
      setLookup(data)
    } catch (caught) {
      setLookupError(
        caught instanceof Error ? caught.message : 'Chưa phân tích được câu này.',
      )
    } finally {
      setLookingUp(false)
    }
  }

  function pickWordFromSentence(tokenText: string) {
    const clean = tokenText.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '')
    if (clean) setWord(clean)
  }

  return (
    <div className="dictionary">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><SearchIcon size={14} /> Từ điển thông minh</span>
          <h1>Tra đúng từ, hiểu đúng câu</h1>
          <p>Nghĩa, phiên âm, ví dụ và cách dùng đúng ngữ cảnh — lưu một chạm.</p>
        </div>
        <Tabs
          items={[
            { id: 'word', label: 'Tra từ' },
            { id: 'context', label: 'Theo ngữ cảnh' },
          ]}
          value={tab}
          onChange={setTab}
          ariaLabel="Cách tra từ"
        />
      </header>

      {message ? (
        <FeedbackBar tone={message.tone}>{message.text}</FeedbackBar>
      ) : null}

      {tab === 'word' ? (
        <div className="dictionary__layout">
          <Card className="dictionary__search">
            <Input
              label="Tìm từ tiếng Anh"
              placeholder="Ví dụ: resilient, bank, serendipity..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              icon={<SearchIcon size={18} />}
              autoFocus
            />
            <div className="dict-results" aria-live="polite">
              {searching ? (
                <div className="page-stack">
                  <div className="skeleton" style={{ height: 54 }} />
                  <div className="skeleton" style={{ height: 54 }} />
                  <div className="skeleton" style={{ height: 54 }} />
                </div>
              ) : query.trim().length >= 2 && results.length === 0 ? (
                <div className="empty">
                  <span className="empty__art"><SearchIcon size={24} /></span>
                  <h3>Không tìm thấy “{query.trim()}”</h3>
                  <p>Thử một từ khác hoặc dùng tab Theo ngữ cảnh để hiểu cả câu.</p>
                </div>
              ) : results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`dict-result${selected?.lemma === item.lemma ? ' is-active' : ''}`}
                    onClick={() => openWord(item.lemma)}
                  >
                    <span>
                      <strong>{item.lemma}</strong>
                      {item.phonetic ? <em>{item.phonetic}</em> : null}
                    </span>
                    <span className="dict-result__meaning">{item.meaning}</span>
                    <Chip tone="line">{item.partOfSpeech}</Chip>
                  </button>
                ))
              ) : query.trim().length < 2 ? (
                <div className="dict-suggest">
                  <p>Gợi ý hôm nay</p>
                  <div className="dict-suggest__chips">
                    {['resilient', 'serendipity', 'deposit', 'habit', 'focus'].map((item) => (
                      <button key={item} type="button" className="chip" onClick={() => setQuery(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="page-stack">
            {detailLoading ? (
              <Card><div className="skeleton" style={{ height: 180 }} /></Card>
            ) : selected ? (
              <Card className="dict-detail">
                <div className="dict-detail__head">
                  <div>
                    <h2>{selected.lemma}</h2>
                    <div className="dict-detail__phonetic">
                      {selected.phoneticUs ? <span>US {selected.phoneticUs}</span> : null}
                      {selected.phoneticUk ? <span>UK {selected.phoneticUk}</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--sec btn--sm"
                    onClick={() => speak(selected.audioUs ?? selected.audioUk, selected.lemma)}
                  >
                    <SpeakerIcon size={15} /> Nghe
                  </button>
                </div>
                <div className="dict-senses">
                  {selected.senses.map((sense) => (
                    <div className="dict-sense" key={sense.id}>
                      <div className="dict-sense__top">
                        <span>
                          <Chip tone="line">{sense.partOfSpeechVi || sense.partOfSpeech}</Chip>
                          {sense.levelCode ? <Chip>{sense.levelCode}</Chip> : null}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => saveSense(sense.id, sentence)}
                        >
                          <BookmarkIcon size={14} /> Lưu
                        </Button>
                      </div>
                      <strong>{sense.meaningVi}</strong>
                      <p>{sense.definitionEn}</p>
                      {sense.examples.slice(0, 2).map((example) => (
                        <div className="dict-example" key={example.sentenceEn}>
                          <em>{example.sentenceEn}</em>
                          {example.sentenceVi ? <span>{example.sentenceVi}</span> : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {selected.senses.length === 0 ? (
                  <Button size="sm" onClick={() => saveLemma(selected.lemma)}>
                    <BookmarkIcon size={14} /> Lưu từ này
                  </Button>
                ) : null}
              </Card>
            ) : wotdLoading ? (
              <Card><div className="skeleton" style={{ height: 160 }} /></Card>
            ) : wotd ? (
              <Card sky className="dict-wotd">
                <span className="eyebrow"><SparkIcon size={14} /> Từ của ngày</span>
                <h2>{wotd.word.lemma}</h2>
                {wotd.word.phoneticUs ? <p className="dict-wotd__ipa">{wotd.word.phoneticUs}</p> : null}
                <p className="dict-wotd__meaning">{wotd.contextMeaning}</p>
                <p className="dict-wotd__sentence">“{wotd.contextSentence}”</p>
                <div className="dict-wotd__actions">
                  <button
                    type="button"
                    className="btn btn--sec btn--sm"
                    onClick={() => speak(wotd.word.audioUs, wotd.word.lemma)}
                  >
                    <SpeakerIcon size={14} /> Nghe
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => {
                      setQuery(wotd.word.lemma)
                      openWord(wotd.word.lemma)
                    }}
                  >
                    Xem chi tiết <ArrowRightIcon size={14} />
                  </button>
                </div>
              </Card>
            ) : (
              <Card flat>
                <h2 className="card__title">Bắt đầu với một từ</h2>
                <p style={{ color: 'var(--mut)', fontSize: '0.82rem', marginTop: 6 }}>
                  Gõ từ vào ô tìm kiếm. Nimbo sẽ hiện nghĩa, phiên âm và ví dụ.
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="dict-context">
          <form className="page-stack" onSubmit={handleContext}>
            <Card>
              <div className="field">
                <label htmlFor="context-sentence">Câu tiếng Anh</label>
                <textarea
                  id="context-sentence"
                  className="input"
                  value={sentence}
                  onChange={(event) => setSentence(event.target.value)}
                  placeholder="Ví dụ: She deposited cash at the bank."
                  rows={4}
                />
                <span className="field__hint">Chạm vào một từ bên dưới để chọn nhanh.</span>
              </div>
              {sentence.trim() ? (
                <div className="context-tokens">
                  {sentence.split(/(\s+)/).map((part, index) =>
                    part.trim() ? (
                      <button key={`${part}-${index}`} type="button" onClick={() => pickWordFromSentence(part)}>
                        {part}
                      </button>
                    ) : (
                      <span key={`${part}-${index}`}> </span>
                    ),
                  )}
                </div>
              ) : null}
              <div className="dict-context__row">
                <Input
                  label="Từ cần hiểu"
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                  placeholder="bank"
                />
                <Button type="submit" disabled={lookingUp}>
                  {lookingUp ? <span className="spinner" /> : <SparkIcon size={15} />}
                  {lookingUp ? 'Đang phân tích...' : 'Phân tích ngữ cảnh'}
                </Button>
              </div>
              {lookupError ? <FeedbackBar tone="bad">{lookupError}</FeedbackBar> : null}
            </Card>
          </form>

          {lookup ? (
            <Card className="dict-context__result">
              <div className="card__head">
                <div>
                  <span className="card__eyebrow">Nghĩa đúng ngữ cảnh</span>
                  <h2 className="card__title">{lookup.word} → {lookup.meaningVi}</h2>
                </div>
                <Chip tone={lookup.confidence >= 0.65 ? 'ok' : 'warn'}>
                  {Math.round(lookup.confidence * 100)}% tin cậy
                </Chip>
              </div>
              <p className="dict-context__definition">{lookup.definitionEn}</p>
              <div className="dict-context__meta">
                <Chip tone="line">{lookup.partOfSpeech}</Chip>
                {lookup.phonetic ? <Chip tone="line">{lookup.phonetic}</Chip> : null}
                <Chip>{lookup.source}</Chip>
              </div>
              {lookup.sentenceTranslation ? (
                <div className="dict-translation">
                  <span>Bản dịch cả câu</span>
                  <p>{lookup.sentenceTranslation}</p>
                </div>
              ) : null}
              {lookup.alternatives.length > 0 ? (
                <div className="dict-alts">
                  <span className="card__eyebrow">Nghĩa khác có thể gặp</span>
                  {lookup.alternatives.map((alt) => (
                    <div key={alt.senseId}>
                      <strong>{alt.meaningVi}</strong>
                      <span>{alt.partOfSpeech} · {Math.round(alt.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="dict-context__actions">
                {lookup.chosenSenseId ? (
                  <Button
                    onClick={() =>
                      saveSense(lookup.chosenSenseId as number, sentence.trim())
                    }
                  >
                    <BookmarkIcon size={15} /> Lưu vào sổ từ
                  </Button>
                ) : (
                  <Button onClick={() => saveLemma(lookup.lemma)}>
                    <BookmarkIcon size={15} /> Lưu từ
                  </Button>
                )}
                <button
                  type="button"
                  className="btn btn--sec btn--sm"
                  onClick={() => speak(null, lookup.word)}
                >
                  <SpeakerIcon size={15} /> Nghe
                </button>
              </div>
            </Card>
          ) : (
            <Card flat className="dict-context__hint">
              <CheckIcon size={18} />
              <p>Dán cả câu để SkyWorld chọn đúng nghĩa, thay vì lấy nghĩa đầu tiên.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
