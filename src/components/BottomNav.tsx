type Screen = 'aujourdhui' | 'historique' | 'correlations' | 'parametres'

const tabs: { key: Screen; icon: string; label: string }[] = [
  { key: 'aujourdhui', icon: '📅', label: "Aujourd'hui" },
  { key: 'historique', icon: '📖', label: 'Historique' },
  { key: 'correlations', icon: '📊', label: 'Corrélations' },
  { key: 'parametres', icon: '⚙️', label: 'Paramètres' },
]

interface BottomNavProps {
  active: Screen
  onNavigate: (screen: Screen) => void
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex border-t"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onNavigate(tab.key)}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium"
          style={{ color: active === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
