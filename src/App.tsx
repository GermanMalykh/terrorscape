import { HashRouter, Route, Routes } from 'react-router-dom'
import { GameProvider } from './contexts/GameContext.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import { CollectionsScreen } from './screens/CollectionsScreen.tsx'
import { GameConsoleScreen } from './screens/GameConsoleScreen.tsx'
import { GameSetupScreen } from './screens/GameSetupScreen.tsx'
import { MainMenuScreen } from './screens/MainMenuScreen.tsx'
import { PlayerRosterScreen } from './screens/PlayerRosterScreen.tsx'
import { SettingsScreen } from './screens/SettingsScreen.tsx'
import './App.css'

function App() {
  return (
    <LanguageProvider>
      <GameProvider>
        <HashRouter>
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<MainMenuScreen />} />
              <Route path="/collections" element={<CollectionsScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/setup" element={<GameSetupScreen />} />
              <Route path="/console" element={<GameConsoleScreen />} />
              <Route path="/players" element={<PlayerRosterScreen />} />
            </Routes>
          </div>
        </HashRouter>
      </GameProvider>
    </LanguageProvider>
  )
}

export default App
