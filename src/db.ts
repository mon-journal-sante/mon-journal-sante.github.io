import { openDB } from 'idb'

export interface Repas {
  id: string
  categorie: 'petit-dejeuner' | 'dejeuner' | 'diner' | 'collation'
  heure: string
  aliments: string[]
  note?: string
}

export interface JournalEntry {
  date: string

  heureCoucher?: string
  heureLever?: string
  fenetreOuverte?: boolean
  symptolesReveil?: boolean

  repas: Repas[]

  nbVerresEau: number

  migraine?: boolean
  migraineAuReveil?: boolean
  heureApparitionMigraine?: string
  heureDisparitionMigraine?: string
  intensiteMigraine?: number
  localisationMigraine?: string[]
  nausees?: boolean
  migraineSoulageeParRepas?: boolean

  jourRegles?: boolean

  notesLibres?: string
}

const DB_NAME = 'journal-sante'
const STORE = 'entries'

function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'date' })
    },
  })
}

export async function getEntry(date: string): Promise<JournalEntry | undefined> {
  const db = await getDb()
  return db.get(STORE, date)
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  const db = await getDb()
  await db.put(STORE, entry)
}

export async function clearAllEntries(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE)
}
