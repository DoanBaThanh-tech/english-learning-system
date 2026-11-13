interface SkySpeechRecognitionEvent extends Event {
  results: {
    length: number
    [index: number]: {
      length: number
      [index: number]: { transcript: string; confidence: number }
      isFinal: boolean
    }
  }
}

interface SkySpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SkySpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

interface SkySpeechRecognitionConstructor {
  new (): SkySpeechRecognition
}

interface Window {
  SpeechRecognition?: SkySpeechRecognitionConstructor
  webkitSpeechRecognition?: SkySpeechRecognitionConstructor
}
