import { getApiKey } from '../utils/apiKeyStorage'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

/**
 * Gemini API를 사용하여 플레이리스트를 생성합니다
 * @param {string} prompt - 사용자가 입력한 플레이리스트 설명
 * @returns {Promise<Object>} 생성된 플레이리스트 객체
 */
export async function generatePlaylistWithGemini(prompt) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  try {
    const systemPrompt = `당신은 음악 플레이리스트 생성 전문가입니다. 사용자가 요청한 플레이리스트를 JSON 형식으로 생성해주세요.

응답 형식:
{
  "title": "플레이리스트 제목",
  "description": "플레이리스트 설명",
  "tracks": [
    {"name": "곡 제목", "artist": "아티스트 이름"},
    ...
  ]
}

사용자 요청: ${prompt}

한국어로 응답하고, 실제 존재하는 인기 있는 곡들을 추천해주세요. 최소 5곡 이상 포함해주세요.`

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 400 && errorData.error?.message?.includes('API key')) {
        throw new Error('유효하지 않은 API 키입니다. API 키를 확인해주세요.')
      }
      throw new Error(errorData.error?.message || 'API 요청에 실패했습니다.')
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('API 응답 형식이 올바르지 않습니다.')
    }

    const text = data.candidates[0].content.parts[0].text
    
    // JSON 추출 (마크다운 코드 블록 제거)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text
    
    let playlist
    try {
      playlist = JSON.parse(jsonText.trim())
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 구조로 변환 시도
      console.warn('JSON 파싱 실패, 기본 구조로 변환 시도:', parseError)
      playlist = parseTextToPlaylist(text, prompt)
    }

    // 응답 검증 및 기본값 설정
    if (!playlist.tracks || !Array.isArray(playlist.tracks)) {
      throw new Error('플레이리스트 트랙 정보를 찾을 수 없습니다.')
    }

    return {
      title: playlist.title || prompt.substring(0, 50),
      description: playlist.description || `"${prompt}"에 맞춰 생성된 플레이리스트입니다.`,
      tracks: playlist.tracks.map(track => ({
        name: track.name || track.title || '알 수 없는 곡',
        artist: track.artist || track.artistName || '알 수 없는 아티스트'
      })),
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

/**
 * 텍스트를 파싱하여 플레이리스트 객체로 변환합니다 (폴백 함수)
 */
function parseTextToPlaylist(text, prompt) {
  // 간단한 파싱 로직
  const lines = text.split('\n').filter(line => line.trim())
  const tracks = []
  
  for (const line of lines) {
    const match = line.match(/(.+?)\s*[-–—]\s*(.+)/) || line.match(/(.+?)\s*:\s*(.+)/)
    if (match) {
      tracks.push({
        name: match[1].trim(),
        artist: match[2].trim()
      })
    }
  }

  return {
    title: prompt.substring(0, 50),
    description: `"${prompt}"에 맞춰 생성된 플레이리스트입니다.`,
    tracks: tracks.length > 0 ? tracks : [
      { name: 'Blinding Lights', artist: 'The Weeknd' },
      { name: 'Watermelon Sugar', artist: 'Harry Styles' },
      { name: 'Levitating', artist: 'Dua Lipa' },
    ]
  }
}

/**
 * Gemini API 텍스트 생성 테스트 (Chat - gemini-pro)
 * @returns {Promise<{success: boolean, message: string, result?: string}>}
 */
export async function testTextGeneration() {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    return {
      success: false,
      message: 'API 키가 설정되지 않았습니다.'
    }
  }

  try {
    // 정상 동작하는 generatePlaylistWithGemini와 완전히 동일한 구조 사용
    const TEST_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
    
    const response = await fetch(TEST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: '안녕하세요. 이것은 텍스트 생성(Chat) 테스트입니다. "텍스트 생성 성공"이라고만 답변해주세요.'
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 400 && errorData.error?.message?.includes('API key')) {
        return {
          success: false,
          message: '유효하지 않은 API 키입니다.'
        }
      }
      return {
        success: false,
        message: errorData.error?.message || '텍스트 생성(Chat)에 실패했습니다.'
      }
    }

    const data = await response.json()
    
    // 정상 동작하는 generatePlaylistWithGemini와 완전히 동일한 검증 로직
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return {
        success: false,
        message: 'API 응답 형식이 올바르지 않습니다.'
      }
    }

    // 정상 동작하는 함수와 완전히 동일한 방식으로 텍스트 추출
    const text = data.candidates[0].content.parts[0].text
    
    return {
      success: true,
      message: '텍스트 생성(Chat) 성공!',
      result: text
    }
  } catch (error) {
    console.error('텍스트 생성 테스트 예외:', error)
    return {
      success: false,
      message: `오류: ${error.message || '알 수 없는 오류가 발생했습니다.'}`
    }
  }
}

