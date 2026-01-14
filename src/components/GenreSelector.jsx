import { useState } from 'react'
import './GenreSelector.css'

const genres = [
  { id: 'lofi', name: 'Lo-fi', icon: 'bedtime' },
  { id: 'pop', name: 'Pop', icon: 'celebration' },
  { id: 'jazz', name: 'Jazz', icon: 'nightlife' },
  { id: 'rnb', name: 'R&B', icon: 'wine_bar' },
  { id: 'kpop', name: 'K-Pop', icon: 'star' },
  { id: 'indie', name: 'Indie', icon: 'park' },
  { id: 'study', name: 'Study / Focus', icon: 'menu_book' },
  { id: 'workout', name: 'Workout', icon: 'fitness_center' },
  { id: 'meditation', name: 'Meditation', icon: 'self_improvement' },
  { id: 'acoustic', name: 'Acoustic', icon: 'piano' },
]

function GenreSelector({ onGenreSelect }) {
  const [customGenre, setCustomGenre] = useState('')

  const handleGenreClick = (genre) => {
    onGenreSelect(genre.name)
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (customGenre.trim()) {
      onGenreSelect(customGenre.trim())
    }
  }

  return (
    <div className="genre-selector">
      <div className="genre-header">
        <h2>장르를 선택하세요</h2>
        <p>오늘 만들고 싶은 유튜브 플레이리스트의 분위기는 무엇인가요?</p>
      </div>

      <div className="genre-grid">
        {genres.map((genre) => (
          <button
            key={genre.id}
            className="genre-button"
            onClick={() => handleGenreClick(genre)}
          >
            <span className="material-icons">{genre.icon}</span>
            <span className="genre-name">{genre.name}</span>
          </button>
        ))}
      </div>

      <div className="custom-genre-section">
        <p className="custom-genre-label">원하는 장르가 없으신가요?</p>
        <form onSubmit={handleCustomSubmit} className="custom-genre-form">
          <input
            type="text"
            value={customGenre}
            onChange={(e) => setCustomGenre(e.target.value)}
            placeholder="예: 90년대 힙합, 비오는 날 카페, 몽환적인 드림팝..."
            className="custom-genre-input"
          />
          <button
            type="submit"
            disabled={!customGenre.trim()}
            className="custom-genre-submit"
          >
            <span className="material-icons">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default GenreSelector
