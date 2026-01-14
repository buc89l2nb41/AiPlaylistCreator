import { useState, useEffect } from 'react'
import GenreSelector from './components/GenreSelector'
import PlaylistCreator from './components/PlaylistCreator'
import PlaylistDisplay from './components/PlaylistDisplay'
import SettingsModal from './components/SettingsModal'
import { hasApiKey } from './utils/apiKeyStorage'
import './App.css'

function App() {
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [showGenreSelector, setShowGenreSelector] = useState(true)

  useEffect(() => {
    // API 키가 없으면 자동으로 설정 모달 열기
    if (!hasApiKey()) {
      setSettingsOpen(true)
    } else {
      // API 키가 있으면 장르 선택 화면 표시
      setShowGenreSelector(true)
    }
  }, [])

  useEffect(() => {
    // 설정 모달이 닫힐 때 API 키가 있으면 장르 선택 화면 표시
    if (!settingsOpen && hasApiKey() && !selectedGenre) {
      setShowGenreSelector(true)
    }
  }, [settingsOpen, selectedGenre])

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre)
    setShowGenreSelector(false)
  }

  const handlePlaylistGenerated = (newPlaylist) => {
    setPlaylist(newPlaylist)
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setSettingsOpen(false)
  }

  const handleBackToGenre = () => {
    setSelectedGenre(null)
    setShowGenreSelector(true)
    setPlaylist(null)
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
        {showGenreSelector && hasApiKey() && (
          <GenreSelector onGenreSelect={handleGenreSelect} />
        )}
        
        {selectedGenre && !showGenreSelector && (
          <PlaylistCreator 
            genre={selectedGenre}
            onPlaylistGenerated={handlePlaylistGenerated}
            onBack={handleBackToGenre}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        
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
