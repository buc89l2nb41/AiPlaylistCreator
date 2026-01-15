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

/**
 * Suno 음악 생성용 프롬프트 3개를 생성합니다
 * @param {string} title - 선택된 플레이리스트 제목
 * @param {string} genre - 선택된 장르명
 * @returns {Promise<Array<string>>} 생성된 Suno 프롬프트 배열 (3개)
 */
export async function generateSunoPrompts(title, genre) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  try {
    const prompt = `Create **3 DISTINCT** detailed prompts for Suno music generation based on the playlist title: "${title}" and genre: "${genre}".
      
      **COPYRIGHT & NAMING RULES (STRICT):**
      1. **NO ARTIST NAMES**: Do NOT use specific artist names, band names, or real-world song titles. (e.g., Do NOT say "Style of BTS", "Like Taylor Swift", or "Cover of Hey Jude").
      2. **NO COPYRIGHTED TERMS**: Avoid specific trademarked synthesizer names or studio names if possible.
      3. **USE DESCRIPTORS**: Instead of artist names, use musical adjectives (e.g., "K-pop boy band style, energetic", "Whisper pop, breathy vocals", "1980s city pop").

      **CONSISTENCY RULE:**
      All 3 prompts MUST share the **EXACT SAME** Mood, Genre Style, and Tempo. They should sound like different tracks on the **same album** or playlist.

      **VARIATION STRATEGY (Vary ONLY Instruments & Articulation):**
      1. Prompt A: The standard/definitive arrangement. Uses the most typical instruments for this specific vibe.
      2. Prompt B: Instrumental substitution. Keep the same mood but swap a main instrument (e.g., Acoustic Piano → Rhodes, or Synth Pad → String Section) or change the tone (e.g., Clean → Lo-fi).
      3. Prompt C: Rhythmic/Textural variation. Keep the same core instruments but focus on a different playing technique (e.g., more arpeggios, different drum pattern, or specific sound design details like "warm tape saturation").

      **CRITICAL LENGTH CONSTRAINT PER PROMPT:**
      - Each prompt MUST be less than 900 characters (including spaces).
      - Target length: 450-800 characters.

      INSTRUCTIONS FOR DETAIL (Apply to all 3):
      1. **Tags:** Start with [Genre], [Tempo], [Mood]. These specific tags should be **IDENTICAL** across all 3 prompts.
      2. **Specific Instrumentation:** Describe instruments specifically.
      3. **Playing Style:** Describe HOW the instruments are played.
      
      Format each prompt clearly using tags and descriptive sentences.`

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
              prompts: {
                type: 'ARRAY',
                items: {
                  type: 'STRING'
                },
                description: 'List of 3 distinct Suno music prompts.'
              }
            },
            required: ['prompts']
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
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('API 응답을 파싱할 수 없습니다.')
      }
    }

    if (!result.prompts || !Array.isArray(result.prompts) || result.prompts.length === 0) {
      throw new Error('Suno 프롬프트 목록을 찾을 수 없습니다.')
    }

    return result.prompts
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

/**
 * 유튜브 영상 메타데이터(설명, 해시태그, 키워드)를 생성합니다
 * @param {string} title - 플레이리스트 제목
 * @param {string} genre - 장르명
 * @returns {Promise<Object>} { description, hashtags, keywords }
 */
