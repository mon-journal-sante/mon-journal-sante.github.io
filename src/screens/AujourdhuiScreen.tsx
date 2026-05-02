import { useEffect, useRef, useState } from 'react'
import { getEntry, saveEntry, Repas } from '../db'
import { todayISO, formatDateFR } from '../utils/date'
import { computeDuration } from '../utils/sleep'
import { identifyFoodFromPhoto, ClaudeApiError } from '../utils/claude'

const CATEGORIE_LABELS: Record<Repas['categorie'], string> = {
  'petit-dejeuner': 'Petit-déjeuner',
  'dejeuner': 'Déjeuner',
  'diner': 'Dîner',
  'collation': 'Collation',
}

function currentTimeHHMM(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const LOCALISATIONS = ['Front', 'Tempes', 'Derrière les yeux', 'Nuque', 'Diffus', 'Autre']

const HTTP_LABELS: Record<number, string> = {
  401: 'clé API invalide',
  403: 'accès refusé',
  429: 'quota dépassé',
  500: 'erreur serveur',
  502: 'erreur serveur',
  503: 'erreur serveur',
  504: 'erreur serveur',
}

export function AujourdhuiScreen() {
  const today = todayISO()

  const [heureCoucher, setHeureCoucher] = useState<string>('')
  const [heureLever, setHeureLever] = useState<string>('')
  const [fenetreOuverte, setFenetreOuverte] = useState<boolean | null>(null)
  const [symptolesReveil, setSymptolesReveil] = useState<boolean | null>(null)
  const [nbVerresEau, setNbVerresEau] = useState<number>(0)
  const [migraine, setMigraine] = useState<boolean | null>(null)
  const [migraineAuReveil, setMigraineAuReveil] = useState<boolean | null>(null)
  const [heureApparitionMigraine, setHeureApparitionMigraine] = useState<string>('')
  const [heureDisparitionMigraine, setHeureDisparitionMigraine] = useState<string>('')
  const [intensiteMigraine, setIntensiteMigraine] = useState<number>(5)
  const [localisationMigraine, setLocalisationMigraine] = useState<string[]>([])
  const [nausees, setNausees] = useState<boolean | null>(null)
  const [migraineSoulageeParRepas, setMigraineSoulageeParRepas] = useState<boolean | null>(null)
  const [jourRegles, setJourRegles] = useState<boolean | null>(null)
  const [notesLibres, setNotesLibres] = useState<string>('')
  const [repas, setRepas] = useState<Repas[]>([])
  const [showRepasForm, setShowRepasForm] = useState<boolean>(false)
  const [toast, setToast] = useState<boolean>(false)

  useEffect(() => {
    getEntry(today).then((entry) => {
      if (!entry) return
      if (entry.heureCoucher) setHeureCoucher(entry.heureCoucher)
      if (entry.heureLever) setHeureLever(entry.heureLever)
      if (entry.fenetreOuverte !== undefined) setFenetreOuverte(entry.fenetreOuverte)
      if (entry.symptolesReveil !== undefined) setSymptolesReveil(entry.symptolesReveil)
      setNbVerresEau(entry.nbVerresEau)
      if (entry.migraine !== undefined) setMigraine(entry.migraine)
      if (entry.migraineAuReveil !== undefined) setMigraineAuReveil(entry.migraineAuReveil)
      if (entry.heureApparitionMigraine) setHeureApparitionMigraine(entry.heureApparitionMigraine)
      if (entry.heureDisparitionMigraine) setHeureDisparitionMigraine(entry.heureDisparitionMigraine)
      if (entry.intensiteMigraine !== undefined) setIntensiteMigraine(entry.intensiteMigraine)
      if (entry.localisationMigraine) setLocalisationMigraine(entry.localisationMigraine)
      if (entry.nausees !== undefined) setNausees(entry.nausees)
      if (entry.migraineSoulageeParRepas !== undefined) setMigraineSoulageeParRepas(entry.migraineSoulageeParRepas)
      if (entry.jourRegles !== undefined) setJourRegles(entry.jourRegles)
      if (entry.notesLibres) setNotesLibres(entry.notesLibres)
      if (entry.repas?.length) setRepas(entry.repas)
    })
  }, [today])

  const duration = computeDuration(heureCoucher, heureLever)

  async function handleSave() {
    await saveEntry({
      date: today,
      heureCoucher: heureCoucher || undefined,
      heureLever: heureLever || undefined,
      fenetreOuverte: fenetreOuverte ?? undefined,
      symptolesReveil: symptolesReveil ?? undefined,
      repas,
      nbVerresEau,
      migraine: migraine ?? undefined,
      ...(migraine === true && {
        migraineAuReveil: migraineAuReveil ?? undefined,
        heureApparitionMigraine: (migraineAuReveil === false && heureApparitionMigraine) ? heureApparitionMigraine : undefined,
        heureDisparitionMigraine: heureDisparitionMigraine || undefined,
        intensiteMigraine,
        localisationMigraine: localisationMigraine.length > 0 ? localisationMigraine : undefined,
        nausees: nausees ?? undefined,
        migraineSoulageeParRepas: migraineSoulageeParRepas ?? undefined,
      }),
      jourRegles: jourRegles ?? undefined,
      notesLibres: notesLibres || undefined,
    })
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Aujourd'hui</h1>
        <p className="text-sm capitalize" style={{ color: 'var(--color-text-muted)' }}>{formatDateFR(today)}</p>
      </div>

      <Card title="Sommeil 🌙">
        <Field label="Heure de coucher">
          <input
            type="time"
            className="input-time"
            value={heureCoucher}
            onChange={(e) => setHeureCoucher(e.target.value)}
          />
        </Field>
        <Field label="Heure de lever">
          <input
            type="time"
            className="input-time"
            value={heureLever}
            onChange={(e) => setHeureLever(e.target.value)}
          />
        </Field>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Durée : {duration ?? '—'}
        </p>
        <ToggleField label="Fenêtre ouverte cette nuit ?" value={fenetreOuverte} onChange={setFenetreOuverte} />
        <ToggleField label="Symptômes dès le réveil ?" value={symptolesReveil} onChange={setSymptolesReveil} />
      </Card>

      <Card title="Repas 🍽️">
        {repas.length > 0 && (
          <div className="flex flex-col">
            {repas.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <div className="my-2" style={{ borderTop: '1px solid var(--color-border)' }} />}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
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
                  <button
                    className="text-sm shrink-0"
                    style={{ color: 'var(--color-danger)', background: 'transparent', border: 'none' }}
                    onClick={() => setRepas((prev) => prev.filter((x) => x.id !== r.id))}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {showRepasForm
          ? <RepasForm
              onAdd={(r) => { setRepas((prev) => [...prev, r]); setShowRepasForm(false) }}
              onCancel={() => setShowRepasForm(false)}
            />
          : <button
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onClick={() => setShowRepasForm(true)}
            >
              + Ajouter un repas
            </button>
        }
      </Card>

      <Card title="Hydratation 💧">
        <div className="flex items-center gap-4">
          <span style={{ color: 'var(--color-text)' }}>Verres d'eau :</span>
          <div className="flex items-center gap-3">
            <button
              className="counter-btn"
              onClick={() => setNbVerresEau((v) => Math.max(0, v - 1))}
            >−</button>
            <span className="text-lg font-semibold w-6 text-center" style={{ color: 'var(--color-text)' }}>
              {nbVerresEau}
            </span>
            <button
              className="counter-btn"
              onClick={() => setNbVerresEau((v) => v + 1)}
            >+</button>
          </div>
        </div>
      </Card>

      <Card title="Symptômes">
        <ToggleField label="Migraine aujourd'hui ?" value={migraine} onChange={setMigraine} />
        {migraine === true && (
          <>
            <ToggleField label="Présente dès le réveil ?" value={migraineAuReveil} onChange={setMigraineAuReveil} />
            {migraineAuReveil === false && (
              <Field label="Heure d'apparition">
                <input
                  type="time"
                  className="input-time"
                  value={heureApparitionMigraine}
                  onChange={(e) => setHeureApparitionMigraine(e.target.value)}
                />
              </Field>
            )}
            <Field label="Heure de disparition">
              <input
                type="time"
                className="input-time"
                value={heureDisparitionMigraine}
                onChange={(e) => setHeureDisparitionMigraine(e.target.value)}
              />
            </Field>
            <div className="flex flex-col gap-1">
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                Intensité : {intensiteMigraine} / 10
              </span>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={intensiteMigraine}
                onChange={(e) => setIntensiteMigraine(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>Localisation</span>
              <div className="flex flex-wrap gap-2">
                {LOCALISATIONS.map((loc) => {
                  const active = localisationMigraine.includes(loc)
                  return (
                    <button
                      key={loc}
                      onClick={() =>
                        setLocalisationMigraine((prev) =>
                          active ? prev.filter((l) => l !== loc) : [...prev, loc]
                        )
                      }
                      className="rounded-lg px-3 py-1 text-sm font-medium border"
                      style={
                        active
                          ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                          : { backgroundColor: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
                      }
                    >
                      {loc}
                    </button>
                  )
                })}
              </div>
            </div>
            <ToggleField label="Nausées ?" value={nausees} onChange={setNausees} />
            <ToggleField label="Soulagée par un repas ?" value={migraineSoulageeParRepas} onChange={setMigraineSoulageeParRepas} />
          </>
        )}
      </Card>

      <Card title="Cycle menstruel">
        <ToggleField label="Jour de règles ?" value={jourRegles} onChange={setJourRegles} />
      </Card>

      <Card title="Notes libres 📝">
        <textarea
          placeholder="Stress, médicament, activité physique…"
          rows={3}
          className="w-full resize-none rounded-lg border p-3 text-sm outline-none"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-bg)',
          }}
          value={notesLibres}
          onChange={(e) => setNotesLibres(e.target.value)}
        />
      </Card>

      <button
        className="w-full rounded-xl py-4 text-base font-semibold text-white"
        style={{ backgroundColor: 'var(--color-primary)' }}
        onClick={handleSave}
      >
        Enregistrer la journée
      </button>

      {toast && (
        <div
          className="fixed rounded-xl px-6 py-3 font-semibold text-white"
          style={{
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-success)',
            zIndex: 50,
          }}
        >
          Journée enregistrée ✓
        </div>
      )}
    </div>
  )
}

function RepasForm({ onAdd, onCancel }: { onAdd: (r: Repas) => void; onCancel: () => void }) {
  const [categorie, setCategorie] = useState<Repas['categorie']>('dejeuner')
  const [heure, setHeure] = useState<string>(currentTimeHHMM())
  const [aliments, setAliments] = useState<string[]>([])
  const [alimentInput, setAlimentInput] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [photoLoading, setPhotoLoading] = useState<boolean>(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoDebug, setPhotoDebug] = useState<object | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addAliment() {
    const trimmed = alimentInput.trim()
    if (!trimmed) return
    setAliments((prev) => [...prev, trimmed])
    setAlimentInput('')
    setPhotoError(null)
    setPhotoDebug(null)
  }

  function downloadDebug(payload: object) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-claude-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addAliment() }
  }

  function handleAdd() {
    onAdd({ id: crypto.randomUUID(), categorie, heure, aliments, note: note || undefined })
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const apiKey = localStorage.getItem('claude_api_key') ?? ''
    if (!apiKey) {
      setPhotoError('Clé API manquante. Renseignez-la dans les Paramètres.')
      return
    }

    setPhotoLoading(true)
    setPhotoError(null)
    setPhotoDebug(null)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).replace(/^data:[^;]+;base64,/, ''))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const identified = await identifyFoodFromPhoto(base64, file.type, apiKey)
      setAliments((prev) => {
        const lower = prev.map((a) => a.toLowerCase())
        const toAdd = identified.filter((a) => !lower.includes(a.toLowerCase()))
        return [...prev, ...toAdd]
      })
    } catch (err) {
      if (err instanceof ClaudeApiError) {
        setPhotoDebug(err.debugPayload)
        setPhotoError(`Identification échouée. Ajoutez les aliments manuellement.`)
      } else {
        const match = (err instanceof Error ? err.message : '').match(/HTTP (\d+)/)
        if (match) {
          const code = Number(match[1])
          const label = HTTP_LABELS[code] ?? 'erreur inconnue'
          setPhotoError(`Identification échouée (${code} — ${label}). Ajoutez les aliments manuellement.`)
        } else {
          setPhotoError('Identification échouée. Ajoutez les aliments manuellement.')
        }
      }
    } finally {
      setPhotoLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>Catégorie</span>
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value as Repas['categorie'])}
          className="rounded-lg border px-2 py-1.5 text-sm outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}
        >
          <option value="petit-dejeuner">Petit-déjeuner</option>
          <option value="dejeuner">Déjeuner</option>
          <option value="diner">Dîner</option>
          <option value="collation">Collation</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>Heure</span>
        <input
          type="time"
          className="input-time"
          value={heure}
          onChange={(e) => setHeure(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>Aliments</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={photoLoading}
          className="w-full rounded-xl py-2.5 text-sm font-semibold border"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'transparent' }}
        >
          {photoLoading ? 'Identification en cours…' : '📷 Identifier par photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
        {photoError && (
          <span className="text-sm" style={{ color: 'var(--color-danger)' }}>{photoError}</span>
        )}
        {photoDebug && (
          <button
            onClick={() => downloadDebug(photoDebug)}
            className="text-sm text-left underline"
            style={{ color: 'var(--color-text-muted)', background: 'transparent', border: 'none', padding: 0 }}
          >
            Télécharger le rapport de débogage
          </button>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ajouter un aliment…"
            value={alimentInput}
            onChange={(e) => setAlimentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}
          />
          <button
            onClick={addAliment}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >+</button>
        </div>
        {aliments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aliments.map((a, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {a}
                <button
                  onClick={() => setAliments((prev) => prev.filter((_, j) => j !== i))}
                  className="ml-0.5 font-semibold leading-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>Note</span>
        <textarea
          placeholder="Remarque optionnelle…"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full resize-none rounded-lg border p-3 text-sm outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold border"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'transparent' }}
        >Annuler</button>
        <button
          onClick={handleAdd}
          disabled={aliments.length === 0}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: aliments.length === 0 ? 'var(--color-text-muted)' : 'var(--color-primary)' }}
        >Ajouter</button>
      </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
      {children}
    </div>
  )
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  function handleClick(selected: boolean) {
    onChange(value === selected ? null : selected)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
      <div className="flex gap-2">
        <ToggleButton active={value === true} onClick={() => handleClick(true)}>Oui</ToggleButton>
        <ToggleButton active={value === false} onClick={() => handleClick(false)}>Non</ToggleButton>
      </div>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-4 py-1.5 text-sm font-medium border"
      style={
        active
          ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
          : { backgroundColor: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
      }
    >
      {children}
    </button>
  )
}
