export function AujourdhuiScreen() {
  const today = new Date()
  const dateLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Aujourd'hui</h1>
        <p className="text-sm capitalize" style={{ color: 'var(--color-text-muted)' }}>{dateLabel}</p>
      </div>

      <Card title="Sommeil 🌙">
        <Field label="Heure de coucher">
          <input type="time" className="input-time" />
        </Field>
        <Field label="Heure de lever">
          <input type="time" className="input-time" />
        </Field>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Durée : —</p>
        <ToggleField label="Fenêtre ouverte cette nuit ?" />
        <ToggleField label="Symptômes dès le réveil ?" />
      </Card>

      <Card title="Repas 🍽️">
        <button className="btn-secondary w-full">+ Ajouter un repas</button>
      </Card>

      <Card title="Hydratation 💧">
        <div className="flex items-center gap-4">
          <span style={{ color: 'var(--color-text)' }}>Verres d'eau :</span>
          <div className="flex items-center gap-3">
            <button className="counter-btn">−</button>
            <span className="text-lg font-semibold w-6 text-center" style={{ color: 'var(--color-text)' }}>0</span>
            <button className="counter-btn">+</button>
          </div>
        </div>
      </Card>

      <Card title="Symptômes">
        <ToggleField label="Migraine aujourd'hui ?" />
      </Card>

      <Card title="Cycle menstruel">
        <ToggleField label="Jour de règles ?" />
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
        />
      </Card>

      <button
        className="w-full rounded-xl py-4 text-base font-semibold text-white"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Enregistrer la journée
      </button>
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

function ToggleField({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
      <div className="flex gap-2">
        <button className="toggle-btn">Oui</button>
        <button className="toggle-btn">Non</button>
      </div>
    </div>
  )
}