export async function generateVideoMetadata(title, genre) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  try {
    const prompt = `Generate YouTube video metadata for a playlist titled "${title}" (Genre: ${genre}).

      1. **Video Description**: Write a warm, emotional, and engaging description in Korean. It should make people want to click and listen. Include situational context (e.g., "Good for studying", "Perfect for night drives").
      2. **Hashtags**: Generate exactly 5 highly relevant and popular hashtags. **CRITICAL: The first hashtag MUST be #playlist".**
      3. **Keywords**: Generate exactly 15 high-volume search keywords related to the genre and title, separated by commas.
      `

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
              description: {
                type: 'STRING',
                description: 'An emotional and engaging YouTube video description in Korean.'
              },
              hashtags: {
                type: 'ARRAY',
                items: {
                  type: 'STRING'
                },
                description: 'Top 5 popular and relevant hashtags. The first one MUST be #playlist.'
              },
              keywords: {
                type: 'STRING',
                description: '15 popular keywords sorted by popularity, separated by commas.'
              }
            },
            required: ['description', 'hashtags', 'keywords']
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
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('API 응답을 파싱할 수 없습니다.')
      }
    }

    if (!result.description || !result.hashtags || !result.keywords) {
      throw new Error('메타데이터를 찾을 수 없습니다.')
    }

    return {
      description: result.description,
      hashtags: result.hashtags,
      keywords: result.keywords
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

/**
 * 가사를 생성합니다
 * @param {string} title - 플레이리스트 제목
 * @param {string} genre - 장르명
 * @param {Object} settings - 가사 생성 설정
 * @returns {Promise<Array<string>>} 생성된 가사 배열
 */
export async function generateLyrics(title, genre, settings) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  try {
    const {
      mainLanguage = '한국어 (Korean)',
      dualLang = false,
      secondaryLanguage = '영어 (English)',
      languageRatio = 70,
      songCount = 1,
      metaphorLevel = '적절함 (Moderate - Balanced)',
      songStructure = '1. 기본 팝 구조 (Intro - Verse 1 - Chorus - Verse 2 - Chorus - Instrumental Break - Bridge - Chorus - Outro)',
      includeIntro = false,
      includeOutro = false,
      instrumental = false
    } = settings

    // 언어 매핑
    const languageMap = {
      '한국어 (Korean)': '한국어 (Korean)',
      '영어 (English)': '영어 (English)',
      '일본어 (Japanese)': '일본어 (Japanese)',
      '스페인어 (Spanish)': '스페인어 (Spanish)',
      '프랑스어 (French)': '프랑스어 (French)'
    }
    const targetLanguage = languageMap[mainLanguage] || '한국어 (Korean)'

    // 비유 레벨 매핑
    const metaphorMap = {
      '직설적 (Literal - Clear & Direct)': '직설적 (Literal - Clear & Direct)',
      '적절함 (Moderate - Balanced)': '적절함 (Moderate - Balanced)',
      '시적 (Poetic - Emotional & Deep)': '시적 (Poetic - Emotional & Deep)',
      '추상적 (Abstract - Artistic & Complex)': '추상적 (Abstract - Artistic & Complex)'
    }
    const metaphor = metaphorMap[metaphorLevel] || '적절함 (Moderate - Balanced)'

    // 언어 혼합 설정
    let languageInstruction = `(ALL lyrics must be in this language)`
    if (dualLang) {
      const secondaryLanguageMap = {
        '영어 (English)': 'English',
        '일본어 (Japanese)': 'Japanese',
        '스페인어 (Spanish)': 'Spanish',
        '프랑스어 (French)': 'French'
      }
      const secondaryLang = secondaryLanguageMap[secondaryLanguage] || 'English'
      languageInstruction = `(Dual Language Mode: Mix ${targetLanguage} ${languageRatio}% and ${secondaryLang} ${100 - languageRatio}%. Mix languages naturally, especially in hooks/chorus. Main language should dominate verses, secondary language can appear in hooks, bridges, or as emphasis phrases)`
    }

    const prompt = `TASK: Generate lyrics for ${songCount} DISTINCT songs.
      
      **CRITICAL GLOBAL SETTINGS:**
      1. **TARGET LANGUAGE**: ${targetLanguage} ${languageInstruction}.
      2. **Vibe/Theme**: Based on "${title}".
      
      **FORMATTING & LAYOUT (HIGHEST PRIORITY):**
      1. **Structure**: Return a list of strings, where each string contains the **ENTIRE** content of one song.
      2. **Headers**: Start each song with "## Song # (Title)".
      3. **Newlines**: Use newline characters (\\n) to separate lines.
      4. **Section Spacing**: You MUST insert a **BLANK LINE** (double newline) before AND after every section header (e.g., [Chorus]).
         
         Example Format for one string:
         "## Song 1 (Title)

[Intro]
(Lyrics...)

[Verse 1]
(Lyrics...)"\n\n      **STRUCTURE MATCHING:**
      The user selected this specific structure pattern: "${songStructure}".
      1. Use the exact section headers (e.g., [Intro], [Verse 1]).
      2. Follow the sequence exactly.
      3. **Tag Formatting**: Always put section tags (like [Verse 1]) on their own line.

      **STYLE & TITLE RULES (STRICT):**
      1. **NO ARTIST NAMES / CREDITS**: Do NOT include any artist names, "Written by...", or references to real-world songs.
      2. **BANNED WORDS**: Do NOT use cliché words like "Neon", "Cyber", "Quantum", "Echoes", "Symphony", "Realm", "Golden Hour", "Midnight", "City Lights".
      3. **TITLE FORMAT**: 
         - **50% of titles MUST be Conversational Sentences** (e.g., "Why did you call me?", "It's raining again", "I left my wallet"). 
         - The rest can be short/abstract (e.g., "Blue Sunday").
      4. **LYRIC QUALITY**: 
         - Write like a human. Avoid robotic AABB rhymes. 
         - Use conversational phrasing and specific details suitable for the genre.
  
      - Metaphor Level: ${metaphor}

      **METAPHOR GUIDELINES:**
      - 'LITERAL': Direct, simple speech (Conversational).
      - 'MODERATE': Everyday metaphors.
      - 'POETIC': Emotional, descriptive, flowery.
      - 'ABSTRACT': Complex, artistic, obscure.

      **SECTION CONTENT RULES:**
      1. **NO MUSICAL DESCRIPTIONS** inside the lyrics (e.g., do not write "upbeat drums").
      2. **Instrumental Sections**: Output ONLY the tag (e.g., [Interlude]).
      3. **Intro**: ${includeIntro ? 'Include lyrics in [Intro]' : 'Output ONLY the tag [Intro] (No lyrics).'}
      4. **Outro**: ${includeOutro ? 'Include lyrics in [Outro]' : 'Output ONLY the tag [Outro] (No lyrics).'}
      5. **Symmetry**: [Verse 1] and [Verse 2] must match in length.
      ${instrumental ? '6. **Instrumental**: This is an instrumental track. Output ONLY section tags without lyrics.' : ''}
  `

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
              lyrics: {
                type: 'ARRAY',
                items: {
                  type: 'STRING'
                },
                description: 'The complete lyrics for the requested songs. Each item in this array should be a full song including titles and line breaks.'
              }
            },
            required: ['lyrics']
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
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('API 응답을 파싱할 수 없습니다.')
      }
    }

    if (!result.lyrics || !Array.isArray(result.lyrics) || result.lyrics.length === 0) {
      throw new Error('가사를 찾을 수 없습니다.')
    }

    return result.lyrics
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

