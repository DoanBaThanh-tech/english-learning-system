import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { FeedbackBar } from '../components/ui/FeedbackBar'
import {
  CheckIcon,
  ClockIcon,
  MicIcon,
  SparkIcon,
  SpeakerIcon,
  TargetIcon,
} from '../components/Icons'
import {
  analyzePronunciationRequest,
  pronunciationSummaryRequest,
  type PronunciationAttempt,
  type PronunciationSummary,
} from '../lib/api'
import { useAuthedApi } from '../lib/useAuthedApi'
import '../styles/speaking.css'

const SAMPLES = [
  'Think about this thing.',
  'The weather is lovely today.',
  'I would like a cup of coffee.',
  'She runs a small café near the river.',
]

const WAVE = [22, 48, 66, 38, 74, 52, 84, 44, 62, 34, 70, 46, 58, 28, 64, 40]

function speak(text: string) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }
}

export function SpeakingPage() {
  const { run } = useAuthedApi()
  const [reference, setReference] = useState(SAMPLES[0])
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const [supported, setSupported] = useState(true)
  const [attempt, setAttempt] = useState<PronunciationAttempt | null>(null)
  const [summary, setSummary] = useState<PronunciationSummary | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<SkySpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  const loadSummary = useCallback(() => {
    run((token) => pronunciationSummaryRequest(token))
      .then(setSummary)
      .catch(() => undefined)
  }, [run])

  useEffect(() => {
    loadSummary()
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    setSupported(Boolean(Ctor))
    return () => {
      recognitionRef.current?.abort()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [loadSummary])

  function stopRecording() {
    setRecording(false)
    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  async function startRecording() {
    setError('')
    setTranscript('')
    setAttempt(null)
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      setError('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Bạn có thể gõ lại câu đã đọc.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recognition = new Ctor()
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognition.onresult = (event) => {
        let text = ''
        for (let i = 0; i < event.results.length; i += 1) {
          text += event.results[i][0].transcript
        }
        setTranscript(text.trim())
      }
      recognition.onerror = () => {
        setRecording(false)
        setError('Chưa nghe rõ. Thử nói gần micro hơn hoặc gõ lại câu.')
      }
      recognition.onend = () => {
        setRecording(false)
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      recognitionRef.current = recognition
      setRecording(true)
      recognition.start()
      timerRef.current = window.setTimeout(stopRecording, 15000)
    } catch {
      setError('Không truy cập được micro. Bạn có thể gõ lại câu đã đọc để chấm.')
    }
  }

  async function analyze() {
    if (!reference.trim() || !transcript.trim()) {
      setError('Cần câu mẫu và câu bạn đọc (hoặc transcript) trước khi chấm.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const data = await run((token) =>
        analyzePronunciationRequest(token, {
          referenceText: reference.trim(),
          transcript: transcript.trim(),
        }),
      )
      setAttempt(data)
      loadSummary()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chưa chấm được phát âm.')
    } finally {
      setAnalyzing(false)
    }
  }

  const scoreTone = (score: number) => (score >= 80 ? 'ok' : score >= 60 ? 'warn' : 'bad')

  return (
    <div className="speaking">
      <header className="page-head">
        <div className="page-head__copy">
          <span className="eyebrow"><MicIcon size={14} /> Luyện nói</span>
          <h1>Nói tự tin, nghe chuẩn hơn</h1>
          <p>Đọc câu mẫu, nhận điểm và biết chính xác âm nào cần sửa.</p>
        </div>
        {summary ? (
          <div className="speaking-summary">
            <Chip tone="ok">Trung bình {Math.round(summary.averageScore)}%</Chip>
            <Chip tone="gold">Cao nhất {summary.bestScore}%</Chip>
          </div>
        ) : null}
      </header>

      {error ? <FeedbackBar tone="bad">{error}</FeedbackBar> : null}

      <div className="speaking__layout">
        <Card className="speak-card">
          <div className="card__head">
            <div>
              <span className="card__eyebrow">Câu mẫu</span>
              <h2 className="card__title">Đọc to câu dưới đây</h2>
            </div>
            <button type="button" className="icon-btn" onClick={() => speak(reference)} aria-label="Nghe câu mẫu">
              <SpeakerIcon size={17} />
            </button>
          </div>
          <p className="speak-reference">{reference}</p>
          <div className="speak-samples">
            {SAMPLES.map((sample) => (
              <button key={sample} type="button" className="chip chip--line" onClick={() => setReference(sample)}>
                {sample}
              </button>
            ))}
          </div>

          <div className={`speak-record${recording ? ' is-recording' : ''}`}>
            <button
              type="button"
              className="speak-record__btn"
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            >
              <MicIcon size={30} />
            </button>
            <div className={`wave wave--live${recording ? ' is-live' : ''}`} aria-hidden="true">
              {WAVE.map((height, index) => (
                <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 0.06}s` }} />
              ))}
            </div>
            <span>{recording ? 'Đang nghe... bấm để dừng' : 'Bấm micro và đọc câu mẫu'}</span>
          </div>

          {!supported ? (
            <p className="field__hint">Trình duyệt không hỗ trợ nhận dạng giọng nói. Hãy gõ câu bạn đã đọc.</p>
          ) : null}

          <div className="field" style={{ marginTop: 10 }}>
            <label htmlFor="speak-transcript">Câu bạn vừa đọc</label>
            <textarea
              id="speak-transcript"
              className="input"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={2}
              placeholder="Transcript sẽ hiện ở đây, hoặc gõ lại câu bạn đã đọc..."
            />
          </div>

          <Button block onClick={analyze} disabled={analyzing || recording || !transcript.trim()}>
            {analyzing ? <span className="spinner" /> : <SparkIcon size={16} />}
            {analyzing ? 'Đang chấm...' : 'CHẤM PHÁT ÂM'}
          </Button>
        </Card>

        <div className="page-stack">
          {attempt ? (
            <Card className="speak-result">
              <div className="card__head">
                <div>
                  <span className="card__eyebrow">Kết quả</span>
                  <h2 className="card__title">Điểm phát âm</h2>
                </div>
                <Chip tone={scoreTone(attempt.overallScore)}>{attempt.overallScore}/100</Chip>
              </div>
              <div className="speak-score">
                <div
                  className="speak-score__ring"
                  style={{ background: `conic-gradient(var(--pri) ${attempt.overallScore * 3.6}deg, var(--sky) 0deg)` }}
                >
                  <span>{attempt.overallScore}%</span>
                </div>
                <div>
                  <strong>{attempt.overallScore >= 80 ? 'Rất rõ!' : attempt.overallScore >= 60 ? 'Khá tốt' : 'Cần luyện thêm'}</strong>
                  <p>{attempt.referenceText}</p>
                </div>
              </div>

              <div className="speak-phonemes">
                {attempt.phonemes.map((phoneme) => (
                  <Chip key={`${phoneme.phoneme}-${phoneme.score}`} tone={scoreTone(phoneme.score)}>
                    {phoneme.phoneme} · {phoneme.score}
                  </Chip>
                ))}
              </div>

              <div className="speak-words">
                {attempt.words.map((word) => (
                  <span key={`${word.word}-${word.spoken}`} className={word.correct ? 'is-ok' : 'is-bad'}>
                    {word.correct ? <CheckIcon size={11} /> : <TargetIcon size={11} />}
                    {word.word}
                  </span>
                ))}
              </div>

              {attempt.tips.length > 0 ? (
                <ul className="speak-tips">
                  {attempt.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ) : (
            <Card className="speak-empty">
              <span className="speak-empty__art"><MicIcon size={46} /></span>
              <h2>Nimbo nghe bạn nói</h2>
              <p>
                Chọn câu mẫu, bấm micro và đọc to. Bạn sẽ thấy điểm tổng, từng âm
                và gợi ý sửa ngay.
              </p>
              <div className="speak-empty__stats">
                <span><ClockIcon size={13} /> {summary?.attempts ?? 0} lần luyện</span>
                <span><TargetIcon size={13} /> {summary ? `${Math.round(summary.averageScore)}% trung bình` : 'Chưa có dữ liệu'}</span>
              </div>
            </Card>
          )}

          {summary && summary.focusTips.length > 0 ? (
            <Card flat>
              <span className="card__eyebrow">Nimbo gợi ý</span>
              <ul className="speak-tips" style={{ marginTop: 8 }}>
                {summary.focusTips.slice(0, 3).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
