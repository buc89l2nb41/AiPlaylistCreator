import { useState } from 'react'
import { generatePlaylist } from '../services/playlistService'
import './PlaylistCreator.css'

function PlaylistCreator({ onPlaylistGenerated, loading, setLoading }) {
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const playlist = await generatePlaylist(prompt)
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
      <form onSubmit={handleSubmit} className="playlist-form">
        <div className="form-group">
          <label htmlFor="prompt">플레이리스트 설명을 입력하세요</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 운동할 때 듣기 좋은 에너지 넘치는 팝송 플레이리스트"
            rows={4}
            disabled={loading}
            className="prompt-input"
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          disabled={loading || !prompt.trim()}
          className="generate-button"
        >
          {loading ? '생성 중...' : '플레이리스트 생성'}
        </button>
      </form>
    </div>
  )
}

export default PlaylistCreator