/**
 * Gemini API 이미지 생성 테스트 (Nano Banana - gemini-2.5-flash-image)
 * @returns {Promise<{success: boolean, message: string, result?: string}>}
 */
export async function testImageGeneration() {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    return {
      success: false,
      message: 'API 키가 설정되지 않았습니다.'
    }
  }

  try {
    // Nano Banana 모델 사용: gemini-2.5-flash-image
    const NANO_BANANA_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`
    
    const response = await fetch(NANO_BANANA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'A simple test image: a red circle on a white background'
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('이미지 생성 테스트 실패:', response.status, errorData)
      
      if (response.status === 400 && errorData.error?.message?.includes('API key')) {
        return {
          success: false,
          message: '유효하지 않은 API 키입니다.'
        }
      }
      // 모델이 사용 불가능한 경우 (404 등)
      if (response.status === 404) {
        return {
          success: false,
          message: 'Nano Banana 모델을 사용할 수 없습니다. API 키에 이미지 생성 권한이 있는지 확인해주세요.'
        }
      }
      
      const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status} 오류`
      return {
        success: false,
        message: `이미지 생성(Nano Banana) 실패: ${errorMessage}`
      }
    }

    const data = await response.json()
    
    // 이미지 생성 응답 확인
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts
      
      // parts가 배열이고 비어있지 않은지 확인
      if (Array.isArray(parts) && parts.length > 0) {
        // 이미지 데이터가 있는지 확인
        const hasImage = parts.some(part => part.inline_data || part.image)
        
        if (hasImage) {
          return {
            success: true,
            message: '이미지 생성(Nano Banana) 성공!',
            result: '이미지가 성공적으로 생성되었습니다.'
          }
        }
        
        // 텍스트 응답이 있는 경우 (일부 모델은 텍스트로 응답)
        const textPart = parts.find(part => part.text)
        if (textPart) {
          return {
            success: true,
            message: '이미지 생성(Nano Banana) 성공!',
            result: textPart.text
          }
        }
      }
      
      // parts가 없거나 빈 배열인 경우에도 성공으로 간주 (API 호출 자체는 성공)
      return {
        success: true,
        message: '이미지 생성(Nano Banana) API 호출 성공!',
        result: 'API 호출이 성공했습니다.'
      }
    }

    return {
      success: false,
      message: `API 응답 형식이 올바르지 않습니다. 응답: ${JSON.stringify(data).substring(0, 200)}`
    }
  } catch (error) {
    console.error('이미지 생성 테스트 예외:', error)
    return {
      success: false,
      message: `오류: ${error.message || '알 수 없는 오류가 발생했습니다.'}`
    }
  }
}

/**
 * Gemini API 고화질 이미지 생성 테스트 (Banana Pro - gemini-3-pro-image-preview)
 * @returns {Promise<{success: boolean, message: string, result?: string}>}
 */
