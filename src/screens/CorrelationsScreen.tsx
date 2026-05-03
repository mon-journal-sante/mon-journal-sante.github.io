import { useEffect, useState, type ReactNode } from 'react'
import { getAllEntries, type JournalEntry } from '../db'
import { todayISO, formatDateFR } from '../utils/date'

type Phase = 'menstruelle' | 'folliculaire' | 'ovulatoire' | 'luteale'
type EnrichedEntry = JournalEntry & { jourCycle?: number }

function getPhase(
  jourCourant: number,
  dureeCycle: number,
  dureeLuteale: number,
  dureeMenstruation: number
): Phase | null {
  if (jourCourant < 1 || jourCourant > dureeCycle) return null
  const jourOvulation = dureeCycle - dureeLuteale
  const debutOvulatoire = jourOvulation - 1
  const finOvulatoire = jourOvulation + 1
  if (jourCourant <= dureeMenstruation) return 'menstruelle'
  if (jourCourant < debutOvulatoire) return 'folliculaire'
  if (jourCourant <= finOvulatoire) return 'ovulatoire'
  return 'luteale'
}

function parseSleep(coucher: string, lever: string): number {
  const [ch, cm] = coucher.split(':').map(Number)
  const [lh, lm] = lever.split(':').map(Number)
  const cMin = ch * 60 + cm
  let lMin = lh * 60 + lm
  if (lMin <= cMin) lMin += 1440
  return lMin - cMin
}

function formatSleep(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
    }}>
      <h3 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Muted({ children }: { children: ReactNode }) {
  return <p style={{ color: 'var(--color-text-muted)' }}>{children}</p>
}

