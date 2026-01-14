import { useState, useEffect } from 'react'
import PlaylistCreator from './components/PlaylistCreator'
import PlaylistDisplay from './components/PlaylistDisplay'
import SettingsModal from './components/SettingsModal'
import { hasApiKey } from './utils/apiKeyStorage'
import './App.css'

function App() {
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    // API 키가 없으면 자동으로 설정 모달 열기
    if (!hasApiKey()) {
      setSettingsOpen(true)
    }
  }, [])

  const handlePlaylistGenerated = (newPlaylist) => {
    setPlaylist(newPlaylist)
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setSettingsOpen(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🎵 AI Playlist Creator</h1>
            <p>AI로 나만의 플레이리스트를 만들어보세요</p>
          </div>
          <button 
            className="settings-button"
            onClick={handleOpenSettings}
            aria-label="설정"
          >
            ⚙️
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <PlaylistCreator 
          onPlaylistGenerated={handlePlaylistGenerated}
          loading={loading}
          setLoading={setLoading}
        />
        
        {playlist && (
          <PlaylistDisplay playlist={playlist} />
        )}
      </main>

      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={handleCloseSettings}
      />
    </div>
  )
}

export default App