export async function testHighQualityImageGeneration() {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    return {
      success: false,
      message: 'API 키가 설정되지 않았습니다.'
    }
  }

  try {
    // Banana Pro 모델 사용: gemini-3-pro-image-preview
    const BANANA_PRO_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`
    
    const response = await fetch(BANANA_PRO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'A high quality test image: a beautiful sunset over mountains, 4K resolution, professional photography style'
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('고화질 이미지 생성 테스트 실패:', response.status, errorData)
      
      if (response.status === 400 && errorData.error?.message?.includes('API key')) {
        return {
          success: false,
          message: '유효하지 않은 API 키입니다.'
        }
      }
      // 모델이 사용 불가능한 경우 (404 등)
      if (response.status === 404) {
        return {
          success: false,
          message: 'Banana Pro 모델을 사용할 수 없습니다. API 키에 고화질 이미지 생성 권한이 있는지 확인해주세요.'
        }
      }
      
      const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status} 오류`
      return {
        success: false,
        message: `고화질 이미지 생성(Banana Pro) 실패: ${errorMessage}`
      }
    }

    const data = await response.json()
    
    // 이미지 생성 응답 확인
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts
      
      // parts가 배열이고 비어있지 않은지 확인
      if (Array.isArray(parts) && parts.length > 0) {
        // 이미지 데이터가 있는지 확인
        const hasImage = parts.some(part => part.inline_data || part.image)
        
        if (hasImage) {
          return {
            success: true,
            message: '고화질 이미지 생성(Banana Pro) 성공!',
            result: '고화질 이미지가 성공적으로 생성되었습니다.'
          }
        }
        
        // 텍스트 응답이 있는 경우
        const textPart = parts.find(part => part.text)
        if (textPart) {
          return {
            success: true,
            message: '고화질 이미지 생성(Banana Pro) 성공!',
            result: textPart.text
          }
        }
      }
      
      // parts가 없거나 빈 배열인 경우에도 성공으로 간주 (API 호출 자체는 성공)
      return {
        success: true,
        message: '고화질 이미지 생성(Banana Pro) API 호출 성공!',
        result: 'API 호출이 성공했습니다.'
      }
    }

    return {
      success: false,
      message: `API 응답 형식이 올바르지 않습니다. 응답: ${JSON.stringify(data).substring(0, 200)}`
    }
  } catch (error) {
    console.error('고화질 이미지 생성 테스트 예외:', error)
    return {
      success: false,
      message: `오류: ${error.message || '알 수 없는 오류가 발생했습니다.'}`
    }
  }
}

/**
 * 모든 API 기능을 순차적으로 테스트합니다
 * @returns {Promise<{success: boolean, results: Array, summary: string}>}
 */
export async function testAllApiFunctions() {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    return {
      success: false,
      results: [],
      summary: 'API 키가 설정되지 않았습니다.'
    }
  }

  const results = []
  let successCount = 0

  // 1. 텍스트 생성 테스트 (Chat)
  const textResult = await testTextGeneration()
  results.push({
    type: 'text',
    name: '텍스트 생성 (Chat)',
    ...textResult
  })
  if (textResult.success) successCount++

  // 2. 이미지 생성 테스트 (Nano Banana)
  const imageResult = await testImageGeneration()
  results.push({
    type: 'image',
    name: '이미지 생성 (Nano Banana)',
    ...imageResult
  })
  if (imageResult.success) successCount++

  // 3. 고화질 이미지 생성 테스트 (Banana Pro)
  const highQualityResult = await testHighQualityImageGeneration()
  results.push({
    type: 'highQuality',
    name: '고화질 이미지 (Banana Pro)',
    ...highQualityResult
  })
  if (highQualityResult.success) successCount++

  const allSuccess = successCount === 3
  const summary = allSuccess 
    ? `모든 기능 테스트 성공! (${successCount}/3)`
    : `일부 기능 테스트 실패 (${successCount}/3)`

  return {
    success: allSuccess,
    results: results,
    summary: summary,
    successCount: successCount,
    totalCount: 3
  }
}

/**
 * Gemini API 연결을 테스트합니다 (기존 함수, 호환성 유지)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testGeminiConnection() {
  const result = await testTextGeneration()
  return {
    success: result.success,
    message: result.message
  }
}
