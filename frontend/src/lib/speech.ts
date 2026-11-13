/* Phát âm tiếng Anh bằng Web Speech API, dùng chung cho các bài học. */
export function speakEnglish(text: string, rate = 0.88) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const clean = text.replace(/[“”"']/g, '')
  if (!clean.trim()) return false
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = 'en-US'
  utterance.rate = rate
  utterance.pitch = 1
  const voice = window.speechSynthesis
    .getVoices()
    .find((item) => item.lang.toLowerCase().startsWith('en'))
  if (voice) utterance.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}
