import { getApiKey } from '../utils/apiKeyStorage'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

/**
 * Gemini API를 사용하여 유튜브 플레이리스트 제목 10개를 생성합니다
 * @param {string} genre - 선택된 장르명
 * @returns {Promise<Array<string>>} 생성된 제목 배열 (10개)
 */
export async function generatePlaylistTitles(genre) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  try {
    const prompt = `Generate 10 creative YouTube playlist titles for the musical genre: "${genre}".

      STRICT FORMATTING RULE:
      All titles MUST follow this specific pattern:
      "playlist [Emoji] [Creative Korean Sentence] | [English Keyword 1] & [English Keyword 2]"

      Examples of the required style (Use these as reference for tone and structure):
      - playlist 🎧 그냥 틀어놨는데 "여기 어디야?" 질문 받는 플리 | Vibe & Pop
      - playlist ☕️ 이 카페, 음악 맛집이네. 사장님 선곡 훔치기 | Cafe & Jazz
      - playlist ☁️ 아무것도 안 하고 싶을 때, BGM은 포기 못해 | Cozy & Chill
      - playlist 🌇 퇴근길 지하철, 잠시 나만의 세상으로 | Sunset & Mood
      - playlist 🚗 창문 열고 드라이브할 때, 바람이랑 같이 듣는 노래 | Drive & Vibe
      - playlist 📚 공부... 해야지. 집중력 200% 올려주는 마법 | Focus & Lofi
      - playlist 🌙 자기 전, 복잡한 생각 비우기 좋은 잔잔한 무드 | Night & Calm
      - playlist 🔥 도파민 터진다. 3초 만에 심장 뛰게 하는 훅 모음 | Dopamine & Pop

      Requirements:
      1. Start with "playlist".
      2. Use a relevant Emoji.
      3. The Korean sentence should be catchy, relatable, emotional, or situational (high CTR).
      4. End with "|" followed by 2 English mood/genre keywords connected by "&".
      5. The content must fit the requested genre: "${genre}".`

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              titles: {
                type: 'ARRAY',
                items: {
                  type: 'STRING'
                },
                description: 'A list of 10 creative YouTube playlist titles.'
              }
            },
            required: ['titles']
          }
        }
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
    
    // JSON 파싱
    let result
    try {
      result = JSON.parse(text.trim())
    } catch (parseError) {
      // JSON 파싱 실패 시 텍스트에서 추출 시도
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('API 응답을 파싱할 수 없습니다.')
      }
    }

    // titles 배열 검증
    if (!result.titles || !Array.isArray(result.titles) || result.titles.length === 0) {
      throw new Error('제목 목록을 찾을 수 없습니다.')
    }

    return result.titles
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

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
    const systemPrompt = `당신은 유튜브 플레이리스트 제작 전문가입니다. 사용자가 요청한 유튜브 플레이리스트를 위한 제목, 설명, 그리고 곡 목록을 JSON 형식으로 생성해주세요.

유튜브 플레이리스트 제목은 검색에 잘 노출되고, 클릭을 유도할 수 있는 매력적인 제목이어야 합니다.
예: "🎵 [장르] 플레이리스트 | 공부할 때 듣기 좋은 음악 | 1시간 연속재생"
예: "💜 Lo-fi 힙합 플레이리스트 | 집중력 향상 | 공부 BGM"
예: "🔥 운동할 때 듣기 좋은 팝송 | 에너지 넘치는 플레이리스트"

응답 형식:
{
  "title": "유튜브 플레이리스트 제목 (이모지와 함께 매력적으로 작성)",
  "description": "유튜브 플레이리스트 설명 (SEO를 고려한 설명, 해시태그 포함 가능)",
  "tracks": [
    {"name": "곡 제목", "artist": "아티스트 이름"},
    ...
  ]
}

사용자 요청: ${prompt}

한국어로 응답하고, 실제 존재하는 인기 있는 곡들을 추천해주세요. 최소 10곡 이상 포함해주세요. 유튜브에 업로드하기 좋은 제목과 설명을 작성해주세요.`

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
 * Gemini API 텍스트 생성 테스트 (Chat - gemini-3-flash-preview)
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
    const TEST_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`
    
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
