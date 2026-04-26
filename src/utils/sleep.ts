export function computeDuration(coucher: string, lever: string): string | null {
  if (!coucher || !lever) return null

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  let coucherMin = toMinutes(coucher)
  let leverMin = toMinutes(lever)

  if (leverMin <= coucherMin) leverMin += 24 * 60

  const duration = leverMin - coucherMin
  if (duration >= 24 * 60) return null

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  return `${hours}h${String(minutes).padStart(2, '0')}`
}
