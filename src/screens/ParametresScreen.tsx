import { useRef, useEffect, useState } from 'react'
import { clearAllEntries, getAllEntries, saveEntry } from '../db'
import { exportJson, BackupData } from '../utils/exportJson'

export function ParametresScreen() {
  const [apiKey, setApiKey] = useState<string>('')
  const [showKey, setShowKey] = useState<boolean>(false)
  const [keySaved, setKeySaved] = useState<boolean>(false)
  const [confirmClear, setConfirmClear] = useState<boolean>(false)
  const [cleared, setCleared] = useState<boolean>(false)
  const [exporting, setExporting] = useState<boolean>(false)
  const [importPending, setImportPending] = useState<BackupData | null>(null)
  const [importing, setImporting] = useState<boolean>(false)
  const [importDone, setImportDone] = useState<boolean>(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setApiKey(localStorage.getItem('claude_api_key') ?? '')
  }, [])

  function handleSaveKey() {
    localStorage.setItem('claude_api_key', apiKey.trim())
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  async function handleExport() {
    setExporting(true)
    const entries = await getAllEntries()
    exportJson(entries)
    setExporting(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportError(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData
      if (data.version !== 1 || !Array.isArray(data.entries)) {
        setImportError('Fichier invalide ou incompatible.')
        return
      }
      setImportPending(data)
    } catch {
      setImportError('Impossible de lire ce fichier.')
    }
  }

  async function handleConfirmImport() {
    if (!importPending) return
    setImporting(true)
    await clearAllEntries()
    for (const entry of importPending.entries) {
      await saveEntry(entry)
    }
    if (importPending.config.claude_api_key) {
      localStorage.setItem('claude_api_key', importPending.config.claude_api_key)
    }
    if (importPending.config.settings) {
      localStorage.setItem('settings', JSON.stringify(importPending.config.settings))
    }
    setImporting(false)
    setImportPending(null)
    setImportDone(true)
    setTimeout(() => window.location.reload(), 1500)
  }

  async function handleConfirmClear() {
    await clearAllEntries()
    setConfirmClear(false)
    setCleared(true)
    setTimeout(() => setCleared(false), 3000)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Paramètres</h1>
      </div>

      <Card title="Clé API Claude 🔑">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Pour activer l'identification automatique des aliments par photo, renseignez votre clé API Claude. Elle est stockée uniquement sur cet appareil.
        </p>
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm"
          style={{ color: 'var(--color-primary)' }}
        >
          Obtenir une clé API → console.anthropic.com
        </a>
        <div className="flex gap-2 items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 rounded-lg border p-3 text-sm outline-none"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-bg)',
            }}
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="text-sm px-3 py-2 rounded-lg border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {showKey ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        <button
          onClick={handleSaveKey}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: keySaved ? 'var(--color-success)' : 'var(--color-primary)' }}
        >
          {keySaved ? 'Clé enregistrée ✓' : 'Enregistrer la clé'}
        </button>
      </Card>

      <Card title="Sauvegarde / Restauration">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: exporting ? 'var(--color-text-muted)' : 'var(--color-primary)' }}
        >
          {exporting ? 'Export en cours…' : 'Exporter mes données et configuration (JSON)'}
        </button>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Ce fichier contient votre clé API. Ne le partagez pas.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        {importDone ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Import réussi. Rechargement…</p>
        ) : importPending ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Cette action remplacera toutes tes données et ta configuration actuelles.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setImportPending(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'transparent' }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: importing ? 'var(--color-text-muted)' : 'var(--color-primary)' }}
              >
                {importing ? 'Import en cours…' : "Confirmer l'import"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl py-3 text-sm font-semibold border"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
            >
              Importer mes données et configuration
            </button>
            {importError && (
              <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{importError}</p>
            )}
          </>
        )}
      </Card>

      <Card title="Données">
        {confirmClear ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Cette action est irréversible. Toutes les entrées du journal seront supprimées.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'transparent' }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--color-danger)' }}
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        ) : cleared ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Données effacées.</p>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full rounded-xl py-3 text-sm font-semibold"
            style={{ border: '1px solid var(--color-danger)', color: 'var(--color-danger)', backgroundColor: 'transparent' }}
          >
            Effacer toutes les données
          </button>
        )}
      </Card>
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
