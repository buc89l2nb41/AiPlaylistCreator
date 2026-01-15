import { useState, useEffect } from 'react'
import GenreSelector from './components/GenreSelector'
import TitleSelector from './components/TitleSelector'
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
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [showGenreSelector, setShowGenreSelector] = useState(true)
  const [showTitleSelector, setShowTitleSelector] = useState(false)
  // 장르별 제목 캐시 (장르를 키로 사용)
  const [titleCache, setTitleCache] = useState({})

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
    if (!settingsOpen && hasApiKey() && !selectedGenre && !selectedTitle) {
      setShowGenreSelector(true)
    }
  }, [settingsOpen, selectedGenre, selectedTitle])

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre)
    setShowGenreSelector(false)
    setShowTitleSelector(true)
    // 장르를 다시 선택하면 캐시를 무시하고 새로 생성 (캐시 삭제)
    setTitleCache(prev => {
      const newCache = { ...prev }
      delete newCache[genre]
      return newCache
    })
  }

  const handleTitleSelect = (title) => {
    setSelectedTitle(title)
    setShowTitleSelector(false)
  }

  // 제목 목록을 캐시에 저장하는 함수
  const handleTitlesGenerated = (genre, titles) => {
    setTitleCache(prev => ({
      ...prev,
      [genre]: titles
    }))
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
    setSelectedTitle(null)
    setShowGenreSelector(true)
    setShowTitleSelector(false)
    setPlaylist(null)
  }

  const handleBackToTitle = () => {
    setSelectedTitle(null)
    setShowTitleSelector(true)
    setPlaylist(null)
  }

  const handleRestart = () => {
    setSelectedGenre(null)
    setSelectedTitle(null)
    setShowGenreSelector(true)
    setShowTitleSelector(false)
    setPlaylist(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🎵 AI Playlist Creator</h1>
            <p>AI로 유튜브 플레이리스트 제목을 추천받아보세요</p>
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
        
        {showTitleSelector && selectedGenre && (
          <TitleSelector 
            genre={selectedGenre}
            onTitleSelect={handleTitleSelect}
            onBack={handleBackToGenre}
            loading={loading}
            setLoading={setLoading}
            cachedTitles={titleCache[selectedGenre]}
            onTitlesGenerated={handleTitlesGenerated}
          />
        )}
        
        {selectedTitle && !showTitleSelector && (
          <PlaylistCreator 
            genre={selectedGenre}
            title={selectedTitle}
            onPlaylistGenerated={handlePlaylistGenerated}
            onBack={handleBackToTitle}
            onRestart={handleRestart}
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
