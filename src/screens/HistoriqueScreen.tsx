import { useEffect, useState } from 'react'
import { JournalEntry, Repas, getAllEntries } from '../db'
import { AujourdhuiScreen } from './AujourdhuiScreen'
import { formatDateFR } from '../utils/date'
import { computeDuration } from '../utils/sleep'

const CATEGORIE_LABELS: Record<Repas['categorie'], string> = {
  'petit-dejeuner': 'Petit-déjeuner',
  'dejeuner': 'Déjeuner',
  'diner': 'Dîner',
  'collation': 'Collation',
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function HistoriqueScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    getAllEntries().then(setEntries)
  }, [])

  const selectedEntry = selected ? entries.find(e => e.date === selected) : undefined

  if (selected && selectedEntry && editing) {
    return (
      <AujourdhuiScreen
        date={selectedEntry.date}
        onSaved={() => {
          getAllEntries().then(setEntries)
          setEditing(false)
        }}
      />
    )
  }

  if (selected && selectedEntry) {
    return <DetailView entry={selectedEntry} onBack={() => setSelected(null)} onEdit={() => setEditing(true)} />
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Historique</h1>

      {entries.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-center">
          <p style={{ color: 'var(--color-text-muted)' }}>
            Aucune entrée pour l'instant. Commence à remplir ton journal !
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {entries.map((entry, i) => (
            <div key={entry.date}>
              {i > 0 && <div style={{ borderTop: '1px solid var(--color-border)' }} />}
              <button
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
                style={{ backgroundColor: 'transparent' }}
                onClick={() => setSelected(entry.date)}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {capitalize(formatDateFR(entry.date))}
                  </span>
                  {(entry.repas?.length ?? 0) > 0 && (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {entry.repas.length} repas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {entry.migraine === false && <span>✅</span>}
                  {entry.migraine === true && <span>🤕</span>}
                  {entry.nausees === true && <span>🤢</span>}
                  {entry.migraine === true && entry.intensiteMigraine !== undefined && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}
                    >
                      {entry.intensiteMigraine}/10
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailView({ entry, onBack, onEdit }: { entry: JournalEntry; onBack: () => void; onEdit: () => void }) {
  const hasSommeil =
    entry.heureCoucher !== undefined ||
    entry.heureLever !== undefined ||
    entry.fenetreOuverte !== undefined ||
    entry.symptolesReveil !== undefined

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm font-semibold"
          style={{ color: 'var(--color-primary)', background: 'transparent', border: 'none', padding: 0 }}
        >
          ← Retour
        </button>
        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
          {capitalize(formatDateFR(entry.date))}
        </span>
        <button
          onClick={onEdit}
          className="text-sm font-semibold"
          style={{ color: 'var(--color-primary)', background: 'transparent', border: 'none', padding: 0 }}
        >
          Modifier
        </button>
      </div>

      {hasSommeil && (
        <Card title="Sommeil 🌙">
          {entry.heureCoucher && <Row label="Coucher" value={entry.heureCoucher} />}
          {entry.heureLever && <Row label="Lever" value={entry.heureLever} />}
          {entry.heureCoucher && entry.heureLever && (
            <Row label="Durée" value={computeDuration(entry.heureCoucher, entry.heureLever) ?? '—'} />
          )}
          {entry.fenetreOuverte !== undefined && (
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              {entry.fenetreOuverte ? 'Fenêtre ouverte' : 'Fenêtre fermée'}
            </p>
          )}
          {entry.symptolesReveil === true && (
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>Symptômes au réveil</p>
          )}
        </Card>
      )}

      {(entry.repas?.length ?? 0) > 0 && (
        <Card title="Repas 🍽️">
          {entry.repas.map((r, i) => (
            <div key={r.id}>
              {i > 0 && <div className="my-1" style={{ borderTop: '1px solid var(--color-border)' }} />}
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {CATEGORIE_LABELS[r.categorie]}{' '}
                  <span className="font-normal" style={{ color: 'var(--color-text-muted)' }}>{r.heure}</span>
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {r.aliments.join(', ')}
                </span>
                {r.note && (
                  <span className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>{r.note}</span>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {entry.nbVerresEau > 0 && (
        <Card title="Hydratation 💧">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            💧 {entry.nbVerresEau} verre{entry.nbVerresEau > 1 ? 's' : ''} d'eau
          </p>
        </Card>
      )}

      {(entry.migraine !== undefined || entry.temperature !== undefined) && (
        <Card title="Symptômes">
          {entry.temperature !== undefined && (
            <Row label="🌡️ Température" value={`${entry.temperature} °C`} />
          )}
          {entry.migraine !== undefined && (
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            Migraine : {entry.migraine ? 'Oui' : 'Non'}
          </p>
          )}
          {entry.migraine === true && (
            <>
              {entry.migraineAuReveil === true && (
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>Dès le réveil</p>
              )}
              {entry.migraineAuReveil !== true && entry.heureApparitionMigraine && (
                <Row label="Apparition" value={entry.heureApparitionMigraine} />
              )}
              {entry.heureDisparitionMigraine && (
                <Row label="Disparition" value={entry.heureDisparitionMigraine} />
              )}
              {entry.intensiteMigraine !== undefined && (
                <Row label="Intensité" value={`${entry.intensiteMigraine}/10`} />
              )}
              {(entry.localisationMigraine?.length ?? 0) > 0 && (
                <Row label="Localisation" value={entry.localisationMigraine!.join(', ')} />
              )}
              {entry.nausees !== undefined && (
                <Row label="Nausées" value={entry.nausees ? 'Oui' : 'Non'} />
              )}
              {entry.migraineSoulageeParRepas !== undefined && (
                <Row label="Soulagée par un repas" value={entry.migraineSoulageeParRepas ? 'Oui' : 'Non'} />
              )}
            </>
          )}
        </Card>
      )}

      {entry.jourRegles !== undefined && (
        <Card title="Cycle menstruel">
          <Row label="Jour de règles" value={entry.jourRegles ? 'Oui' : 'Non'} />
        </Card>
      )}

      {entry.notesLibres && (
        <Card title="Notes libres 📝">
          <p className="text-sm" style={{ color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
            {entry.notesLibres}
          </p>
        </Card>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h2 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</span>
    </div>
  )
}
