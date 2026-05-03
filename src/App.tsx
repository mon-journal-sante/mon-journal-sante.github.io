import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { BottomNav } from './components/BottomNav'
import { AujourdhuiScreen } from './screens/AujourdhuiScreen'
import { HistoriqueScreen } from './screens/HistoriqueScreen'
import { CorrelationsScreen } from './screens/CorrelationsScreen'
import { ParametresScreen } from './screens/ParametresScreen'

type Screen = 'aujourdhui' | 'historique' | 'correlations' | 'parametres'

export default function App() {
  const [screen, setScreen] = useState<Screen>('aujourdhui')
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  return (
    <div className="flex flex-col min-h-dvh">
      {needRefresh && (
        <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: 'var(--color-primary)' }}>
          <span className="text-sm text-white">Une mise à jour est disponible</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-sm font-semibold rounded-lg px-3 py-1"
            style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}
          >
            Mettre à jour
          </button>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        {screen === 'aujourdhui' && <AujourdhuiScreen />}
        {screen === 'historique' && <HistoriqueScreen />}
        {screen === 'correlations' && <CorrelationsScreen />}
        {screen === 'parametres' && <ParametresScreen />}
      </main>
      <BottomNav active={screen} onNavigate={setScreen} />
    </div>
  )
}