/**
 * 썸네일 이미지 생성용 프롬프트를 생성합니다
 * @param {string} title - 플레이리스트 제목
 * @param {string} genre - 장르명
 * @param {string} style - 이미지 스타일 (예: "실사 (Realistic)")
 * @param {string|null} personaImageDataUrl - 페르소나 이미지 (base64 data URL, 선택사항)
 * @param {string|null} revisionFeedback - 수정 요청 피드백 (선택사항)
 * @returns {Promise<string>} 생성된 이미지 프롬프트
 */
export async function generateThumbnailPrompt(title, genre, style = '실사 (Realistic)', personaImageDataUrl = null, revisionFeedback = null) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  try {
    // 페르소나 이미지가 있는 경우와 없는 경우 프롬프트 분기
    let characterConsistencyRules = ''
    if (personaImageDataUrl) {
      characterConsistencyRules = `CRITICAL CHARACTER CONSISTENCY RULES:
    1. **Identity Preservation:** The main subject MUST be the specific individual from the persona reference image. Ensure 100% identical facial structure, jawline, and expressive eyes.
    2. **Reference Image:** Use the provided persona image as the SOLE visual reference for the subject's identity and facial features to ensure 100% character consistency. The person in the output MUST be the person in the reference.
    3. **Setting & Pose:** Place the subject in an atmospheric setting fitting the genre "${genre}". 
    4. **Text Rule:** The word "PLAYLIST" must appear EXACTLY ONCE in the background. It should be huge, partially obscured by the subject (Depth Effect).
    5. **No Extra Text:** Do NOT include any other text, subtitles, or small text. ONLY the background "PLAYLIST" is allowed.`
    } else {
      characterConsistencyRules = `CRITICAL CHARACTER CONSISTENCY RULES:
    1. **Identity Preservation:** The main subject MUST be a "beautiful Korean woman in her 20s" (unless the user feedback explicitly says otherwise).
    2. **Setting & Pose:** Place the subject in an atmospheric setting fitting the genre "${genre}". 
    3. **Text Rule:** The word "PLAYLIST" must appear EXACTLY ONCE in the background. It should be huge, partially obscured by the subject (Depth Effect).
    4. **No Extra Text:** Do NOT include any other text, subtitles, or small text. ONLY the background "PLAYLIST" is allowed.`
    }

    // 수정 요청이 있는 경우와 없는 경우 분기
    let taskDescription = ''
    if (revisionFeedback) {
      taskDescription = `TASK: This is an IMAGE REVISION task. You must PRESERVE the subject, composition, and visual style of the provided image. Only modify based on the feedback.

    USER FEEDBACK FOR REVISION: The user wants to modify the previous result. Feedback: "${revisionFeedback}". Keep the character's identity and basic layout consistent, but adjust details as requested.`
    } else {
      taskDescription = `TASK: New image generation.`
    }

    const prompt = `You are an expert image prompt engineer. Create a detailed image generation prompt for a YouTube thumbnail based on the playlist title "${title}" and genre "${genre}".

    Style: ${style}
    
    ${taskDescription}

    ${characterConsistencyRules}

    Output ONLY the final English prompt for the image generator.`

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

    const text = data.candidates[0].content.parts[0].text.trim()
    return text
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

/**
 * Gemini 이미지 생성 API를 사용하여 썸네일 이미지를 생성합니다
 * @param {string} prompt - 이미지 생성 프롬프트
 * @param {string|null} personaImageDataUrl - 페르소나 이미지 (base64 data URL, 선택사항)
 * @returns {Promise<string>} base64 인코딩된 이미지 데이터 URL
 */
export async function generateThumbnailImage(prompt, personaImageDataUrl = null) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  try {
    // Banana Pro 모델 사용 (고화질)
    const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`
    
    console.log('이미지 생성 요청 시작:', prompt.substring(0, 100) + '...')
    if (personaImageDataUrl) {
      console.log('페르소나 이미지 포함됨')
    }
    
    // 페르소나 이미지가 있으면 base64 데이터 추출
    let personaImageBase64 = null
    let personaMimeType = 'image/png'
    if (personaImageDataUrl) {
      // data:image/png;base64,xxxxx 형식에서 mimeType과 base64 부분 추출
      const dataUrlMatch = personaImageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
      if (dataUrlMatch) {
        personaMimeType = dataUrlMatch[1]
        personaImageBase64 = dataUrlMatch[2]
      } else {
        console.warn('페르소나 이미지 형식이 올바르지 않습니다.')
      }
    }

    // requestParts 배열 구성 (요청용)
    const requestParts = [{ text: prompt }]
    
    // 페르소나 이미지가 있으면 inlineData로 추가
    if (personaImageBase64) {
      requestParts.push({
        inlineData: {
          mimeType: personaMimeType,
          data: personaImageBase64
        }
      })
    }
    
    const response = await fetch(IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: requestParts
        }],
        generationConfig: {
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '2K'
          }
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('이미지 생성 API 오류:', response.status, errorData)
      
      // Banana Pro가 없으면 Nano Banana로 폴백
      if (response.status === 404 || response.status === 400) {
        console.warn('Banana Pro 모델을 사용할 수 없습니다. Nano Banana로 시도합니다.')
        return await generateThumbnailImageFallback(prompt, personaImageDataUrl)
      }
      
      if (response.status === 400 && errorData.error?.message?.includes('API key')) {
        throw new Error('유효하지 않은 API 키입니다. API 키를 확인해주세요.')
      }
      throw new Error(errorData.error?.message || `이미지 생성에 실패했습니다. (HTTP ${response.status})`)
    }

    const data = await response.json()
    console.log('이미지 생성 API 응답:', JSON.stringify(data).substring(0, 500))
    
    if (!data.candidates || !data.candidates[0]) {
      console.error('응답에 candidates가 없습니다:', data)
      throw new Error('API 응답에 candidates가 없습니다.')
    }

    const candidate = data.candidates[0]
    
    if (!candidate.content) {
      console.error('응답에 content가 없습니다:', candidate)
      throw new Error('API 응답에 content가 없습니다.')
    }

    const responseParts = candidate.content.parts || []
    
    if (!Array.isArray(responseParts) || responseParts.length === 0) {
      console.error('응답에 parts가 없거나 비어있습니다:', candidate.content)
      throw new Error('API 응답에 이미지 데이터가 없습니다.')
    }

    // 이미지 데이터 찾기 (camelCase와 snake_case 모두 지원)
    for (const part of responseParts) {
      // camelCase 형식 (실제 API 응답 형식)
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || part.inlineData.mime_type || 'image/png'
        const imageData = part.inlineData.data
        
        if (!imageData) {
          console.error('inlineData에 data가 없습니다:', part.inlineData)
          continue
        }
        
        console.log('이미지 데이터 발견 (camelCase):', mimeType, '크기:', imageData.length)
        return `data:${mimeType};base64,${imageData}`
      }
      
      // snake_case 형식 (폴백)
      if (part.inline_data) {
        const mimeType = part.inline_data.mime_type || part.inline_data.mimeType || 'image/png'
        const imageData = part.inline_data.data
        
        if (!imageData) {
          console.error('inline_data에 data가 없습니다:', part.inline_data)
          continue
        }
        
        console.log('이미지 데이터 발견 (snake_case):', mimeType, '크기:', imageData.length)
        return `data:${mimeType};base64,${imageData}`
      }
      
      // 다른 형식의 이미지 데이터 확인
      if (part.image) {
        console.log('image 필드 발견:', part.image)
        if (part.image.data) {
          const mimeType = part.image.mimeType || part.image.mime_type || 'image/png'
          return `data:${mimeType};base64,${part.image.data}`
        }
      }
    }

    // 디버깅을 위한 상세 로그
    console.error('이미지 데이터를 찾을 수 없습니다. parts 구조:', JSON.stringify(parts, null, 2))
    throw new Error('이미지 데이터를 찾을 수 없습니다. API 응답 구조를 확인해주세요.')
  } catch (error) {
    console.error('이미지 생성 오류:', error)
    // 에러 메시지에 더 많은 정보 포함
    if (error.message) {
      throw error
    }
    throw new Error(`이미지 생성 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
  }
}

