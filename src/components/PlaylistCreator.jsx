import { useState, useEffect, useRef } from 'react'
import { generateSunoPrompts, generateVideoMetadata, generateLyrics, generateThumbnailPrompt, generateThumbnailImage, synthesizeThumbnailWithText } from '../services/geminiService'
import './PlaylistCreator.css'

function PlaylistCreator({ genre, title, onPlaylistGenerated, onBack, onRestart, loading, setLoading }) {
  // Suno 프롬프트 상태
  const [sunoPrompts, setSunoPrompts] = useState(null)
  const [sunoLoading, setSunoLoading] = useState(false)
  const [sunoError, setSunoError] = useState(null)

  // 영상 메타데이터 상태
  const [videoMetadata, setVideoMetadata] = useState(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState(null)

  // 가사 상태
  const [lyrics, setLyrics] = useState(null)
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [lyricsError, setLyricsError] = useState(null)
  
  // 가사 설정 상태
  const [lyricsSettings, setLyricsSettings] = useState({
    mainLanguage: '한국어 (Korean)',
    dualLang: false,
    secondaryLanguage: '영어 (English)',
    languageRatio: 70, // 메인 언어 비중 (10-90%)
    songCount: 1,
    metaphorLevel: '적절함 (Moderate - Balanced)',
    songStructure: '1. 기본 팝 구조 (Intro - Verse 1 - Chorus - Verse 2 - Chorus - Instrumental Break - Bridge - Chorus - Outro)',
    includeIntro: false,
    includeOutro: false,
    instrumental: false
  })

  // 곡 구성 옵션 목록
  const songStructures = [
    { id: 1, name: '기본 팝 구조', structure: 'Intro - Verse 1 - Chorus - Verse 2 - Chorus - Instrumental Break - Bridge - Chorus - Outro', best: true },
    { id: 2, name: '클래식 팝 구조', structure: 'Intro - Verse 1 - Verse 2 - Chorus - Instrumental - Verse 3 - Chorus - Outro', best: false },
    { id: 3, name: '모던 팝 구조', structure: 'Intro - Verse 1 - Pre-Chorus - Chorus - Verse 2 - Pre-Chorus - Chorus - Instrumental Break - Bridge - Chorus - Outro', best: true },
    { id: 4, name: '후크 중심 구조', structure: 'Intro (Hook) - Verse 1 - Chorus - Instrumental - Verse 2 - Chorus - Bridge - Chorus - Outro (Hook)', best: true },
    { id: 5, name: 'EDM/댄스 구조', structure: 'Intro - Verse 1 - Build-up - Drop (Chorus) - Breakdown - Verse 2 - Build-up - Drop - Breakdown - Drop - Outro', best: true },
    { id: 6, name: '록 구조', structure: 'Intro - Verse 1 - Chorus - Verse 2 - Chorus - Guitar Solo (간주) - Bridge - Chorus - Guitar Outro', best: false },
    { id: 7, name: '발라드 구조', structure: 'Intro - Verse 1 - Verse 2 - Chorus - Instrumental Interlude - Verse 3 - Chorus - Bridge - Chorus (High note) - Outro', best: false },
    { id: 8, name: 'AAA 구조', structure: 'Intro - Verse 1 - Instrumental - Verse 2 - Verse 3 - Instrumental - Verse 4 - Outro', best: false },
    { id: 9, name: 'AABA 구조', structure: 'Intro - A (Verse) - A (Verse) - Instrumental Break - B (Bridge) - A (Verse) - Outro', best: false },
    { id: 10, name: 'Verse-Chorus 구조', structure: 'Intro - Verse 1 - Chorus - Instrumental - Verse 2 - Chorus - Instrumental Break - Chorus - Outro', best: false },
    { id: 11, name: '이중 Chorus 구조', structure: 'Intro - Verse 1 - Chorus 1 - Instrumental - Verse 2 - Chorus 1 - Chorus 2 - Bridge - Chorus 1 - Chorus 2 - Outro', best: true },
    { id: 12, name: '힙합 구조', structure: 'Intro - Verse 1 - Hook - Instrumental/Beat Switch - Verse 2 - Hook - Verse 3 - Hook - Bridge/Outro', best: false },
    { id: 13, name: '프로그레시브 구조', structure: 'Intro - Verse 1 - Chorus - Instrumental Section 1 - Verse 2 - Instrumental Section 2 - Bridge - Verse 3 - Chorus - Extended Instrumental Outro', best: false },
    { id: 14, name: '라디오 프렌들리 구조', structure: 'Intro - Chorus - Verse 1 - Chorus - Verse 2 - Chorus - Instrumental Break (짧음) - Bridge - Chorus - Outro', best: true },
    { id: 15, name: '미니멀 구조', structure: 'Intro - Verse - Chorus - Instrumental - Verse - Chorus - Outro', best: false }
  ]

  // 곡 구성 드롭다운 열림/닫힘 상태
  const [structureDropdownOpen, setStructureDropdownOpen] = useState(false)

  // 썸네일 상태
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailLoading, setThumbnailLoading] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(null)
  const [personaImage, setPersonaImage] = useState(null) // 페르소나 이미지 (base64 data URL)
  const [personaImageFile, setPersonaImageFile] = useState(null) // 원본 파일 (base64 변환용)
  const [thumbnailSettings, setThumbnailSettings] = useState({
    style: '실사 (Realistic)',
    includeTitle: true,
    thumbnailTitle: title || '',
    font: '나눔 손글씨 (Pen)',
    fontSize: 0.09,
    fontColor: '#ffffff',
    bold: false
  })
  const [revisionFeedback, setRevisionFeedback] = useState('') // 수정 요청 피드백

  // 탭 상태 (기본값: 'suno' - 제목 선택 시 자동으로 Suno 프롬프트 탭 활성화)
  const [activeTab, setActiveTab] = useState('suno')

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (structureDropdownOpen && !event.target.closest('.structure-dropdown-container')) {
        setStructureDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [structureDropdownOpen])

  // 제목이 변경되면 자동으로 Suno 프롬프트 생성
  useEffect(() => {
    if (title && genre) {
      // 제목이 있으면 자동으로 Suno 프롬프트 생성
      handleGenerateSunoPrompts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, genre])

  // 메인 언어 변경 시 보조 언어가 같으면 자동으로 변경
  useEffect(() => {
    if (lyricsSettings.dualLang && lyricsSettings.secondaryLanguage === lyricsSettings.mainLanguage) {
      const availableLanguages = ['한국어 (Korean)', '영어 (English)', '일본어 (Japanese)', '스페인어 (Spanish)', '프랑스어 (French)']
      const newSecondaryLanguage = availableLanguages.find(lang => lang !== lyricsSettings.mainLanguage) || '영어 (English)'
      setLyricsSettings({...lyricsSettings, secondaryLanguage: newSecondaryLanguage})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lyricsSettings.mainLanguage])

  // Suno 프롬프트 생성
  const handleGenerateSunoPrompts = async () => {
    setSunoLoading(true)
    setSunoError(null)
    try {
      const prompts = await generateSunoPrompts(title, genre)
      setSunoPrompts(prompts)
    } catch (error) {
      setSunoError(error.message || 'Suno 프롬프트 생성 중 오류가 발생했습니다.')
      console.error('Error generating Suno prompts:', error)
    } finally {
      setSunoLoading(false)
    }
  }

  // 영상 메타데이터 생성
  const handleGenerateMetadata = async () => {
    setMetadataLoading(true)
    setMetadataError(null)
    try {
      const metadata = await generateVideoMetadata(title, genre)
      setVideoMetadata(metadata)
    } catch (error) {
      setMetadataError(error.message || '메타데이터 생성 중 오류가 발생했습니다.')
      console.error('Error generating metadata:', error)
    } finally {
      setMetadataLoading(false)
    }
  }

  // 가사 생성
  const handleGenerateLyrics = async () => {
    setLyricsLoading(true)
    setLyricsError(null)
    try {
      const generatedLyrics = await generateLyrics(title, genre, lyricsSettings)
      setLyrics(generatedLyrics)
    } catch (error) {
      setLyricsError(error.message || '가사 생성 중 오류가 발생했습니다.')
      console.error('Error generating lyrics:', error)
    } finally {
      setLyricsLoading(false)
    }
  }

  // 폰트 목록 및 매핑
  const fontList = [
    { id: 'pen', name: '나눔 손글씨 (Pen)', desc: '새벽 감성 터지는 선곡', fontFamily: 'Nanum Pen Script' },
    { id: 'artistic', name: '연성체 (Artistic)', desc: '부드러운 한글 필기체', fontFamily: 'Yeon Sung' },
    { id: 'unique', name: '독도체 (Unique)', desc: '거친 느낌의 손글씨', fontFamily: 'Dokdo' },
    { id: 'gaegu', name: '개구체 (Gaegu)', desc: '귀여운 로파이 분위기', fontFamily: 'Gaegu' },
    { id: 'warm', name: '고운 바탕 (Warm)', desc: '감성적인 플레이리스트', fontFamily: 'Gowun Batang' },
    { id: 'classic', name: '나눔 명조 (Classic)', desc: '새벽에 듣기 좋은 노래', fontFamily: 'Nanum Myeongjo' },
    { id: 'greatvibes', name: '그레이트 바이브 (Classic Script)', desc: 'Elegant English Script', fontFamily: 'Great Vibes' },
    { id: 'dancingscript', name: '댄싱 스크립트 (Flow)', desc: 'Emotional Piano Vibe', fontFamily: 'Dancing Script' },
    { id: 'satisfy', name: '새티스파이 (Elegant)', desc: 'Lo-fi Jazz Night', fontFamily: 'Satisfy' },
    { id: 'pacifico', name: '퍼시피코 (Retro)', desc: 'Summer Chill Beats', fontFamily: 'Pacifico' },
    { id: 'jeyada', name: '제야다 (Thin Handwriting)', desc: 'Simple Handwriting', fontFamily: 'Jeyada' },
    { id: 'homemade', name: '홈메이드 (Crayon)', desc: 'Cozy Morning Coffee', fontFamily: 'Homemade Apple' },
    { id: 'caveat', name: '카베아트 (Casual)', desc: 'Personal Collection', fontFamily: 'Caveat' },
    { id: 'black', name: '검은 고딕 (Bold)', desc: '힙합 & 스트릿 무드', fontFamily: 'Black Han Sans' }
  ]

  // 폰트 이름을 CSS font-family로 변환하는 함수
  const getFontFamily = (fontName) => {
    const font = fontList.find(f => f.name === fontName)
    return font ? font.fontFamily : 'Nanum Pen Script' // 기본값
  }

  // 텍스트만 재합성하는 함수 (실시간 미리보기용)
  const resynthesizeThumbnailText = async (originalImageUrl) => {
    try {
      let synthesizedImageUrl = originalImageUrl
      
      // 제목 텍스트 포함이 켜져있을 때만 텍스트 합성
      if (thumbnailSettings.includeTitle) {
        synthesizedImageUrl = await synthesizeThumbnailWithText(
          originalImageUrl,
          thumbnailSettings.thumbnailTitle || title,
          {
            fontFamily: getFontFamily(thumbnailSettings.font),
            fontSize: thumbnailSettings.fontSize,
            fontColor: thumbnailSettings.fontColor,
            bold: thumbnailSettings.bold
          },
          'png'
        )
      }
      
      setThumbnail(prev => ({
        ...prev,
        imageDataUrl: synthesizedImageUrl,
        settings: thumbnailSettings
      }))
    } catch (error) {
      console.error('Error resynthesizing thumbnail text:', error)
      // 실시간 미리보기 실패는 조용히 처리 (사용자 경험을 위해)
    }
  }

  // 썸네일 생성
  const handleGenerateThumbnail = async (isRevision = false) => {
    setThumbnailLoading(true)
    setThumbnailError(null)
    try {
      // 1단계: 프롬프트 생성 (수정 요청인 경우 피드백 포함)
      const feedback = isRevision ? revisionFeedback : null
      const prompt = await generateThumbnailPrompt(title, genre, thumbnailSettings.style, personaImage, feedback)
      
      // 2단계: 이미지 생성 (페르소나 이미지 포함)
      const imageDataUrl = await generateThumbnailImage(prompt, personaImage)
      
      // 3단계: 텍스트 합성 (제목 텍스트 포함이 켜져있을 때만)
      let synthesizedImageUrl = imageDataUrl
      if (thumbnailSettings.includeTitle) {
        synthesizedImageUrl = await synthesizeThumbnailWithText(
          imageDataUrl,
          thumbnailSettings.thumbnailTitle || title,
          {
            fontFamily: getFontFamily(thumbnailSettings.font),
            fontSize: thumbnailSettings.fontSize,
            fontColor: thumbnailSettings.fontColor,
            bold: thumbnailSettings.bold
          },
          'png'
        )
      }
      
      setThumbnail({
        imageDataUrl: synthesizedImageUrl,
        originalImageDataUrl: imageDataUrl, // 원본 이미지 저장 (실시간 미리보기용)
        prompt,
        settings: thumbnailSettings
      })
      
      // 수정 요청 후 피드백 초기화
      if (isRevision) {
        setRevisionFeedback('')
      }
    } catch (error) {
      setThumbnailError(error.message || '썸네일 생성 중 오류가 발생했습니다.')
      console.error('Error generating thumbnail:', error)
    } finally {
      setThumbnailLoading(false)
    }
  }

  // 수정 요청 핸들러
  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      alert('수정하고 싶은 내용을 입력해주세요.')
      return
    }
    
    if (!thumbnail) {
      alert('먼저 썸네일을 생성해주세요.')
      return
    }
    
    await handleGenerateThumbnail(true)
  }

  // 실시간 미리보기: 설정 변경 시 자동으로 텍스트 재합성
  const isInitialMount = useRef(true)
  const prevSettingsRef = useRef(thumbnailSettings)
  const prevOriginalImageRef = useRef(null)
  
  // 썸네일이 새로 생성될 때 prevSettingsRef 업데이트
  useEffect(() => {
    if (thumbnail && thumbnail.originalImageDataUrl) {
      // 원본 이미지가 변경되었으면 (새로 생성된 경우) prevSettingsRef 업데이트
      if (prevOriginalImageRef.current !== thumbnail.originalImageDataUrl) {
        prevOriginalImageRef.current = thumbnail.originalImageDataUrl
        prevSettingsRef.current = { ...thumbnailSettings }
      }
    }
  }, [thumbnail?.originalImageDataUrl])
  
  // 설정 변경 시 텍스트 재합성
  useEffect(() => {
    // 초기 마운트 시에는 실행하지 않음
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevSettingsRef.current = thumbnailSettings
      return
    }

    // 썸네일이 생성되어 있고, 원본 이미지가 있는 경우에만 실행
    if (thumbnail && thumbnail.originalImageDataUrl) {
      // 설정이 실제로 변경되었는지 확인
      const settingsChanged = 
        prevSettingsRef.current.includeTitle !== thumbnailSettings.includeTitle ||
        prevSettingsRef.current.thumbnailTitle !== thumbnailSettings.thumbnailTitle ||
        prevSettingsRef.current.font !== thumbnailSettings.font ||
        prevSettingsRef.current.fontSize !== thumbnailSettings.fontSize ||
        prevSettingsRef.current.fontColor !== thumbnailSettings.fontColor ||
        prevSettingsRef.current.bold !== thumbnailSettings.bold

      if (settingsChanged) {
        // includeTitle이 false로 변경된 경우 즉시 원본 이미지로 변경 (디바운싱 없음)
        if (prevSettingsRef.current.includeTitle && !thumbnailSettings.includeTitle) {
          setThumbnail(prev => ({
            ...prev,
            imageDataUrl: thumbnail.originalImageDataUrl,
            settings: thumbnailSettings
          }))
          prevSettingsRef.current = { ...thumbnailSettings }
          return
        }

        // 그 외의 경우 디바운싱: 연속된 변경을 지연시켜 성능 최적화
        const timeoutId = setTimeout(() => {
          resynthesizeThumbnailText(thumbnail.originalImageDataUrl)
        }, 300) // 300ms 지연

        prevSettingsRef.current = { ...thumbnailSettings }

        return () => clearTimeout(timeoutId)
      }
    }
  }, [thumbnailSettings.includeTitle, thumbnailSettings.thumbnailTitle, thumbnailSettings.font, thumbnailSettings.fontSize, thumbnailSettings.fontColor, thumbnailSettings.bold, thumbnail])

  // 프롬프트 복사
  const handleCopyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt).then(() => {
      alert('프롬프트가 클립보드에 복사되었습니다.')
    }).catch(err => {
      console.error('복사 실패:', err)
    })
  }

  // 가사 복사
  const handleCopyLyrics = (lyric) => {
    navigator.clipboard.writeText(lyric).then(() => {
      alert('가사가 클립보드에 복사되었습니다.')
    }).catch(err => {
      console.error('복사 실패:', err)
    })
  }

  // 메타데이터 전체 복사
  const handleCopyAllMetadata = () => {
    if (!videoMetadata) return
    const text = `${title}\n\n${videoMetadata.description}\n\n${videoMetadata.hashtags.join(' ')}\n\n${videoMetadata.keywords}`
    navigator.clipboard.writeText(text).then(() => {
      alert('전체 메타데이터가 클립보드에 복사되었습니다.')
    }).catch(err => {
      console.error('복사 실패:', err)
    })
  }

  // 페르소나 이미지 업로드 핸들러
  const handlePersonaImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하여야 합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setPersonaImage(dataUrl)
      setPersonaImageFile(file)
    }
    reader.onerror = () => {
      alert('이미지 파일을 읽는 중 오류가 발생했습니다.')
    }
    reader.readAsDataURL(file)
  }

  // 페르소나 이미지 제거
  const handleRemovePersonaImage = () => {
    setPersonaImage(null)
    setPersonaImageFile(null)
  }

  // 썸네일 다운로드
  const handleDownloadThumbnail = (format = 'png') => {
    if (!thumbnail) return
    
    const link = document.createElement('a')
    link.download = `thumbnail.${format}`
    link.href = thumbnail.imageDataUrl
    link.click()
  }

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

      {/* 탭 버튼 */}
      <div className="project-tabs">
        <button 
          className={`tab-button ${activeTab === 'suno' ? 'active' : ''}`}
          onClick={() => setActiveTab('suno')}
        >
          🎵 Suno 프롬프트 & 가사
        </button>
        <button 
          className={`tab-button ${activeTab === 'thumbnail' ? 'active' : ''}`}
          onClick={() => setActiveTab('thumbnail')}
        >
          🖼️ 유튜브 썸네일
        </button>
      </div>

      <div className="project-sections">
        {/* Suno 프롬프트 & 가사 탭 내용 */}
        {activeTab === 'suno' && (
          <>
            {/* 좌우 배치 컨테이너 */}
            <div className="sections-row">
              {/* Suno 프롬프트 섹션 */}
              <section className="project-section">
          <h3>
            <span className="material-icons">queue_music</span>
            Suno 5.0 Prompt
          </h3>
          <div className="tip-box">
            <span className="material-icons">lightbulb</span>
            <p>Suno AI 'Custom Mode'에 원하는 스타일의 프롬프트를 선택하여 붙여넣으세요. 3가지 다른 분위기로 제공됩니다.</p>
          </div>
          
          {!sunoPrompts && (
            <button 
              className="section-button"
              onClick={handleGenerateSunoPrompts}
              disabled={sunoLoading}
            >
              {sunoLoading ? '생성 중...' : '🎵 Suno 프롬프트 & 가사'}
            </button>
          )}

          {sunoError && (
            <div className="error-message">
              <p>{sunoError}</p>
              <button onClick={handleGenerateSunoPrompts} className="retry-button">
                다시 시도
              </button>
            </div>
          )}

          {sunoPrompts && (
            <div className="suno-prompts-container">
              {sunoPrompts.map((prompt, index) => (
                <div key={index} className="prompt-variation">
                  <h4>Variation {index + 1}</h4>
                  <div className="prompt-info">
                    <span>{prompt.length} / 900</span>
                  </div>
                  <div className="prompt-text">{prompt}</div>
                  <button 
                    className="copy-button"
                    onClick={() => handleCopyPrompt(prompt)}
                  >
                    <span className="material-icons">content_copy</span>
                    프롬프트 복사
                  </button>
                </div>
              ))}
              <button 
                className="regenerate-button"
                onClick={handleGenerateSunoPrompts}
                disabled={sunoLoading}
              >
                <span className="material-icons">refresh</span>
                다시 생성하기
              </button>
            </div>
          )}
        </section>

              {/* 가사 생성 섹션 */}
              <section className="project-section">
          <h3>
            <span className="material-icons">lyrics</span>
            가사 생성 설정
          </h3>
          <div className="lyrics-settings">
            <div className="setting-group">
              <label>메인 언어</label>
              <select 
                className="setting-select"
                value={lyricsSettings.mainLanguage}
                onChange={(e) => setLyricsSettings({...lyricsSettings, mainLanguage: e.target.value})}
              >
                <option>한국어 (Korean)</option>
                <option>영어 (English)</option>
                <option>일본어 (Japanese)</option>
                <option>스페인어 (Spanish)</option>
                <option>프랑스어 (French)</option>
              </select>
            </div>
            <div className="dual-lang-container">
              <button 
                className={`setting-button ${lyricsSettings.dualLang ? 'active' : ''}`}
                onClick={() => setLyricsSettings({...lyricsSettings, dualLang: !lyricsSettings.dualLang})}
              >
                언어 혼합 (Dual Lang)
              </button>
              {lyricsSettings.dualLang && (
                <div className="dual-lang-options">
                  <div className="setting-group">
                    <label>보조 언어</label>
                    <select 
                      className="setting-select"
                      value={lyricsSettings.secondaryLanguage}
                      onChange={(e) => setLyricsSettings({...lyricsSettings, secondaryLanguage: e.target.value})}
                    >
                      {['한국어 (Korean)', '영어 (English)', '일본어 (Japanese)', '스페인어 (Spanish)', '프랑스어 (French)']
                        .filter(lang => lang !== lyricsSettings.mainLanguage)
                        .map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                  </div>
                  <div className="setting-group">
                    <label>혼합 비율 (메인 언어 비중)</label>
                    <div className="ratio-control">
                      <div className="ratio-display">
                        <span>{lyricsSettings.languageRatio}%</span>
                        <span> : </span>
                        <span>{100 - lyricsSettings.languageRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={lyricsSettings.languageRatio}
                        onChange={(e) => setLyricsSettings({...lyricsSettings, languageRatio: parseInt(e.target.value)})}
                        className="ratio-slider"
                      />
                      <div className="ratio-presets">
                        <button
                          className={`ratio-preset-button ${lyricsSettings.languageRatio === 70 ? 'active' : ''}`}
                          onClick={() => setLyricsSettings({...lyricsSettings, languageRatio: 70})}
                        >
                          K-Pop 표준 (70%)
                        </button>
                        <button
                          className={`ratio-preset-button ${lyricsSettings.languageRatio === 50 ? 'active' : ''}`}
                          onClick={() => setLyricsSettings({...lyricsSettings, languageRatio: 50})}
                        >
                          밸런스 (50%)
                        </button>
                        <button
                          className={`ratio-preset-button ${lyricsSettings.languageRatio === 90 ? 'active' : ''}`}
                          onClick={() => setLyricsSettings({...lyricsSettings, languageRatio: 90})}
                        >
                          포인트/후크 (90%)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="setting-group">
              <label>생성할 곡의 수</label>
              <div className="setting-input-group">
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={lyricsSettings.songCount}
                  onChange={(e) => setLyricsSettings({...lyricsSettings, songCount: parseInt(e.target.value) || 1})}
                  className="setting-input" 
                />
                <span>곡</span>
              </div>
            </div>
            
            <div className="setting-group">
              <label>비유와 은유 강도</label>
              <select 
                className="setting-select"
                value={lyricsSettings.metaphorLevel}
                onChange={(e) => setLyricsSettings({...lyricsSettings, metaphorLevel: e.target.value})}
              >
                <option>직설적 (Literal - Clear & Direct)</option>
                <option>적절함 (Moderate - Balanced)</option>
                <option>시적 (Poetic - Emotional & Deep)</option>
                <option>추상적 (Abstract - Artistic & Complex)</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>곡 구성 (Song Structure)</label>
              <div className="structure-dropdown-container">
                <button 
                  className="structure-button"
                  onClick={() => setStructureDropdownOpen(!structureDropdownOpen)}
                >
                  <span className="structure-button-text">
                    {songStructures.find(s => lyricsSettings.songStructure.includes(s.name)) 
                      ? `${songStructures.find(s => lyricsSettings.songStructure.includes(s.name)).id}. ${songStructures.find(s => lyricsSettings.songStructure.includes(s.name)).name} 구조`
                      : '1. 기본 팝 구조'}
                    {songStructures.find(s => lyricsSettings.songStructure.includes(s.name))?.best && (
                      <span className="best-badge">BEST</span>
                    )}
                  </span>
                  <span className="material-icons">{structureDropdownOpen ? 'expand_less' : 'expand_more'}</span>
                </button>
                {structureDropdownOpen && (
                  <div className="structure-dropdown">
                    {songStructures.map((structure) => (
                      <button
                        key={structure.id}
                        className={`structure-option ${lyricsSettings.songStructure.includes(structure.name) ? 'selected' : ''}`}
                        onClick={() => {
                          setLyricsSettings({
                            ...lyricsSettings,
                            songStructure: `${structure.id}. ${structure.name} 구조 (${structure.structure})`
                          })
                          setStructureDropdownOpen(false)
                        }}
                      >
                        <div className="structure-option-header">
                          <span className="structure-name">{structure.id}. {structure.name} 구조</span>
                          {structure.best && (
                            <span className="material-icons best-icon">stars</span>
                          )}
                        </div>
                        <div className="structure-detail">({structure.structure})</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="setting-options">
              <button 
                className={`option-button ${lyricsSettings.includeIntro ? 'active' : ''}`}
                onClick={() => setLyricsSettings({...lyricsSettings, includeIntro: !lyricsSettings.includeIntro})}
              >
                Intro 가사 포함
              </button>
              <button 
                className={`option-button ${lyricsSettings.includeOutro ? 'active' : ''}`}
                onClick={() => setLyricsSettings({...lyricsSettings, includeOutro: !lyricsSettings.includeOutro})}
              >
                Outro 가사 포함
              </button>
              <button 
                className={`option-button ${lyricsSettings.instrumental ? 'active' : ''}`}
                onClick={() => setLyricsSettings({...lyricsSettings, instrumental: !lyricsSettings.instrumental})}
              >
                Instrumental (가사 없음)
              </button>
            </div>
            
            <button 
              className="generate-lyrics-button"
              onClick={handleGenerateLyrics}
              disabled={lyricsLoading}
            >
              <span className="material-icons">auto_awesome</span>
              {lyricsLoading ? '가사 생성 중...' : '가사 생성하기'}
            </button>
          </div>

          {lyricsError && (
            <div className="error-message">
              <p>{lyricsError}</p>
              <button onClick={handleGenerateLyrics} className="retry-button">
                다시 시도
              </button>
            </div>
          )}

          {lyrics && (
            <div className="lyrics-container">
              {lyrics.map((lyric, index) => (
                <div key={index} className="lyric-item">
                  <div className="lyric-header">
                    <h4>Song {index + 1}</h4>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopyLyrics(lyric)}
                    >
                      <span className="material-icons">content_copy</span>
                      가사 복사
                    </button>
                  </div>
                  <pre className="lyric-text">{lyric}</pre>
                </div>
              ))}
              <button 
                className="regenerate-button"
                onClick={handleGenerateLyrics}
                disabled={lyricsLoading}
              >
                <span className="material-icons">refresh</span>
                다시 생성하기
              </button>
            </div>
          )}
        </section>
            </div>

        {/* 영상 메타데이터 섹션 */}
        <section className="project-section">
          <h3>
            <span className="material-icons">description</span>
            유튜브 영상 설정
          </h3>
          <p>영상 설명, 해시태그, 키워드를 자동으로 생성합니다.</p>
          
          {!videoMetadata && (
            <button 
              className="section-button"
              onClick={handleGenerateMetadata}
              disabled={metadataLoading}
            >
              <span className="material-icons">smart_toy</span>
              {metadataLoading ? '생성 중...' : '영상 설명 & 태그 생성하기'}
            </button>
          )}

          {metadataError && (
            <div className="error-message">
              <p>{metadataError}</p>
              <button onClick={handleGenerateMetadata} className="retry-button">
                다시 시도
              </button>
            </div>
          )}

          {videoMetadata && (
            <div className="metadata-container">
              <button 
                className="copy-all-button"
                onClick={handleCopyAllMetadata}
              >
                <span className="material-icons">content_copy</span>
                전체 복사 (제목 + 설명 + 키워드)
              </button>
              
              <div className="metadata-content">
                <h4>
                  <span className="material-icons">title</span>
                  영상 제목
                </h4>
                <p>{title}</p>
                
                <h4>
                  <span className="material-icons">description</span>
                  영상 설명
                </h4>
                <p className="description-text">{videoMetadata.description}</p>
                
                <div className="hashtags-container">
                  {videoMetadata.hashtags.map((tag, index) => (
                    <span key={index} className="hashtag">{tag}</span>
                  ))}
                </div>
                
                <h4>
                  <span className="material-icons">tag</span>
                  추천 키워드 (태그)
                </h4>
                <p className="keywords-text">{videoMetadata.keywords}</p>
              </div>
              
              <button 
                className="regenerate-button"
                onClick={handleGenerateMetadata}
                disabled={metadataLoading}
              >
                <span className="material-icons">refresh</span>
                다시 생성하기
              </button>
            </div>
          )}
        </section>
          </>
        )}

        {/* 유튜브 썸네일 탭 내용 */}
        {activeTab === 'thumbnail' && (
          <div className="thumbnail-layout-row">
            {/* 좌측: 페르소나 + 썸네일 설정 */}
            <div className="thumbnail-left-column">
              {/* 페르소나 (캐릭터 설정) 섹션 */}
              <section className="project-section">
                <h3>
                  <span className="material-icons">face</span>
                  페르소나 (캐릭터 설정)
                </h3>
                <p>일관성 있는 캐릭터가 썸네일에 반영되도록 이미지를 업로드하세요.</p>
                
                <div className="persona-upload">
                  {!personaImage ? (
                    <>
                      <span className="material-icons">person_add</span>
                      <label htmlFor="persona-image-input" className="upload-button">
                        이미지 업로드
                      </label>
                      <input
                        id="persona-image-input"
                        type="file"
                        accept="image/*"
                        onChange={handlePersonaImageUpload}
                        style={{ display: 'none' }}
                      />
                    </>
                  ) : (
                    <div className="persona-preview">
                      <img src={personaImage} alt="Persona" />
                      <button 
                        className="remove-persona-button"
                        onClick={handleRemovePersonaImage}
                        title="이미지 제거"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* 썸네일 설정 섹션 */}
              <section className="project-section">
              <h3>
                <span className="material-icons">palette</span>
                썸네일 설정
              </h3>
              
              <div className="thumbnail-settings">
            <div className="setting-group">
              <label>이미지 스타일</label>
              <div className="style-buttons">
                {['실사 (Realistic)', '애니메이션 (Anime)', '일러스트 (Illustration)', '로파이 (Lo-fi)', '수채화 (Watercolor)', '사이버펑크 (Cyberpunk)', '유화 (Oil Painting)'].map(style => (
                  <button
                    key={style}
                    className={`style-button ${thumbnailSettings.style === style ? 'active' : ''}`}
                    onClick={() => setThumbnailSettings({...thumbnailSettings, style})}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 제목 텍스트 포함 토글 */}
            <div className="setting-group">
              <div className="include-title-toggle">
                <label>제목 텍스트 포함</label>
                <button
                  type="button"
                  className={`toggle-switch ${thumbnailSettings.includeTitle ? 'active' : ''}`}
                  onClick={() => setThumbnailSettings({...thumbnailSettings, includeTitle: !thumbnailSettings.includeTitle})}
                  aria-label="제목 텍스트 포함 토글"
                >
                  <span className="toggle-knob"></span>
                </button>
              </div>
            </div>

            {/* 썸네일 제목 관련 설정 (토글이 켜져있을 때만 표시) */}
            {thumbnailSettings.includeTitle && (
              <>
                <div className="setting-group">
                  <label>썸네일 제목 (수정 가능)</label>
                  <textarea
                    className="thumbnail-title-input"
                    value={thumbnailSettings.thumbnailTitle}
                    onChange={(e) => setThumbnailSettings({...thumbnailSettings, thumbnailTitle: e.target.value})}
                    placeholder="이미지에 들어갈 제목 입력"
                    rows={3}
                  />
                </div>

                <div className="setting-group">
                  <label>제목 폰트 선택</label>
              <div className="font-buttons">
                {fontList.map(font => (
                  <button
                    key={font.id}
                    className={`font-button ${thumbnailSettings.font === font.name ? 'active' : ''}`}
                    onClick={() => setThumbnailSettings({...thumbnailSettings, font: font.name})}
                    title={font.desc}
                  >
                    {font.name}
                    <span 
                      className="font-desc" 
                      style={{ fontFamily: `"${font.fontFamily}", sans-serif` }}
                    >
                      {font.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>폰트 크기</label>
              <div className="font-size-control">
                <input
                  type="range"
                  min="0.05"
                  max="0.15"
                  step="0.01"
                  value={thumbnailSettings.fontSize}
                  onChange={(e) => setThumbnailSettings({...thumbnailSettings, fontSize: parseFloat(e.target.value)})}
                  className="font-size-slider"
                />
                <span className="font-size-value">
                  {Math.round(thumbnailSettings.fontSize * 100)}%
                </span>
              </div>
            </div>

            <div className="setting-group">
              <label>폰트 색상</label>
              <div className="font-color-control">
                <input
                  type="color"
                  value={thumbnailSettings.fontColor}
                  onChange={(e) => setThumbnailSettings({...thumbnailSettings, fontColor: e.target.value})}
                  className="font-color-picker"
                />
                <input
                  type="text"
                  value={thumbnailSettings.fontColor}
                  onChange={(e) => setThumbnailSettings({...thumbnailSettings, fontColor: e.target.value})}
                  className="font-color-input"
                  placeholder="#ffffff"
                />
              </div>
            </div>

                <div className="setting-group">
                  <label>폰트 스타일</label>
                  <button
                    className={`bold-button ${thumbnailSettings.bold ? 'active' : ''}`}
                    onClick={() => setThumbnailSettings({...thumbnailSettings, bold: !thumbnailSettings.bold})}
                  >
                    <strong>B</strong>
                    <span>볼드</span>
                  </button>
                </div>
              </>
            )}
          </div>

                <div className="thumbnail-info-box">
                  <span className="material-icons">info</span>
                  <div>
                    <strong>SYNTHESIS ENGINE</strong>
                    <p>배경의 'PLAYLIST' 문구는 AI가 생성하고, 선택한 문구는 폰트로 합성됩니다.</p>
                  </div>
                </div>

                {!thumbnail && (
                  <button 
                    className="section-button"
                    onClick={handleGenerateThumbnail}
                    disabled={thumbnailLoading}
                  >
                    <span className="material-icons">auto_fix_high</span>
                    {thumbnailLoading ? '생성 중...' : '썸네일 생성하기'}
                  </button>
                )}
              </section>
            </div>

            {/* 우측: 미리보기 */}
            <section className="project-section thumbnail-preview-section">
                <h3>
                  <span className="material-icons">auto_awesome</span>
                  미리보기
                </h3>
                
                {!thumbnail && (
                  <div className="thumbnail-placeholder">
                    <span className="material-icons">auto_awesome</span>
                    <p>Select a style and font, then click 'Generate Thumbnail'.</p>
                    <p>Your custom artistic layout will be rendered here.</p>
                  </div>
                )}

                {thumbnailLoading && (
                  <div className="loading-message">
                    <p>이미지를 생성하고 텍스트를 합성하는 중입니다...</p>
                    <p>약 5-10초 정도 소요됩니다.</p>
                  </div>
                )}

                {thumbnailError && (
                  <div className="error-message">
                    <p><strong>이미지 생성 오류:</strong> {thumbnailError}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#666' }}>
                      💡 <strong>참고:</strong> Gemini 이미지 생성 API는 아직 preview 단계입니다. 
                      API 키에 이미지 생성 권한이 있는지 확인해주세요. 
                      브라우저 콘솔(F12)에서 더 자세한 오류 정보를 확인할 수 있습니다.
                    </p>
                    <button onClick={handleGenerateThumbnail} className="retry-button">
                      다시 시도
                    </button>
                  </div>
                )}

                {thumbnail && (
                  <div className="thumbnail-container">
                    <div className="thumbnail-preview">
                      <img src={thumbnail.imageDataUrl} alt="Generated thumbnail" />
                    </div>
                    <div className="thumbnail-actions">
                      <button 
                        className="download-button"
                        onClick={() => handleDownloadThumbnail('png')}
                      >
                        <span className="material-icons">image</span>
                        PNG 다운로드
                      </button>
                      <button 
                        className="download-button"
                        onClick={() => handleDownloadThumbnail('jpg')}
                      >
                        <span className="material-icons">photo</span>
                        JPG 다운로드
                      </button>
                      <button 
                        className="regenerate-button"
                        onClick={handleGenerateThumbnail}
                        disabled={thumbnailLoading}
                      >
                        <span className="material-icons">refresh</span>
                        다시 생성하기
                      </button>
                    </div>
                    
                    {/* 수정 요청 섹션 */}
                    <div className="revision-section">
                      <h4>
                        <span className="material-icons">rate_review</span>
                        마음에 들지 않으신가요?
                      </h4>
                      <textarea
                        className="revision-feedback-input"
                        value={revisionFeedback}
                        onChange={(e) => setRevisionFeedback(e.target.value)}
                        placeholder="수정하고 싶은 내용을 입력하세요..."
                        rows={3}
                      />
                      <button
                        className="revision-button"
                        onClick={handleRequestRevision}
                        disabled={thumbnailLoading || !revisionFeedback.trim()}
                      >
                        수정 요청
                      </button>
                    </div>
                  </div>
                )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaylistCreator
