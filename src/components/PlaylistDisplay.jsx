import './PlaylistDisplay.css'

function PlaylistDisplay({ playlist }) {
  const handleSpotifyClick = () => {
    // Spotify에서 검색하거나 플레이리스트를 생성하는 로직
    // 실제 구현 시 Spotify API를 사용할 수 있습니다
    alert('Spotify 통합 기능은 추후 구현 예정입니다.')
  }

  return (
    <div className="playlist-display">
      <div className="playlist-header">
        <h2>{playlist.title}</h2>
        <p className="playlist-description">{playlist.description}</p>
      </div>
      
      <div className="playlist-actions">
        <button onClick={handleSpotifyClick} className="spotify-button">
          Spotify에 저장
        </button>
      </div>

      <div className="playlist-tracks">
        <h3>트랙 목록 ({playlist.tracks.length}곡)</h3>
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
                  href={`https://open.spotify.com/search/${encodeURIComponent(`${track.name} ${track.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-link"
                >
                  Spotify에서 듣기
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