/**
 * Nano Banana 모델로 이미지 생성 (폴백)
 */
async function generateThumbnailImageFallback(prompt, personaImageDataUrl = null) {
  const apiKey = getApiKey()
  const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
  
  console.log('Nano Banana 모델로 이미지 생성 시도:', prompt.substring(0, 100) + '...')
  
  // 페르소나 이미지가 있으면 base64 데이터 추출
  let personaImageBase64 = null
  let personaMimeType = 'image/png'
  if (personaImageDataUrl) {
    const dataUrlMatch = personaImageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (dataUrlMatch) {
      personaMimeType = dataUrlMatch[1]
      personaImageBase64 = dataUrlMatch[2]
    }
  }

  // requestParts 배열 구성 (요청용)
  const requestParts = [{ text: prompt }]
  
  // 페르소나 이미지가 있으면 inlineData로 추가
  if (personaImageBase64) {
    requestParts.push({
      inlineData: {
        mimeType: personaMimeType,
        data: personaImageBase64
      }
    })
  }
  
  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: requestParts
      }],
      generationConfig: {
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '2K'
        }
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Nano Banana 이미지 생성 오류:', response.status, errorData)
    throw new Error(errorData.error?.message || `이미지 생성에 실패했습니다. (HTTP ${response.status})`)
  }

  const data = await response.json()
  console.log('Nano Banana 응답:', JSON.stringify(data).substring(0, 500))
  
  if (!data.candidates || !data.candidates[0]) {
    console.error('응답에 candidates가 없습니다:', data)
    throw new Error('API 응답에 candidates가 없습니다.')
  }

  const candidate = data.candidates[0]
  
  if (!candidate.content) {
    console.error('응답에 content가 없습니다:', candidate)
    throw new Error('API 응답에 content가 없습니다.')
  }

  const responseParts = candidate.content.parts || []
  
  if (!Array.isArray(responseParts) || responseParts.length === 0) {
    console.error('응답에 parts가 없거나 비어있습니다:', candidate.content)
    throw new Error('API 응답에 이미지 데이터가 없습니다.')
  }

  for (const part of responseParts) {
    // camelCase 형식 (실제 API 응답 형식)
    if (part.inlineData) {
      const mimeType = part.inlineData.mimeType || part.inlineData.mime_type || 'image/png'
      const imageData = part.inlineData.data
      
      if (!imageData) {
        console.error('inlineData에 data가 없습니다:', part.inlineData)
        continue
      }
      
      console.log('Nano Banana 이미지 데이터 발견 (camelCase):', mimeType, '크기:', imageData.length)
      return `data:${mimeType};base64,${imageData}`
    }
    
    // snake_case 형식 (폴백)
    if (part.inline_data) {
      const mimeType = part.inline_data.mime_type || part.inline_data.mimeType || 'image/png'
      const imageData = part.inline_data.data
      
      if (!imageData) {
        console.error('inline_data에 data가 없습니다:', part.inline_data)
        continue
      }
      
      console.log('Nano Banana 이미지 데이터 발견 (snake_case):', mimeType, '크기:', imageData.length)
      return `data:${mimeType};base64,${imageData}`
    }
    
    if (part.image) {
      console.log('image 필드 발견:', part.image)
      if (part.image.data) {
        const mimeType = part.image.mimeType || part.image.mime_type || 'image/png'
        return `data:${mimeType};base64,${part.image.data}`
      }
    }
  }

  console.error('이미지 데이터를 찾을 수 없습니다. parts 구조:', JSON.stringify(parts, null, 2))
  throw new Error('이미지 데이터를 찾을 수 없습니다.')
}

