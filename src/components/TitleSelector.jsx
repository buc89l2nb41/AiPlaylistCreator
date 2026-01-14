import { useState, useEffect } from 'react'
import { generatePlaylistTitles } from '../services/geminiService'
import './TitleSelector.css'

function TitleSelector({ genre, onTitleSelect, onBack, loading, setLoading }) {
  const [titles, setTitles] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    // 장르가 선택되면 자동으로 제목 생성
    if (genre) {
      handleGenerateTitles()
    }
  }, [genre])

  const handleGenerateTitles = async () => {
    setError(null)
    setLoading(true)

    try {
      const generatedTitles = await generatePlaylistTitles(genre)
      setTitles(generatedTitles)
    } catch (err) {
      setError(err.message || '제목 생성 중 오류가 발생했습니다.')
      console.error('Error generating titles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTitleClick = (title) => {
    onTitleSelect(title)
  }

  return (
    <div className="title-selector">
      {onBack && (
        <button onClick={onBack} className="back-button">
          <span className="material-icons">arrow_back</span>
        </button>
      )}
      
      <div className="title-header">
        <h2>{genre} 추천 제목</h2>
        <p>가장 마음에 드는 제목을 하나 선택해주세요.</p>
      </div>

      {loading ? (
        <div className="loading-message">
          <span className="material-icons">hourglass_empty</span>
          <p>AI가 창의적인 제목을 생각하고 있습니다...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleGenerateTitles} className="retry-button">
            다시 시도
          </button>
        </div>
      ) : (
        <div className="title-list">
          {titles.map((title, index) => (
            <button
              key={index}
              className="title-button"
              onClick={() => handleTitleClick(title)}
            >
              <span className="title-number">{index + 1}</span>
              <span className="title-text">{title}</span>
              <span className="material-icons">chevron_right</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default TitleSelector
