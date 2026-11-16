import { useCallback, useEffect, useState } from 'react'
import { ALL_LEVELS } from './curriculum'

/* Tiến độ khóa học là dữ liệu UI theo tài khoản trên thiết bị.
   Không ghi vào DB để giữ nguyên chính sách database trắng. */

export type LevelProgress = {
  stars: number
  bestAccuracy: number
  xp: number
  attempts: number
  completedAt?: string
  /** Số phase đã hoàn thành (0–4). Đủ 4 phase mới mở level kế. */
  phases: number
}

export type CourseProgress = {
  levels: Record<string, LevelProgress>
}

const STORAGE_PREFIX = 'skyworld.course.v1'

function keyFor(email: string | null | undefined): string {
  return `${STORAGE_PREFIX}:${(email ?? 'local').trim().toLowerCase()}`
}

function clampPhases(value: unknown): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.min(4, Math.max(0, Math.round(number)))
}

function normalize(entry: Partial<LevelProgress> | undefined): LevelProgress | null {
  if (!entry || typeof entry !== 'object') return null
  const legacyDone = Boolean(entry.completedAt)
  return {
    stars: Math.max(0, Math.min(3, Math.round(entry.stars ?? 0))),
    bestAccuracy: Math.max(0, Math.min(100, Math.round(entry.bestAccuracy ?? 0))),
    xp: Math.max(0, Math.round(entry.xp ?? 0)),
    attempts: Math.max(0, Math.round(entry.attempts ?? 0)),
    completedAt: entry.completedAt,
    phases: entry.phases === undefined ? (legacyDone ? 4 : 0) : clampPhases(entry.phases),
  }
}

export function readProgress(email: string | null | undefined): CourseProgress {
  try {
    const raw = window.localStorage.getItem(keyFor(email))
    if (!raw) return { levels: {} }
    const parsed = JSON.parse(raw) as CourseProgress
    if (!parsed || typeof parsed !== 'object' || !parsed.levels) return { levels: {} }
    const levels: Record<string, LevelProgress> = {}
    for (const [levelId, entry] of Object.entries(parsed.levels)) {
      const normalized = normalize(entry)
      if (normalized) levels[levelId] = normalized
    }
    return { levels }
  } catch {
    return { levels: {} }
  }
}

function writeProgress(email: string | null | undefined, progress: CourseProgress) {
  try {
    window.localStorage.setItem(keyFor(email), JSON.stringify(progress))
  } catch {
    /* Safari private mode: tiến độ vẫn chạy trong phiên hiện tại. */
  }
}

export function levelPhases(progress: CourseProgress, levelId: string): number {
  const entry = progress.levels[levelId]
  if (!entry) return 0
  if (entry.phases === undefined) return entry.completedAt ? 4 : 0
  return clampPhases(entry.phases)
}

export function isLevelDone(progress: CourseProgress, levelId: string): boolean {
  return levelPhases(progress, levelId) >= 4
}

export function isLevelUnlocked(progress: CourseProgress, flatIndex: number): boolean {
  if (flatIndex <= 0) return true
  const previous = ALL_LEVELS[flatIndex - 1]
  return previous ? isLevelDone(progress, previous.id) : false
}

export function firstOpenLevel(progress: CourseProgress): number {
  const index = ALL_LEVELS.findIndex(
    (level, position) => !isLevelDone(progress, level.id) && isLevelUnlocked(progress, position),
  )
  return index >= 0 ? index : ALL_LEVELS.length - 1
}

export function courseSummary(progress: CourseProgress) {
  const entries = Object.values(progress.levels)
  const done = ALL_LEVELS.filter((level) => isLevelDone(progress, level.id)).length
  const stars = ALL_LEVELS.reduce(
    (sum, level) => sum + (isLevelDone(progress, level.id) ? progress.levels[level.id]?.stars ?? 0 : 0),
    0,
  )
  return {
    done,
    total: ALL_LEVELS.length,
    xp: entries.reduce((sum, item) => sum + item.xp, 0),
    stars,
    maxStars: ALL_LEVELS.length * 3,
  }
}

export function useCourseProgress(email: string | null | undefined) {
  const [progress, setProgress] = useState<CourseProgress>(() => readProgress(email))

  useEffect(() => {
    setProgress(readProgress(email))
  }, [email])

  const completePhase = useCallback(
    (levelId: string, phase: number, xp: number) => {
      setProgress((current) => {
        const previous = current.levels[levelId]
        const next: LevelProgress = {
          stars: previous?.stars ?? 0,
          bestAccuracy: previous?.bestAccuracy ?? 0,
          xp: Math.max(previous?.xp ?? 0, xp),
          attempts: previous?.attempts ?? 0,
          completedAt: previous?.completedAt,
          phases: Math.max(levelPhases(current, levelId), clampPhases(phase)),
        }
        const updated: CourseProgress = {
          levels: { ...current.levels, [levelId]: next },
        }
        writeProgress(email, updated)
        return updated
      })
    },
    [email],
  )

  const complete = useCallback(
    (levelId: string, result: { stars: number; accuracy: number; xp: number }) => {
      setProgress((current) => {
        const previous = current.levels[levelId]
        const next: LevelProgress = {
          stars: Math.max(previous?.stars ?? 0, result.stars),
          bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, Math.round(result.accuracy)),
          xp: Math.max(previous?.xp ?? 0, result.xp),
          attempts: (previous?.attempts ?? 0) + 1,
          completedAt: new Date().toISOString(),
          phases: 4,
        }
        const updated: CourseProgress = {
          levels: { ...current.levels, [levelId]: next },
        }
        writeProgress(email, updated)
        return updated
      })
    },
    [email],
  )

  return { progress, complete, completePhase }
}
