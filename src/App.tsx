import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { AujourdhuiScreen } from './screens/AujourdhuiScreen'
import { HistoriqueScreen } from './screens/HistoriqueScreen'
import { CorrelationsScreen } from './screens/CorrelationsScreen'
import { ParametresScreen } from './screens/ParametresScreen'

type Screen = 'aujourdhui' | 'historique' | 'correlations' | 'parametres'

export default function App() {
  const [screen, setScreen] = useState<Screen>('aujourdhui')

  return (
    <div className="flex flex-col min-h-dvh">
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
