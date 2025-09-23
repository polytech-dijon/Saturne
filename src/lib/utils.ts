import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DurationParts = {
  totalSeconds: number
  roundedSeconds: number
  minutes: number
  seconds: number
}

export function toDurationParts(seconds: number): DurationParts | null {
  if (!Number.isFinite(seconds)) return null
  const safeSeconds = Math.max(0, seconds)
  const roundedSeconds = Math.round(safeSeconds)
  const minutes = Math.floor(roundedSeconds / 60)
  const remainingSeconds = roundedSeconds % 60

  return {
    totalSeconds: safeSeconds,
    roundedSeconds,
    minutes,
    seconds: remainingSeconds,
  }
}
