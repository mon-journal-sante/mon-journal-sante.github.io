import { JournalEntry } from '../db'
import { todayISO } from './date'

function escapeCsv(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

function boolCell(value: boolean | undefined): string {
  if (value === undefined) return ''
  return value ? 'Oui' : 'Non'
}

function durationMin(coucher: string, lever: string): string {
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
  }
  let coucherMin = toMin(coucher)
  let leverMin = toMin(lever)
  if (leverMin < coucherMin) leverMin += 1440
  return String(leverMin - coucherMin)
}

function entryToRow(entry: JournalEntry): string {
  const repasCategories = entry.repas.map(r => r.categorie).join('|')
  const aliments = entry.repas.flatMap(r => r.aliments).join('|')
  const localisation = (entry.localisationMigraine ?? []).join('|')

  const cells = [
    entry.date,
    entry.heureCoucher ?? '',
    entry.heureLever ?? '',
    entry.heureCoucher && entry.heureLever ? durationMin(entry.heureCoucher, entry.heureLever) : '',
    boolCell(entry.fenetreOuverte),
    repasCategories,
    aliments,
    String(entry.nbVerresEau),
    boolCell(entry.migraine),
    boolCell(entry.migraineAuReveil),
    entry.heureApparitionMigraine ?? '',
    entry.heureDisparitionMigraine ?? '',
    entry.intensiteMigraine !== undefined ? String(entry.intensiteMigraine) : '',
    localisation,
    boolCell(entry.nausees),
    boolCell(entry.migraineSoulageeParRepas),
    boolCell(entry.jourRegles),
    '',
    entry.temperature !== undefined ? String(entry.temperature) : '',
    entry.notesLibres ?? '',
  ]

  return cells.map(escapeCsv).join(';')
}

const HEADERS = [
  'date', 'heure_coucher', 'heure_lever', 'duree_sommeil_min', 'fenetre_ouverte',
  'repas_categories', 'aliments_identifies', 'nb_verres_eau',
  'migraine', 'migraine_au_reveil', 'heure_apparition_migraine', 'heure_disparition_migraine',
  'intensite_migraine', 'localisation_migraine', 'nausees', 'migraine_soulagee_par_repas',
  'jour_regles', 'jour_cycle', 'temperature', 'notes_libres',
]

export function exportCsv(entries: JournalEntry[]): void {
  const rows = [HEADERS.join(';'), ...entries.map(entryToRow)]
  const csv = '﻿' + rows.join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `journal-migraines-${todayISO()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
