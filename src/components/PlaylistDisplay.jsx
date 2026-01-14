import './PlaylistDisplay.css'

function PlaylistDisplay({ playlist }) {
  const handleCopyTitle = () => {
    navigator.clipboard.writeText(playlist.title)
    alert('제목이 클립보드에 복사되었습니다!')
  }

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(playlist.description)
    alert('설명이 클립보드에 복사되었습니다!')
  }

  return (
    <div className="playlist-display">
      <div className="playlist-header">
        <div className="title-section">
          <h2>{playlist.title}</h2>
          <button onClick={handleCopyTitle} className="copy-button" title="제목 복사">
            📋
          </button>
        </div>
        <div className="description-section">
          <p className="playlist-description">{playlist.description}</p>
          <button onClick={handleCopyDescription} className="copy-button" title="설명 복사">
            📋
          </button>
        </div>
        <div className="youtube-hint">
          <p>💡 이 제목과 설명을 유튜브 플레이리스트 업로드 시 사용하세요!</p>
        </div>
      </div>

      <div className="playlist-tracks">
        <h3>추천 곡 목록 ({playlist.tracks.length}곡)</h3>
        <p className="tracks-hint">아래 곡들을 유튜브에서 검색하여 플레이리스트에 추가하세요</p>
        <ul className="track-list">
          {playlist.tracks.map((track, index) => (
            <li key={index} className="track-item">
              <div className="track-number">{index + 1}</div>
              <div className="track-info">
                <div className="track-name">{track.name}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
              <div className="track-actions">
                <a 
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.name} ${track.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="youtube-link"
                >
                  🔍 YouTube에서 검색
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PlaylistDisplay
