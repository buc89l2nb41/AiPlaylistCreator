import { hasApiKey } from '../utils/apiKeyStorage'
import { generatePlaylistWithGemini } from './geminiService'

/**
 * AI를 사용하여 플레이리스트를 생성합니다
 * @param {string} prompt - 사용자가 입력한 플레이리스트 설명
 * @returns {Promise<Object>} 생성된 플레이리스트 객체
 */
export async function generatePlaylist(prompt) {
  try {
    // Gemini API 키가 설정되어 있으면 Gemini API 사용
    if (hasApiKey()) {
      return await generatePlaylistWithGemini(prompt)
    }

    // API 키가 없으면 모의 데이터 반환
    return mockGeneratePlaylist(prompt)
  } catch (error) {
    console.error('Playlist generation error:', error)
    throw error
  }
}

/**
 * 모의 플레이리스트 생성 함수 (개발/테스트용)
 * 실제 API가 준비되면 제거하거나 실제 API로 교체하세요
 */
function mockGeneratePlaylist(prompt) {
  // 프롬프트에 따라 다른 플레이리스트를 생성하는 간단한 로직
  const mockTracks = {
    운동: [
      { name: 'Eye of the Tiger', artist: 'Survivor' },
      { name: 'Stronger', artist: 'Kanye West' },
      { name: 'Can\'t Hold Us', artist: 'Macklemore & Ryan Lewis' },
      { name: 'Lose Yourself', artist: 'Eminem' },
      { name: 'Till I Collapse', artist: 'Eminem' },
    ],
    공부: [
      { name: 'Weightless', artist: 'Marconi Union' },
      { name: 'Strawberry Swing', artist: 'Coldplay' },
      { name: 'Watermark', artist: 'Enya' },
      { name: 'Mellomaniac', artist: 'DJ Shah' },
      { name: 'Electra', artist: 'Airstream' },
    ],
    파티: [
      { name: 'Uptown Funk', artist: 'Bruno Mars' },
      { name: 'Blinding Lights', artist: 'The Weeknd' },
      { name: 'Shape of You', artist: 'Ed Sheeran' },
      { name: 'Dance Monkey', artist: 'Tones and I' },
      { name: 'Levitating', artist: 'Dua Lipa' },
    ],
  }

  // 프롬프트에서 키워드 추출
  let tracks = []
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('운동') || lowerPrompt.includes('workout')) {
    tracks = mockTracks.운동
  } else if (lowerPrompt.includes('공부') || lowerPrompt.includes('study')) {
    tracks = mockTracks.공부
  } else if (lowerPrompt.includes('파티') || lowerPrompt.includes('party')) {
    tracks = mockTracks.파티
  } else {
    // 기본 플레이리스트
    tracks = [
      { name: 'Blinding Lights', artist: 'The Weeknd' },
      { name: 'Watermelon Sugar', artist: 'Harry Styles' },
      { name: 'Levitating', artist: 'Dua Lipa' },
      { name: 'Good 4 U', artist: 'Olivia Rodrigo' },
      { name: 'Stay', artist: 'The Kid LAROI & Justin Bieber' },
    ]
  }

  return {
    title: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
    description: `"${prompt}"에 맞춰 생성된 플레이리스트입니다.`,
    tracks: tracks,
    createdAt: new Date().toISOString(),
  }
}
