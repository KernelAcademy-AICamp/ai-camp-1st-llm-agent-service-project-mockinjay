/**
 * 무료 번역 API 서비스
 * MyMemory API 사용 (무료, API 키 불필요)
 * https://mymemory.translated.net/doc/spec.php
 */

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

// 번역 캐시 (localStorage 사용)
const CACHE_KEY = 'translation_cache';
const CACHE_MAX_SIZE = 500; // 최대 캐시 항목 수

interface TranslationCache {
  [key: string]: {
    text: string;
    timestamp: number;
  };
}

/**
 * 캐시에서 번역 가져오기
 */
function getFromCache(text: string): string | null {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;

    const parsed: TranslationCache = JSON.parse(cache);
    const key = generateCacheKey(text);
    const entry = parsed[key];

    if (entry) {
      return entry.text;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 캐시에 번역 저장
 */
function saveToCache(originalText: string, translatedText: string): void {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    let parsed: TranslationCache = cache ? JSON.parse(cache) : {};

    // 캐시 크기 제한 (오래된 항목 삭제)
    const keys = Object.keys(parsed);
    if (keys.length >= CACHE_MAX_SIZE) {
      const sortedKeys = keys.sort((a, b) => parsed[a].timestamp - parsed[b].timestamp);
      const keysToRemove = sortedKeys.slice(0, Math.floor(CACHE_MAX_SIZE / 4));
      keysToRemove.forEach((key) => delete parsed[key]);
    }

    const key = generateCacheKey(originalText);
    parsed[key] = {
      text: translatedText,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch (err) {
    console.warn('번역 캐시 저장 실패:', err);
  }
}

/**
 * 캐시 키 생성 (텍스트 해시)
 */
function generateCacheKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `en_ko_${hash}`;
}

/**
 * 영어 텍스트를 한글로 번역
 */
export async function translateToKorean(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // 이미 한글이 포함되어 있으면 번역하지 않음
  if (/[가-힣]/.test(text)) {
    return text;
  }

  // 캐시 확인
  const cached = getFromCache(text);
  if (cached) {
    return cached;
  }

  try {
    // MyMemory API는 500자 제한이 있으므로 긴 텍스트는 분할
    if (text.length > 450) {
      return await translateLongText(text);
    }

    const params = new URLSearchParams({
      q: text,
      langpair: 'en|ko',
    });

    const response = await fetch(`${MYMEMORY_API_URL}?${params}`);

    if (!response.ok) {
      console.warn('번역 API 응답 오류:', response.status);
      return text;
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      saveToCache(text, translated);
      return translated;
    }

    return text;
  } catch (err) {
    console.warn('번역 실패:', err);
    return text;
  }
}

/**
 * 긴 텍스트 분할 번역
 */
async function translateLongText(text: string): Promise<string> {
  // 문장 단위로 분할
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > 450) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // 각 청크 번역 (API 제한 고려하여 순차 실행)
  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    const translated = await translateToKorean(chunk);
    translatedChunks.push(translated);
    // API 속도 제한 방지를 위한 딜레이
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return translatedChunks.join(' ');
}

/**
 * 여러 텍스트를 한번에 번역 (배치)
 */
export async function translateBatch(texts: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const text of texts) {
    if (!text) continue;

    const translated = await translateToKorean(text);
    results.set(text, translated);

    // API 속도 제한 방지
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return results;
}

/**
 * 논문 데이터 번역 헬퍼
 */
export interface PaperTranslation {
  title: string;
  abstract: string;
  keyFindings: string[];
}

export async function translatePaperData(
  title: string,
  abstract: string,
  keyFindings: string[]
): Promise<PaperTranslation> {
  const [translatedTitle, translatedAbstract] = await Promise.all([
    translateToKorean(title),
    translateToKorean(abstract),
  ]);

  const translatedFindings: string[] = [];
  for (const finding of keyFindings) {
    const translated = await translateToKorean(finding);
    translatedFindings.push(translated);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    title: translatedTitle,
    abstract: translatedAbstract,
    keyFindings: translatedFindings,
  };
}
