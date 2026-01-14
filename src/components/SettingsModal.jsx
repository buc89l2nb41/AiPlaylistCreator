import { useState, useEffect } from 'react'
import { getApiKey, saveApiKey } from '../utils/apiKeyStorage'
import { 
  testTextGeneration, 
  testImageGeneration, 
  testHighQualityImageGeneration 
} from '../services/geminiService'
import './SettingsModal.css'

function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [testResults, setTestResults] = useState({
    text: null,
    image: null,
    highQuality: null
  })
  const [testing, setTesting] = useState({
    text: false,
    image: false,
    highQuality: false,
    all: false
  })
  const [allTestResults, setAllTestResults] = useState(null)
  const [currentTestIndex, setCurrentTestIndex] = useState(-1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const savedKey = getApiKey()
      setApiKey(savedKey || '')
      setTestResults({
        text: null,
        image: null,
        highQuality: null
      })
      setAllTestResults(null)
      setCurrentTestIndex(-1)
    }
  }, [isOpen])

  const handleSave = () => {
    if (!apiKey.trim()) {
      setTestResults(prev => ({
        ...prev,
        text: {
          success: false,
          message: 'API 키를 입력해주세요.'
        }
      }))
      return
    }

    setSaving(true)
    const saved = saveApiKey(apiKey)
    
    if (saved) {
      setTestResults(prev => ({
        ...prev,
        text: {
          success: true,
          message: 'API 키가 저장되었습니다.'
        }
      }))
      setTimeout(() => {
        onClose()
      }, 1000)
    } else {
      setTestResults(prev => ({
        ...prev,
        text: {
          success: false,
          message: 'API 키 저장에 실패했습니다.'
        }
      }))
    }
    setSaving(false)
  }

  const handleTest = async (testType) => {
    if (!apiKey.trim()) {
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: false,
          message: 'API 키를 입력해주세요.'
        }
      }))
      return
    }

    // 임시로 API 키 저장 (테스트용)
    const previousKey = getApiKey()
    saveApiKey(apiKey)

    setTesting(prev => ({ ...prev, [testType]: true }))
    setTestResults(prev => ({ ...prev, [testType]: null }))

    try {
      let result
      switch (testType) {
        case 'text':
          result = await testTextGeneration()
          break
        case 'image':
          result = await testImageGeneration()
          break
        case 'highQuality':
          result = await testHighQualityImageGeneration()
          break
        default:
          return
      }
      
      setTestResults(prev => ({ ...prev, [testType]: result }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: false,
          message: `테스트 중 오류가 발생했습니다: ${error.message}`
        }
      }))
    } finally {
      setTesting(prev => ({ ...prev, [testType]: false }))
      // 이전 키로 복원
      if (previousKey) {
        saveApiKey(previousKey)
      } else {
        saveApiKey(apiKey)
      }
    }
  }

  const handleTestAll = async () => {
    if (!apiKey.trim()) {
      setAllTestResults({
        success: false,
        results: [],
        summary: 'API 키를 입력해주세요.'
      })
      return
    }

    // 임시로 API 키 저장 (테스트용)
    const previousKey = getApiKey()
    saveApiKey(apiKey)

    setTesting(prev => ({ ...prev, all: true }))
    setAllTestResults(null)
    setCurrentTestIndex(0)

    try {
      // 각 테스트를 순차적으로 실행하면서 진행 상황 업데이트
      const results = []
      let successCount = 0

      // 1. 텍스트 생성 테스트
      setCurrentTestIndex(0)
      const textResult = await testTextGeneration()
      results.push({
        type: 'text',
        name: '텍스트 생성',
        ...textResult
      })
      if (textResult.success) successCount++

      // 2. 이미지 생성 테스트
      setCurrentTestIndex(1)
      const imageResult = await testImageGeneration()
      results.push({
        type: 'image',
        name: '이미지 생성',
        ...imageResult
      })
      if (imageResult.success) successCount++

      // 3. 고화질 이미지 생성 테스트
      setCurrentTestIndex(2)
      const highQualityResult = await testHighQualityImageGeneration()
      results.push({
        type: 'highQuality',
        name: '고화질 이미지 생성',
        ...highQualityResult
      })
      if (highQualityResult.success) successCount++

      const allSuccess = successCount === 3
      const summary = allSuccess 
        ? `모든 기능 테스트 성공! (${successCount}/3)`
        : `일부 기능 테스트 실패 (${successCount}/3)`

      setAllTestResults({
        success: allSuccess,
        results: results,
        summary: summary,
        successCount: successCount,
        totalCount: 3
      })

      // 개별 테스트 결과도 업데이트
      setTestResults({
        text: results[0],
        image: results[1],
        highQuality: results[2]
      })
    } catch (error) {
      setAllTestResults({
        success: false,
        results: [],
        summary: `테스트 중 오류가 발생했습니다: ${error.message}`
      })
    } finally {
      setTesting(prev => ({ ...prev, all: false }))
      setCurrentTestIndex(-1)
      // 이전 키로 복원
      if (previousKey) {
        saveApiKey(previousKey)
      } else {
        saveApiKey(apiKey)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ 설정</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3>Gemini API 키</h3>
            <p className="settings-description">
              Google AI Studio에서 발급받은 Gemini API 키를 입력하세요.
              <br />
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="api-key-link"
              >
                API 키 발급받기 →
              </a>
            </p>

            <div className="input-group">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="api-key-input"
                disabled={testing.text || testing.image || testing.highQuality || saving}
              />
            </div>

            <div className="test-section">
              <h4>기능 테스트</h4>
              <p className="test-description">
                API 키가 정상적으로 작동하는지 테스트해보세요.
              </p>

              {/* API 기능 테스트 버튼 (모든 기능 일괄 테스트) */}
              <div className="test-all-section">
                <button
                  onClick={handleTestAll}
                  disabled={testing.all || testing.text || testing.image || testing.highQuality || saving || !apiKey.trim()}
                  className={`test-all-button ${testing.all ? 'testing' : ''}`}
                >
                  {testing.all ? (
                    <>
                      <span className="spinner"></span>
                      테스트 진행 중... ({currentTestIndex + 1}/3)
                    </>
                  ) : (
                    '🔍 API 기능 테스트'
                  )}
                </button>

                {allTestResults && (
                  <div className={`test-all-result ${allTestResults.success ? 'success' : 'error'}`}>
                    <div className="test-all-summary">
                      <strong>{allTestResults.success ? '✓' : '✗'} {allTestResults.summary}</strong>
                    </div>
                    <div className="test-all-details">
                      {allTestResults.results.map((result, index) => (
                        <div key={index} className={`test-detail-item ${result.success ? 'success' : 'error'}`}>
                          <span className="test-detail-icon">{result.success ? '✓' : '✗'}</span>
                          <span className="test-detail-name">{result.name}:</span>
                          <span className="test-detail-message">{result.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 개별 테스트 버튼들 */}
              <div className="test-buttons-grid">
                <div className="test-item">
                  <button
                    onClick={() => handleTest('text')}
                    disabled={testing.all || testing.text || testing.image || testing.highQuality || saving || !apiKey.trim()}
                    className={`test-function-button ${testing.text ? 'testing' : ''}`}
                  >
                    {testing.text ? '테스트 중...' : '📝 텍스트 생성 (Chat)'}
                  </button>
                  {testResults.text && !testing.all && (
                    <div className={`test-result-small ${testResults.text.success ? 'success' : 'error'}`}>
                      {testResults.text.success ? '✓' : '✗'} {testResults.text.message}
                    </div>
                  )}
                </div>

                <div className="test-item">
                  <button
                    onClick={() => handleTest('image')}
                    disabled={testing.all || testing.text || testing.image || testing.highQuality || saving || !apiKey.trim()}
                    className={`test-function-button ${testing.image ? 'testing' : ''}`}
                  >
                    {testing.image ? '테스트 중...' : '🖼️ 이미지 생성 (Nano Banana)'}
                  </button>
                  {testResults.image && !testing.all && (
                    <div className={`test-result-small ${testResults.image.success ? 'success' : 'error'}`}>
                      {testResults.image.success ? '✓' : '✗'} {testResults.image.message}
                    </div>
                  )}
                </div>

                <div className="test-item">
                  <button
                    onClick={() => handleTest('highQuality')}
                    disabled={testing.all || testing.text || testing.image || testing.highQuality || saving || !apiKey.trim()}
                    className={`test-function-button ${testing.highQuality ? 'testing' : ''}`}
                  >
                    {testing.highQuality ? '테스트 중...' : '✨ 고화질 이미지 (Banana Pro)'}
                  </button>
                  {testResults.highQuality && !testing.all && (
                    <div className={`test-result-small ${testResults.highQuality.success ? 'success' : 'error'}`}>
                      {testResults.highQuality.success ? '✓' : '✗'} {testResults.highQuality.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="button-group">
              <button
                onClick={handleSave}
                disabled={testing.all || testing.text || testing.image || testing.highQuality || saving || !apiKey.trim()}
                className="save-button"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
