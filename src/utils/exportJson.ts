import { JournalEntry } from '../db'
import { todayISO } from './date'

export interface BackupData {
  version: 1
  exportDate: string
  config: {
    claude_api_key?: string
    settings?: unknown
  }
  entries: JournalEntry[]
}

export function exportJson(entries: JournalEntry[]): void {
  const raw = localStorage.getItem('settings')
  const backup: BackupData = {
    version: 1,
    exportDate: todayISO(),
    config: {
      claude_api_key: localStorage.getItem('claude_api_key') ?? undefined,
      settings: raw ? JSON.parse(raw) : undefined,
    },
    entries,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `journal-sante-${todayISO()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
