import './PlaylistCreator.css'

function PlaylistCreator({ genre, title, onPlaylistGenerated, onBack, onRestart, loading, setLoading }) {

  return (
    <div className="playlist-creator">
      {onBack && (
        <button onClick={onBack} className="back-button">
          <span className="material-icons">arrow_back</span>
          목록으로 돌아가기
        </button>
      )}
      
      {title && (
        <div className="project-header">
          <h2>"{title}" 프로젝트</h2>
          <button onClick={onRestart} className="restart-button">
            <span className="material-icons">restart_alt</span>
            처음부터 다시하기
          </button>
        </div>
      )}

      <div className="project-sections">
        <section className="project-section">
          <h3>
            <span className="material-icons">queue_music</span>
            Suno 5.0 Prompt
          </h3>
          <div className="tip-box">
            <span className="material-icons">lightbulb</span>
            <p>Suno AI 'Custom Mode'에 원하는 스타일의 프롬프트를 선택하여 붙여넣으세요. 3가지 다른 분위기로 제공됩니다.</p>
          </div>
          <button className="section-button">
            🎵 Suno 프롬프트 & 가사
          </button>
        </section>

        <section className="project-section">
          <h3>
            <span className="material-icons">description</span>
            유튜브 영상 설정
          </h3>
          <p>영상 설명, 해시태그, 키워드를 자동으로 생성합니다.</p>
          <button className="section-button">
            <span className="material-icons">smart_toy</span>
            영상 설명 & 태그 생성하기
          </button>
        </section>

        <section className="project-section">
          <h3>
            <span className="material-icons">lyrics</span>
            가사 생성 설정
          </h3>
          <div className="lyrics-settings">
            <div className="setting-group">
              <label>메인 언어</label>
              <select className="setting-select">
                <option>한국어 (Korean)</option>
                <option>영어 (English)</option>
                <option>일본어 (Japanese)</option>
                <option>스페인어 (Spanish)</option>
                <option>프랑스어 (French)</option>
              </select>
            </div>
            <button className="setting-button">언어 혼합 (Dual Lang)</button>
            
            <div className="setting-group">
              <label>생성할 곡의 수</label>
              <div className="setting-input-group">
                <input type="number" min="1" max="20" defaultValue="1" className="setting-input" />
                <span>곡</span>
              </div>
            </div>
            
            <div className="setting-group">
              <label>비유와 은유 강도</label>
              <select className="setting-select">
                <option>직설적 (Literal - Clear & Direct)</option>
                <option defaultValue>적절함 (Moderate - Balanced)</option>
                <option>시적 (Poetic - Emotional & Deep)</option>
                <option>추상적 (Abstract - Artistic & Complex)</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>곡 구성 (Song Structure)</label>
              <button className="structure-button">
                15. 미니멀 구조 (Intro - Verse - Chorus - Instrumental - Verse - Chorus - Outro) BEST
                <span className="material-icons">expand_more</span>
              </button>
            </div>
            
            <div className="setting-options">
              <button className="option-button">Intro 가사 포함</button>
              <button className="option-button">Outro 가사 포함</button>
              <button className="option-button">Instrumental (가사 없음)</button>
            </div>
            
            <button className="generate-lyrics-button">
              <span className="material-icons">auto_awesome</span>
              가사 생성하기
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PlaylistCreator
