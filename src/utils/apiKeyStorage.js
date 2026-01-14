const API_KEY_STORAGE_KEY = 'gemini_api_key'

/**
 * Gemini API 키를 로컬 스토리지에 저장합니다
 * @param {string} apiKey - 저장할 API 키
 */
export function saveApiKey(apiKey) {
  if (apiKey && apiKey.trim()) {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim())
    return true
  }
  return false
}

/**
 * 저장된 Gemini API 키를 가져옵니다
 * @returns {string|null} 저장된 API 키 또는 null
 */
export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

/**
 * 저장된 API 키를 삭제합니다
 */
export function removeApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
}

/**
 * API 키가 설정되어 있는지 확인합니다
 * @returns {boolean}
 */
export function hasApiKey() {
  const key = getApiKey()
  return key !== null && key.trim() !== ''
}
