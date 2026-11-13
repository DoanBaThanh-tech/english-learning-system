import { useCallback, useEffect, useState } from 'react'
import { ALL_LEVELS } from './curriculum'

/* Tiến độ khóa học là dữ liệu UI theo tài khoản trên thiết bị.
   Không ghi vào DB để giữ nguyên chính sách database trắng. */

export type LevelProgress = {
  stars: number
  bestAccuracy: number
  xp: number
  attempts: number
  completedAt: string
}

export type CourseProgress = {
  levels: Record<string, LevelProgress>
}

const STORAGE_PREFIX = 'skyworld.course.v1'

function keyFor(email: string | null | undefined): string {
  return `${STORAGE_PREFIX}:${(email ?? 'local').trim().toLowerCase()}`
}

export function readProgress(email: string | null | undefined): CourseProgress {
  try {
    const raw = window.localStorage.getItem(keyFor(email))
    if (!raw) return { levels: {} }
    const parsed = JSON.parse(raw) as CourseProgress
    if (!parsed || typeof parsed !== 'object' || !parsed.levels) return { levels: {} }
    return { levels: parsed.levels }
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

export function isLevelDone(progress: CourseProgress, levelId: string): boolean {
  return Boolean(progress.levels[levelId])
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
  return {
    done: entries.length,
    total: ALL_LEVELS.length,
    xp: entries.reduce((sum, item) => sum + item.xp, 0),
    stars: entries.reduce((sum, item) => sum + item.stars, 0),
    maxStars: ALL_LEVELS.length * 3,
  }
}

export function useCourseProgress(email: string | null | undefined) {
  const [progress, setProgress] = useState<CourseProgress>(() => readProgress(email))

  useEffect(() => {
    setProgress(readProgress(email))
  }, [email])

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

  return { progress, complete }
}