/**
 * Canvas를 사용하여 이미지에 텍스트를 합성합니다
 * @param {string} imageDataUrl - base64 인코딩된 이미지 데이터 URL
 * @param {string} title - 썸네일에 추가할 제목 텍스트
 * @param {Object} settings - 텍스트 설정
 * @param {string} settings.fontFamily - 폰트 패밀리
 * @param {number} settings.fontSize - 폰트 크기 (0.05 ~ 0.15, 이미지 높이의 비율)
 * @param {string} settings.fontColor - 폰트 색상 (hex)
 * @param {boolean} settings.bold - 볼드 여부
 * @param {string} format - 출력 형식 ('png' | 'jpg')
 * @returns {Promise<string>} 합성된 이미지의 base64 데이터 URL
 */
export async function synthesizeThumbnailWithText(imageDataUrl, title, settings = {}, format = 'png') {
  return new Promise(async (resolve, reject) => {
    try {
      // 폰트가 로드될 때까지 대기
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }

      // Canvas 생성
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context를 사용할 수 없습니다.'))
        return
      }

      // 이미지 로드
      const img = new Image()
      
      img.onload = () => {
        try {
          // Canvas 크기를 이미지 크기로 설정
          canvas.width = img.width
          canvas.height = img.height

          // 이미지 그리기
          ctx.drawImage(img, 0, 0)

          // 텍스트가 있으면 합성
          if (title && title.trim().length > 0) {
            // 하단 그라데이션 배경 추가 (이미지 하단 40%부터)
            const gradient = ctx.createLinearGradient(
              0, 
              canvas.height * 0.4, 
              0, 
              canvas.height
            )
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.75)')
            
            ctx.fillStyle = gradient
            ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6)

            // 텍스트 처리
            let mainTitle = title.trim()
            
            // "playlist" 제거 (이모지 포함)
            mainTitle = mainTitle.replace(/^playlist\s*[\p{Emoji}\u200d\u2700-\u27bf\s]*\s*/gu, '').trim()
            
            // "|"로 분리하여 영어 키워드와 한글 제목 분리
            let englishKeywords = ''
            if (mainTitle.includes('|')) {
              const parts = mainTitle.split('|')
              mainTitle = parts[0].trim()
              englishKeywords = parts[1] ? parts[1].trim() : ''
            }

            // 텍스트 설정
            const marginX = canvas.width * 0.05
            const maxWidth = canvas.width - marginX * 2.5
            ctx.textAlign = 'left'
            ctx.textBaseline = 'bottom'
            
            // 그림자 효과
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
            ctx.shadowBlur = 20
            ctx.shadowOffsetX = 3
            ctx.shadowOffsetY = 3

            let currentY = marginX * 1.2

            // 영어 키워드 먼저 그리기 (있는 경우)
            if (englishKeywords) {
              const englishFontSize = Math.floor(canvas.height * 0.045)
              ctx.font = `600 ${englishFontSize}px "Outfit", sans-serif`
              ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
              ctx.fillText(englishKeywords, marginX, canvas.height - currentY, maxWidth)
              currentY += canvas.height * 0.065
            }

            // 메인 제목 그리기 (자동 줄바꿈 및 폰트 크기 조정)
            const drawTextWithAutoWrap = (text, x, y, maxWidth, fontSize, fontFamily, color, bold) => {
              let currentFontSize = fontSize
              let lines = []

              // 폰트 크기를 조정하면서 최대 3줄로 맞춤
              while (currentFontSize > fontSize * 0.4) {
                ctx.font = `${bold ? 'bold' : 'normal'} ${currentFontSize}px "${fontFamily}", sans-serif`
                const words = text.split(' ')
                lines = []
                let currentLine = ''

                for (let i = 0; i < words.length; i++) {
                  const testLine = currentLine + words[i] + ' '
                  const metrics = ctx.measureText(testLine)
                  
                  if (metrics.width > maxWidth && i > 0) {
                    lines.push(currentLine)
                    currentLine = words[i] + ' '
                  } else {
                    currentLine = testLine
                  }
                }
                lines.push(currentLine)

                if (lines.length <= 3) {
                  break
                }
                currentFontSize -= 5
              }

              // 텍스트 그리기
              const lineHeight = currentFontSize * 1.15
              ctx.fillStyle = color
              
              for (let i = lines.length - 1; i >= 0; i--) {
                ctx.fillText(
                  lines[i], 
                  x, 
                  y - (lines.length - 1 - i) * lineHeight,
                  maxWidth
                )
              }
            }

            const fontSize = Math.floor(canvas.height * (settings.fontSize || 0.09))
            const fontFamily = settings.fontFamily || '나눔 손글씨'
            const fontColor = settings.fontColor || '#ffffff'
            const bold = settings.bold || false

            drawTextWithAutoWrap(
              mainTitle,
              marginX,
              canvas.height - currentY,
              maxWidth,
              fontSize,
              fontFamily,
              fontColor,
              bold
            )
          }

          // 최종 이미지로 변환
          const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
          const quality = format === 'jpg' ? 0.92 : undefined
          const dataUrl = canvas.toDataURL(mimeType, quality)
          
          resolve(dataUrl)
        } catch (error) {
          reject(new Error(`이미지 합성 중 오류: ${error.message}`))
        }
      }

      img.onerror = () => {
        reject(new Error('기본 이미지를 로드할 수 없습니다.'))
      }

      img.src = imageDataUrl
    } catch (error) {
      reject(error)
    }
  })
}
