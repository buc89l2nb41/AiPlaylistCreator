import { useState, useEffect } from 'react'
import { generatePlaylist } from '../services/playlistService'
import './PlaylistCreator.css'

function PlaylistCreator({ genre, onPlaylistGenerated, onBack, loading, setLoading }) {
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    // 장르가 선택되면 자동으로 플레이리스트 생성
    if (genre) {
      handleGenerate()
    }
  }, [genre])

  const handleGenerate = async () => {
    setError(null)
    setLoading(true)

    try {
      // 장르를 프롬프트에 포함
      const fullPrompt = genre
      const playlist = await generatePlaylist(fullPrompt)
      onPlaylistGenerated(playlist)
    } catch (err) {
      setError(err.message || '플레이리스트 생성 중 오류가 발생했습니다.')
      console.error('Error generating playlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // 선택된 장르와 사용자 입력을 결합
      const fullPrompt = genre ? `${genre} ${prompt}` : prompt
      const playlist = await generatePlaylist(fullPrompt)
      onPlaylistGenerated(playlist)
      setPrompt('')
    } catch (err) {
      setError(err.message || '플레이리스트 생성 중 오류가 발생했습니다.')
      console.error('Error generating playlist:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="playlist-creator">
      {genre && (
        <div className="selected-genre-badge">
          <span>선택된 장르: {genre}</span>
          {onBack && (
            <button onClick={onBack} className="back-button">
              ← 장르 다시 선택
            </button>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="loading-message">
          <p>플레이리스트를 생성하고 있습니다...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="playlist-form">
          <div className="form-group">
            <label htmlFor="prompt">추가 설명을 입력하세요 (선택사항)</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 운동할 때 듣기 좋은 에너지 넘치는 팝송"
              rows={4}
              disabled={loading}
              className="prompt-input"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="generate-button"
          >
            {loading ? '생성 중...' : '플레이리스트 생성'}
          </button>
        </form>
      )}
    </div>
  )
}

export default PlaylistCreator
