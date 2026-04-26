import { useEffect, useState } from 'react'
import { getEntry, saveEntry } from '../db'
import { todayISO, formatDateFR } from '../utils/date'
import { computeDuration } from '../utils/sleep'

export function AujourdhuiScreen() {
  const today = todayISO()

  const [heureCoucher, setHeureCoucher] = useState<string>('')
  const [heureLever, setHeureLever] = useState<string>('')
  const [fenetreOuverte, setFenetreOuverte] = useState<boolean | null>(null)
  const [symptolesReveil, setSymptolesReveil] = useState<boolean | null>(null)
  const [nbVerresEau, setNbVerresEau] = useState<number>(0)
  const [migraine, setMigraine] = useState<boolean | null>(null)
  const [jourRegles, setJourRegles] = useState<boolean | null>(null)
  const [notesLibres, setNotesLibres] = useState<string>('')
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
      if (entry.jourRegles !== undefined) setJourRegles(entry.jourRegles)
      if (entry.notesLibres) setNotesLibres(entry.notesLibres)
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
      repas: [],
      nbVerresEau,
      migraine: migraine ?? undefined,
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
        <button className="btn-secondary w-full" disabled>+ Ajouter un repas</button>
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