export function CorrelationsScreen() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)

  useEffect(() => {
    getAllEntries().then(setEntries)
  }, [])

  if (entries === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--color-text-muted)' }}>Chargement…</p>
      </div>
    )
  }

  if (entries.length < 7) {
    return (
      <div className="flex items-center justify-center h-full" style={{ padding: '24px' }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <Muted>Continue à remplir ton journal, les corrélations apparaîtront après quelques semaines de données.</Muted>
        </div>
      </div>
    )
  }

  const migraineEntries = entries.filter(e => e.migraine === true)
  const sansMigraineEntries = entries.filter(e => e.migraine === false)

  // --- Corr. 1 — Aliments fréquents les jours de migraine ---
  let corr1: ReactNode
  if (migraineEntries.length < 3) {
    corr1 = <Muted>Pas encore assez de données (il faut au moins 3 jours de migraine).</Muted>
  } else {
    const counts = new Map<string, { display: string; count: number }>()
    for (const entry of migraineEntries) {
      for (const repas of entry.repas) {
        for (const aliment of repas.aliments) {
          const key = aliment.toLowerCase()
          const existing = counts.get(key)
          if (existing) existing.count++
          else counts.set(key, { display: aliment, count: 1 })
        }
      }
    }
    const recurring = [...counts.values()]
      .filter(v => v.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    corr1 = recurring.length === 0
      ? <Muted>Pas encore de récurrence dans les aliments les jours de migraine.</Muted>
      : <p style={{ color: 'var(--color-text)' }}>{recurring.map(v => `${v.display} (${v.count} fois)`).join(', ')}</p>
  }

  // --- Corr. 2 — Soulagement par un repas ---
  const soulEnts = entries.filter(e => e.migraine === true && e.migraineSoulageeParRepas !== undefined)
  let corr2: ReactNode
  if (soulEnts.length < 3) {
    corr2 = <Muted>Pas encore assez de données.</Muted>
  } else {
    const soulCount = soulEnts.filter(e => e.migraineSoulageeParRepas === true).length
    corr2 = <p style={{ color: 'var(--color-text)' }}>{soulCount} fois sur {soulEnts.length}, manger a soulagé ta migraine.</p>
  }

  // --- Corr. 3 — Sommeil et migraine ---
  const sleepMig = entries.filter(e => e.migraine === true && e.heureCoucher && e.heureLever)
  const sleepSans = entries.filter(e => e.migraine === false && e.heureCoucher && e.heureLever)
  let corr3: ReactNode
  if (sleepMig.length < 3 || sleepSans.length < 3) {
    corr3 = <Muted>Pas encore assez de données.</Muted>
  } else {
    const avgMig = Math.round(sleepMig.reduce((s, e) => s + parseSleep(e.heureCoucher!, e.heureLever!), 0) / sleepMig.length)
    const avgSans = Math.round(sleepSans.reduce((s, e) => s + parseSleep(e.heureCoucher!, e.heureLever!), 0) / sleepSans.length)
    corr3 = (
      <>
        <p style={{ color: 'var(--color-text)' }}>Nuits avant une migraine : {formatSleep(avgMig)} de sommeil en moyenne.</p>
        <p style={{ color: 'var(--color-text)', marginTop: '4px' }}>Nuits sans migraine : {formatSleep(avgSans)} de sommeil en moyenne.</p>
      </>
    )
  }

  // --- Corr. 4 — Fenêtre la nuit ---
  const fenetreOuverteEnts = entries.filter(e => e.fenetreOuverte === true && e.migraine !== undefined)
  const fenetreFermeeEnts = entries.filter(e => e.fenetreOuverte === false && e.migraine !== undefined)
  let corr4: ReactNode
  if (fenetreOuverteEnts.length < 3 || fenetreFermeeEnts.length < 3) {
    corr4 = <Muted>Pas encore assez de données.</Muted>
  } else {
    const ouverteMig = fenetreOuverteEnts.filter(e => e.migraine === true).length
    const fermeeMig = fenetreFermeeEnts.filter(e => e.migraine === true).length
    corr4 = (
      <>
        <p style={{ color: 'var(--color-text)' }}>Fenêtre ouverte : migraine {ouverteMig} fois sur {fenetreOuverteEnts.length}.</p>
        <p style={{ color: 'var(--color-text)', marginTop: '4px' }}>Fenêtre fermée : migraine {fermeeMig} fois sur {fenetreFermeeEnts.length}.</p>
      </>
    )
  }

  // --- Corr. 5 — Hydratation ---
  let corr5: ReactNode
  if (migraineEntries.length < 3 || sansMigraineEntries.length < 3) {
    corr5 = <Muted>Pas encore assez de données.</Muted>
  } else {
    const avgMig = (migraineEntries.reduce((s, e) => s + e.nbVerresEau, 0) / migraineEntries.length).toFixed(1).replace('.', ',')
    const avgSans = (sansMigraineEntries.reduce((s, e) => s + e.nbVerresEau, 0) / sansMigraineEntries.length).toFixed(1).replace('.', ',')
    corr5 = (
      <>
        <p style={{ color: 'var(--color-text)' }}>Jours de migraine : {avgMig} verres d'eau en moyenne.</p>
        <p style={{ color: 'var(--color-text)', marginTop: '4px' }}>Jours sans migraine : {avgSans} verres d'eau en moyenne.</p>
      </>
    )
  }

  // --- Corr. 6 — Cycle menstruel ---
  const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
  const dureeCycle: number = settings.dureeCycle ?? 28
  const dureeLuteale: number = settings.dureeLuteale ?? 14
  const dureeMenstruation: number = settings.dureeMenstruation ?? 5
  const jourOvulation = dureeCycle - dureeLuteale
  const debutOvulatoire = jourOvulation - 1
  const finOvulatoire = jourOvulation + 1

  let corr6: ReactNode
  const cycleParamsValid = dureeCycle >= 21 && dureeCycle <= 35
    && (dureeMenstruation + 1) <= (debutOvulatoire - 1)

  if (!cycleParamsValid) {
    corr6 = <Muted>Paramètres de cycle incohérents. Vérifie la durée du cycle et la durée des règles dans les Paramètres.</Muted>
  } else {
    let debutDernierCycle: string | undefined = settings.debutDernierCycle

    if (!debutDernierCycle) {
      const reglesEnts = entries.filter(e => e.jourRegles === true).map(e => e.date).sort()
      if (reglesEnts.length > 0) {
        const runs: string[][] = [[reglesEnts[0]]]
        for (let i = 1; i < reglesEnts.length; i++) {
          const gap = (Date.parse(reglesEnts[i]) - Date.parse(reglesEnts[i - 1])) / 86400000
          if (gap >= 2) runs.push([reglesEnts[i]])
          else runs[runs.length - 1].push(reglesEnts[i])
        }
        debutDernierCycle = runs[runs.length - 1][0]
      }
    }

    const enriched: EnrichedEntry[] = entries.map(entry => {
      const e = entry as EnrichedEntry
      if (e.jourCycle !== undefined) return e
      if (!debutDernierCycle) return e
      const elapsed = Math.floor((Date.parse(entry.date) - Date.parse(debutDernierCycle)) / 86400000)
      if (elapsed < 0) return e
      return { ...e, jourCycle: (elapsed % dureeCycle) + 1 }
    })

    const hasAnyJourCycle = enriched.some(e => e.jourCycle !== undefined)

    if (!debutDernierCycle && !hasAnyJourCycle) {
      corr6 = <Muted>Pour activer cette corrélation, renseigne la date de début de ton dernier cycle dans les Paramètres, ou commence à cocher « Jour de règles ? » dans ton journal quotidien.</Muted>
    } else {
      const classifiable = enriched.filter(e =>
        e.jourCycle !== undefined &&
        getPhase(e.jourCycle!, dureeCycle, dureeLuteale, dureeMenstruation) !== null
      )

      if (classifiable.length < 3) {
        corr6 = <Muted>Pas encore assez de données sur le cycle.</Muted>
      } else {
        type PhaseInfo = { label: string; contexte: string; start: number; end: number; total: number; migraines: number }
        const phaseInfo: Record<Phase, PhaseInfo> = {
          menstruelle: { label: 'menstruelle', contexte: 'chute des œstrogènes', start: 1, end: dureeMenstruation, total: 0, migraines: 0 },
          folliculaire: { label: 'folliculaire', contexte: 'montée des œstrogènes', start: dureeMenstruation + 1, end: debutOvulatoire - 1, total: 0, migraines: 0 },
          ovulatoire: { label: 'ovulatoire', contexte: 'pic de LH', start: debutOvulatoire, end: finOvulatoire, total: 0, migraines: 0 },
          luteale: { label: 'lutéale', contexte: 'chute de la progestérone', start: finOvulatoire + 1, end: dureeCycle, total: 0, migraines: 0 },
        }

        for (const entry of enriched) {
          if (entry.jourCycle === undefined) continue
          const phase = getPhase(entry.jourCycle, dureeCycle, dureeLuteale, dureeMenstruation)
          if (!phase) continue
          phaseInfo[phase].total++
          if (entry.migraine === true) phaseInfo[phase].migraines++
        }

        const phaseOrder: Phase[] = ['menstruelle', 'folliculaire', 'ovulatoire', 'luteale']
        const phaseLines = phaseOrder
          .filter(p => phaseInfo[p].total > 0)
          .map(p => {
            const { label, contexte, total, migraines } = phaseInfo[p]
            return (
              <p key={p} style={{ color: 'var(--color-text)', marginTop: '4px' }}>
                Phase {label} <span style={{ color: 'var(--color-text-muted)' }}>({contexte})</span> : {migraines} migraine(s) sur {total} jours
              </p>
            )
          })

        const activePhases = phaseOrder.filter(p => phaseInfo[p].total > 0)
        const maxMig = Math.max(...activePhases.map(p => phaseInfo[p].migraines))
        const topPhases = activePhases.filter(p => phaseInfo[p].migraines === maxMig)
        let summary: ReactNode = null
        if (topPhases.length === 1 && maxMig >= 2) {
          const top = topPhases[0]
          const { label, start, end } = phaseInfo[top]
          summary = (
            <p style={{ color: 'var(--color-primary)', marginTop: '8px' }}>
              Tes migraines se concentrent en phase {label} (j. {start}–{end}).
            </p>
          )
        }

        corr6 = <>{phaseLines}{summary}</>
      }
    }
  }

  // --- Corr. 7 — Migraines au réveil ---
  const reveilEnts = entries.filter(e => e.migraine === true && e.migraineAuReveil !== undefined)
  let corr7: ReactNode
  if (reveilEnts.length < 3) {
    corr7 = <Muted>Pas encore assez de données.</Muted>
  } else {
    const reveilCount = reveilEnts.filter(e => e.migraineAuReveil === true).length
    corr7 = <p style={{ color: 'var(--color-text)' }}>{reveilCount} fois sur {reveilEnts.length}, la migraine était déjà présente au réveil.</p>
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text)' }}>Corrélations 📊</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{formatDateFR(todayISO())}</p>
      </div>
      <Card title="🍽️ Aliments les jours de migraine">{corr1}</Card>
      <Card title="🍴 Soulagement par un repas">{corr2}</Card>
      <Card title="🌙 Sommeil et migraine">{corr3}</Card>
      <Card title="🪟 Fenêtre la nuit">{corr4}</Card>
      <Card title="💧 Hydratation">{corr5}</Card>
      <Card title="🌸 Cycle menstruel">{corr6}</Card>
      <Card title="☀️ Migraines au réveil">{corr7}</Card>
    </div>
  )
}
